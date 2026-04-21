import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, MapPin, Users, Search } from "lucide-react";
import { getCoverImage } from "@/lib/tour-images";

// Forcing dynamic so we can read search params if needed
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

  // Base query: only published future excursions
  let query = supabase
    .from("excursions")
    .select(`
      id,
      price_per_seat,
      departure_date,
      status,
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
        capacity
      )
    `)
    .eq("status", "PUBLISHED")
    .gt("departure_date", new Date().toISOString())
    .order("departure_date", { ascending: true });

  if (cat) {
    query = query.eq("tour_packages.category", cat);
  }
  if (q) {
    query = query.ilike("tour_packages.title", `%${q}%`);
  }

  const { data: excursions } = await query;

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface font-[family-name:var(--font-display)]">
            Explore Nossos Destinos
          </h1>
          <p className="mt-2 text-on-surface-variant text-lg">
            Encontre a excursão perfeita para o seu próximo feriado ou final de semana.
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
                  <label className="block text-sm font-medium text-on-surface-variant mb-2">Buscar</label>
                  <input 
                    type="text" 
                    name="q"
                    defaultValue={q}
                    placeholder="Ex: Arraial do Cabo"
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-2">Categoria</label>
                  <select 
                    name="cat"
                    defaultValue={cat}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Todas</option>
                    <option value="PRAIA">Praias</option>
                    <option value="MONTANHA">Montanhas</option>
                    <option value="BATE_VOLTA">Bate e Volta</option>
                    <option value="FERIADAO">Feriadão</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-colors">
                  Filtrar
                </button>
              </form>
            </div>
          </div>

          {/* Grid de Excursões */}
          <div className="flex-1">
            {excursions && excursions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {excursions.map((exc) => {
                  const pkgRaw = exc.tour_packages as unknown;
                  const pkg = (Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw) as {
                    id: string;
                    title: string;
                    slug: string;
                    short_description: string;
                    category: string;
                    tour_package_images: { url: string; is_cover: boolean; position: number }[];
                  } | null;

                  if (!pkg) return null;

                  return (
                    <article key={exc.id} className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col border border-outline-variant/30">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getCoverImage(pkg.tour_package_images)}
                          alt={pkg.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1 rounded-full">
                          {pkg.category || "TURISMO"}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-bold text-on-surface mb-2 leading-tight">
                          {pkg.title}
                        </h3>
                        
                        <div className="space-y-2 mb-4 mt-auto">
                          <div className="flex items-center text-sm text-on-surface-variant">
                            <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                            {formatDate(exc.departure_date)}
                          </div>
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-outline-variant/30 mt-auto">
                          <div>
                            <span className="text-xs text-on-surface-variant block">A partir de</span>
                            <span className="text-xl font-extrabold text-primary">
                              {formatBRL(exc.price_per_seat)}
                            </span>
                          </div>
                          <Link
                            href={`/excursao/${pkg.slug}`}
                            className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary hover:text-on-primary transition-colors text-sm"
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
                <h3 className="text-xl font-bold text-on-surface mb-2">Nenhuma excursão encontrada</h3>
                <p className="text-on-surface-variant">Tente ajustar seus filtros ou buscar por outro destino.</p>
                <Link href="/excursoes" className="mt-6 inline-block text-primary font-bold hover:underline">
                  Limpar Filtros
                </Link>
              </div>
            )}
            
            {/* Paginação Placeholder */}
            {excursions && excursions.length > 0 && (
              <div className="mt-8 flex justify-center gap-2">
                <button className="px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-medium hover:bg-surface-container disabled:opacity-50" disabled>Anterior</button>
                <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium">1</button>
                <button className="px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-medium hover:bg-surface-container">2</button>
                <button className="px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-medium hover:bg-surface-container">Próxima</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
