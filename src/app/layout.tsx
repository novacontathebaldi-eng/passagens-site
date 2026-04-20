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

export const metadata: Metadata = {
  title: {
    default: "ViajaEdu! — Excursões Turísticas Rodoviárias",
    template: "%s | ViajaEdu!",
  },
  description:
    "Descubra destinos incríveis com excursões turísticas de ônibus premium. Pacotes completos com guia, ônibus executivo e tudo incluso. Garanta sua vaga!",
  keywords: [
    "excursões",
    "viagens de ônibus",
    "turismo rodoviário",
    "pacotes turísticos",
    "ViajaEdu",
    "viagem barata",
    "excursão de ônibus",
  ],
  authors: [{ name: "ViajaEdu!" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "ViajaEdu!",
    title: "ViajaEdu! — Excursões Turísticas Rodoviárias",
    description:
      "Descubra destinos incríveis com excursões turísticas de ônibus premium.",
  },
};

import { RefCatcher } from "@/components/RefCatcher";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${beVietnam.variable} antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <RefCatcher />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
