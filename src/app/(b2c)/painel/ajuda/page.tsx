import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle, HelpCircle, ShieldAlert, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Central de Ajuda | Partiu Turismo",
};

export default async function AjudaPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obter perfil para saudação no WhatsApp
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, cpf")
    .eq("id", user.id)
    .single();

  // Obter configurações globais
  const { data: settings } = await supabase
    .from("global_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!settings) {
    return <div className="p-8 text-center">Configurações indisponíveis no momento.</div>;
  }

  // Parse dinâmico (caso venha como string ou array)
  let faqItems: { id: string; question: string; answer: string }[] = [];
  try {
    faqItems = typeof settings.faq_items === "string" ? JSON.parse(settings.faq_items) : settings.faq_items || [];
  } catch {}

  let whatsappNumbers: string[] = [];
  try {
    whatsappNumbers = typeof settings.whatsapp_support_numbers === "string" 
      ? JSON.parse(settings.whatsapp_support_numbers) 
      : settings.whatsapp_support_numbers || [];
  } catch {}

  let socialLinks: { id: string; platform: string; name: string; url: string; isActive: boolean }[] = [];
  try {
    socialLinks = typeof settings.social_links === "string" 
      ? JSON.parse(settings.social_links) 
      : settings.social_links || [];
  } catch {}

  const activeSocialLinks = socialLinks.filter(l => l.isActive);

  // Helper para formatar o link do WhatsApp
  const getWhatsappLink = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    const msg = `Olá, meu nome é ${profile?.full_name || 'um cliente'}${profile?.cpf ? ` (CPF: ${profile.cpf})` : ''}. Preciso de ajuda com minhas reservas.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Voltar */}
        <div className="mb-6">
          <Link href="/painel" className="inline-flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar para o Painel
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-on-surface font-[family-name:var(--font-display)] flex items-center gap-3 mb-8">
          <HelpCircle className="w-8 h-8 text-primary" />
          Central de Ajuda
        </h1>

        <div className="space-y-8">
          
          {/* CARTÃO DE SUPORTE RÁPIDO (WHATSAPP) */}
          <section className="bg-gradient-to-br from-primary/10 to-surface-container-lowest border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-2">Suporte Rápido</h2>
            <p className="text-sm text-on-surface-variant mb-6">Nossa equipe está pronta para tirar suas dúvidas ou ajudar com problemas na sua viagem.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {whatsappNumbers.map((num, i) => (
                <a
                  key={i}
                  href={getWhatsappLink(num)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4 transition-all shadow-sm hover:shadow-md hover:border-primary/50 group"
                >
                  <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">WhatsApp</p>
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Falar com Suporte</p>
                  </div>
                </a>
              ))}
              {whatsappNumbers.length === 0 && (
                <p className="text-sm text-on-surface-variant italic">Número de suporte indisponível no momento.</p>
              )}
            </div>
          </section>

          {/* PERGUNTAS FREQUENTES (FAQ) */}
          {faqItems.length > 0 && (
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" /> Perguntas Frequentes
              </h2>
              
              <div className="space-y-4">
                {faqItems.map((faq, i) => (
                  <details key={faq.id || i} className="group border border-outline-variant/30 rounded-2xl bg-surface overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between p-4 font-semibold text-on-surface cursor-pointer hover:bg-surface-container-lowest transition-colors">
                      {faq.question}
                      <span className="ml-4 flex-shrink-0 text-primary transition duration-300 group-open:-rotate-180">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="p-4 pt-0 text-sm text-on-surface-variant leading-relaxed bg-surface-container-lowest border-t border-outline-variant/20">
                      {faq.answer.split('\n').map((line, j) => (
                        <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* POLÍTICA DE CANCELAMENTO E TERMOS */}
          {settings.cancellation_policy_text && (
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-on-surface-variant" /> Política de Cancelamento e Reembolso
              </h2>
              <div className="prose prose-sm prose-p:text-on-surface-variant prose-p:leading-relaxed max-w-none bg-surface p-4 rounded-2xl border border-outline-variant/20">
                {settings.cancellation_policy_text.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          )}

          {/* REDES SOCIAIS */}
          {activeSocialLinks.length > 0 && (
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-on-surface mb-4">Nossas Redes</h2>
              <div className="flex flex-wrap gap-3">
                {activeSocialLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.name || link.platform}
                  </a>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
