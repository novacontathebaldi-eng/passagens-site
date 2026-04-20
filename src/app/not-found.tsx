import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-6">
        {/* Imagem (O ônibus) */}
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl mb-8 border border-outline-variant/30">
          <img
            src="/images/eita404.png"
            alt="Ônibus perdido"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-left">
            <h2 className="text-4xl font-extrabold text-white drop-shadow-md">404</h2>
          </div>
        </div>

        {/* Título e Texto */}
        <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-display)] text-on-surface">
          Eita, o ônibus virou a esquina!
        </h1>
        <p className="text-lg text-on-surface-variant font-medium">
          A página que você está procurando não existe ou o caminho foi alterado. 
          Não se preocupe, nosso próximo embarque está logo ali.
        </p>

        {/* Botões de Ação */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto gradient-cta text-on-cta font-semibold py-3 px-8 rounded-xl shadow-md hover:shadow-glow-cta transition-all duration-200"
          >
            Voltar para o início
          </Link>
          <Link
            href="/#excursoes"
            className="w-full sm:w-auto bg-surface-container-low text-on-surface hover:bg-surface-container font-semibold py-3 px-8 rounded-xl border border-outline-variant transition-all duration-200"
          >
            Ver Viagens
          </Link>
        </div>
      </div>
    </main>
  );
}
