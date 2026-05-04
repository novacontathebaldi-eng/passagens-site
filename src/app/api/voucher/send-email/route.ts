import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import { buildVoucherEmail, TicketData } from "@/lib/email-templates";
import { sendEmail } from "@/lib/brevo";
import { getSiteSettings } from "@/lib/get-settings";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const reservationId = body.reservation_id;

  if (!reservationId) {
    return NextResponse.json({ error: "reservation_id obrigatório" }, { status: 400 });
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
    .select("id, full_name, cpf, seat_code, qr_code_token, short_code")
    .eq("reservation_id", reservationId);

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ error: "Nenhum ticket encontrado" }, { status: 404 });
  }

  // Fetch settings for branding
  const settings = await getSiteSettings();

  const companyName = settings?.company_name ?? "Partiu Turismo";
  const logoUrl = settings?.logo_url ?? "";
  const tripTitle = reservation.excursions?.tour_packages?.title ?? "Viagem";
  const depDate = reservation.excursions?.departure_date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(reservation.excursions.departure_date))
    : "Data a definir";
  const shortId = reservationId.split("-")[0].toUpperCase();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const clientName = profile?.full_name ?? "Viajante";

  // Generate QR codes as PNG buffers for CID inline attachments
  const attachments: { content: string; name: string }[] = [];
  const qrCidMap: Record<string, string> = {};

  for (const t of tickets) {
    const buffer = await QRCode.toBuffer(t.qr_code_token, {
      type: "png",
      width: 200,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const cidName = `qr-${t.short_code}.png`;
    attachments.push({
      content: buffer.toString("base64"),
      name: cidName,
    });
    qrCidMap[t.id] = cidName;
  }

  const siteUrl = `${origin}/sucesso/${reservationId}`;

  const htmlContent = buildVoucherEmail({
    userName: clientName,
    shortId,
    tripTitle,
    depDate,
    siteUrl,
    tickets: tickets as TicketData[],
    qrCidMap,
    settings
  });

  try {
    await sendEmail({
      to: [{ email: user.email!, name: clientName }],
      subject: `Seus Vouchers de Embarque — ${tripTitle}`,
      htmlContent,
      attachment: attachments.length > 0 ? attachments : undefined
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
