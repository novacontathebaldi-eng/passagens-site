import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MeusDadosForm from "./MeusDadosForm";

export default async function MeusDadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/painel"
            className="p-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">Meus Dados</h1>
            <p className="text-on-surface-variant text-sm mt-1">Mantenha suas informações pessoais atualizadas.</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
          <MeusDadosForm initialData={profile} />
        </div>
        
      </div>
    </div>
  );
}
