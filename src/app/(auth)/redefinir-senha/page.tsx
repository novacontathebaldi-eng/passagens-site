import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const metadata = {
  title: "Redefinir Senha | ViajaEdu!",
};

export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If there's no active session (i.e. the recovery link failed or they visited this manually),
  // redirect them to login. The recovery link automatically signs them in.
  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Link de recuperação inválido ou expirado."));
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface mb-2">
          Redefinir sua senha
        </h1>
        <p className="text-on-surface-variant text-sm">
          Você já pode escolher sua nova senha para acessar o ViajaEdu!.
        </p>
      </div>

      <ResetPasswordClient />
    </div>
  );
}