import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if profile needs completion
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("cpf, role")
          .eq("id", user.id)
          .single();

        // Google login users might not have CPF yet — always redirect to complete
        if (profile && !profile.cpf && next !== "/redefinir-senha") {
          return NextResponse.redirect(`${origin}/completar-cadastro`);
        }

        // Role-based redirect (only when next is default)
        if (next === "/") {
          if (profile?.role === "ADMIN" || profile?.role === "AGENT") {
            return NextResponse.redirect(`${origin}/admin`);
          }
          if (profile?.role === "DRIVER") {
            return NextResponse.redirect(`${origin}/motorista`);
          }
          // CLIENT goes to /painel
          return NextResponse.redirect(`${origin}/painel`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
