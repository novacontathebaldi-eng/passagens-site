import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/brevo";
import { buildExpiredEmail } from "@/lib/email-templates";
import { getSiteSettings } from "@/lib/get-settings";

export async function POST(request: Request) {
  try {
    // 1. Autorização básica (Secret enviado pelo Supabase Webhook via Headers)
    const authHeader = request.headers.get("Authorization") || "";
    const urlSecret = new URL(request.url).searchParams.get("secret") || "";
    
    // Pode usar um secret na querystring ou no header Authorization: Bearer <secret>
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isAuthorized = 
      authHeader.includes(expectedSecret as string) || 
      urlSecret === expectedSecret;

    if (!isAuthorized && expectedSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Parse do Payload (Webhook do Supabase)
    const payload = await request.json();

    // Aceita apenas UPDATE onde o status mudou para EXPIRED
    if (payload.type !== "UPDATE" || payload.record.status !== "EXPIRED" || payload.old_record?.status === "EXPIRED") {
      return NextResponse.json({ message: "Ignorado: não é uma expiração válida." });
    }

    const { id: reservationId, user_id, excursion_id } = payload.record;

    // 3. Obter dados estendidos usando o Service Role (Admin)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const adminClient = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3.1. Dados do Usuário (Email e Nome)
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(user_id);
    if (authError || !authUser?.user?.email) {
      console.error("Erro ao buscar e-mail do usuário:", authError);
      return NextResponse.json({ error: "Usuário/E-mail não encontrado." }, { status: 400 });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", user_id)
      .single();

    // 3.2. Dados da Excursão (Nome/Destino)
    const { data: excursion } = await adminClient
      .from("excursions")
      .select("tour_packages(title)")
      .eq("id", excursion_id)
      .single();

    const email = authUser.user.email;
    const userName = profile?.full_name || "Cliente";
    
    // O Prisma/Supabase retorna um array ou objeto aninhado. 
    // Vamos garantir que pegamos o texto corretamente.
    let excursionName = "sua excursão";
    if (excursion?.tour_packages) {
      excursionName = Array.isArray(excursion.tour_packages) 
        ? excursion.tour_packages[0]?.title 
        : (excursion.tour_packages as any).title;
    }

    // 4. Montar e-mail Premium
    const settings = await getSiteSettings();
    const shortId = reservationId.split('-')[0].toUpperCase();
    
    // Obter URL do site atual para o botão "Reservar Novamente"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const excursionUrl = `${siteUrl}/excursao/${excursion_id}`;

    const htmlContent = buildExpiredEmail({
      userName,
      shortId,
      excursionName,
      siteUrl: excursionUrl,
      settings
    });

    // 5. Enviar e-mail via Brevo
    await sendEmail({
      to: [{ email, name: userName }],
      subject: `Aviso: Sua reserva expirou ⏳ - ${settings.company_name}`,
      htmlContent
    });

    return NextResponse.json({ success: true, message: "E-mail de expiração enviado." });

  } catch (error: any) {
    console.error("Erro no Webhook de Expiração:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
