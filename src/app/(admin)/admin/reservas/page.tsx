"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { useRealtimeReservations } from "@/hooks/useRealtimeReservations";
import { ReservationStatus } from "@/app/actions/reservas";
import { ReservasKanban } from "@/components/admin/reservas/ReservasKanban";
import { ReservasList } from "@/components/admin/reservas/ReservasList";
import { StatusActionModal } from "@/components/admin/reservas/StatusActionModal";
import { ReservationDrawer } from "@/components/admin/reservas/ReservationDrawer";

type ExcursionOption = {
  id: string;
  departure_date: string;
  tour_packages: { title: string } | null;
};

type ViewMode = "kanban" | "list";
type ActionType = "APPROVE" | "CANCEL" | "REFUND" | "REACTIVATE";

export default function ReservasPage() {
  const [excursions, setExcursions] = useState<ExcursionOption[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ActionType | null>(null);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerReservationId, setDrawerReservationId] = useState<string | null>(null);
  
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const selectedExcursionId = searchParams.get("excursion_id") || "ALL";

  // Using the new real-time custom hook
  const { reservations, isLoading, updateStatus } = useRealtimeReservations(selectedExcursionId);

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

  const handleActionClick = (id: string, action: ActionType) => {
    setActiveReservationId(id);
    setModalAction(action);
    
    // Se for aprovação ou reativação, podemos até pular o modal, mas para manter a UI consistente:
    if (action === "CANCEL" || action === "REFUND") {
      setModalOpen(true);
    } else {
      // Para APPROVE e REACTIVATE, podemos perguntar ou ir direto. Vamos perguntar também no modal (opcional, o user pediu opcional para cancel/refund, mas pro approve é só clicar sim).
      setModalOpen(true);
    }
  };

  const handleModalConfirm = async (notes?: string) => {
    if (!activeReservationId || !modalAction) return;

    setIsUpdating(true);
    let newStatus: ReservationStatus;
    
    switch (modalAction) {
      case "APPROVE": newStatus = "APPROVED"; break;
      case "CANCEL": newStatus = "CANCELLED"; break;
      case "REFUND": newStatus = "REFUNDED"; break;
      case "REACTIVATE": newStatus = "PENDING_PIX"; break;
      default: return;
    }

    const { error } = await updateStatus(activeReservationId, newStatus, notes);
    
    setIsUpdating(false);
    if (!error) {
      setModalOpen(false);
      setActiveReservationId(null);
      setModalAction(null);
    }
  };

  const handleOpenDrawer = (id: string) => {
    setDrawerReservationId(id);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="space-y-6 flex flex-col h-[calc(100vh-100px)] p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              CRM de Reservas
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Gerencie o fluxo de vendas e reservas ativas.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* View Toggle */}
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 w-full sm:w-auto">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex-1 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'list' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Lista
              </button>
            </div>

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

        {viewMode === "kanban" ? (
          <ReservasKanban 
            reservations={reservations} 
            isLoading={isLoading} 
            onStatusChange={async () => {}} // Não usado diretamente mais, mas mantido na prop se precisar
            onActionClick={handleActionClick}
            onCardClick={handleOpenDrawer}
          />
        ) : (
          <ReservasList 
            reservations={reservations} 
            isLoading={isLoading} 
            onStatusChange={async () => {}}
            onActionClick={handleActionClick}
            onRowClick={handleOpenDrawer}
          />
        )}
      </div>

      <StatusActionModal
        isOpen={modalOpen}
        action={modalAction}
        isLoading={isUpdating}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />

      <ReservationDrawer
        isOpen={drawerOpen}
        reservationId={drawerReservationId}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
