import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordClient } from "./ResetPasswordClient";
import { getSiteSettings } from "@/lib/get-settings";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

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
    <main className="min-h-screen bg-surface flex relative items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 mt-8 sm:mt-0">
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <Logo logoUrl={settings.logo_url} companyName={settings.company_name} size="lg" />
          </Link>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface mb-2">
            Redefinir sua senha
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Você já pode escolher sua nova senha para acessar o {settings.company_name}.
          </p>
        </div>

        <ResetPasswordClient />
      </div>
    </main>
  );
}