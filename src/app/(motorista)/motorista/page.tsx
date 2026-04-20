import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, MapPin, Users, QrCode } from "lucide-react";

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

  return (
    <div className="p-4 space-y-6">
      
      {/* Resumo do Dia */}
      <div className="bg-primary text-on-primary p-6 rounded-3xl shadow-md">
        <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Próxima Viagem</h2>
        {excursions && excursions.length > 0 ? (
          <div>
            <h3 className="text-2xl font-bold font-[family-name:var(--font-display)] leading-tight mb-4">
              {Array.isArray(excursions[0].tour_packages) ? (excursions[0].tour_packages as any)[0].title : (excursions[0].tour_packages as any)?.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm font-medium bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-cta" />
                <span>{formatDate(excursions[0].departure_date)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link 
                href={`/motorista/manifesto/${excursions[0].id}`}
                className="flex-1 bg-surface text-primary font-bold py-3 px-4 rounded-xl text-center shadow-sm flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Passageiros
              </Link>
              <Link 
                href={`/motorista/checkin/${excursions[0].id}`}
                className="bg-cta text-on-cta font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Ler QR
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-lg mt-2">Você não possui viagens agendadas para hoje.</p>
        )}
      </div>

      {/* Próximas Expedições */}
      <div>
        <h3 className="font-bold text-on-surface mb-4">Agenda Futura</h3>
        <div className="space-y-4">
          {excursions && excursions.slice(1).map((exc) => {
            const title = Array.isArray(exc.tour_packages) ? (exc.tour_packages as any)[0].title : (exc.tour_packages as any)?.title;
            const veh = Array.isArray(exc.vehicle_layouts) ? exc.vehicle_layouts[0] : exc.vehicle_layouts;
            return (
              <div key={exc.id} className="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm leading-tight">{title}</h4>
                  <p className="text-xs text-on-surface-variant mt-1">{formatDate(exc.departure_date)}</p>
                </div>
                <Link 
                  href={`/motorista/manifesto/${exc.id}`}
                  className="px-3 py-2 bg-surface-container rounded-lg text-xs font-bold text-primary hover:bg-surface-container-high transition-colors"
                >
                  Ver
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
