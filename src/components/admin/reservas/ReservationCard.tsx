import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Reservation } from "@/hooks/useRealtimeReservations";
import { useEffect, useState } from "react";

interface ReservationCardProps {
  reservation: Reservation;
  onActionClick: (id: string, action: "APPROVE" | "CANCEL" | "REFUND" | "REACTIVATE") => void;
  onClick?: (id: string) => void;
}

export function ReservationCard({ reservation, onActionClick, onClick }: ReservationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reservation.id, data: { status: reservation.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const profile = Array.isArray(reservation.profiles) ? reservation.profiles[0] : reservation.profiles;
  const excursion = Array.isArray(reservation.excursions) ? reservation.excursions[0] : reservation.excursions;
  const tourTitle = Array.isArray(excursion?.tour_packages) ? excursion?.tour_packages[0]?.title : excursion?.tour_packages?.title;
  const ticketsCount = reservation.passenger_tickets?.length || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  // TTL Logic
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (reservation.status !== "PENDING_PIX" || !reservation.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(reservation.expires_at).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeLeft("Expirado");
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      setIsUrgent(hours < 2);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [reservation.expires_at, reservation.status]);

  const whatsappUrl = profile?.phone 
    ? `https://wa.me/55${profile.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(profile.full_name.split(' ')[0])}%2C%20somos%20da%20Partiu%20Turismo!` 
    : "#";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent opening drawer if dragging
        if (!isDragging && onClick) {
          onClick(reservation.id);
        }
      }}
      className={`bg-surface p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isUrgent && reservation.status === 'PENDING_PIX' ? 'border-error animate-pulse shadow-error/20' : 'border-outline-variant/40'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-outline uppercase tracking-wider">#{reservation.id.split("-")[0]}</span>
        <span className="text-sm font-bold text-primary-dark">{formatCurrency(reservation.total_amount)}</span>
      </div>
      
      <div className="font-semibold text-on-surface mb-1 flex items-center justify-between gap-2">
        <span className="truncate">{profile?.full_name || "Cliente"}</span>
        {profile?.phone && (
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking link
            className="w-6 h-6 shrink-0 bg-success/10 text-success rounded-full flex items-center justify-center hover:bg-success/20 transition-colors"
            title="Abrir WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </a>
        )}
      </div>
      
      <div className="text-xs text-on-surface-variant mb-2 line-clamp-2">
        {tourTitle || "Excursão"} <br/>
        {excursion?.departure_date && new Date(excursion.departure_date).toLocaleDateString("pt-BR")}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-medium">
          🎫 {ticketsCount} poltronas
        </span>
        {reservation.status === "PENDING_PIX" && (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${isUrgent ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning-dark'}`}>
            ⏳ {timeLeft}
          </span>
        )}
      </div>
      
      {/* Fallback buttons if they don't want to drag */}
      <div className="flex gap-2 pt-3 border-t border-outline-variant/20">
        {(reservation.status === "PENDING_PIX" || reservation.status === "AWAITING_MANUAL_CHECK") ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onActionClick(reservation.id, "APPROVE"); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 bg-success/10 hover:bg-success/20 text-success text-xs font-bold py-1.5 rounded transition-colors"
            >
              Aprovar
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onActionClick(reservation.id, "CANCEL"); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 bg-error/10 hover:bg-error/20 text-error text-xs font-bold py-1.5 rounded transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : reservation.status === "APPROVED" ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onActionClick(reservation.id, "REFUND"); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 bg-warning/10 hover:bg-warning/20 text-warning-dark text-xs font-bold py-1.5 rounded transition-colors"
            >
              Reembolsar
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onActionClick(reservation.id, "CANCEL"); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 bg-error/10 hover:bg-error/20 text-error text-xs font-bold py-1.5 rounded transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : reservation.status === "EXPIRED" ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onActionClick(reservation.id, "REACTIVATE"); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold py-1.5 rounded transition-colors"
          >
            Reativar
          </button>
        ) : reservation.status === "CANCELLED" ? (
           <button 
              onClick={(e) => { e.stopPropagation(); onActionClick(reservation.id, "REFUND"); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 bg-warning/10 hover:bg-warning/20 text-warning-dark text-xs font-bold py-1.5 rounded transition-colors"
            >
              Reembolsar
            </button>
        ) : null}
      </div>
    </div>
  );
}
