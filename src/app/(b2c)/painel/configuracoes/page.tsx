import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DangerZoneClient from "./DangerZoneClient";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">Privacidade e Configurações</h1>
            <p className="text-on-surface-variant text-sm mt-1">Gerencie seus dados e preferências da conta.</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4">Informações de Privacidade</h2>
          <p className="text-sm text-on-surface-variant mb-4">
            A Partiu Turismo respeita sua privacidade. As informações listadas abaixo detalham como seus dados
            são tratados e gerenciados em nossa plataforma, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
          <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside">
            <li>Seus dados de pagamento não são armazenados em nossos servidores.</li>
            <li>O e-mail e telefone são usados exclusivamente para comunicações sobre suas compras.</li>
            <li>O envio de promoções de marketing é opcional e você pode revogar quando quiser.</li>
          </ul>
        </div>

        <DangerZoneClient />
        
      </div>
    </div>
  );
}
