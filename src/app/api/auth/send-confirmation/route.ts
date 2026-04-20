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

    await sendConfirmationEmail(user.id, user.email!);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no send-confirmation:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
