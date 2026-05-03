"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changeReservationStatus, ReservationStatus } from "@/app/actions/reservas";
import { StatusActionModal } from "@/components/admin/reservas/StatusActionModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionType = "APPROVE" | "CANCEL" | "REFUND" | "REACTIVATE";

interface Reservation {
  id: string;
  total_amount: number;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
  notes: string | null;
  gateway_provider: string | null;
  profiles: { full_name: string; phone: string; cpf: string } | null;
  excursions: {
    id: string;
    departure_date: string;
    return_date: string | null;
    tour_packages: { title: string; slug: string } | null;
  } | null;
  passenger_tickets: {
    id: string;
    full_name: string;
    cpf: string;
    rg: string | null;
    seat_code: string;
    boarding_location_id: string | null;
    check_in_status: boolean;
    checked_in_at: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  }[];
}

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  old_data: any;
  new_data: any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusLabels: Record<ReservationStatus, string> = {
  PENDING_PIX: "Aguardando PIX",
  AWAITING_MANUAL_CHECK: "Em Análise",
  APPROVED: "Aprovada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REFUNDED: "Reembolsada",
};

const statusColors: Record<ReservationStatus, string> = {
  PENDING_PIX: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  AWAITING_MANUAL_CHECK: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  CANCELLED: "bg-red-500/15 text-red-700 border-red-500/30",
  EXPIRED: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  REFUNDED: "bg-orange-500/15 text-orange-700 border-orange-500/30",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

// ─── Actions available per status ────────────────────────────────────────────

function getAvailableActions(status: ReservationStatus): ActionType[] {
  switch (status) {
    case "PENDING_PIX":
    case "AWAITING_MANUAL_CHECK":
      return ["APPROVE", "CANCEL"];
    case "APPROVED":
      return ["CANCEL", "REFUND"];
    case "CANCELLED":
      return ["REFUND"];
    case "EXPIRED":
      return ["REACTIVATE"];
    default:
      return [];
  }
}

const actionMeta: Record<ActionType, { label: string; className: string }> = {
  APPROVE: { label: "Aprovar", className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  CANCEL: { label: "Cancelar", className: "bg-red-600 hover:bg-red-700 text-white" },
  REFUND: { label: "Reembolsar", className: "bg-warning hover:bg-warning/80 text-white" },
  REACTIVATE: { label: "Reativar", className: "bg-primary hover:bg-primary-dark text-white" },
};

// ─── Client Component ────────────────────────────────────────────────────────

export default function ReservationDetailClient({
  reservation,
  auditLogs,
}: {
  reservation: Reservation;
  auditLogs: AuditLog[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ActionType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const profile = Array.isArray(reservation.profiles) ? reservation.profiles[0] : reservation.profiles;
  const excursion = Array.isArray(reservation.excursions) ? reservation.excursions[0] : reservation.excursions;
  const tourTitle = Array.isArray(excursion?.tour_packages) ? excursion?.tour_packages[0]?.title : excursion?.tour_packages?.title;
  const shortId = reservation.id.split("-")[0].toUpperCase();
  const actions = getAvailableActions(reservation.status);

  const handleModalConfirm = async (notes?: string) => {
    if (!modalAction) return;
    setIsUpdating(true);

    let newStatus: ReservationStatus;
    switch (modalAction) {
      case "APPROVE": newStatus = "APPROVED"; break;
      case "CANCEL": newStatus = "CANCELLED"; break;
      case "REFUND": newStatus = "REFUNDED"; break;
      case "REACTIVATE": newStatus = "PENDING_PIX"; break;
      default: return;
    }

    const { error } = await changeReservationStatus(reservation.id, newStatus, notes);
    setIsUpdating(false);
    if (!error) {
      setModalOpen(false);
      setModalAction(null);
      router.refresh();
    }
  };

  // ─── TTL Timer ───────────────────────────────────────────────────────────
  const isExpiringSoon = reservation.status === "PENDING_PIX" && reservation.expires_at;
  const expiresDate = isExpiringSoon ? new Date(reservation.expires_at) : null;
  const now = new Date();
  const hoursLeft = expiresDate ? Math.max(0, (expiresDate.getTime() - now.getTime()) / 3600000) : null;

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* ─── Header / Breadcrumbs ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-outline mb-1">
                <Link href="/admin" className="hover:text-on-surface transition-colors">Admin</Link>
                <span>/</span>
                <Link href="/admin/reservas" className="hover:text-on-surface transition-colors">Reservas</Link>
                <span>/</span>
                <span className="text-on-surface-variant font-medium">#{shortId}</span>
              </nav>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
                Reserva #{shortId}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Links de PDF */}
            <a
              href={`/api/pdf/admin/reserva?reservation_id=${reservation.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-on-surface bg-surface border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Detalhes em PDF
            </a>
            <a
              href={`/api/pdf/reserva?reservation_id=${reservation.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Vouchers
            </a>

            {/* WhatsApp */}
            {profile?.phone && (
              <a
                href={`https://wa.me/55${profile.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}

            {/* Action Buttons */}
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => { setModalAction(action); setModalOpen(true); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${actionMeta[action].className}`}
              >
                {actionMeta[action].label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Bento Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ════ Coluna Principal (2/3) ════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card: Excursão + Dados Chave */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-transparent p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-outline uppercase tracking-wider mb-1">Excursão</p>
                    <h2 className="text-xl font-bold text-on-surface">{tourTitle || "N/A"}</h2>
                    <div className="flex items-center gap-4 mt-3 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {excursion?.departure_date ? formatDateShort(excursion.departure_date) : "N/A"}
                      </span>
                      {excursion?.return_date && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          Volta: {formatDateShort(excursion.return_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusColors[reservation.status]}`}>
                    {statusLabels[reservation.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Cliente (Comprador) */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Cliente (Comprador)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-outline mb-1">Nome Completo</p>
                  <p className="font-semibold text-on-surface">{profile?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-outline mb-1">CPF</p>
                  <p className="font-medium text-on-surface font-mono">{profile?.cpf || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-outline mb-1">Telefone / WhatsApp</p>
                  <p className="font-medium text-on-surface">{profile?.phone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Card: Notas / Motivo */}
            {reservation.notes && (
              <div className="bg-surface rounded-2xl border border-warning/20 p-6">
                <h3 className="text-sm font-bold text-warning uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Motivo / Observações
                </h3>
                <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{reservation.notes}</p>
              </div>
            )}

            {/* Card: Passageiros */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Passageiros ({reservation.passenger_tickets?.length || 0})
                </h3>
                <a
                  href={`/api/pdf/reserva?reservation_id=${reservation.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar PDF Vouchers
                </a>
              </div>

              {reservation.passenger_tickets?.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-outline uppercase tracking-wider border-b border-outline-variant/20">
                        <th className="text-left py-3 px-6 font-semibold">Poltrona</th>
                        <th className="text-left py-3 px-6 font-semibold">Nome</th>
                        <th className="text-left py-3 px-6 font-semibold">CPF</th>
                        <th className="text-left py-3 px-6 font-semibold">RG</th>
                        <th className="text-left py-3 px-6 font-semibold">Contato de Emergência</th>
                        <th className="text-left py-3 px-6 font-semibold">Check-in</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {reservation.passenger_tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="py-3 px-6">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                              {ticket.seat_code}
                            </span>
                          </td>
                          <td className="py-3 px-6 font-medium text-on-surface">{ticket.full_name}</td>
                          <td className="py-3 px-6 font-mono text-on-surface-variant">{ticket.cpf}</td>
                          <td className="py-3 px-6 text-on-surface-variant">{ticket.rg || "—"}</td>
                          <td className="py-3 px-6 text-on-surface-variant">
                            {ticket.emergency_contact_name
                              ? `${ticket.emergency_contact_name} (${ticket.emergency_contact_phone || "—"})`
                              : "—"}
                          </td>
                          <td className="py-3 px-6">
                            {ticket.check_in_status ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-1 rounded-md">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                OK
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-outline bg-surface-container px-2 py-1 rounded-md">Pendente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-outline text-center py-8">Nenhum passageiro registrado.</p>
              )}
            </div>
          </div>

          {/* ════ Coluna Lateral (1/3) ════ */}
          <div className="space-y-6">

            {/* Card: Resumo Financeiro */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Resumo Financeiro</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-on-surface-variant">Valor Total</span>
                  <span className="text-2xl font-bold text-on-surface">{formatCurrency(reservation.total_amount)}</span>
                </div>
                <div className="h-px bg-outline-variant/20" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-on-surface-variant">Passageiros</span>
                  <span className="font-semibold text-on-surface">{reservation.passenger_tickets?.length || 0}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-on-surface-variant">Valor por assento</span>
                  <span className="font-semibold text-on-surface">
                    {reservation.passenger_tickets?.length
                      ? formatCurrency(reservation.total_amount / reservation.passenger_tickets.length)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-on-surface-variant">Gateway</span>
                  <span className="font-medium text-on-surface-variant text-xs">{reservation.gateway_provider || "—"}</span>
                </div>
              </div>
            </div>

            {/* Card: Status & TTL */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${statusColors[reservation.status]}`}>
                    {statusLabels[reservation.status]}
                  </span>
                </div>
                <div className="text-xs text-outline space-y-1">
                  <p>Criada em: {formatDate(reservation.created_at)}</p>
                  {reservation.expires_at && <p>Expira em: {formatDate(reservation.expires_at)}</p>}
                </div>

                {/* TTL Warning */}
                {hoursLeft !== null && hoursLeft <= 4 && reservation.status === "PENDING_PIX" && (
                  <div className={`p-3 rounded-xl border text-sm font-semibold text-center ${hoursLeft <= 1 ? "bg-red-500/10 border-red-500/30 text-red-700 animate-pulse" : "bg-amber-500/10 border-amber-500/30 text-amber-700"}`}>
                    ⏳ {hoursLeft <= 0 ? "Expirada!" : `Expira em ${Math.floor(hoursLeft)}h ${Math.floor((hoursLeft % 1) * 60)}min`}
                  </div>
                )}
              </div>
            </div>

            {/* Card: Linha do Tempo (Auditoria) */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Histórico da Reserva</h3>
              <div className="relative pl-4 border-l-2 border-outline-variant/30 space-y-5">
                {/* Evento de Criação */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" />
                  <p className="text-sm font-medium text-on-surface">Reserva Criada</p>
                  <p className="text-xs text-outline">{formatDate(reservation.created_at)}</p>
                </div>

                {/* Logs de Auditoria */}
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-outline-variant ring-4 ring-surface" />
                    <p className="text-sm font-medium text-on-surface">
                      {log.action === "STATUS_CHANGED"
                        ? `Status alterado para ${statusLabels[log.new_data?.status as ReservationStatus] || log.new_data?.status}`
                        : log.action}
                    </p>
                    <p className="text-xs text-outline">{formatDate(log.created_at)}</p>
                    {log.new_data?.notes && (
                      <p className="text-xs text-on-surface-variant mt-1.5 bg-surface-container-low p-2 rounded-lg">
                        Nota: {log.new_data.notes}
                      </p>
                    )}
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-outline-variant/50 ring-4 ring-surface" />
                    <p className="text-xs text-outline italic">Nenhuma alteração registrada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusActionModal
        isOpen={modalOpen}
        action={modalAction}
        isLoading={isUpdating}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}
