import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/brevo";
import QRCode from "qrcode";

function maskCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length < 11) return cpf;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

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
  const { data: settings } = await supabase
    .from("global_settings")
    .select("company_name, logo_url")
    .eq("id", 1)
    .single();

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

  // Generate QR codes as base64
  const qrMap: Record<string, string> = {};
  for (const t of tickets) {
    const dataUrl = await QRCode.toDataURL(t.qr_code_token, { width: 200, margin: 1, errorCorrectionLevel: "M" });
    qrMap[t.id] = dataUrl;
  }

  // Build ticket rows HTML
  const ticketRows = tickets.map((t) => `
    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;">
      <div style="background:#f0f9ff;padding:12px 16px;border-bottom:1px solid #e2e8f0;">
        <strong style="color:#0369a1;font-size:15px;">${t.full_name}</strong>
      </div>
      <div style="padding:16px;">
        <table style="width:100%;font-size:13px;"><tr>
          <td style="padding:4px 0;"><span style="color:#64748b;font-size:11px;">CPF</span><br/><code>${maskCPF(t.cpf)}</code></td>
          <td style="padding:4px 0;"><span style="color:#64748b;font-size:11px;">Poltrona</span><br/><strong style="color:#0369a1;font-size:18px;">${t.seat_code}</strong></td>
        </tr></table>
        <hr style="border:none;border-top:1px dashed #e2e8f0;margin:12px 0;" />
        <table style="width:100%;"><tr>
          <td style="vertical-align:top;width:120px;"><img src="${qrMap[t.id]}" alt="QR" width="100" height="100" style="border-radius:8px;" /></td>
          <td style="vertical-align:top;padding-left:12px;">
            <span style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Código de Embarque</span>
            <div style="font-size:28px;font-weight:bold;color:#0369a1;letter-spacing:4px;margin:4px 0;font-family:monospace;">${t.short_code}</div>
            <p style="font-size:11px;color:#64748b;margin:0;">Apresente ao motorista no embarque</p>
          </td>
        </tr></table>
      </div>
    </div>
  `).join("");

  const htmlContent = `
  <div style="font-family:'Inter',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#0369a1;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" width="40" height="40" style="border-radius:8px;margin-bottom:8px;" />` : ""}
      <h1 style="color:white;margin:0;font-size:20px;">${companyName}</h1>
    </div>
    <div style="padding:24px;">
      <h2 style="color:#1a1a2e;margin:0 0 8px;">Olá, ${clientName}! 🎉</h2>
      <p style="color:#334155;font-size:14px;margin:0 0 16px;">Sua reserva foi confirmada!</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#64748b;">Pedido <strong style="color:#0369a1;">#${shortId}</strong></p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:#1a1a2e;">${tripTitle} — ${depDate}</p>
      </div>
      ${ticketRows}
      <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-weight:bold;color:#0369a1;font-size:13px;">ℹ️ Como usar seu voucher:</p>
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:12px;line-height:1.8;">
          <li>Apresente este email ou o QR Code ao motorista no embarque</li>
          <li>Caso não consiga ler o QR, informe o código de embarque</li>
          <li>Guarde este email — você pode precisar dele no dia da viagem</li>
        </ul>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${origin}/sucesso/${reservationId}" style="background:#f59e0b;color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block;">Ver minha reserva online</a>
      </div>
    </div>
    <div style="border-top:1px solid #e2e8f0;padding:16px 24px;text-align:center;font-size:11px;color:#94a3b8;">
      <p style="margin:0;">${companyName} • Todos os direitos reservados</p>
    </div>
  </div>`;

  try {
    await sendEmail({
      to: [{ email: user.email!, name: clientName }],
      subject: `Seu Voucher de Embarque — ${tripTitle}`,
      htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
