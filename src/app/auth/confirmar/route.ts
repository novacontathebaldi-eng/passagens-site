import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const uid = searchParams.get('uid');
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!uid || !email || !token) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Link de confirmação inválido.")}`);
  }

  // Verify the HMAC token
  const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const payload = `${uid}:${email}`;
  const expectedToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (token !== expectedToken) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Link de confirmação corrompido ou inválido.")}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== uid) {
    // Need to login first. Pass the current URL as redirect so they come back here
    const currentUrl = encodeURIComponent(`/auth/confirmar?uid=${uid}&email=${encodeURIComponent(email)}&token=${token}`);
    return NextResponse.redirect(`${origin}/login?redirect=${currentUrl}&error=${encodeURIComponent("Por favor, faça login para confirmar seu e-mail.")}`);
  }

  // User is logged in and token is valid. Update the profile.
  const { error } = await supabase
    .from('profiles')
    .update({ email_confirmed_at: new Date().toISOString() })
    .eq('id', uid);

  if (error) {
    console.error("Erro ao confirmar e-mail:", error);
    return NextResponse.redirect(`${origin}/painel?error=${encodeURIComponent("Erro ao atualizar o status do e-mail.")}`);
  }

  return NextResponse.redirect(`${origin}/painel?success=${encodeURIComponent("E-mail confirmado com sucesso!")}`);
}
