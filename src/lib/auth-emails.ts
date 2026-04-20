import { sendEmail } from '@/lib/brevo';
import crypto from 'crypto';

export async function sendConfirmationEmail(userId: string, userEmail: string) {
  const secret = process.env.EMAIL_CONFIRM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("EMAIL_CONFIRM_SECRET env var is required for secure email confirmation tokens.");
  }
  const payload = `${userId}:${userEmail}`;
  const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmLink = `${origin}/auth/confirmar?uid=${userId}&email=${encodeURIComponent(userEmail)}&token=${token}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0284c7;">Confirme seu E-mail - ViajaEdu!</h2>
      <p>Olá,</p>
      <p>Obrigado por se cadastrar na ViajaEdu! Para garantir a segurança da sua conta e receber seus vouchers corretamente, precisamos confirmar seu endereço de e-mail.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmLink}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Confirmar meu E-mail
        </a>
      </div>
      <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
      <p style="font-size: 12px; word-break: break-all; color: #666;">${confirmLink}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999;">Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
    </div>
  `;

  await sendEmail({
    to: [{ email: userEmail }],
    subject: "Confirme seu e-mail na ViajaEdu!",
    htmlContent
  });
}
