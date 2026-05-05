import { SiteSettings } from "./get-settings";

// Utilitário para escapar HTML (segurança)
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type BaseEmailProps = {
  settings: SiteSettings;
  userName: string;
  shortId: string;
};

type CancellationRefundProps = BaseEmailProps & {
  reasonHtml?: string;
};

type ExpiredProps = BaseEmailProps & {
  excursionName: string;
  siteUrl: string;
};

export type TicketData = {
  id: string;
  full_name: string;
  cpf: string;
  seat_code: string;
  short_code: string;
};

type VoucherEmailProps = BaseEmailProps & {
  tripTitle: string;
  depDate: string;
  siteUrl: string;
  tickets: TicketData[];
  qrCidMap: Record<string, string>;
};

// ─── Design Tokens (espelham globals.css) ──────────────────────────────────
const C = {
  // Brand
  primary:      "#1E40AF",
  primaryDark:  "#00288E",
  secondary:    "#06B6D4",
  secDark:      "#00687A",
  cta:          "#F97316",
  ctaDark:      "#EA580C",
  // Feedback
  success:      "#16A34A",
  successBg:    "#DCFCE7",
  error:        "#BA1A1A",
  errorBg:      "#FFDAD6",
  // Surfaces
  pageBg:       "#F0F4F8",
  cardBg:       "#FFFFFF",
  // Text
  dark:         "#191C1E",
  body:         "#374151",
  muted:        "#6B7280",
  light:        "#9CA3AF",
  // Borders
  border:       "#E5E7EB",
  borderLight:  "#F3F4F6",
};

