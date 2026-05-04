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

// ─── Design Tokens (espelham o globals.css do site) ────────────────────────
const COLORS = {
  primary: "#1E40AF",        // Azul Royal
  primaryDark: "#00288E",
  secondary: "#06B6D4",      // Turquesa
  cta: "#F97316",            // Laranja Solar
  ctaDark: "#EA580C",
  success: "#10b981",
  error: "#ef4444",
  bgPage: "#f0f4ff",         // Azul-neve suave (mais vida que slate-50)
  bgCard: "#ffffff",
  textDark: "#0f172a",
  textBody: "#475569",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  bgAccent: "#EEF2FF",       // Indigo-50 (fundo de destaque)
};

/**
 * Base layout premium com header gradiente Azul Royal → Turquesa.
 * Logo com border-radius, cores vibrantes do site, footer elegante.
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
        💬 WhatsApp: ${rawNum}
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
              
              <!-- HEADER com gradiente Azul → Turquesa -->
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
                      Com carinho, <strong style="color: ${COLORS.primary};">Equipe ${settings.company_name}</strong> 🚌✨
                    </p>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Disclaimer abaixo do card -->
            <p style="text-align: center; font-size: 11px; color: ${COLORS.textLight}; margin-top: 20px; padding: 0 16px; line-height: 1.5;">
              Este é um e-mail automático enviado por ${settings.company_name}.<br>Por favor, não responda diretamente a este endereço.
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
      Atualização da sua reserva
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 16px;">Olá <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <p style="margin-bottom: 20px;">
      Informamos que a sua reserva foi 
      <span style="color: ${COLORS.error}; font-weight: 600; background-color: #FEF2F2; padding: 2px 8px; border-radius: 6px;">cancelada</span>.
    </p>
    
    ${reasonHtml ? `
    <div style="background-color: ${COLORS.bgAccent}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; color: ${COLORS.textBody}; border-left: 4px solid ${COLORS.primary};">
      ${reasonHtml}
    </div>` : ""}
    
    <p style="margin-bottom: 0; color: ${COLORS.textBody};">
      Se você acredita que isso foi um engano ou deseja remarcar, estamos à disposição para ajudar. Basta nos chamar! 💙
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
      Reembolso Processado ✅
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 16px;">Olá <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <p style="margin-bottom: 20px;">
      Temos uma boa notícia! O reembolso da sua reserva foi 
      <span style="color: ${COLORS.success}; font-weight: 600; background-color: #ECFDF5; padding: 2px 8px; border-radius: 6px;">processado e autorizado</span> 
      com sucesso.
    </p>
    
    ${reasonHtml ? `
    <div style="background-color: ${COLORS.bgAccent}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; color: ${COLORS.textBody}; border-left: 4px solid ${COLORS.success};">
      ${reasonHtml}
    </div>` : ""}
    
    <p style="margin-bottom: 0; color: ${COLORS.textBody};">
      O prazo para o valor constar na sua conta depende exclusivamente da sua instituição financeira. Geralmente leva de 1 a 5 dias úteis.
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

  const waMessage = encodeURIComponent(`Olá, minha reserva #${shortId} expirou e gostaria de verificar se ainda há vagas para ${excursionName}.`);
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : "";

  const content = `
    <h2 style="color: ${COLORS.textDark}; font-size: 21px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
      Sua reserva expirou ⏳
    </h2>
    <p style="font-size: 13px; color: ${COLORS.textMuted}; margin-top: 0; margin-bottom: 24px;">Pedido <strong>#${shortId}</strong></p>

    <p style="margin-bottom: 16px;">Oi <strong style="color: ${COLORS.textDark};">${userName}</strong>,</p>
    
    <p style="margin-bottom: 16px;">
      O prazo de pagamento da sua reserva para <strong style="color: ${COLORS.primary};">${excursionName}</strong> acabou e as poltronas foram liberadas.
    </p>
    
    <div style="background-color: ${COLORS.bgAccent}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; color: ${COLORS.textBody}; text-align: center;">
      💡 <strong>Imprevistos acontecem!</strong> Se você ainda quer viajar com a gente, tente reservar novamente — pode ser que ainda tenha vagas.
    </div>
    
    <!-- Botão CTA principal -->
    <div style="text-align: center; margin: 32px 0 20px 0;">
      <a href="${siteUrl}" style="background: linear-gradient(135deg, ${COLORS.cta} 0%, ${COLORS.ctaDark} 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);">
        🚌 Fazer Nova Reserva
      </a>
    </div>

    ${waUrl ? `
    <!-- Link WhatsApp secundário -->
    <div style="text-align: center; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid ${COLORS.border};">
      <p style="color: ${COLORS.textMuted}; margin: 0 0 8px 0;">Prefere falar com a gente?</p>
      <a href="${waUrl}" style="color: ${COLORS.secondary}; text-decoration: none; font-weight: 600; font-size: 14px;">
        💬 Conversar no WhatsApp →
      </a>
    </div>
    ` : ""}
  `;

  return buildBaseLayout(settings, `Reserva Expirada #${shortId}`, content);
}
