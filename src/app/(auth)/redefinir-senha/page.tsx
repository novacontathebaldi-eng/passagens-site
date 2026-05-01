import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordClient } from "./ResetPasswordClient";
import { getSiteSettings } from "@/lib/get-settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Redefinir Senha | ${settings.company_name}`,
  };
}

export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const settings = await getSiteSettings();
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
          Você já pode escolher sua nova senha para acessar o {settings.company_name}.
        </p>
      </div>

      <ResetPasswordClient />
    </div>
  );
}