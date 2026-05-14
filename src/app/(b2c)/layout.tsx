import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";
import { SiteHeader } from "@/components/SiteHeader";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import { SocialLinks } from "@/components/SocialLinks";
import { GoogleOneTap } from "@/components/GoogleOneTap";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `${settings.company_name} — Excursões Turísticas Rodoviárias`,
    description:
      "Descubra destinos incríveis com excursões turísticas de ônibus premium. Pacotes completos com guia, ônibus executivo e tudo incluso.",
  };
}

function LogoMarkWhite({ logoUrl, companyName, size = 28 }: { logoUrl?: string | null; companyName?: string; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={companyName || "Partiu Turismo"}
        width={size}
        height={size}
        priority
        className="object-cover rounded-full ring-1 ring-white/20"
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

  // Fetch user role server-side for secure conditional rendering (e.g. admin shortcut)
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role ?? null;
  }

  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen flex flex-col" suppressHydrationWarning>
      {/* ── Navbar ── */}
      <SiteHeader user={user} settings={settings} userRole={userRole} />


      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Google One Tap (only for unauthenticated visitors) ── */}
      {!user && <GoogleOneTap />}

      {/* ── Floating WhatsApp Support Widget ── */}
      <WhatsAppWidget
        phoneNumbers={settings.whatsapp_support_numbers ?? []}
        companyName={settings.company_name}
        operatingHours={settings.operating_hours}
      />

      {/* ── Footer ── */}
      <footer id="site-footer" className="bg-on-surface text-surface-container-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LogoMarkWhite logoUrl={settings.logo_url} companyName={settings.company_name} size={28} />
                <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-white">
                  {settings.company_name}
                </span>
              </div>
              <p className="text-sm text-outline-variant leading-relaxed">
                Excursões turísticas rodoviárias premium. Pacotes completos
                com guia, ônibus executivo e tudo incluso.
              </p>
              <div className="mt-6">
                <SocialLinks links={settings.social_links} className="flex gap-4" iconClassName="w-5 h-5 text-outline-variant hover:text-white transition-colors" />
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">
                Links Rápidos
              </h3>
              <ul className="space-y-2 text-sm text-outline-variant">
                <li>
                  <SmoothScrollLink
                    href="/#excursoes"
                    className="hover:text-white transition-colors"
                  >
                    Excursões
                  </SmoothScrollLink>
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
                  <a href={`mailto:${settings.contact_email || "contato@partiuturismo.com.br"}`} className="hover:text-white transition-colors">
                    {settings.contact_email || "contato@partiuturismo.com.br"}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href={settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0 && settings.whatsapp_support_numbers[0].trim() !== "" ? `https://wa.me/${settings.whatsapp_support_numbers[0].replace(/\D/g, '')}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {settings.whatsapp_support_numbers && settings.whatsapp_support_numbers.length > 0 && settings.whatsapp_support_numbers[0].trim() !== "" ? settings.whatsapp_support_numbers[0] : "WhatsApp Indisponível"}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-outline/30 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-outline">
            <div>
              © {new Date().getFullYear()} {settings.company_name} — Todos os direitos reservados.
            </div>
            <div>
              Design e Tecnologia por{" "}
              <a
                href="https://othebaldi.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-medium hover:underline transition-colors"
              >
                oTHEBALDI
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
