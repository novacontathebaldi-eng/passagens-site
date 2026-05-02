import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("global_settings")
    .select("company_name, favicon_url, og_image_url, updated_at")
    .eq("id", 1)
    .single();

  const v = settings?.updated_at ? new Date(settings.updated_at).getTime() : Date.now();

  const title = settings?.company_name
    ? `${settings.company_name} — Excursões Turísticas Rodoviárias`
    : "Partiu Turismo — Excursões Turísticas Rodoviárias";

  return {
    title: {
      default: title,
      template: `%s | ${settings?.company_name || "Partiu Turismo"}`,
    },
    description:
      "Descubra destinos incríveis com excursões turísticas de ônibus premium. Pacotes completos com guia, ônibus executivo e tudo incluso. Garanta sua vaga!",
    keywords: [
      "excursões",
      "viagens de ônibus",
      "turismo rodoviário",
      "pacotes turísticos",
      "Partiu Turismo",
      "viagem barata",
      "excursão de ônibus",
    ],
    authors: [{ name: settings?.company_name || "Partiu Turismo" }],
    icons: settings?.favicon_url ? [
      { rel: "icon", url: `${settings.favicon_url}?v=${v}` },
      { rel: "apple-touch-icon", url: `${settings.favicon_url}?v=${v}` },
    ] : undefined,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: settings?.company_name || "Partiu Turismo",
      title: title,
      description:
        "Descubra destinos incríveis com excursões turísticas de ônibus premium.",
      images: settings?.og_image_url ? [
        {
          url: `${settings.og_image_url}?v=${v}`,
          width: 1200,
          height: 630,
          alt: settings?.company_name || "Partiu Turismo",
        }
      ] : undefined,
    },
  };
}

import { RefCatcher } from "@/components/RefCatcher";
import { Suspense } from "react";
import { GlobalRealtimeProvider } from "@/components/providers/GlobalRealtimeProvider";
import { Toaster } from "sonner";
import { LiveAlerts } from "@/components/LiveAlerts";
import { getCachedProfile } from "@/lib/get-profile";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCachedProfile();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${beVietnam.variable} antialiased`}
        suppressHydrationWarning
      >
        <GlobalRealtimeProvider>
          <Suspense fallback={null}>
            <RefCatcher />
          </Suspense>
          {children}
        </GlobalRealtimeProvider>
        <LiveAlerts role={profile?.role} />
        <Toaster
          position="bottom-left"
          richColors
          toastOptions={{ style: { fontSize: '14px', fontWeight: 500 } }}
        />
      </body>
    </html>
  );
}
