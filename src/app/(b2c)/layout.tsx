import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ViajaEdu! — Excursões Turísticas Rodoviárias",
  description:
    "Descubra destinos incríveis com excursões turísticas de ônibus premium. Pacotes completos com guia, ônibus executivo e tudo incluso.",
};

export default async function B2CLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col" suppressHydrationWarning>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 glass border-b border-outline-variant/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🚌</span>
            <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-primary group-hover:text-primary-dark transition-colors">
              ViajaEdu!
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
                <span className="text-2xl">🚌</span>
                <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-white">
                  ViajaEdu!
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
                <li>📧 suporte@othebaldi.me</li>
                <li>📱 WhatsApp disponível no checkout</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-outline/30 text-center text-xs text-outline">
            © {new Date().getFullYear()} ViajaEdu! — Todos os direitos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
