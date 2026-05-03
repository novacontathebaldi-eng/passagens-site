import { ReservationStatus } from "@/app/actions/reservas";
import { Reservation } from "@/hooks/useRealtimeReservations";
import { useState, useMemo } from "react";

interface ReservasListProps {
  reservations: Reservation[];
  isLoading: boolean;
  onActionClick: (id: string, action: "APPROVE" | "CANCEL" | "REFUND" | "REACTIVATE") => void;
  onRowClick?: (id: string) => void;
}

type SortField = "id" | "status" | "date" | "amount";
type SortOrder = "asc" | "desc";

export function ReservasList({ reservations, isLoading, onActionClick, onRowClick }: ReservasListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedReservations = useMemo(() => {
    let result = [...reservations];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(res => {
        const profile = Array.isArray(res.profiles) ? res.profiles[0] : res.profiles;
        const excursion = Array.isArray(res.excursions) ? res.excursions[0] : res.excursions;
        const tourTitle = Array.isArray(excursion?.tour_packages) ? excursion?.tour_packages[0]?.title : excursion?.tour_packages?.title;

        return (
          res.id.toLowerCase().includes(lowerTerm) ||
          (profile?.full_name && profile.full_name.toLowerCase().includes(lowerTerm)) ||
          (profile?.cpf && profile.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))) ||
          (tourTitle && tourTitle.toLowerCase().includes(lowerTerm))
        );
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "amount":
          comparison = a.total_amount - b.total_amount;
          break;
        case "date":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [reservations, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage);
  const currentReservations = filteredAndSortedReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const statusColors: Record<ReservationStatus, string> = {
    "PENDING_PIX": "bg-warning/10 text-warning-dark border-warning/20",
    "AWAITING_MANUAL_CHECK": "bg-cta/10 text-cta border-cta/20",
    "APPROVED": "bg-success/10 text-success border-success/20",
    "CANCELLED": "bg-error/10 text-error border-error/20",
    "EXPIRED": "bg-outline/10 text-outline border-outline/20",
    "REFUNDED": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };

  const statusLabels: Record<ReservationStatus, string> = {
    "PENDING_PIX": "Aguardando PIX",
    "AWAITING_MANUAL_CHECK": "Em Análise",
    "APPROVED": "Aprovada",
    "CANCELLED": "Cancelada",
    "EXPIRED": "Expirada",
    "REFUNDED": "Reembolsada",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Ferramentas da Lista */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, CPF, ID ou excursão..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant/30 bg-surface text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="text-sm text-on-surface-variant font-medium">
          {filteredAndSortedReservations.length} {filteredAndSortedReservations.length === 1 ? 'reserva' : 'reservas'}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort("id")}>
                  <div className="flex items-center gap-1">
                    ID {sortField === "id" && <span className="text-xs">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Excursão</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort("date")}>
                  <div className="flex items-center gap-1">
                    Data {sortField === "date" && <span className="text-xs">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-surface-container-low transition-colors text-right" onClick={() => handleSort("amount")}>
                  <div className="flex items-center justify-end gap-1">
                    Valor {sortField === "amount" && <span className="text-xs">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">
                    Status {sortField === "status" && <span className="text-xs">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading && reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-outline">Carregando lista...</td>
                </tr>
              ) : currentReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-outline border-2 border-dashed border-outline-variant/30 m-4 rounded-xl">
                    Nenhuma reserva encontrada para os filtros atuais.
                  </td>
                </tr>
              ) : (
                currentReservations.map(res => {
                  const profile = Array.isArray(res.profiles) ? res.profiles[0] : res.profiles;
                  const excursion = Array.isArray(res.excursions) ? res.excursions[0] : res.excursions;
                  const tourTitle = Array.isArray(excursion?.tour_packages) ? excursion?.tour_packages[0]?.title : excursion?.tour_packages?.title;

                  return (
                    <tr 
                      key={res.id} 
                      className="hover:bg-surface-container-lowest/50 transition-colors cursor-pointer"
                      onClick={() => onRowClick && onRowClick(res.id)}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-outline uppercase">
                        {res.id.split("-")[0]}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-on-surface">{profile?.full_name || "Desconhecido"}</div>
                        {profile?.cpf && <div className="text-xs text-on-surface-variant font-mono">{profile.cpf}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-on-surface-variant">{tourTitle}</div>
                        {excursion?.departure_date && <div className="text-xs text-outline">{new Date(excursion.departure_date).toLocaleDateString("pt-BR")}</div>}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {new Date(res.created_at).toLocaleDateString("pt-BR")} <br/>
                        <span className="text-xs">{new Date(res.created_at).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-on-surface">
                        {formatCurrency(res.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[res.status]}`}>
                          {statusLabels[res.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                        {(res.status === "PENDING_PIX" || res.status === "AWAITING_MANUAL_CHECK") ? (
                          <>
                            <button onClick={() => onActionClick(res.id, "APPROVE")} className="text-xs font-semibold px-3 py-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors">Aprovar</button>
                            <button onClick={() => onActionClick(res.id, "CANCEL")} className="text-xs font-semibold px-3 py-1.5 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors">Cancelar</button>
                          </>
                        ) : res.status === "APPROVED" ? (
                          <>
                            <button onClick={() => onActionClick(res.id, "REFUND")} className="text-xs font-semibold px-3 py-1.5 bg-warning-dark/10 text-warning-dark rounded-lg hover:bg-warning-dark/20 transition-colors">Reembolsar</button>
                            <button onClick={() => onActionClick(res.id, "CANCEL")} className="text-xs font-semibold px-3 py-1.5 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors">Cancelar</button>
                          </>
                        ) : res.status === "EXPIRED" ? (
                          <button onClick={() => onActionClick(res.id, "REACTIVATE")} className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">Reativar</button>
                        ) : res.status === "CANCELLED" ? (
                          <button onClick={() => onActionClick(res.id, "REFUND")} className="text-xs font-semibold px-3 py-1.5 bg-warning-dark/10 text-warning-dark rounded-lg hover:bg-warning-dark/20 transition-colors">Reembolsar</button>
                        ) : <span className="text-xs text-outline px-3 py-1.5">-</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
          <div className="text-sm text-on-surface-variant">
            Página <span className="font-semibold text-on-surface">{currentPage}</span> de <span className="font-semibold text-on-surface">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface hover:bg-surface-container-high border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface hover:bg-surface-container-high border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
