/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";
import { formatBRL, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, CalendarDays, Bus, ShieldCheck } from "lucide-react";
import AmenityBadges from "@/components/AmenityBadges";
import RealtimeSeatCount from "@/components/RealtimeSeatCount";
import WaitlistButton from "./WaitlistButton";
import LightboxGallery from "./LightboxGallery";
import StickyExcursionTitle from "@/components/StickyExcursionTitle";
import { getCoverImage, getGalleryImages } from "@/lib/tour-images";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();

  const { data: pkg } = await supabase
    .from("tour_packages")
    .select("title, short_description, tour_package_images(url, is_cover, position)")
    .eq("slug", slug)
    .single();

  if (!pkg) return { title: "Excursão não encontrada" };

  const settings = await getSiteSettings();

  return {
    title: `${pkg.title} | ${settings.company_name}`,
    description: pkg.short_description,
    openGraph: {
      images: pkg.tour_package_images?.length > 0
        ? [getCoverImage(pkg.tour_package_images)]
        : [],
    },
  };
}

export default async function ExcursaoDetailsPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();
  const settings = await getSiteSettings();

  // Buscar Pacote e Excursões Relacionadas
  const { data: pkg } = await supabase
    .from("tour_packages")
    .select(`
      *,
      tour_package_images (
        id,
        url,
        alt_text,
        is_cover,
        position
      ),
      excursions (
        id,
        price_per_seat,
        departure_date,
        return_date,
        status,
        allow_seat_selection,
        vehicle_layouts (capacity, amenities, bus_type)
      )
    `)
    .eq("slug", slug)
    .single();

  if (!pkg) {
    notFound();
  }

  // Buscar ocupação real das poltronas via RPC seguro (bypassa RLS, retorna apenas contagem)
  const excursionIds = pkg.excursions.map((e: any) => e.id);
  const { data: occupancyData } = await supabase
    .rpc('get_occupied_seats', { exc_ids: excursionIds });

  const occupiedByExcursion = (occupancyData || []).reduce(
    (acc: Record<string, number>, row: any) => {
      acc[row.excursion_id] = Number(row.occupied_count);
      return acc;
    }, {} as Record<string, number>
  );

  const excursionsWithAvailability = pkg.excursions.map((exc: any) => {
    const capacity = exc.vehicle_layouts?.capacity || 0;
    const occupied = occupiedByExcursion[exc.id] || 0;
    const availableCount = Math.max(0, capacity - occupied);
    return { ...exc, capacity, occupied, availableCount };
  });

  const activeStatuses = ["PUBLISHED", "IN_PROGRESS"];

  const availableExcursions = excursionsWithAvailability
    .filter((e: any) => activeStatuses.includes(e.status) && new Date(e.departure_date) > new Date() && e.availableCount > 0)
    .sort((a: any, b: any) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime());

  const soldOutExcursions = excursionsWithAvailability
    .filter((e: any) => 
      (e.status === "SOLD_OUT" || (activeStatuses.includes(e.status) && e.availableCount === 0)) 
      && new Date(e.departure_date) > new Date()
    )
    .sort((a: any, b: any) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime());

  const { data: { user } } = await supabase.auth.getUser();

  const heroImage = getCoverImage(pkg.tour_package_images);
  const galleryImages = getGalleryImages(pkg.tour_package_images, true);

  return (
    <div className="min-h-screen bg-surface">
      {/* ── HERO HEADER ── */}
      <div className="relative h-[40vh] md:h-[60vh] w-full">
        <img
          src={heroImage}
          alt={pkg.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/5" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold mb-5 uppercase tracking-wider shadow-lg">
              {pkg.category || "Destino Incrível"}
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight font-[family-name:var(--font-display)]"
              style={{ color: "#FFFFFF", textShadow: "0px 2px 4px rgba(0,0,0,0.5)" }}
            >
              {pkg.title}
            </h1>
            <p
              className="mt-4 text-lg md:text-xl text-white/95 max-w-2xl font-medium"
              style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.5)" }}
            >
              {pkg.short_description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">

          {/* ── ESQUERDA: DETALHES DA VIAGEM ── */}
          <div className="w-full lg:w-2/3 space-y-10">

            {/* Sobre o Pacote */}
            <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
              <h2 className="text-2xl font-bold text-on-surface mb-4">Sobre o Roteiro</h2>
              <div className="prose prose-on-surface max-w-none text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                {pkg.description || "Nenhuma descrição detalhada informada para este roteiro."}
              </div>
            </section>

            {/* O que está incluso */}
            {pkg.includes && pkg.includes.length > 0 && (
              <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
                <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-primary w-6 h-6" /> O que está incluso?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pkg.includes.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-success/20 rounded-full p-1 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-on-surface-variant font-medium">
                        {typeof item === 'string' ? item : item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Conforto a Bordo (Amenidades do Veículo) */}
            {(() => {
              // Merge all amenities from all active excursions
              const mergedAmenities: Record<string, boolean> = {};
              excursionsWithAvailability.forEach((e: any) => {
                if (activeStatuses.includes(e.status) && e.vehicle_layouts?.amenities) {
                  Object.entries(e.vehicle_layouts.amenities).forEach(([key, value]) => {
                    if (value === true) {
                      mergedAmenities[key] = true;
                    }
                  });
                }
              });
              
              if (Object.keys(mergedAmenities).length === 0) return null;

              return (
                <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
                  <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                    <Bus className="text-primary w-6 h-6" /> Conforto a Bordo
                  </h2>
                  <AmenityBadges amenities={mergedAmenities} variant="pills" size="md" />
                  <p className="mt-6 text-xs text-on-surface-variant italic">
                    * As comodidades disponíveis podem variar de acordo com a data escolhida e o tipo de ônibus.
                  </p>
                </section>
              );
            })()}

            {/* Galeria de Fotos */}
            {galleryImages.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-on-surface">Galeria de Fotos</h2>
                <LightboxGallery images={galleryImages.map(img => img.url)} title={pkg.title} />
              </section>
            )}

            {/* Trust Badges */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Compra Segura</h4>
                  <p className="text-xs text-on-surface-variant">Pagamento via PIX</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl">
                <Bus className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Frota Executiva</h4>
                  <p className="text-xs text-on-surface-variant">Ônibus confortáveis</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl">
                <CalendarDays className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Garantia {settings.company_name}</h4>
                  <p className="text-xs text-on-surface-variant">Cancelamento fácil</p>
                </div>
              </div>
            </section>
          </div>

          {/* ── DIREITA: STICKY CHECKOUT PANEL ── */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xl">
              
              {/* COMPONENTE DE TÍTULO ANIMADO STICKY */}
              <StickyExcursionTitle title={pkg.title} />

              <h3 className="text-xl font-bold text-on-surface mb-2">Selecione uma Data</h3>
              <p className="text-sm text-on-surface-variant mb-6">Escolha o dia da sua viagem para consultar os valores.</p>

              <div className="space-y-4">
                {availableExcursions.length === 0 ? (
                  <div className="space-y-4">
                    {soldOutExcursions.length > 0 ? (
                      soldOutExcursions.map((exc: any) => (
                        <div key={exc.id} className="relative group border border-outline-variant/50 rounded-2xl p-4 bg-surface-container-low opacity-80 cursor-not-allowed">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-5 h-5 text-outline" />
                              <span className="font-bold text-outline line-through">{formatDate(exc.departure_date)}</span>
                            </div>
                            <span className="text-xs font-bold bg-error/10 text-error px-2 py-1 rounded">ESGOTADO</span>
                          </div>

                          <div className="mt-4">
                            <WaitlistButton excursionId={exc.id} user={user} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-surface-container-low rounded-xl border border-outline-variant/30">
                        <p className="text-on-surface-variant font-medium">Nenhuma data prevista no momento.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  availableExcursions.map((exc: any) => (
                    <div key={exc.id} className="relative group border border-outline-variant/50 rounded-2xl p-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-5 h-5 text-primary" />
                          <span className="font-bold text-on-surface">{formatDate(exc.departure_date)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-outline block">por passageiro</span>
                          <span className="font-bold text-lg text-primary">{formatBRL(exc.price_per_seat)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3 flex-wrap gap-y-2">
                        <span className="flex items-center gap-1 font-medium"><Bus className="w-3 h-3" /> {exc.vehicle_layouts?.bus_type ? `Ônibus ${exc.vehicle_layouts.bus_type.charAt(0).toUpperCase()}${exc.vehicle_layouts.bus_type.slice(1).toLowerCase()}` : 'Ônibus Padrão'}</span>
                        {exc.vehicle_layouts?.amenities && Object.values(exc.vehicle_layouts.amenities).some((v: any) => v === true) && (
                          <div className="flex items-center">
                            <AmenityBadges amenities={exc.vehicle_layouts.amenities} variant="icons" size="sm" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4 flex-wrap">
                        {exc.allow_seat_selection ? (
                          <span className="text-success font-medium">Escolha sua Poltrona</span>
                        ) : (
                          <span>Alocação automática</span>
                        )}
                        <span className="flex items-center gap-1">•</span>
                        <RealtimeSeatCount
                          excursionId={exc.id}
                          capacity={exc.capacity}
                          initialOccupied={exc.occupied}
                        />
                      </div>

                      <Link
                        href={`/checkout/${exc.id}`}
                        className="block w-full text-center bg-on-surface text-surface-container-lowest py-3 rounded-xl font-bold hover:bg-primary hover:text-on-primary transition-colors shadow-md"
                      >
                        Reservar Vaga
                      </Link>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}