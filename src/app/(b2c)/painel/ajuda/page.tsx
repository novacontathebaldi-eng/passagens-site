import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle, HelpCircle, ShieldAlert, ExternalLink, Mail, Info, CreditCard, Users, CheckCircle } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";
import { InteractiveFaq } from "./InteractiveFaq";

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
    const msg = `Olá, meu nome é ${profile?.full_name || 'um cliente'}. Preciso de ajuda com minhas reservas.`;
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
          
          {/* CARTÃO DE SUPORTE RÁPIDO */}
          <section className="bg-gradient-to-br from-primary/10 to-surface-container-lowest border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-2">Suporte Rápido</h2>
            <p className="text-sm text-on-surface-variant mb-6">Nossa equipe está pronta para tirar suas dúvidas ou ajudar com problemas na sua viagem.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whatsappNumbers.map((num, i) => (
                <a
                  key={i}
                  href={getWhatsappLink(num)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4 transition-all shadow-sm hover:shadow-md hover:border-[#25D366]/50 group"
                >
                  <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">WhatsApp</p>
                    <p className="text-sm font-bold text-on-surface group-hover:text-[#25D366] transition-colors truncate">{num}</p>
                  </div>
                </a>
              ))}
              
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex-1 bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4 transition-all shadow-sm hover:shadow-md hover:border-primary/50 group"
                >
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">E-mail</p>
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">{settings.contact_email}</p>
                  </div>
                </a>
              )}
            </div>
            {whatsappNumbers.length === 0 && !settings.contact_email && (
              <p className="text-sm text-on-surface-variant italic mt-4">Nenhum canal de suporte configurado no momento.</p>
            )}
          </section>

          {/* COMO RESERVAR */}
          <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-8 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Como reservar sua excursão?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
              {/* Linha conectora (visível apenas em telas maiores) */}
              <div className="hidden sm:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-outline-variant/30 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md ring-4 ring-surface-container-lowest">1</div>
                <h3 className="font-bold text-on-surface mb-2">Escolha o Destino</h3>
                <p className="text-sm text-on-surface-variant">Explore nossas opções e escolha a data ideal para sua viagem na página inicial.</p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md ring-4 ring-surface-container-lowest">2</div>
                <h3 className="font-bold text-on-surface mb-2">Adicione Passageiros</h3>
                <p className="text-sm text-on-surface-variant">Selecione quantos lugares deseja e preencha os dados dos acompanhantes.</p>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md ring-4 ring-surface-container-lowest">3</div>
                <h3 className="font-bold text-on-surface mb-2">Efetue o Pagamento</h3>
                <p className="text-sm text-on-surface-variant">Realize o pagamento via PIX, envie o comprovante pelo WhatsApp e aguarde a aprovação.</p>
              </div>
            </div>
          </section>

          {/* PERGUNTAS FREQUENTES (FAQ) */}
          <InteractiveFaq faqItems={faqItems} />

          {/* POLÍTICA DE CANCELAMENTO E TERMOS */}
          {settings.cancellation_policy_text && (
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-on-surface-variant" /> Política de Cancelamento e Reembolso
              </h2>
              <div className="flex flex-col gap-4">
                {settings.cancellation_policy_text.split('\n').map((line: string, i: number) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;
                  return (
                    <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mt-0.5 shrink-0 text-primary">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {trimmedLine}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* REDES SOCIAIS */}
          {activeSocialLinks.length > 0 && (
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-on-surface mb-6">Nossas Redes</h2>
              <SocialLinks links={socialLinks} className="flex flex-wrap gap-6" iconClassName="w-8 h-8 text-on-surface-variant hover:text-primary transition-all hover:scale-110" />
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
