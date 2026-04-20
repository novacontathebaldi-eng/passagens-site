import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/brevo';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { email } = await req.json();

    if (email !== user.email) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Create a simple HMAC token with user id, email and a secret
    const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const payload = `${user.id}:${user.email}`;
    const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const confirmLink = `${origin}/auth/confirmar?uid=${user.id}&email=${encodeURIComponent(user.email!)}&token=${token}`;

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
      to: [{ email: user.email! }],
      subject: "Confirme seu e-mail na ViajaEdu!",
      htmlContent
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no send-confirmation:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
