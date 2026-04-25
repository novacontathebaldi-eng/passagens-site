import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const uid = searchParams.get('uid');
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!uid || !email || !token) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Link de confirmação inválido.")}`);
  }

  const supabase = await createClient();
  
  // A validação do HMAC agora acontece de forma segura DENTRO do banco de dados (RPC + Vault).
  // Isso impede que qualquer pessoa acione a RPC sem o token criptográfico correto.
  const { data: isValid, error: rpcError } = await supabase.rpc('confirm_user_email', {
    user_uid: uid,
    user_email: email,
    hmac_token: token
  });

  if (rpcError) {
    console.error("Erro ao confirmar e-mail via RPC:", rpcError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Erro interno ao confirmar o e-mail.")}`);
  }

  if (!isValid) {
     return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Link de confirmação corrompido ou inválido.")}`);
  }

  // Agora verificamos se o usuário por acaso já está logado nesta sessão de navegador
  const { data: { user } } = await supabase.auth.getUser();

  // Se o usuário não estiver logado (ex: clicou no link pelo app do Gmail no celular),
  // redirecionamos para o login avisando que o e-mail FOI confirmado com sucesso.
  if (!user || user.id !== uid) {
    return NextResponse.redirect(`${origin}/login?success=${encodeURIComponent("E-mail confirmado com sucesso! Por favor, faça login para acessar sua conta.")}`);
  }

  // Se estiver logado corretamente no mesmo navegador, vai direto para o painel.
  return NextResponse.redirect(`${origin}/painel?success=${encodeURIComponent("E-mail confirmado com sucesso!")}`);
}
