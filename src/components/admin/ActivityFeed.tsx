"use client";

import { useNotifications, type NotificationType } from "@/hooks/useNotifications";

const TYPE_LABELS: Record<NotificationType, { label: string; dotColor: string }> = {
  NEW_RESERVATION: { label: "Nova Reserva", dotColor: "bg-primary" },
  RESERVATION_APPROVED: { label: "Aprovada", dotColor: "bg-success" },
  RESERVATION_EXPIRED: { label: "Expirada", dotColor: "bg-warning" },
  RESERVATION_CANCELLED: { label: "Cancelada", dotColor: "bg-error" },
  RESERVATION_REFUNDED: { label: "Reembolso", dotColor: "bg-secondary" },
  NEW_CLIENT: { label: "Novo Cliente", dotColor: "bg-primary" },
  EXCURSION_SOLD_OUT: { label: "Esgotada", dotColor: "bg-cta" },
  WAITLIST_SPOT_OPENED: { label: "Vaga Aberta", dotColor: "bg-success" },
  SYSTEM_ALERT: { label: "Sistema", dotColor: "bg-outline" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `${diffMinutes}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function ActivityFeed() {
  const { notifications, isLoading } = useNotifications(10);

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30">
      <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <h2 className="font-bold text-on-surface text-sm">Atividade em Tempo Real</h2>
        </div>
        <span className="text-[10px] text-outline font-medium px-2 py-0.5 bg-surface-container rounded-full">
          LIVE
        </span>
      </div>

      <div className="divide-y divide-outline-variant/10 max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="px-6 py-8 text-center">
            <div className="w-5 h-5 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-outline mt-2">Carregando atividades...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="w-8 h-8 mx-auto text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs text-on-surface-variant mt-2">Nenhuma atividade recente</p>
            <p className="text-[10px] text-outline mt-0.5">As atividades aparecerão aqui em tempo real</p>
          </div>
        ) : (
          notifications.map((n, idx) => {
            const config = TYPE_LABELS[n.type] || TYPE_LABELS.SYSTEM_ALERT;
            const isLast = idx === notifications.length - 1;

            return (
              <div
                key={n.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-surface-container-low/30 transition-colors"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor} shrink-0 ring-2 ring-surface-container-lowest`} />
                  {!isLast && (
                    <div className="w-px flex-1 bg-outline-variant/30 mt-1 min-h-[16px]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.dotColor.replace("bg-", "text-")}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-outline">·</span>
                    <span className="text-[10px] text-outline">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
