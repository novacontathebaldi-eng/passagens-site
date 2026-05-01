import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.6";

const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
const brevoApiKey = Deno.env.get("BREVO_API_KEY") as string;
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const SENDER_EMAIL = "suporte@othebaldi.me";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    if (!hookSecret) {
      throw new Error("SEND_EMAIL_HOOK_SECRET is missing or empty.");
    }

    let wh;
    try {
      wh = new Webhook(hookSecret);
    } catch (e) {
      throw new Error("Failed to initialize Webhook: " + (e as Error).message);
    }
    
    let user: any;
    let email_data: any;
    
    try {
      const verified = wh.verify(payload, headers) as {
        user: any;
        email_data: any;
      };
      user = verified.user;
      email_data = verified.email_data;
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const emailType = email_data.email_action_type;

    if (emailType !== "recovery") {
      console.log(`Skipping email type: ${emailType}`);
      return new Response(JSON.stringify({ skipped: true, reason: `Type ${emailType} not handled` }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: settings } = await supabase
      .from("global_settings")
      .select("company_name, logo_url")
      .eq("id", 1)
      .single();

    const companyName = settings?.company_name || "Partiu Turismo";
    const logoUrl = settings?.logo_url;

    const userEmail = user.email;
    const firstName = user.user_metadata?.full_name?.split(" ")[0] || "Cliente";

    const subject = `Recuperação de Senha - ${companyName}`;
    
    const actionLink = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

    const headerHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 40px; display: block; margin: 0 auto;" />` 
      : `<h1 style="color: white; font-size: 28px; margin: 0;">🚌 ${companyName}</h1>`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F9FB; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
        <div style="background: linear-gradient(135deg, #1E40AF 0%, #00687A 50%, #00288E 100%); padding: 40px 32px; text-align: center;">
          ${headerHtml}
        </div>
        <div style="padding: 40px 32px; background: #FFFFFF;">
          <h2 style="color: #0F172A; font-size: 24px; margin-top: 0; margin-bottom: 16px;">Olá, ${firstName}!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no <strong>${companyName}</strong>. 
            Se foi você, basta clicar no botão abaixo para criar uma nova senha:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionLink}" style="display: inline-block; background: linear-gradient(135deg, #F97316, #EA580C); color: #FFFFFF; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2), 0 2px 4px -1px rgba(234, 88, 12, 0.1);">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color: #64748B; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:
            <br>
            <a href="${actionLink}" style="color: #0284C7; word-break: break-all; text-decoration: underline; display: inline-block; margin-top: 8px;">
              ${actionLink}
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;" />
          <p style="color: #94A3B8; font-size: 13px; line-height: 1.5; margin: 0;">
            Se você não solicitou esta alteração, pode ignorar este e-mail com segurança. Sua senha permanecerá a mesma.
          </p>
        </div>
        <div style="background: #F1F5F9; padding: 24px 32px; text-align: center;">
          <p style="color: #64748B; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} ${companyName} — Todos os direitos reservados
          </p>
        </div>
      </div>
    `;

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: companyName, email: SENDER_EMAIL },
        to: [{ email: userEmail, name: user.user_metadata?.full_name || firstName }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const brevoData = await brevoRes.json();

    if (!brevoRes.ok) {
      throw new Error("Failed to send email via Brevo: " + brevoData.message);
    }

    return new Response(JSON.stringify({ success: true, brevo: brevoData }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Internal Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
