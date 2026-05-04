import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import VoucherPDFDocument from "@/components/pdf/VoucherPDFDocument";

type Params = Promise<{ ticket_id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const resolvedParams = await params;
  const ticketId = resolvedParams.ticket_id;

  if (!ticketId) {
    return NextResponse.json({ error: "ticket_id obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Fetch ticket and check ownership via reservation
  const { data: ticket } = await supabase
    .from("passenger_tickets")
    .select(`
      id, full_name, cpf, seat_code, qr_code_token, short_code, boarding_location_id,
      reservations!inner (
        id, user_id, status,
        excursions (
          departure_date,
          tour_packages (title)
        )
      )
    `)
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  const reservation = ticket.reservations as any;

  if (reservation.user_id !== user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (reservation.status !== "APPROVED") {
    return NextResponse.json({ error: "Reserva ainda não aprovada" }, { status: 400 });
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

  // Generate QR code as data URL
  const qrImages: Record<string, string> = {};
  qrImages[ticket.id] = await QRCode.toDataURL(ticket.qr_code_token, {
    width: 300,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const ticketsArray = [{
    id: ticket.id,
    full_name: ticket.full_name,
    cpf: ticket.cpf,
    seat_code: ticket.seat_code,
    qr_code_token: ticket.qr_code_token,
    short_code: ticket.short_code,
    boarding_location_id: ticket.boarding_location_id
  }];

  const pdfElement = (
    <VoucherPDFDocument
      tickets={ticketsArray}
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

    const firstName = ticket.full_name.split(" ")[0] ?? "passageiro";
    const filename = `voucher-${ticket.short_code}-${firstName}.pdf`;

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
