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

// ─── Design Tokens (espelham o globals.css do site) ────────────────────────
const COLORS = {
  primary: "#1E40AF",        // Azul Royal (--color-primary)
  primaryDark: "#00288E",    // (--color-primary-dark)
  secondary: "#06B6D4",      // Turquesa (--color-secondary)
  cta: "#F97316",            // Laranja Solar (--color-cta)
  ctaDark: "#EA580C",        // (gradient-cta end)
  success: "#16A34A",        // (--color-success)
  error: "#BA1A1A",          // (--color-error)
  bgPage: "#F7F9FB",         // (--color-surface)
  bgCard: "#ffffff",         // (--color-surface-container-lowest)
  textDark: "#191C1E",       // (--color-on-surface)
  textBody: "#444653",       // (--color-on-surface-variant)
  textMuted: "#757684",      // (--color-outline)
  textLight: "#94a3b8",
  border: "#C4C5D5",         // (--color-outline-variant)
  bgAccent: "#E0F2FE",       // Sky-100 — azul claro limpo, sem lilás
};

/**
 * Base layout premium com header gradiente Azul Royal → Turquesa.
 * Logo com border-radius, cores do site, footer elegante.
 */
function buildBaseLayout(settings: SiteSettings, title: string, content: string): string {
  const logoHtml = settings.logo_url
    ? `<img src="${settings.logo_url}" alt="${settings.company_name}" style="height: 44px; width: auto; border-radius: 12px; margin-bottom: 12px;" />`
    : "";

  // Nome da empresa SEMPRE aparece no header (logo é complementar)
  const companyNameHtml = `<div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">${settings.company_name}</div>`;


  // WhatsApp formatado para o footer
  let waFooterHtml = "";
  if (settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0) {
    const rawNum = settings.whatsapp_support_numbers[0];
    let cleanNum = rawNum.replace(/\D/g, "");
    if (cleanNum.length >= 10 && !cleanNum.startsWith("55")) cleanNum = "55" + cleanNum;
    waFooterHtml = `
      <a href="https://wa.me/${cleanNum}" style="color: ${COLORS.secondary}; text-decoration: none; font-weight: 600;">
        WhatsApp: ${rawNum}
      </a>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${COLORS.bgPage}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: ${COLORS.textBody};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.bgPage}; padding: 32px 16px;">
        <tr>
          <td align="center">
            <!-- Card principal -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${COLORS.bgCard}; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(30, 64, 175, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);">
              
              <!-- HEADER com gradiente Azul Royal → Turquesa -->
              <tr>
                <td style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); padding: 28px 32px; text-align: center;">
                  ${logoHtml}
                  ${companyNameHtml}
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding: 36px 32px 28px 32px;">
                  <div style="font-size: 16px; line-height: 1.7; color: ${COLORS.textBody};">
                    ${content}
                  </div>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="padding: 0 32px 32px 32px;">
                  <div style="border-top: 2px solid ${COLORS.bgAccent}; padding-top: 24px; text-align: center;">
                    ${waFooterHtml ? `<p style="margin: 0 0 10px 0; font-size: 14px;">${waFooterHtml}</p>` : ""}
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.textMuted};">
                      Atenciosamente, <strong style="color: ${COLORS.primary};">Equipe ${settings.company_name}</strong>
                    </p>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Disclaimer abaixo do card -->
            <p style="text-align: center; font-size: 11px; color: ${COLORS.textLight}; margin-top: 20px; padding: 0 16px; line-height: 1.5;">
              Este e-mail foi enviado automaticamente por ${settings.company_name}.<br>Por favor, nao responda diretamente a este endereco.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Template premium para Reserva Cancelada.
 */
export function buildCancellationEmail({ userName, shortId, reasonHtml, settings }: CancellationRefundProps): string {
  const content = `
    <h2 style="color: ${COLORS.textDark}; font-size: 21px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
      Atualizacao da sua reserva
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 16px;">Prezado(a) <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <p style="margin-bottom: 20px;">
      Informamos que a sua reserva foi 
      <span style="color: ${COLORS.error}; font-weight: 600; background-color: #FFDAD6; padding: 2px 8px; border-radius: 6px;">cancelada</span>.
    </p>
    
    ${reasonHtml ? `
    <div style="background-color: ${COLORS.bgAccent}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; color: ${COLORS.textBody}; border-left: 4px solid ${COLORS.primary};">
      ${reasonHtml}
    </div>` : ""}
    
    <p style="margin-bottom: 0; color: ${COLORS.textBody};">
      Se houver qualquer duvida ou se desejar verificar opcoes para reagendamento, nossa equipe encontra-se a inteira disposicao.
    </p>
  `;

  return buildBaseLayout(settings, `Reserva Cancelada #${shortId}`, content);
}

/**
 * Template premium para Reembolso.
 */
export function buildRefundEmail({ userName, shortId, reasonHtml, settings }: CancellationRefundProps): string {
  const content = `
    <h2 style="color: ${COLORS.textDark}; font-size: 21px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
      Reembolso Processado
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 16px;">Prezado(a) <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <p style="margin-bottom: 20px;">
      Confirmamos que o reembolso correspondente a sua reserva foi devidamente 
      <span style="color: ${COLORS.success}; font-weight: 600; background-color: #DCFCE7; padding: 2px 8px; border-radius: 6px;">processado e autorizado</span>.
    </p>
    
    ${reasonHtml ? `
    <div style="background-color: ${COLORS.bgAccent}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; color: ${COLORS.textBody}; border-left: 4px solid ${COLORS.success};">
      ${reasonHtml}
    </div>` : ""}
    
    <p style="margin-bottom: 0; color: ${COLORS.textBody};">
      O prazo para que o valor seja creditado depende exclusivamente da sua instituicao financeira (geralmente entre 1 a 5 dias uteis).
    </p>
  `;

  return buildBaseLayout(settings, `Reembolso Processado #${shortId}`, content);
}

/**
 * Template premium para Reserva Expirada (TTL - Falta de Pagamento).
 */
export function buildExpiredEmail({ userName, shortId, excursionName, siteUrl, settings }: ExpiredProps): string {
  // Formatar WhatsApp para URL
  let waNumber = "";
  if (settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0) {
    waNumber = settings.whatsapp_support_numbers[0].replace(/\D/g, "");
    if (waNumber.length === 10 || waNumber.length === 11) {
      waNumber = "55" + waNumber;
    }
  }

  const waMessage = encodeURIComponent(`Ola, minha reserva #${shortId} expirou e gostaria de verificar se ainda ha vagas para ${excursionName}.`);
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : "";

  const content = `
    <h2 style="color: ${COLORS.textDark}; font-size: 21px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
      Aviso de Expiracao
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 16px;">Prezado(a) <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <p style="margin-bottom: 16px;">
      Informamos que o prazo para confirmacao do pagamento referente a viagem para <strong style="color: ${COLORS.primary};">${excursionName}</strong> expirou. Sendo assim, as poltronas foram automaticamente liberadas pelo sistema.
    </p>
    
    <div style="background-color: ${COLORS.bgAccent}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; color: ${COLORS.textBody}; text-align: center;">
      <strong>Ainda ha interesse na viagem?</strong> Caso deseje, voce pode realizar uma nova reserva para verificar se ainda existem assentos disponiveis.
    </div>
    
    <!-- Botao CTA principal -->
    <div style="text-align: center; margin: 32px 0 20px 0;">
      <a href="${siteUrl}" style="background: linear-gradient(135deg, ${COLORS.cta} 0%, ${COLORS.ctaDark} 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);">
        Verificar Disponibilidade
      </a>
    </div>

    ${waUrl ? `
    <!-- Link WhatsApp secundario -->
    <div style="text-align: center; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid ${COLORS.border};">
      <p style="color: ${COLORS.textMuted}; margin: 0 0 8px 0;">Prefere falar conosco?</p>
      <a href="${waUrl}" style="color: ${COLORS.secondary}; text-decoration: none; font-weight: 600; font-size: 14px;">
        Conversar no WhatsApp
      </a>
    </div>
    ` : ""}
  `;

  return buildBaseLayout(settings, `Reserva Expirada #${shortId}`, content);
}

function maskCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length < 11) return cpf;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/**
 * Template premium para Confirmacao e Envio de Vouchers.
 * Layout Bento com cards individuais por passageiro, QR Code inline e link para voucher individual.
 */
