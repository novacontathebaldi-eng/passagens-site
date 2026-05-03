import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReservationStatus } from "@/app/actions/reservas";
import Link from "next/link";

interface ReservationDrawerProps {
  reservationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type FullReservation = {
  id: string;
  total_amount: number;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
  notes: string | null;
  profiles: { full_name: string; phone: string; cpf: string } | null;
  excursions: { 
    id: string;
    departure_date: string;
    tour_packages: { title: string } | null;
  } | null;
  passenger_tickets: {
    id: string;
    full_name: string;
    cpf: string;
    seat_code: string;
    check_in_status: boolean;
  }[];
};

type AuditLog = {
  id: string;
  action: string;
  created_at: string;
  old_data: any;
  new_data: any;
  auth_users?: { email: string };
};

export function ReservationDrawer({ reservationId, isOpen, onClose }: ReservationDrawerProps) {
  const [reservation, setReservation] = useState<FullReservation | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen || !reservationId) {
      setReservation(null);
      setAuditLogs([]);
      return;
    }

    async function loadData() {
      setIsLoading(true);
      
      // Load reservation details
      const { data: resData } = await supabase
        .from("reservations")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          expires_at,
          notes,
          profiles ( full_name, phone, cpf ),
          excursions ( 
            id,
            departure_date,
            tour_packages ( title )
          ),
          passenger_tickets (
            id,
            full_name,
            cpf,
            seat_code,
            check_in_status
          )
        `)
        .eq("id", reservationId)
        .single();

      if (resData) {
        setReservation(resData as unknown as FullReservation);
      }

      // Load audit logs
      const { data: logsData } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          created_at,
          old_data,
          new_data
        `)
        .eq("entity_type", "reservations")
        .eq("entity_id", reservationId)
        .order("created_at", { ascending: false });

      if (logsData) {
        // Here we could join auth.users if we had access, but RLS on auth.users usually prevents it for clients.
        // If we want the actor's email, we might need an edge function or a secure view. 
        // For now we just show the action.
        setAuditLogs(logsData as AuditLog[]);
      }

      setIsLoading(false);
    }

    loadData();
  }, [isOpen, reservationId, supabase]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusLabels: Record<ReservationStatus, string> = {
    "PENDING_PIX": "Aguardando PIX",
    "AWAITING_MANUAL_CHECK": "Em Análise",
    "APPROVED": "Aprovada",
    "CANCELLED": "Cancelada",
    "EXPIRED": "Expirada",
    "REFUNDED": "Reembolsada",
  };

  const profile = Array.isArray(reservation?.profiles) ? reservation?.profiles[0] : reservation?.profiles;
  const excursion = Array.isArray(reservation?.excursions) ? reservation?.excursions[0] : reservation?.excursions;
  const tourTitle = Array.isArray(excursion?.tour_packages) ? excursion?.tour_packages[0]?.title : excursion?.tour_packages?.title;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-surface shadow-2xl z-50 transform transition-transform duration-300 flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Detalhes da Reserva</h2>
            {reservationId && <p className="text-sm text-outline font-mono mt-1">#{reservationId}</p>}
          </div>
          <div className="flex items-center gap-1">
            {/* Abrir em tela cheia */}
            {reservationId && (
              <Link
                href={`/admin/reservas/${reservationId}`}
                className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
                title="Abrir em tela cheia"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </Link>
            )}
            {/* Fechar drawer */}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !reservation ? (
            <div className="text-center text-outline py-12">Reserva não encontrada.</div>
          ) : (
            <>
              {/* Header Info */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">{tourTitle}</h3>
                  <p className="text-sm text-on-surface-variant">
                    Saída: {excursion?.departure_date ? formatDate(excursion.departure_date).split(' ')[0] : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary-dark mb-1">{formatCurrency(reservation.total_amount)}</div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface">
                    {statusLabels[reservation.status]}
                  </span>
                </div>
              </div>

              {/* Cliente */}
              <section>
                <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Cliente (Comprador)</h4>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-outline mb-1">Nome</div>
                    <div className="font-medium text-on-surface">{profile?.full_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-outline mb-1">E-mail</div>
                    <div className="font-medium text-on-surface">Protegido via Auth</div>
                  </div>
                  <div>
                    <div className="text-xs text-outline mb-1">CPF</div>
                    <div className="font-medium text-on-surface">{profile?.cpf || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-outline mb-1">Telefone / WhatsApp</div>
                    <div className="font-medium text-on-surface">{profile?.phone || 'N/A'}</div>
                  </div>
                </div>
              </section>

              {/* Notas */}
              {reservation.notes && (
                <section>
                  <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Motivo / Observações</h4>
                  <div className="bg-warning/10 p-4 rounded-xl border border-warning/20">
                    <p className="text-sm text-warning-dark whitespace-pre-wrap">{reservation.notes}</p>
                  </div>
                </section>
              )}

              {/* Passageiros */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Passageiros ({reservation.passenger_tickets?.length})</h4>
                  <a 
                    href={`/api/pdf/reserva?reservation_id=${reservation.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar PDF Vouchers
                  </a>
                </div>
                <div className="space-y-3">
                  {reservation.passenger_tickets?.map((ticket, i) => (
                    <div key={ticket.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface-variant">
                          {ticket.seat_code}
                        </div>
                        <div>
                          <div className="font-medium text-on-surface">{ticket.full_name}</div>
                          <div className="text-xs text-outline">CPF: {ticket.cpf}</div>
                        </div>
                      </div>
                      <div>
                        {ticket.check_in_status ? (
                          <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">Check-in OK</span>
                        ) : (
                          <span className="text-xs font-medium text-outline bg-surface-container px-2 py-1 rounded">Pendente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Histórico / Auditoria */}
              <section>
                <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Histórico da Reserva</h4>
                <div className="relative pl-4 border-l-2 border-surface-container-high space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" />
                    <div className="text-sm font-medium text-on-surface">Reserva Criada</div>
                    <div className="text-xs text-outline">{formatDate(reservation.created_at)}</div>
                  </div>
                  
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-surface-container-highest ring-4 ring-surface" />
                      <div className="text-sm font-medium text-on-surface">
                        {log.action === "STATUS_CHANGED" 
                          ? `Status alterado para ${statusLabels[log.new_data?.status as ReservationStatus] || log.new_data?.status}`
                          : log.action}
                      </div>
                      <div className="text-xs text-outline">{formatDate(log.created_at)}</div>
                      {log.new_data?.notes && (
                        <div className="text-xs text-on-surface-variant mt-1 bg-surface-container-low p-2 rounded">
                          Nota: {log.new_data.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
