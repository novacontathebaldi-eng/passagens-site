import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import { getCoverImage } from "@/lib/tour-images";
import { HeroSearchBar } from "@/components/HeroSearchBar";
import { ExcursionGrid } from "@/components/ExcursionGrid";
import { CategoryPills } from "@/components/CategoryPills";
import type { ExcursionItem } from "@/lib/search-utils";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: excursionsRaw } = await supabase
    .from("excursions")
    .select(
      `
      id,
      price_per_seat,
      departure_date,
      return_date,
      status,
      allow_seat_selection,
      highlight_text,
      boarding_locations,
      tour_packages (
        id,
        title,
        slug,
        short_description,
        category,
        tour_package_images (
          url,
          is_cover,
          position
        )
      ),
      vehicle_layouts (
        capacity
      )
    `
    )
    .eq("status", "PUBLISHED")
    .order("departure_date", { ascending: true });

  // Transform raw data into clean ExcursionItem[] for client components
  const excursions: ExcursionItem[] = (excursionsRaw ?? [])
    .map((exc) => {
      const pkgRaw = exc.tour_packages as unknown;
      const pkg = (Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw) as {
        id: string;
        title: string;
        slug: string;
        short_description: string;
        category: string | null;
        tour_package_images: {
          url: string;
          is_cover: boolean;
          position: number;
        }[];
      } | null;
      const vehRaw = exc.vehicle_layouts as unknown;
      const vehicle = (Array.isArray(vehRaw) ? vehRaw[0] : vehRaw) as {
        capacity: number;
      } | null;

      if (!pkg) return null;

      return {
        id: exc.id,
        price_per_seat: Number(exc.price_per_seat),
        departure_date: exc.departure_date,
        return_date: exc.return_date ?? null,
        status: exc.status,
        highlight_text: exc.highlight_text ?? null,
        tour_package: {
          id: pkg.id,
          title: pkg.title,
          slug: pkg.slug,
          short_description: pkg.short_description,
          category: pkg.category,
          cover_image: getCoverImage(pkg.tour_package_images),
        },
        vehicle_capacity: vehicle?.capacity ?? null,
      } satisfies ExcursionItem;
    })
    .filter(Boolean) as ExcursionItem[];

  // Extract active categories (only those with published excursions)
  const categories = [
    ...new Set(
      excursions
        .map((e) => e.tour_package.category)
        .filter(Boolean) as string[]
    ),
  ].sort();

  return (
    <>
      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative overflow-hidden">
        {/* Dynamic hero background image from admin */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/api/settings/image?field=hero_image_url')`,
          }}
        />
        {/* Gradient overlay (ensures readability over any image) */}
        <div className="absolute inset-0 gradient-hero opacity-90" />
        {/* Decorative background glow (static, CSS-only) */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden">
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-secondary/20 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pt-16 sm:pb-32 lg:pt-20 lg:pb-40">
          <div className="max-w-3xl">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Vagas abertas para próximas excursões
              </div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-xl">
                Descubra destinos{" "}
                <span className="bg-gradient-to-r from-cta-light to-cta bg-clip-text text-transparent drop-shadow-md">
                  incríveis
                </span>{" "}
                pelo Brasil
              </h1>
            </div>

            <div>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl">
                Excursões turísticas de ônibus com tudo incluso. Escolha seu
                destino, garanta sua vaga e embarque na aventura!
              </p>
            </div>

            {/* Search Bar — now functional */}
            <div className="mt-10">
              <HeroSearchBar
                excursions={excursions}
                categories={categories}
              />
            </div>

            {/* Quick Category Filters — now functional */}
            <div className="mt-6">
              <HeroCategoryPills categories={categories} />
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute -bottom-1 left-0 right-0 w-full translate-y-[1px]">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-12 sm:h-16 lg:h-20 text-surface block"
          >
            <path
              d="M0 32C240 64 480 80 720 64C960 48 1200 16 1440 32V80H0V32Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section className="relative -mt-2 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                number: "50+",
                label: "Excursões realizadas",
                iconPath:
                  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              },
              {
                number: "2.000+",
                label: "Viajantes felizes",
                iconPath:
                  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
              },
              {
                number: "15+",
                label: "Destinos",
                iconPath:
                  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
              },
              {
                number: "4.9",
                label: "Avaliação média",
                iconPath:
                  "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest rounded-2xl p-5 text-center shadow-md hover:shadow-lg transition-shadow"
              >
                <svg
                  className="w-6 h-6 mx-auto text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={stat.iconPath}
                  />
                </svg>
                <p className="text-2xl font-bold text-primary mt-1">
                  {stat.number}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ EXCURSÕES (Client-side filtered) ══════════ */}
      <ExcursionGrid excursions={excursions} categories={categories} />

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-16 bg-surface-container-low">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-on-surface mb-12">
            Como funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                title: "Escolha seu destino",
                desc: "Navegue pelas excursões disponíveis e encontre a viagem perfeita para você.",
              },
              {
                step: "02",
                iconPath:
                  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                title: "Pague via PIX",
                desc: "Faça o pagamento por PIX e envie o comprovante. Confirmação em até 24h.",
              },
              {
                step: "03",
                iconPath:
                  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Embarque e aproveite!",
                desc: "Receba seu voucher digital, vá ao ponto de embarque e aproveite a viagem!",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-surface-container-lowest rounded-2xl p-6 shadow-md text-center group hover:shadow-lg transition-all"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-primary text-on-primary text-xs font-bold flex items-center justify-center shadow-md">
                  {item.step}
                </div>
                <svg
                  className="w-10 h-10 mx-auto mt-2 mb-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.iconPath}
                  />
                </svg>
                <h3 className="text-lg font-bold text-on-surface">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="gradient-hero rounded-3xl p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Pronto para embarcar?
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                Cadastre-se gratuitamente e garanta sua vaga nas melhores
                excursões do Brasil.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/cadastro"
                  className="px-8 py-4 rounded-2xl gradient-cta text-on-cta font-bold text-base shadow-xl hover:shadow-glow-cta transition-all"
                >
                  Criar conta gratuita
                </Link>
                <SmoothScrollLink
                  href="/#excursoes"
                  className="px-8 py-4 rounded-2xl bg-white/10 text-white font-semibold text-base hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Ver excursões
                </SmoothScrollLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Hero-specific category pills (white/glass style for dark hero bg) */
function HeroCategoryPills({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <a
          key={cat}
          href={`/excursoes?cat=${encodeURIComponent(cat)}`}
          className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium hover:bg-white/20 cursor-pointer transition-colors backdrop-blur-sm"
        >
          {cat}
        </a>
      ))}
    </div>
  );
}