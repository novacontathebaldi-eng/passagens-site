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

/**
 * Base layout responsivo, premium e moderno.
 * Cores baseadas no Tailwind CSS (slate-50, slate-900, etc).
 */
function buildBaseLayout(settings: SiteSettings, title: string, content: string): string {
  const logoHtml = settings.logo_url
    ? `<img src="${settings.logo_url}" alt="${settings.company_name}" style="height: 48px; width: auto; margin-bottom: 24px;" />`
    : `<h1 style="color: #0f172a; font-size: 24px; font-weight: bold; margin: 0 0 24px 0;">${settings.company_name}</h1>`;

  const footerContacts = settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0
    ? `Dúvidas? Fale conosco no WhatsApp: <strong>${settings.whatsapp_support_numbers[0]}</strong>`
    : `Dúvidas? Entre em contato conosco.`;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table max-width="600" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); text-align: left;">
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center;">
                    ${logoHtml}
                  </div>
                  
                  <div style="font-size: 16px; line-height: 1.6; color: #475569;">
                    ${content}
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
                  
                  <div style="text-align: center; font-size: 14px; color: #64748b;">
                    <p style="margin: 0 0 8px 0;">${footerContacts}</p>
                    <p style="margin: 0;">Equipe ${settings.company_name}</p>
                  </div>
                </td>
              </tr>
            </table>
            
            <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; padding: 0 20px;">
              Este é um e-mail automático enviado por ${settings.company_name}. Por favor, não responda diretamente a este endereço.
            </div>
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
    <h2 style="color: #0f172a; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Atualização da sua reserva</h2>
    <p style="margin-bottom: 16px;">Olá <strong>${userName}</strong>,</p>
    <p style="margin-bottom: 16px;">Vimos informar que a sua reserva <strong>#${shortId}</strong> foi <span style="color: #ef4444; font-weight: 500;">cancelada</span>.</p>
    ${reasonHtml ? `<div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; color: #475569;">${reasonHtml}</div>` : ''}
    <p style="margin-bottom: 0;">Se você acredita que isso foi um engano ou tem alguma dúvida, estamos à disposição para ajudar.</p>
  `;
  
  return buildBaseLayout(settings, `Reserva Cancelada #${shortId}`, content);
}

/**
 * Template premium para Reembolso.
 */
export function buildRefundEmail({ userName, shortId, reasonHtml, settings }: CancellationRefundProps): string {
  const content = `
    <h2 style="color: #0f172a; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Reembolso Processado</h2>
    <p style="margin-bottom: 16px;">Olá <strong>${userName}</strong>,</p>
    <p style="margin-bottom: 16px;">Temos uma boa notícia! O reembolso da sua reserva <strong>#${shortId}</strong> foi <span style="color: #10b981; font-weight: 500;">processado e autorizado</span> com sucesso.</p>
    ${reasonHtml ? `<div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; color: #475569;">${reasonHtml}</div>` : ''}
    <p style="margin-bottom: 0;">Lembramos que o prazo para o valor constar na sua conta ou fatura depende exclusivamente da instituição financeira ou operadora do cartão de crédito.</p>
  `;
  
  return buildBaseLayout(settings, `Reembolso Processado #${shortId}`, content);
}

/**
 * Template premium para Reserva Expirada (TTL - Falta de Pagamento).
 */
export function buildExpiredEmail({ userName, shortId, excursionName, siteUrl, settings }: ExpiredProps): string {
  // Limpar e formatar o número do whatsapp para a URL
  let waNumber = '';
  if (settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0) {
    waNumber = settings.whatsapp_support_numbers[0].replace(/\D/g, '');
    // Assegura o código DDI (55 para Brasil se não tiver)
    if (waNumber.length === 10 || waNumber.length === 11) {
      waNumber = '55' + waNumber;
    }
  }

  const waMessage = encodeURIComponent(`Olá, minha reserva #${shortId} expirou e gostaria de verificar se ainda há vagas para ${excursionName}.`);
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : '#';

  const content = `
    <h2 style="color: #0f172a; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Sua reserva expirou ⏳</h2>
    <p style="margin-bottom: 16px;">Oi <strong>${userName}</strong>,</p>
    <p style="margin-bottom: 16px;">O prazo de pagamento da sua reserva <strong>#${shortId}</strong> para a excursão <strong>${excursionName}</strong> acabou e, por isso, as poltronas foram liberadas.</p>
    <p style="margin-bottom: 24px;">Sabemos que imprevistos acontecem! Se você ainda deseja viajar com a gente, você pode tentar fazer uma nova reserva agora mesmo pelo nosso site.</p>
    
    <div style="text-align: center; margin-top: 32px; margin-bottom: 24px;">
      <a href="${siteUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
        Fazer Nova Reserva
      </a>
    </div>

    ${waNumber ? `
    <div style="text-align: center; font-size: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
      <p style="color: #64748b; margin-bottom: 12px;">Prefere falar com um atendente?</p>
      <a href="${waUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center;">
        Conversar no WhatsApp →
      </a>
    </div>
    ` : ''}
  `;
  
  return buildBaseLayout(settings, `Reserva Expirada #${shortId}`, content);
}
