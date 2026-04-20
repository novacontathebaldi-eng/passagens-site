import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";

export const metadata: Metadata = {
  title: "ViajaEdu! — Excursões Turísticas Rodoviárias",
  description:
    "Descubra destinos incríveis com excursões turísticas de ônibus premium. Pacotes completos com guia, ônibus executivo e tudo incluso.",
};

function LogoMark({ logoUrl, size = 28 }: { logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="ViajaEdu!"
        width={size}
        height={size}
        className="object-contain"
        unoptimized
      />
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 10L16 24L24 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10L16 18L20 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

function LogoMarkWhite({ logoUrl, size = 28 }: { logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="ViajaEdu!"
        width={size}
        height={size}
        className="object-contain brightness-0 invert"
        unoptimized
      />
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
      <path
        d="M8 10L16 24L24 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10L16 18L20 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

export default async function B2CLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen flex flex-col" suppressHydrationWarning>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 glass border-b border-outline-variant/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <LogoMark logoUrl={settings.logo_url} size={28} />
            <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-primary group-hover:text-primary-dark transition-colors">
              {settings.company_name}
            </span>
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
            <Link
              href="/#excursoes"
              className="hover:text-primary transition-colors"
            >
              Excursões
            </Link>
            <Link
              href="/sobre"
              className="hover:text-primary transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="/contato"
              className="hover:text-primary transition-colors"
            >
              Contato
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/painel"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Meu Painel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary-container/40 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex px-4 py-2 rounded-xl gradient-cta text-on-cta text-sm font-semibold shadow-sm hover:shadow-glow-cta transition-all"
                >
                  Cadastre-se
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-on-surface text-surface-container-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LogoMarkWhite logoUrl={settings.logo_url} size={28} />
                <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-white">
                  {settings.company_name}
                </span>
              </div>
              <p className="text-sm text-outline-variant leading-relaxed">
                Excursões turísticas rodoviárias premium. Pacotes completos
                com guia, ônibus executivo e tudo incluso.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">
                Links Rápidos
              </h3>
              <ul className="space-y-2 text-sm text-outline-variant">
                <li>
                  <Link
                    href="/#excursoes"
                    className="hover:text-white transition-colors"
                  >
                    Excursões
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sobre"
                    className="hover:text-white transition-colors"
                  >
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link
                    href="/termos"
                    className="hover:text-white transition-colors"
                  >
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacidade"
                    className="hover:text-white transition-colors"
                  >
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div suppressHydrationWarning>
              <h3 className="text-sm font-semibold text-white mb-4">
                Contato
              </h3>
              <ul className="space-y-2 text-sm text-outline-variant">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  suporte@othebaldi.me
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  WhatsApp disponível no checkout
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-outline/30 text-center text-xs text-outline">
            © {new Date().getFullYear()} {settings.company_name} — Todos os direitos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
