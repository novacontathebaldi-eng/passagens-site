import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import AdminReservationPDFDocument from "@/components/pdf/AdminReservationPDFDocument";

export async function GET(request: NextRequest) {
  const reservationId = request.nextUrl.searchParams.get("reservation_id");

  if (!reservationId) {
    return NextResponse.json({ error: "reservation_id obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Role check: Apenas ADMIN ou AGENT
  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileCheck || (profileCheck.role !== "ADMIN" && profileCheck.role !== "AGENT")) {
    return NextResponse.json({ error: "Acesso negado. Requer permissões administrativas." }, { status: 403 });
  }

  // Fetch reservation and relations
  const { data: reservation } = await supabase
    .from("reservations")
    .select(`
      *,
      profiles(full_name, cpf, phone),
      excursions(departure_date, return_date, tour_packages(title)),
      passenger_tickets(id, full_name, cpf, seat_code, check_in_status)
    `)
    .eq("id", reservationId)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  }

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, old_data, new_data")
    .eq("entity_type", "reservations")
    .eq("entity_id", reservationId)
    .order("created_at", { ascending: false });

  // Fetch settings
  const { data: settings } = await supabase
    .from("global_settings")
    .select("company_name, logo_url")
    .limit(1)
    .single();

  const companyName = settings?.company_name ?? "Partiu Turismo";
  const logoUrl = settings?.logo_url ?? null;
  const generatedAt = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const profile = Array.isArray(reservation.profiles) ? reservation.profiles[0] : reservation.profiles;
  const excursionRaw = Array.isArray(reservation.excursions) ? reservation.excursions[0] : reservation.excursions;
  const packageRaw = Array.isArray(excursionRaw?.tour_packages) ? excursionRaw.tour_packages[0] : excursionRaw?.tour_packages;

  const formattedProfile = {
    full_name: profile?.full_name || "Desconhecido",
    cpf: profile?.cpf || "Não informado",
    phone: profile?.phone || "Não informado"
  };

  const formattedExcursion = {
    title: packageRaw?.title || "Excursão",
    departure_date: excursionRaw?.departure_date || new Date().toISOString(),
    return_date: excursionRaw?.return_date || null
  };

  const shortId = reservation.id.split("-")[0];

  const pdfElement = (
    <AdminReservationPDFDocument
      companyName={companyName}
      logoUrl={logoUrl}
      reservation={{
        id: reservation.id,
        shortId,
        total_amount: reservation.total_amount,
        discount_applied: reservation.discount_applied,
        status: reservation.status,
        gateway_provider: reservation.gateway_provider,
        notes: reservation.notes,
        created_at: reservation.created_at,
      }}
      profile={formattedProfile}
      excursion={formattedExcursion}
      tickets={reservation.passenger_tickets || []}
      auditLogs={auditLogs || []}
      generatedAt={generatedAt}
    />
  );

  try {
    const buffer = await renderToBuffer(pdfElement);

    const filename = `relatorio-reserva-${shortId}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
