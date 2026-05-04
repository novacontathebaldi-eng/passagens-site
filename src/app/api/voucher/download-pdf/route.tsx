import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import VoucherPDFDocument from "@/components/pdf/VoucherPDFDocument";

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

  // Verify ownership
  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, excursions(departure_date, tour_packages(title))")
    .eq("id", reservationId)
    .single();

  if (!reservation || reservation.user_id !== user.id) {
    return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  }

  if (reservation.status !== "APPROVED") {
    return NextResponse.json({ error: "Reserva ainda não aprovada" }, { status: 400 });
  }

  // Fetch tickets
  const { data: tickets } = await supabase
    .from("passenger_tickets")
    .select("id, full_name, cpf, seat_code, qr_code_token, short_code, boarding_location_id")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ error: "Nenhum ticket encontrado" }, { status: 404 });
  }

  // Fetch settings
  const { data: settings } = await supabase
    .from("global_settings")
    .select("company_name, logo_url")
    .eq("id", 1)
    .single();

  const companyName = settings?.company_name ?? "Partiu Turismo";
  const logoUrl = settings?.logo_url ?? null;
  const tripTitle = reservation.excursions?.tour_packages?.title ?? "Viagem";

  const departureDate = reservation.excursions?.departure_date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(reservation.excursions.departure_date))
    : "Data a definir";

  const departureDateFull = reservation.excursions?.departure_date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(reservation.excursions.departure_date))
    : "Data a definir";

  // Generate QR codes as data URLs
  const qrImages: Record<string, string> = {};
  for (const t of tickets) {
    qrImages[t.id] = await QRCode.toDataURL(t.qr_code_token, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });
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

  try {
    const buffer = await renderToBuffer(pdfElement);

    const firstName = tickets[0]?.full_name.split(" ")[0] ?? "passageiro";
    const filename = `voucher-${tickets[0]?.short_code}-${firstName}.pdf`;

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