export function buildVoucherEmail({ userName, shortId, tripTitle, depDate, siteUrl, tickets, qrCidMap, settings }: VoucherEmailProps): string {
  
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  // Card de cada passageiro
  const ticketRows = tickets.map((t) => `
    <div style="background-color: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed ${COLORS.border}; padding-bottom: 12px; margin-bottom: 12px;">
        <strong style="color: ${COLORS.primary}; font-size: 15px;">${escapeHtml(t.full_name)}</strong>
        <span style="background-color: ${COLORS.bgAccent}; color: ${COLORS.primary}; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: bold;">Poltrona ${t.seat_code}</span>
      </div>
      
      <table style="width: 100%;" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width: 100px; vertical-align: top;">
            <img src="cid:${qrCidMap[t.id]}" alt="QR Code" width="80" height="80" style="border-radius: 8px; border: 1px solid ${COLORS.border};" />
          </td>
          <td style="vertical-align: top; padding-left: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">Codigo de Embarque</p>
            <div style="font-size: 24px; font-weight: 800; color: ${COLORS.textDark}; letter-spacing: 2px; font-family: monospace;">${t.short_code}</div>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: ${COLORS.textLight};">CPF: ${maskCPF(t.cpf)}</p>
          </td>
        </tr>
      </table>
      
      <!-- Link para voucher individual -->
      <div style="text-align: right; margin-top: 12px; padding-top: 10px; border-top: 1px solid ${COLORS.border};">
        <a href="${origin}/voucher/${t.id}" style="color: ${COLORS.primary}; font-size: 12px; font-weight: 600; text-decoration: none;">
          Ver Voucher Individual &rarr;
        </a>
      </div>
    </div>
  `).join("");

  const content = `
    <h2 style="color: ${COLORS.textDark}; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
      Reserva Confirmada
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 24px; font-size: 15px;">Prezado(a) <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <div style="background: linear-gradient(to right, ${COLORS.bgAccent}, #ffffff); border-left: 4px solid ${COLORS.secondary}; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
      <p style="margin: 0; font-size: 12px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">Viagem</p>
      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: ${COLORS.primaryDark};">${tripTitle}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: ${COLORS.textDark}; font-weight: 500;">${depDate}</p>
    </div>
    
    <h3 style="font-size: 16px; color: ${COLORS.textDark}; margin-bottom: 16px; border-bottom: 2px solid ${COLORS.bgAccent}; padding-bottom: 8px;">
      Vouchers de Embarque
    </h3>
    
    ${ticketRows}
    
    <div style="background-color: ${COLORS.bgAccent}; border-radius: 12px; padding: 20px; margin-top: 24px; margin-bottom: 32px;">
      <p style="margin: 0 0 12px 0; font-weight: 700; color: ${COLORS.textDark}; font-size: 14px;">Como utilizar seus vouchers:</p>
      <ul style="margin: 0; padding-left: 20px; color: ${COLORS.textBody}; font-size: 13px; line-height: 1.6;">
        <li style="margin-bottom: 8px;">Apresente este e-mail na tela do seu celular ao motorista no momento do embarque.</li>
        <li style="margin-bottom: 8px;">Caso nao consiga ler o QR Code, informe o <strong style="color: ${COLORS.primary};">Codigo de Embarque</strong> de 6 caracteres.</li>
        <li>Nao esqueca de levar um <strong>documento original com foto</strong> (RG ou CNH).</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${siteUrl}" style="background: linear-gradient(135deg, ${COLORS.cta} 0%, ${COLORS.ctaDark} 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);">
        Acessar Reserva Online
      </a>
    </div>
  `;

  return buildBaseLayout(settings, `Vouchers de Embarque - ${tripTitle}`, content);
}
