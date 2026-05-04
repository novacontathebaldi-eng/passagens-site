import { sendEmail } from '@/lib/brevo';
import { getSiteSettings } from '@/lib/get-settings';
import crypto from 'crypto';

export async function sendConfirmationEmail(userId: string, userEmail: string) {
  const secret = process.env.EMAIL_CONFIRM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("EMAIL_CONFIRM_SECRET env var is required for secure email confirmation tokens.");
  }
  
  const settings = await getSiteSettings();
  const companyName = settings.company_name || "Partiu Turismo";
  const logoUrl = settings.logo_url;
  const contactEmail = settings.contact_email || "suporte@othebaldi.me";

  const payload = `${userId}:${userEmail}`;
  const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmLink = `${origin}/auth/confirmar?uid=${userId}&email=${encodeURIComponent(userEmail)}&token=${token}`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #F7F9FB; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1E40AF 0%, #00687A 50%, #00288E 100%); padding: 40px 32px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 60px; margin-bottom: 16px;">` : `<h1 style="color: white; font-size: 28px; margin: 0;">${companyName}</h1>`}
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">Confirmação de Acesso</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #191C1E; font-size: 22px;">Confirme seu e-mail</h2>
        <p style="color: #444653; font-size: 15px; line-height: 1.6;">
          Olá! Para garantir a segurança da sua conta no <strong>${companyName}</strong> e permitir que você receba seus vouchers corretamente, precisamos confirmar seu endereço de e-mail.
        </p>
        
        <div style="margin: 32px 0; padding: 24px; background: white; border-radius: 12px; border: 1px solid #E2E8F0; text-align: center;">
          <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #F97316, #EA580C); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">Confirmar E-mail agora →</a>
        </div>

        <p style="color: #757684; font-size: 13px;">Se o botão não funcionar, copie e cole este link: <br/> <span style="font-size: 11px; color: #0284c7;">${confirmLink}</span></p>
      </div>
      <div style="background: #ECEEF0; padding: 20px 32px; text-align: center;">
        <p style="color: #757684; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${companyName} — Excursões Turísticas</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: [{ email: userEmail }],
    subject: `Confirme seu e-mail no ${companyName}`,
    htmlContent
  });
}