// ──────────────────────────────────────────────────────────────────────────
//  BASE LAYOUT — usado por TODOS os templates
// ──────────────────────────────────────────────────────────────────────────
function buildBaseLayout(settings: SiteSettings, title: string, content: string): string {
  const logoHtml = settings.logo_url
    ? `<img src="${settings.logo_url}" alt="${settings.company_name}" style="height: 48px; width: auto; border-radius: 12px; margin-bottom: 14px; border: 2px solid rgba(255,255,255,0.2);" />`
    : "";

  const companyNameHtml = `<div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${settings.company_name}</div>`;

  // WhatsApp footer
  let waFooterHtml = "";
  if (settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0) {
    const rawNum = settings.whatsapp_support_numbers[0];
    let cleanNum = rawNum.replace(/\D/g, "");
    if (cleanNum.length >= 10 && !cleanNum.startsWith("55")) cleanNum = "55" + cleanNum;
    waFooterHtml = `<a href="https://wa.me/${cleanNum}" style="color: #25D366; text-decoration: none; font-weight: 600; font-size: 14px;">💬 WhatsApp: ${rawNum}</a>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${C.pageBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: ${C.body};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${C.pageBg}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Card principal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: ${C.cardBg}; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(30,64,175,0.08);">
          
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 40%, ${C.secDark} 100%); padding: 36px 32px 32px 32px; text-align: center;">
              ${logoHtml}
              ${companyNameHtml}
              <div style="width: 40px; height: 3px; background: ${C.cta}; border-radius: 2px; margin: 14px auto 0 auto;"></div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 40px 32px 32px 32px;">
              <div style="font-size: 15px; line-height: 1.7; color: ${C.body};">
                ${content}
              </div>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="padding: 0 32px 36px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid ${C.border};">
                <tr>
                  <td style="padding-top: 24px; text-align: center;">
                    ${waFooterHtml ? `<p style="margin: 0 0 12px 0;">${waFooterHtml}</p>` : ""}
                    <p style="margin: 0; font-size: 13px; color: ${C.muted};">
                      Atenciosamente, <strong style="color: ${C.primary};">Equipe ${settings.company_name}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <p style="text-align: center; font-size: 11px; color: ${C.light}; margin-top: 24px; padding: 0 16px; line-height: 1.5;">
          E-mail enviado automaticamente por ${settings.company_name}. Nao responda diretamente.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────────────────
//  CANCELAMENTO
// ──────────────────────────────────────────────────────────────────────────
export function buildCancellationEmail({ userName, shortId, reasonHtml, settings }: CancellationRefundProps): string {
  const content = `
    <h2 style="color: ${C.dark}; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">Reserva Cancelada</h2>
    <p style="font-size: 13px; color: ${C.muted}; margin: 0 0 28px 0;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin: 0 0 20px 0;">Prezado(a) <strong style="color: ${C.dark};">${userName}</strong>,</p>
    
    <p style="margin: 0 0 24px 0;">
      Informamos que a sua reserva foi 
      <span style="color: ${C.error}; font-weight: 700; background: ${C.errorBg}; padding: 3px 10px; border-radius: 6px; font-size: 14px;">cancelada</span>.
    </p>
    
    ${reasonHtml ? `
    <div style="background: ${C.borderLight}; padding: 18px 20px; border-radius: 12px; margin: 0 0 24px 0; font-size: 14px; color: ${C.body}; border-left: 4px solid ${C.primary};">
      ${reasonHtml}
    </div>` : ""}
    
    <p style="margin: 0; color: ${C.body};">
      Se houver qualquer duvida ou se desejar verificar opcoes para reagendamento, nossa equipe esta a inteira disposicao.
    </p>
  `;
  return buildBaseLayout(settings, `Reserva Cancelada #${shortId}`, content);
}

// ──────────────────────────────────────────────────────────────────────────
//  REEMBOLSO
// ──────────────────────────────────────────────────────────────────────────
export function buildRefundEmail({ userName, shortId, reasonHtml, settings }: CancellationRefundProps): string {
  const content = `
    <h2 style="color: ${C.dark}; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">Reembolso Processado</h2>
    <p style="font-size: 13px; color: ${C.muted}; margin: 0 0 28px 0;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin: 0 0 20px 0;">Prezado(a) <strong style="color: ${C.dark};">${userName}</strong>,</p>
    
    <p style="margin: 0 0 24px 0;">
      Confirmamos que o reembolso da sua reserva foi 
      <span style="color: ${C.success}; font-weight: 700; background: ${C.successBg}; padding: 3px 10px; border-radius: 6px; font-size: 14px;">processado e autorizado</span>.
    </p>
    
    ${reasonHtml ? `
    <div style="background: ${C.borderLight}; padding: 18px 20px; border-radius: 12px; margin: 0 0 24px 0; font-size: 14px; color: ${C.body}; border-left: 4px solid ${C.success};">
      ${reasonHtml}
    </div>` : ""}
    
    <p style="margin: 0; color: ${C.body};">
      O prazo para que o valor seja creditado depende da sua instituicao financeira (geralmente entre 1 a 5 dias uteis).
    </p>
  `;
  return buildBaseLayout(settings, `Reembolso Processado #${shortId}`, content);
}

// ──────────────────────────────────────────────────────────────────────────
//  EXPIRADO
// ──────────────────────────────────────────────────────────────────────────
export function buildExpiredEmail({ userName, shortId, excursionName, siteUrl, settings }: ExpiredProps): string {
  let waNumber = "";
  if (settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0) {
    waNumber = settings.whatsapp_support_numbers[0].replace(/\D/g, "");
    if (waNumber.length === 10 || waNumber.length === 11) waNumber = "55" + waNumber;
  }
  const waMessage = encodeURIComponent(`Ola, minha reserva #${shortId} expirou e gostaria de verificar disponibilidade para ${excursionName}.`);
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : "";

  const content = `
    <h2 style="color: ${C.dark}; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">Reserva Expirada</h2>
    <p style="font-size: 13px; color: ${C.muted}; margin: 0 0 28px 0;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin: 0 0 20px 0;">Prezado(a) <strong style="color: ${C.dark};">${userName}</strong>,</p>
    
    <p style="margin: 0 0 20px 0;">
      O prazo para confirmacao do pagamento da viagem para <strong style="color: ${C.primary};">${excursionName}</strong> expirou e as poltronas foram automaticamente liberadas.
    </p>
    
    <!-- Destaque -->
    <div style="background: linear-gradient(135deg, ${C.primaryDark}, ${C.primary}); padding: 24px; border-radius: 16px; margin: 0 0 28px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #ffffff;">Ainda quer viajar?</p>
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.8);">Verifique se ainda existem assentos disponiveis.</p>
    </div>
    
    <div style="text-align: center; margin: 0 0 24px 0;">
      <a href="${siteUrl}" style="background: linear-gradient(135deg, ${C.cta}, ${C.ctaDark}); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(249,115,22,0.3);">
        Verificar Disponibilidade
      </a>
    </div>

    ${waUrl ? `
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid ${C.border};">
      <p style="color: ${C.muted}; margin: 0 0 8px 0; font-size: 14px;">Prefere falar conosco?</p>
      <a href="${waUrl}" style="color: #25D366; text-decoration: none; font-weight: 600; font-size: 14px;">
        💬 Conversar no WhatsApp
      </a>
    </div>` : ""}
  `;
  return buildBaseLayout(settings, `Reserva Expirada #${shortId}`, content);
}

// ──────────────────────────────────────────────────────────────────────────
//  VOUCHER DE CONFIRMACAO
// ──────────────────────────────────────────────────────────────────────────
function maskCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length < 11) return cpf;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export function buildVoucherEmail({ userName, shortId, tripTitle, depDate, siteUrl, tickets, qrCidMap, settings }: VoucherEmailProps): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Card de cada passageiro
  const ticketRows = tickets.map((t) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; border-radius: 16px; overflow: hidden; border: 1px solid ${C.border};">
      <!-- Header do card -->
      <tr>
        <td colspan="2" style="background: linear-gradient(135deg, ${C.primary}, ${C.secDark}); padding: 14px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #ffffff; font-weight: 700; font-size: 15px;">${escapeHtml(t.full_name)}</td>
              <td align="right" style="color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600;">Poltrona <span style="font-size: 18px; font-weight: 800; color: #ffffff;">${t.seat_code}</span></td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Corpo do card -->
      <tr>
        <td style="width: 110px; padding: 20px; vertical-align: top; background: ${C.cardBg};">
          <img src="cid:${qrCidMap[t.id]}" alt="QR" width="80" height="80" style="border-radius: 10px; border: 2px solid ${C.border}; display: block;" />
        </td>
        <td style="padding: 20px 20px 20px 0; vertical-align: top; background: ${C.cardBg};">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: ${C.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Codigo de Embarque</p>
          <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: ${C.primary}; letter-spacing: 3px; font-family: 'Courier New', monospace;">${t.short_code}</p>
          <p style="margin: 0; font-size: 12px; color: ${C.light};">CPF: ${maskCPF(t.cpf)}</p>
        </td>
      </tr>
      <!-- Footer do card -->
      <tr>
        <td colspan="2" style="padding: 10px 20px; background: ${C.borderLight}; border-top: 1px solid ${C.border};">
          <a href="${origin}/voucher/${t.id}" style="color: ${C.primary}; font-size: 13px; font-weight: 600; text-decoration: none;">
            Ver Voucher Individual &rarr;
          </a>
        </td>
      </tr>
    </table>
  `).join("");

  const content = `
    <h2 style="color: ${C.dark}; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">Pagamento Confirmado</h2>
    <p style="font-size: 13px; color: ${C.muted}; margin: 0 0 28px 0;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin: 0 0 20px 0;">Tudo certo, <strong style="color: ${C.dark};">${userName}</strong>.</p>
    
    <p style="margin: 0 0 24px 0;">
      Seu pagamento foi 
      <span style="color: ${C.success}; font-weight: 700; background: ${C.successBg}; padding: 3px 10px; border-radius: 6px; font-size: 14px;">confirmado com sucesso</span>
      e a sua viagem esta garantida.
    </p>

    <!-- Dados da viagem -->
    <div style="background: ${C.borderLight}; padding: 18px 20px; border-radius: 12px; margin: 0 0 28px 0; border-left: 4px solid ${C.primary};">
      <p style="margin: 0 0 2px 0; font-size: 11px; color: ${C.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Viagem</p>
      <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: ${C.dark};">${tripTitle}</p>
      <p style="margin: 0; font-size: 14px; color: ${C.body}; font-weight: 500;">Embarque: <strong style="color: ${C.dark};">${depDate}</strong></p>
    </div>
    
    <!-- Titulo vouchers -->
    <p style="font-size: 14px; font-weight: 700; color: ${C.dark}; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid ${C.primary}; padding-bottom: 10px;">
      Vouchers de Embarque
    </p>
    
    ${ticketRows}
    
    <!-- Instrucoes -->
    <div style="background: ${C.borderLight}; padding: 18px 20px; border-radius: 12px; margin: 28px 0; border-left: 4px solid ${C.secondary};">
      <p style="margin: 0 0 10px 0; font-weight: 700; color: ${C.dark}; font-size: 14px;">Antes de embarcar:</p>
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: ${C.body}; line-height: 1.7;">
        <tr><td style="padding: 4px 0; vertical-align: top; width: 20px; color: ${C.primary}; font-weight: 700;">1.</td><td style="padding: 4px 0;">Apresente este e-mail ou o voucher no celular ao motorista.</td></tr>
        <tr><td style="padding: 4px 0; vertical-align: top; color: ${C.primary}; font-weight: 700;">2.</td><td style="padding: 4px 0;">Se o QR Code nao funcionar, informe o <strong style="color: ${C.primary};">Codigo de Embarque</strong>.</td></tr>
        <tr><td style="padding: 4px 0; vertical-align: top; color: ${C.primary}; font-weight: 700;">3.</td><td style="padding: 4px 0;">Leve um <strong>documento original com foto</strong> (RG ou CNH).</td></tr>
      </table>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${siteUrl}" style="background: linear-gradient(135deg, ${C.cta}, ${C.ctaDark}); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 14px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(249,115,22,0.35);">
        Acessar Reserva Online
      </a>
    </div>
  `;

  return buildBaseLayout(settings, `Vouchers de Embarque - ${tripTitle}`, content);
}
