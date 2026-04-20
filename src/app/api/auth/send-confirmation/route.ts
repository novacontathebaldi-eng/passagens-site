import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendConfirmationEmail } from '@/lib/auth-emails';

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

    // --- RATE LIMIT CHECK ---
    const action = 'email_confirmation';
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('action', action)
      .single();

    const now = new Date();

    if (rateLimit) {
      const lastRequest = new Date(rateLimit.last_request_at);
      const diffMinutes = (now.getTime() - lastRequest.getTime()) / (1000 * 60);
      const diffHours = diffMinutes / 60;

      // Reset if it's been more than an hour
      let currentCount = diffHours >= 1 ? 0 : rateLimit.request_count;

      if (diffHours < 1 && currentCount >= 5) {
         return NextResponse.json({ error: "Aguarde uma hora. Máximo de envios excedido." }, { status: 429 });
      }

      if (diffMinutes < 2) {
         return NextResponse.json({ error: "Aguarde pelo menos 2 minutos antes de pedir novamente." }, { status: 429 });
      }

      await supabase.from('rate_limits').update({
        last_request_at: now.toISOString(),
        request_count: currentCount + 1
      }).eq('id', rateLimit.id);
    } else {
      await supabase.from('rate_limits').insert({
        user_id: user.id,
        action,
        last_request_at: now.toISOString(),
        request_count: 1
      });
    }
    // ------------------------

    await sendConfirmationEmail(user.id, user.email!);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no send-confirmation:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
