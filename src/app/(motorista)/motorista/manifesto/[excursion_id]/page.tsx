import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, CheckCircle2, Clock, Phone, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function ManifestoPage({
  params
}: {
  params: Promise<{ excursion_id: string }>;
}) {
  const { excursion_id } = await params;
  const supabase = await createClient();

  // Fetch Excursion Details
  const { data: excursion } = await supabase
    .from("excursions")
    .select(`
      id,
      tour_packages (title),
      vehicle_layouts (capacity)
    `)
    .eq("id", excursion_id)
    .single();

  // Fetch Passengers from the secure View (LGPD compliance)
  const { data: passengers } = await supabase
    .from("driver_manifest_view")
    .select("*")
    .eq("excursion_id", excursion_id)
    .order("seat_code", { ascending: true });

  const pkgRaw = excursion?.tour_packages as any;
  const title = Array.isArray(pkgRaw) ? pkgRaw[0]?.title : pkgRaw?.title;

  const totalBoarded = passengers?.filter(p => p.check_in_status === true).length || 0;
  const totalTickets = passengers?.length || 0;

  return (
    <div className="bg-surface pb-20">
      {/* Sticky Header */}
      <div className="bg-surface-container-lowest sticky top-14 z-30 px-4 py-4 border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/motorista" className="text-on-surface-variant hover:text-primary p-1 bg-surface-container rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-on-surface text-lg leading-tight truncate">
            {title}
          </h1>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-on-surface-variant">Embarcados</span>
            <span className="text-primary">{totalBoarded} / {totalTickets}</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${totalTickets > 0 ? (totalBoarded / totalTickets) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Passenger List */}
      <div className="p-4 space-y-3">
        {passengers && passengers.length > 0 ? (
          passengers.map((passenger) => (
            <div 
              key={passenger.ticket_id} 
              className={`border rounded-2xl p-4 flex items-start gap-4 transition-all shadow-sm ${
                passenger.check_in_status 
                  ? "bg-success/5 border-success/30" 
                  : "bg-surface-container-lowest border-outline-variant/30"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                passenger.check_in_status ? "bg-success text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}>
                {passenger.seat_code}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-on-surface text-base truncate">{passenger.full_name}</h3>
                  {passenger.check_in_status ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-outline-variant shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-on-surface-variant mt-1 font-mono">{passenger.masked_cpf}</p>
                
                {passenger.emergency_contact_phone && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary bg-primary/10 w-max px-2 py-1 rounded-md">
                    <Phone className="w-3 h-3" />
                    Emergência: {passenger.emergency_contact_phone}
                  </div>
                )}
                
                {passenger.payment_status === 'PENDING_PIX' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-error font-bold">
                    <AlertCircle className="w-3 h-3" />
                    PAGAMENTO PENDENTE
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <p className="text-on-surface-variant">Nenhum passageiro confirmado ainda.</p>
          </div>
        )}
      </div>

    </div>
  );
}
