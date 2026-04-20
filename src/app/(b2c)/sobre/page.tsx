import { Bus, Map, ShieldCheck, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface font-[family-name:var(--font-display)] tracking-tight">
            Nossa Missão é Conectar Pessoas a <span className="text-primary">Destinos Incríveis</span>
          </h1>
          <p className="mt-4 text-lg text-on-surface-variant max-w-2xl mx-auto">
            A ViajaEdu! nasceu da paixão por explorar o Brasil. Oferecemos pacotes rodoviários completos com conforto, segurança e a melhor curadoria de roteiros.
          </p>
        </div>
      </div>

      {/* Valores */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Bus className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Frota Premium</h3>
            <p className="text-sm text-on-surface-variant">Ônibus modernos com ar-condicionado, Wi-Fi e poltronas confortáveis para viagens longas.</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-cta/10 rounded-full flex items-center justify-center mx-auto mb-4 text-cta">
              <Map className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Roteiros Exclusivos</h3>
            <p className="text-sm text-on-surface-variant">Curadoria minuciosa dos melhores destinos. Do bate-volta às grandes expedições de feriado.</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 text-success">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Segurança Total</h3>
            <p className="text-sm text-on-surface-variant">Motoristas experientes, seguro viagem incluso e suporte 24h durante toda a sua excursão.</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Atendimento Humano</h3>
            <p className="text-sm text-on-surface-variant">Esqueça os robôs. Nossa equipe cuida de cada passageiro como se fosse da própria família.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-on-surface mb-6">Pronto para sua próxima aventura?</h2>
        <Link href="/#excursoes" className="inline-block px-8 py-4 rounded-xl gradient-cta text-on-cta font-bold shadow-md hover:shadow-glow-cta transition-all text-lg">
          Ver Destinos Disponíveis
        </Link>
      </div>
    </div>
  );
}
