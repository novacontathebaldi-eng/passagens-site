"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CheckoutData {
  excursionId: string;
  quantity: number;
  passengers: any[];
  selectedSeats: string[];
  totalAmount: number;
  referralCode?: string;
}

export async function createReservation(data: CheckoutData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado." };
  }

  try {
    // Resolve promoter if referral code exists
    let promoterId = null;
    if (data.referralCode) {
      const { data: promoter } = await supabase
        .from("promoters")
        .select("id")
        .eq("referral_code", data.referralCode)
        .single();
      if (promoter) {
        promoterId = promoter.id;
      }
    }

    // 1. Verificar disponibilidade de vagas
    const { data: excursion } = await supabase
      .from("excursions")
      .select("allow_seat_selection, status, price_per_seat, vehicle_layouts(capacity)")
      .eq("id", data.excursionId)
      .single();

    if (!excursion || excursion.status !== "PUBLISHED") {
      return { error: "Excursão indisponível." };
    }

    const { data: existingTickets } = await supabase
      .from("passenger_tickets")
      .select("seat_code, reservations!inner(status)")
      .eq("excursion_id", data.excursionId)
      .in("reservations.status", ["PENDING_PIX", "AWAITING_MANUAL_CHECK", "APPROVED"]);

    const occupiedSeats = existingTickets?.map(t => t.seat_code) || [];
    const vehLayout = Array.isArray(excursion.vehicle_layouts) ? excursion.vehicle_layouts[0] : excursion.vehicle_layouts;
    const capacity = vehLayout?.capacity || 0;

    if (capacity - occupiedSeats.length < data.quantity) {
      return { error: "Não há vagas suficientes disponíveis." };
    }

    // 2. Verificar conflito de poltronas
    if (excursion.allow_seat_selection) {
      const conflict = data.selectedSeats.some(seat => occupiedSeats.includes(seat));
      if (conflict) {
        return { error: "Uma ou mais poltronas selecionadas já foram ocupadas. Por favor, tente novamente." };
      }
    }

    // [SECURITY PATCH] Validação Matemática do Pagamento (Server-Side Trust)
    const baseTotalAmount = Number(excursion.price_per_seat) * data.quantity;
    let finalAmount = baseTotalAmount;

    // Se houver regras de cupom/promotor no futuro, aplique o desconto aqui:
    // if (promoterId) { finalAmount = baseTotalAmount - discount; }

    // Rejeita tentativas de manipulação (Data Tampering) via Postman/Burp
    if (Math.abs(data.totalAmount - finalAmount) > 0.01) {
      console.warn(`[SECURITY] Tentativa de fraude ou divergência de preço interceptada: Cliente enviou ${data.totalAmount}, esperado ${finalAmount}`);
      return { error: "Divergência de valores detectada. O preço da excursão pode ter sido atualizado." };
    }

    // 3. Criar Reserva (PENDING_PIX) com TTL
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        excursion_id: data.excursionId,
        promoter_id: promoterId,
        total_amount: finalAmount, // Banco assume o controle matemático final
        // status is locked by DB privileges or defaults to PENDING_PIX
      })
      .select("id")
      .single();

    if (resError || !reservation) {
      console.error("Erro ao criar reserva:", resError);
      return { error: "Erro ao criar reserva. Tente novamente." };
    }

    // 4. Alocar poltronas e inserir Tickets
    let allocatedSeats: string[] = [];

    if (!excursion.allow_seat_selection) {
      const { data: seats, error: allocError } = await supabase
        .rpc('allocate_seats_for_reservation', {
          p_excursion_id: data.excursionId,
          p_reservation_id: reservation.id,
          p_ticket_count: data.quantity,
          p_prefer_together: true
        });
      
      if (allocError || !seats) {
        console.error("Erro ao alocar poltronas:", allocError);
        // Rollback manual
        await supabase.from("reservations").delete().eq("id", reservation.id);
        return { error: 'Não foi possível alocar as poltronas. Por favor, tente novamente.' };
      }
      
      allocatedSeats = seats;
    }

    const ticketsToInsert = data.passengers.map((p, idx) => ({
      reservation_id: reservation.id,
      excursion_id: data.excursionId,
      full_name: p.full_name,
      cpf: p.cpf,
      rg: p.rg || null,
      orgao_emissor: p.orgao_emissor || null,
      seat_code: excursion.allow_seat_selection 
        ? data.selectedSeats[idx] 
        : allocatedSeats[idx]
    }));

    // [SECURITY PATCH] Ticket Capacity Bypass Mitigation
    // A inserção direta foi revogada da role authenticated via SQL.
    // Usamos uma RPC SECURITY DEFINER que valida matematicamente a lotação 
    // máxima com base no valor pago pela reserva.
    const { error: ticketError } = await supabase.rpc("insert_passenger_tickets_secure", {
      p_reservation_id: reservation.id,
      p_excursion_id: data.excursionId,
      p_tickets: ticketsToInsert
    });

    if (ticketError) {
      console.error("[SECURITY] Erro na RPC de inserção de tickets:", ticketError);
      // Rollback manual
      await supabase.from("reservations").delete().eq("id", reservation.id);
      return { error: "Erro ao alocar passageiros." };
    }

    // 5. Salvar novos dependentes se solicitado (Fire and forget, ignoring duplicates)
    const passengersToSave = data.passengers.filter(p => p.save_passenger);
    if (passengersToSave.length > 0) {
      const savedToInsert = passengersToSave.map(p => ({
        owner_id: user.id,
        full_name: p.full_name,
        cpf: p.cpf,
        rg: p.rg || null,
        orgao_emissor: p.orgao_emissor || null,
      }));
      // UPSERT is better but assuming CPF is not UNIQUE in saved_passengers per owner, we just insert.
      // Wait, there might be duplicates, but we just let it insert or fail silently.
      const { error: saveError } = await supabase.from("saved_passengers").insert(savedToInsert);
      if (saveError) console.error("Erro ao salvar dependentes (nao critico):", saveError);
    }

    revalidatePath(`/excursao/[slug]`, "page");
    return { reservationId: reservation.id };

  } catch (error: any) {
    console.error("Erro inesperado:", error);
    return { error: "Ocorreu um erro inesperado." };
  }
}
