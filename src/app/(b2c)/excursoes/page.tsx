/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, Search, Bus } from "lucide-react";
import { getCoverImage } from "@/lib/tour-images";
import RealtimeSeatCount from "@/components/RealtimeSeatCount";

export const dynamic = "force-dynamic";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  const q = sp.q || "";
  const cat = sp.cat || "";

  // Fetch available categories (only those with published excursions)
  const { data: categoriesRaw } = await supabase
    .from("tour_packages")
    .select("category, excursions!inner(status)")
    .not("category", "is", null);

  const availableCategories = [
    ...new Set(
      (categoriesRaw ?? [])
        .filter((tp: any) => {
          const excs = Array.isArray(tp.excursions) ? tp.excursions : [tp.excursions];
          return excs.some((e: any) => e.status === "PUBLISHED");
        })
        .map((tp: any) => tp.category as string)
    ),
  ].sort();

  // Base query: only published future excursions
  let query = supabase
    .from("excursions")
    .select(
      `
      id,
      price_per_seat,
      departure_date,
      status,
      highlight_text,
      tour_packages!inner (
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
        capacity,
        bus_type
      )
    `
    )
    .eq("status", "PUBLISHED")
    .order("departure_date", { ascending: true });

  if (cat) {
    query = query.eq("tour_packages.category", cat);
  }
  if (q) {
    query = query.ilike("tour_packages.title", `%${q}%`);
  }

  const { data: excursions } = await query;

  // If filtered query returned 0 results, fetch ALL published excursions as fallback
  const hasFilters = !!(q || cat);
  const noResults = !excursions || excursions.length === 0;
  let fallbackExcursions: typeof excursions = null;

  if (hasFilters && noResults) {
    const { data: allExc } = await supabase
      .from("excursions")
      .select(
        `
        id,
        price_per_seat,
        departure_date,
        status,
        highlight_text,
        tour_packages!inner (
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
          capacity,
          bus_type
        )
      `
      )
      .eq("status", "PUBLISHED")
      .order("departure_date", { ascending: true });

    fallbackExcursions = allExc;
  }

  // Analytics: track catalog searches (fire-and-forget, never blocks render)
  if (q && q.trim().length >= 2) {
    const cleanTerm = q.trim().toLowerCase().slice(0, 200);
    const trackPromises: PromiseLike<unknown>[] = [
      supabase.rpc("increment_excursion_search_stat", { key_param: "total" }).then(),
      supabase.rpc("increment_excursion_search_stat", { key_param: "total_catalog" }).then(),
    ];

    if (noResults) {
      // Failure: log full term + increment failure counter
      trackPromises.push(
        supabase.from("excursion_search_analytics").insert({
          search_term: cleanTerm,
          result_count: 0,
          page_origin: "catalog",
        }).then(),
        supabase.rpc("increment_excursion_search_stat", { key_param: "failure" }).then()
      );
    } else {
      // Success: only increment counter
      trackPromises.push(
        supabase.rpc("increment_excursion_search_stat", { key_param: "success" }).then()
      );
    }

    Promise.all(trackPromises).catch(() => {});
  }

  const rawExcursions = noResults ? fallbackExcursions : excursions;

  // Calcular ocupação real das poltronas via RPC seguro
  const excursionIds = (rawExcursions || []).map((e: any) => e.id);
  let occupiedByExcursion: Record<string, number> = {};
  
  if (excursionIds.length > 0) {
    const { data: occupancyData } = await supabase
      .rpc('get_occupied_seats', { exc_ids: excursionIds });

    occupiedByExcursion = (occupancyData || []).reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row.excursion_id] = Number(row.occupied_count);
        return acc;
      }, {} as Record<string, number>
    );
  }

  const displayExcursions = (rawExcursions || []).map((exc: any) => {
    const vl = Array.isArray(exc.vehicle_layouts) ? exc.vehicle_layouts[0] : exc.vehicle_layouts;
    const capacity = vl?.capacity || 0;
    const occupied = occupiedByExcursion[exc.id] || 0;
    const availableCount = Math.max(0, capacity - occupied);
    return { ...exc, availableCount, capacity, occupied, busType: vl?.bus_type || "" };
  });

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface font-[family-name:var(--font-display)]">
            Explore Nossos Destinos
          </h1>
          <p className="mt-2 text-on-surface-variant text-lg">
            Encontre a excursão perfeita para o seu próximo feriado ou final de
            semana.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 sticky top-24">
              <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" /> Filtros
              </h2>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-2">
                    Buscar
                  </label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Ex: Guarujá, Aparecida..."
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-2">
                    Categoria
                  </label>
                  <select
                    name="cat"
                    defaultValue={cat}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Todas</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  Filtrar
                </button>

                {hasFilters && (
                  <Link
                    href="/excursoes"
                    className="block text-center text-sm text-primary font-medium hover:underline"
                  >
                    Limpar filtros
                  </Link>
                )}
              </form>
            </div>
          </div>

          {/* Grid de Excursões */}
          <div className="flex-1">
            {/* Fallback message when search had no direct results */}
            {hasFilters && noResults && fallbackExcursions && fallbackExcursions.length > 0 && (
              <div className="mb-6 bg-surface-container-low rounded-2xl p-4 text-center">
                <p className="text-on-surface-variant">
                  {q
                    ? `Não encontramos excursões para "${q}"`
                    : `Nenhuma excursão na categoria "${cat}" no momento`}
                  {" — "}mas veja nossas próximas aventuras! 🚌
                </p>
              </div>
            )}

            {displayExcursions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayExcursions.map((exc) => {
                  const pkgRaw = exc.tour_packages as unknown;
                  const pkg = (
                    Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw
                  ) as {
                    id: string;
                    title: string;
                    slug: string;
                    short_description: string;
                    category: string;
                    tour_package_images: {
                      url: string;
                      is_cover: boolean;
                      position: number;
                    }[];
                  } | null;

                  if (!pkg) return null;

                  return (
                    <article
                      key={exc.id}
                      className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col border border-outline-variant/30 cursor-pointer"
                    >
                      {/* Stretched link — makes the entire card clickable */}
                      <Link
                        href={`/excursao/${pkg.slug}`}
                        className="absolute inset-0 z-[1]"
                        aria-label={`Ver detalhes de ${pkg.title}`}
                        tabIndex={-1}
                      />

                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getCoverImage(pkg.tour_package_images)}
                          alt={pkg.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1 rounded-full">
                          {pkg.category || "Turismo"}
                        </div>
                        {exc.highlight_text && (
                          <span className="absolute top-3 right-3 px-3 py-1 rounded-full gradient-cta text-on-cta text-xs font-bold shadow-md">
                            {exc.highlight_text}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-bold text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">
                          {pkg.title}
                        </h3>

                        <div className="space-y-2 mb-4 mt-auto">
                          <div className="flex items-center text-sm text-on-surface-variant">
                            <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                            {formatDate(exc.departure_date)}
                          </div>
                          {exc.busType && (
                            <div className="flex items-center text-sm text-on-surface-variant capitalize">
                              <Bus className="w-4 h-4 mr-2 text-primary" />
                              Ônibus {exc.busType.toLowerCase()}
                            </div>
                          )}
                          <div className="text-xs font-medium">
                            <RealtimeSeatCount
                              excursionId={exc.id}
                              capacity={exc.capacity}
                              initialOccupied={exc.occupied}
                            />
                          </div>
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-outline-variant/30 mt-auto">
                          <div>
                            <span className="text-xs text-on-surface-variant block">
                              A partir de
                            </span>
                            <span className="text-xl font-extrabold text-primary">
                              {formatBRL(exc.price_per_seat)}
                            </span>
                          </div>
                          {/* CTA — positioned above the stretched link */}
                          <Link
                            href={`/excursao/${pkg.slug}`}
                            className="relative z-[2] bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary hover:text-on-primary transition-colors text-sm"
                          >
                            Ver Detalhes
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-12 text-center shadow-sm">
                <Search className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  Nenhuma excursão disponível no momento
                </h3>
                <p className="text-on-surface-variant">
                  Novas excursões em breve! Cadastre-se para ser avisado.
                </p>
                <Link
                  href="/cadastro"
                  className="mt-6 inline-block px-6 py-3 rounded-xl gradient-cta text-on-cta font-bold text-sm shadow-md hover:shadow-glow-cta transition-all"
                >
                  Criar conta gratuita
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

