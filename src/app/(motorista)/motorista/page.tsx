/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, Users, QrCode, BusFront, ChevronRight, Clock } from "lucide-react";

export default async function MotoristaHomePage() {
  const supabase = await createClient();

  // Fetch only excursions that are IN_PROGRESS or PUBLISHED with departure_date very soon
  const { data: excursions } = await supabase
    .from("excursions")
    .select(`
      id,
      departure_date,
      status,
      tour_packages (title, images),
      vehicle_layouts (name, capacity)
    `)
    .in("status", ["PUBLISHED", "IN_PROGRESS"])
    .order("departure_date", { ascending: true })
    .limit(5);

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] || "Motorista";

  return (
    <div className="py-4 md:py-6 space-y-8">
      
      {/* Header Section */}
      <section className="pt-2">
        <h2 className="font-headline font-bold text-3xl text-primary tracking-tight mb-1">
          Bom dia, {firstName}.
        </h2>
        <p className="font-body text-on-surface-variant text-lg">Aqui está o resumo das suas viagens.</p>
      </section>

      {/* Resumo do Dia / Próxima Viagem */}
      {excursions && excursions.length > 0 ? (
        (() => {
          const exc = excursions[0];
          const title = Array.isArray(exc.tour_packages) ? (exc.tour_packages as any)[0].title : (exc.tour_packages as any)?.title;
          const images = Array.isArray(exc.tour_packages) ? (exc.tour_packages as any)[0].images : (exc.tour_packages as any)?.images;
          const coverImage = images && images.length > 0 ? images[0] : null;

          return (
            <div className="relative rounded-3xl overflow-hidden bg-primary shadow-[0_8px_30px_rgb(25,28,30,0.06)] flex flex-col justify-between min-h-[380px]">
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                {coverImage && (
                  <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-primary/30"></div>
              </div>
              
              {/* Content (Top) */}
              <div className="relative z-10 p-6 flex justify-between items-start">
                <span className="bg-white/20 backdrop-blur-md text-on-primary font-bold text-[10px] px-3 py-1.5 rounded-full tracking-widest uppercase border border-white/20">
                  Próxima Viagem
                </span>
                <div className="bg-white/20 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center border border-white/20">
                  <BusFront className="w-5 h-5 text-on-primary" />
                </div>
              </div>

              {/* Content (Bottom) */}
              <div className="relative z-10 p-6 mt-auto space-y-6">
                <div>
                  <h3 className="font-headline font-extrabold text-3xl text-on-primary mb-3 text-shadow-subtle leading-tight">
                    {title}
                  </h3>
                  <div className="flex items-center gap-2 text-on-primary/90 font-body text-sm bg-white/15 w-fit px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                    <CalendarDays className="w-4 h-4 text-cta" />
                    <span>{formatDate(exc.departure_date)} • {formatTime(exc.departure_date)}</span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link 
                    href={`/motorista/checkin/${exc.id}`}
                    className="flex-1 bg-cta hover:bg-cta/90 text-on-cta font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(249,115,22,0.3)] transition-all active:scale-95"
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="tracking-wide uppercase text-sm">Ler QR Code</span>
                  </Link>
                  <Link 
                    href={`/motorista/manifesto/${exc.id}`}
                    className="sm:flex-none bg-surface hover:bg-surface-container-low text-primary font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Users className="w-5 h-5" />
                    <span className="uppercase text-sm">Passageiros</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm text-center border border-outline-variant/30">
          <p className="text-lg text-on-surface-variant">Você não possui viagens agendadas para hoje.</p>
        </div>
      )}

      {/* Próximas Expedições */}
      {excursions && excursions.length > 1 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-xl text-on-surface">Agenda Futura</h3>
          </div>
          <div className="space-y-4">
            {excursions.slice(1).map((exc) => {
              const title = Array.isArray(exc.tour_packages) ? (exc.tour_packages as any)[0].title : (exc.tour_packages as any)?.title;
              return (
                <Link 
                  href={`/motorista/manifesto/${exc.id}`}
                  key={exc.id} 
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgb(25,28,30,0.03)] flex items-center gap-5 group hover:bg-surface-container-low transition-colors block border border-transparent hover:border-outline-variant/20"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-headline font-bold text-on-surface text-lg group-hover:text-primary transition-colors">
                      {title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" /> {formatDate(exc.departure_date)}
                      </p>
                      <p className="font-body text-sm text-on-surface-variant flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {formatTime(exc.departure_date)}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 font-bold text-sm text-primary bg-primary/10 px-4 py-2 rounded-full">
                    Detalhes
                  </div>
                  <div className="sm:hidden text-on-surface-variant">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  );
}

