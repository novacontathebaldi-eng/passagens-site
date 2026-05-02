import { useMemo, useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { ReservationStatus } from "@/app/actions/reservas";
import { Reservation } from "@/hooks/useRealtimeReservations";
import { ReservationCard } from "./ReservationCard";
import { useDroppable } from "@dnd-kit/core";

const COLUMNS = [
  { id: "PENDING_PIX", title: "Aguardando PIX", color: "border-warning" },
  { id: "AWAITING_MANUAL_CHECK", title: "Em Análise", color: "border-cta" },
  { id: "APPROVED", title: "Aprovadas", color: "border-success" },
  { id: "CANCELLED", title: "Canceladas", color: "border-error" },
  { id: "EXPIRED", title: "Expiradas (TTL)", color: "border-outline" },
  { id: "REFUNDED", title: "Reembolsadas", color: "border-purple-500" }
];

interface ReservasKanbanProps {
  reservations: Reservation[];
  isLoading: boolean;
  onStatusChange: (id: string, newStatus: ReservationStatus) => Promise<void>;
  onActionClick: (id: string, action: "APPROVE" | "CANCEL" | "REFUND" | "REACTIVATE") => void;
  onCardClick?: (id: string) => void;
}

// Helper to render the droppable column
function KanbanColumn({ col, reservations, onActionClick, onCardClick }: { col: typeof COLUMNS[0], reservations: Reservation[], onActionClick: any, onCardClick?: any }) {
  const { setNodeRef } = useDroppable({ id: col.id });
  const totalAmount = reservations.reduce((acc, curr) => acc + curr.total_amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  return (
    <div className="w-80 flex flex-col bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shrink-0">
      <div className={`p-4 border-t-4 ${col.color} bg-surface-container-low border-b border-outline-variant/20 flex justify-between items-center shrink-0`}>
        <h3 className="font-semibold text-on-surface">{col.title}</h3>
        <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2 py-1 rounded-full">
          {reservations.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[500px]">
        <SortableContext items={reservations.map(r => r.id)} strategy={rectSortingStrategy}>
          {reservations.map(res => (
            <ReservationCard 
              key={res.id} 
              reservation={res} 
              onActionClick={onActionClick}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>
        {reservations.length === 0 && (
          <div className="text-center text-sm text-outline py-8 border-2 border-dashed border-outline-variant/30 rounded-xl h-[100px] flex items-center justify-center">
            Vazio
          </div>
        )}
      </div>

      <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/20 text-right">
        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Total: </span>
        <span className="text-sm font-bold text-on-surface">{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}

export function ReservasKanban({ reservations, isLoading, onStatusChange, onActionClick, onCardClick }: ReservasKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag to trigger, helps with clicking buttons inside card
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeReservation = reservations.find(r => r.id === activeId);
    if (!activeReservation) return;

    // Se o target for uma coluna
    const targetStatus = COLUMNS.find(c => c.id === overId)?.id as ReservationStatus | undefined;
    
    // Ou se o target for outro card, pega o status daquele card
    const targetCardStatus = over.data.current?.status as ReservationStatus | undefined;

    const finalStatus = targetStatus || targetCardStatus;

    if (finalStatus && finalStatus !== activeReservation.status) {
      // Map drag to action
      if (finalStatus === "APPROVED") {
        onActionClick(activeId, "APPROVE");
      } else if (finalStatus === "CANCELLED") {
        onActionClick(activeId, "CANCEL");
      } else if (finalStatus === "REFUNDED") {
        onActionClick(activeId, "REFUND");
      } else if (finalStatus === "PENDING_PIX" && activeReservation.status === "EXPIRED") {
        onActionClick(activeId, "REACTIVATE");
      } else {
        // Other transitions could be handled here or blocked
        console.log("Transição não mapeada via drag:", activeReservation.status, "->", finalStatus);
      }
    }
  };

  const activeReservation = useMemo(
    () => reservations.find(r => r.id === activeId),
    [activeId, reservations]
  );

  if (isLoading && reservations.length === 0) {
    return <div className="text-center py-20 text-outline">Carregando kanban...</div>;
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => {
            if (col.id === "AWAITING_MANUAL_CHECK") return null;

            const columnReservations = reservations.filter(r => r.status === col.id);
            
            return (
              <KanbanColumn 
                key={col.id} 
                col={col} 
                reservations={columnReservations} 
                onActionClick={onActionClick}
                onCardClick={onCardClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeReservation ? (
            <ReservationCard 
              reservation={activeReservation} 
              onActionClick={() => {}} // dummy
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
