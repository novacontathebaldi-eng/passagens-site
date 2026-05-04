import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import VoucherPDFDocument from "@/components/pdf/VoucherPDFDocument";

/**
 * Admin-only PDF generation route for a reservation.
 * Unlike /api/voucher/download-pdf (client-facing, ownership-verified),
 * this route is protected by role (ADMIN/AGENT) and works for any reservation.
 */
export async function GET(request: NextRequest) {
  const reservationId = request.nextUrl.searchParams.get("reservation_id");

  if (!reservationId) {
    return NextResponse.json({ error: "reservation_id obrigatório" }, { status: 400 });
  }

  // Validate UUID format
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(reservationId)) {
    return NextResponse.json({ error: "Formato de ID inválido" }, { status: 400 });
  }

  // 1. Auth + Role check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "AGENT")) {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  // 2. Fetch reservation (no ownership check — admin can access any)
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .select("*, excursions(departure_date, tour_packages(title))")
    .eq("id", reservationId)
    .single();

  if (resError || !reservation) {
    return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  }

  // 3. Fetch tickets
  const { data: tickets } = await supabase
    .from("passenger_tickets")
    .select("id, full_name, cpf, seat_code, qr_code_token, short_code, boarding_location_id")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ error: "Nenhum ticket encontrado para esta reserva" }, { status: 404 });
  }

  // 4. Fetch global settings
  const { data: settings } = await supabase
    .from("global_settings")
    .select("company_name, logo_url")
    .eq("id", 1)
    .single();

  const companyName = settings?.company_name ?? "Partiu Turismo";
  const logoUrl = settings?.logo_url ?? null;

  const excursion = Array.isArray(reservation.excursions) ? reservation.excursions[0] : reservation.excursions;
  const tripTitle = excursion?.tour_packages?.title ?? "Viagem";

  const departureDate = excursion?.departure_date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(excursion.departure_date))
    : "Data a definir";

  const departureDateFull = excursion?.departure_date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(excursion.departure_date))
    : "Data a definir";

  // 5. Generate QR codes
  const qrImages: Record<string, string> = {};
  for (const t of tickets) {
    if (t.qr_code_token) {
      qrImages[t.id] = await QRCode.toDataURL(t.qr_code_token, {
        width: 300,
        margin: 1,
        errorCorrectionLevel: "M",
      });
    }
  }

  const pdfElement = (
    <VoucherPDFDocument
      tickets={tickets}
      tripTitle={tripTitle}
      departureDate={departureDate}
      departureDateFull={departureDateFull}
      companyName={companyName}
      logoUrl={logoUrl}
      qrImages={qrImages}
    />
  );

  // 6. Render PDF server-side
  try {
    const buffer = await renderToBuffer(pdfElement);

    const shortId = reservationId.split("-")[0].toUpperCase();
    const filename = `reserva-${shortId}-vouchers.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store",
      },
    });
  } catch (err) {
    console.error("Admin PDF generation error:", err);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
