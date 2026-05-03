"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/brevo";
import { revalidatePath } from "next/cache";

export type ReservationStatus = "PENDING_PIX" | "AWAITING_MANUAL_CHECK" | "APPROVED" | "REFUNDED" | "CANCELLED" | "EXPIRED";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper for admin operations requiring service role
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase Service Role Key or URL");
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  "PENDING_PIX": ["APPROVED", "CANCELLED"],
  "AWAITING_MANUAL_CHECK": ["APPROVED", "CANCELLED"],
  "APPROVED": ["CANCELLED", "REFUNDED"],
  "CANCELLED": ["REFUNDED"],
  "EXPIRED": ["PENDING_PIX"],
  "REFUNDED": []
};

function isValidTransition(currentStatus: ReservationStatus, newStatus: ReservationStatus): boolean {
  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

export async function changeReservationStatus(
  reservationId: string, 
  newStatus: ReservationStatus, 
  notes?: string
) {
  const supabase = await createClient();
  
  // 1. Verify Authentication & Role
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Não autorizado: Usuário não autenticado." };
  }

  // Validate UUID format to prevent malformed queries
  if (!UUID_REGEX.test(reservationId)) {
    return { error: "ID de reserva inválido." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "AGENT")) {
    return { error: "Não autorizado: Permissão negada." };
  }

  // 2. Fetch Current Reservation State using the authenticated client
  // Since the user is ADMIN/AGENT, RLS allows this.
  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select(`
      *,
      profiles ( full_name, auth_user_id:id )
    `)
    .eq("id", reservationId)
    .single();

  if (fetchError || !reservation) {
    return { error: "Reserva não encontrada." };
  }

  const currentStatus = reservation.status as ReservationStatus;

  // 3. State Machine Validation
  if (!isValidTransition(currentStatus, newStatus)) {
    return { error: `Transição inválida de ${currentStatus} para ${newStatus}.` };
  }

  // 4. Update Reservation Status & Notes using authenticated client
  const updatePayload: any = { status: newStatus };
  if (notes) {
    // Append to existing notes or set new
    const timestamp = new Date().toLocaleString("pt-BR");
    const actorName = user.user_metadata?.full_name || "Admin/Agente";
    const formattedNote = `[${timestamp} - ${actorName}]: ${notes}`;
    updatePayload.notes = reservation.notes 
      ? `${reservation.notes}\n${formattedNote}` 
      : formattedNote;
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update(updatePayload)
    .eq("id", reservationId);

  if (updateError) {
    return { error: "Erro ao atualizar a reserva: " + updateError.message };
  }

  // 5. Trigger Emails via Brevo (for CANCELLED and REFUNDED)
  if (newStatus === "CANCELLED" || newStatus === "REFUNDED") {
    try {
      // We need the adminClient only here, to get the user's email via auth.admin API
      const adminClient = getAdminClient();
      const targetUserId = reservation.user_id;
      const { data: targetUserAuth, error: authFetchError } = await adminClient.auth.admin.getUserById(targetUserId);
      
      if (!authFetchError && targetUserAuth?.user?.email) {
        const email = targetUserAuth.user.email;
        const userName = reservation.profiles?.full_name || "Cliente";
        const actionTitle = newStatus === "CANCELLED" ? "Cancelamento de Reserva" : "Reembolso de Reserva";
        const shortId = reservationId.split('-')[0].toUpperCase();
        const reasonHtml = notes 
          ? `<p><strong>Motivo / Observação:</strong> ${escapeHtml(notes)}</p>` 
          : "";

        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${newStatus === 'CANCELLED' ? '#ef4444' : '#f59e0b'};">${actionTitle} - Partiu Turismo</h2>
            <p>Olá ${userName},</p>
            <p>Informamos que o status da sua reserva <strong>#${shortId}</strong> foi alterado para: <strong>${newStatus === 'CANCELLED' ? 'Cancelada' : 'Reembolsada'}</strong>.</p>
            ${reasonHtml}
            <p>Se tiver qualquer dúvida, por favor responda a este e-mail ou entre em contato conosco pelo WhatsApp.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999;">Atenciosamente,<br>Equipe Partiu Turismo</p>
          </div>
        `;

        await sendEmail({
          to: [{ email, name: userName }],
          subject: `Atualização: ${actionTitle} #${shortId}`,
          htmlContent
        });
      }
    } catch (err) {
      console.error("Falha ao configurar admin client ou enviar email na Server Action", err);
      // We do not return error here because the DB update was successful.
    }
  }

  revalidatePath("/admin/reservas", "layout");
  revalidatePath(`/admin/reservas/${reservationId}`);
  return { success: true };
}
