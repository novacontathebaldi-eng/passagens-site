"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";

type Reservation = {
  id: string;
  total_amount: number;
  status: "PENDING_PIX" | "AWAITING_MANUAL_CHECK" | "APPROVED" | "REFUNDED" | "CANCELLED" | "EXPIRED";
  created_at: string;
  profiles: { full_name: string; phone: string } | null;
  excursions: { 
    departure_date: string;
    tour_packages: { title: string } | null;
  } | null;
};

type ExcursionOption = {
  id: string;
  departure_date: string;
  tour_packages: { title: string } | null;
};

const COLUMNS = [
  { id: "PENDING_PIX", title: "Aguardando PIX", color: "border-warning" },
  { id: "AWAITING_MANUAL_CHECK", title: "Em Análise", color: "border-cta" },
  { id: "APPROVED", title: "Aprovadas", color: "border-success" },
  { id: "CANCELLED", title: "Canceladas", color: "border-error" },
  { id: "EXPIRED", title: "Expiradas (TTL)", color: "border-outline" }
];

export default function KanbanReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [excursions, setExcursions] = useState<ExcursionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const selectedExcursionId = searchParams.get("excursion_id") || "ALL";

  useEffect(() => {
    async function loadExcursions() {
      const { data } = await supabase
        .from("excursions")
        .select("id, departure_date, tour_packages(title)")
        .order("departure_date", { ascending: false });
      if (data) setExcursions(data as unknown as ExcursionOption[]);
    }
    loadExcursions();
  }, [supabase]);

  useEffect(() => {
    async function fetchReservations() {
      setIsLoading(true);
      let query = supabase
        .from("reservations")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          profiles ( full_name, phone ),
          excursions ( 
            departure_date,
            tour_packages ( title )
          )
        `)
        .order("created_at", { ascending: false });

      if (selectedExcursionId !== "ALL") {
        query = query.eq("excursion_id", selectedExcursionId);
      }

      const { data } = await query;
      if (data) {
        setReservations(data as unknown as Reservation[]);
      }
      setIsLoading(false);
    }

    fetchReservations();

    // Set up Real-time Subscription
    const channel = supabase
      .channel('public:reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        (payload) => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedExcursionId]);

  async function handleStatusChange(id: string, newStatus: Reservation["status"]) {
    // Optimistic update
    setReservations(prev => prev.map(res => res.id === id ? { ...res, status: newStatus } : res));

    // Persist to DB
    const { error } = await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      // Fallback: reload state from db if error
      const { data } = await supabase.from("reservations").select("*, profiles(*), excursions(*, tour_packages(*))").eq("id", id).single();
      if (data) {
        setReservations(prev => prev.map(res => res.id === id ? (data as unknown as Reservation) : res));
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)] p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            CRM de Reservas (Kanban)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Arraste ou clique para mover as reservas pelo funil de vendas. Atualização em tempo real.
          </p>
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            value={selectedExcursionId}
            onChange={(e) => {
              if (e.target.value === "ALL") {
                router.push("/admin/reservas");
              } else {
                router.push(`/admin/reservas?excursion_id=${e.target.value}`);
              }
            }}
            className="w-full sm:w-64 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="ALL">Todas as Excursões</option>
            {excursions.map(exc => {
              const tourTitle = Array.isArray(exc.tour_packages) ? exc.tour_packages[0]?.title : exc.tour_packages?.title;
              return (
                <option key={exc.id} value={exc.id}>
                  {tourTitle} ({new Date(exc.departure_date).toLocaleDateString("pt-BR")})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const columnReservations = reservations.filter(r => r.status === col.id);
            
            return (
              <div key={col.id} className="w-80 flex flex-col bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shrink-0">
                <div className={`p-4 border-t-4 ${col.color} bg-surface-container-low border-b border-outline-variant/20 flex justify-between items-center shrink-0`}>
                  <h3 className="font-semibold text-on-surface">{col.title}</h3>
                  <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2 py-1 rounded-full">
                    {columnReservations.length}
                  </span>
                </div>
                
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center text-sm text-outline py-4">Carregando...</div>
                  ) : columnReservations.length === 0 ? (
                    <div className="text-center text-sm text-outline py-8 border-2 border-dashed border-outline-variant/30 rounded-xl">
                      Vazio
                    </div>
                  ) : (
                    columnReservations.map(res => {
                      const profile = Array.isArray(res.profiles) ? res.profiles[0] : res.profiles;
                      const excursion = Array.isArray(res.excursions) ? res.excursions[0] : res.excursions;
                      const tourTitle = Array.isArray(excursion?.tour_packages) ? excursion?.tour_packages[0]?.title : excursion?.tour_packages?.title;

                      return (
                        <div key={res.id} className="bg-surface p-4 rounded-xl border border-outline-variant/40 shadow-sm hover:shadow-md transition-shadow cursor-grab">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-outline uppercase tracking-wider">#{res.id.split("-")[0]}</span>
                            <span className="text-sm font-bold text-primary-dark">{formatCurrency(res.total_amount)}</span>
                          </div>
                          <div className="font-semibold text-on-surface mb-1">
                            {profile?.full_name || "Cliente Desconhecido"}
                          </div>
                          <div className="text-xs text-on-surface-variant mb-3 line-clamp-2">
                            {tourTitle || "Excursão Genérica"} <br/>
                            {excursion?.departure_date && new Date(excursion.departure_date).toLocaleDateString("pt-BR")}
                          </div>
                          
                          {/* Ações */}
                          <div className="flex gap-2 pt-3 border-t border-outline-variant/20">
                            {res.status === "PENDING_PIX" || res.status === "AWAITING_MANUAL_CHECK" ? (
                              <>
                                <button onClick={() => handleStatusChange(res.id, "APPROVED")} className="flex-1 bg-success/10 hover:bg-success/20 text-success text-xs font-bold py-1.5 rounded transition-colors">
                                  Aprovar
                                </button>
                                <button onClick={() => handleStatusChange(res.id, "CANCELLED")} className="flex-1 bg-error/10 hover:bg-error/20 text-error text-xs font-bold py-1.5 rounded transition-colors">
                                  Cancelar
                                </button>
                              </>
                            ) : res.status === "APPROVED" ? (
                              <button onClick={() => handleStatusChange(res.id, "REFUNDED")} className="flex-1 bg-warning/10 hover:bg-warning/20 text-warning text-xs font-bold py-1.5 rounded transition-colors">
                                Reembolsar
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
