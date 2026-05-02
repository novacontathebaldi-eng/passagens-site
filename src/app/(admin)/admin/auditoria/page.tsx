"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";

type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const PAGE_SIZE = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  async function fetchLogs() {
    setIsLoading(true);

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (actionFilter !== "ALL") {
      query = query.eq("action", actionFilter);
    }
    if (entityFilter.trim()) {
      query = query.ilike("entity_type", `%${entityFilter}%`);
    }

    const { data } = await query;
    if (data) setLogs(data);
    setIsLoading(false);
  }

  const formatAction = (action: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      INSERT: { cls: "bg-success/10 text-success", label: "CRIAÇÃO" },
      UPDATE: { cls: "bg-warning/10 text-warning", label: "ATUALIZAÇÃO" },
      DELETE: { cls: "bg-error/10 text-error", label: "EXCLUSÃO" },
    };
    const s = map[action] || { cls: "bg-surface-container-high text-on-surface", label: action };
    return <span className={`px-2 py-1 rounded text-xs font-bold ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Logs de Auditoria
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Rastreamento de todas as alterações críticas no banco de dados.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        >
          <option value="ALL">Todas as Ações</option>
          <option value="INSERT">Criações</option>
          <option value="UPDATE">Atualizações</option>
          <option value="DELETE">Exclusões</option>
        </select>
        <input
          type="text"
          placeholder="Filtrar por tabela (ex: reservations, excursions)..."
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(0); }}
          className="flex-1 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface">
            <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4 font-bold">Data/Hora</th>
                <th className="px-6 py-4 font-bold">Ação</th>
                <th className="px-6 py-4 font-bold">Tabela (Entidade)</th>
                <th className="px-6 py-4 font-bold">ID do Registro</th>
                <th className="px-6 py-4 font-bold">Autor (Actor ID)</th>
                <th className="px-6 py-4 font-bold">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-outline">Carregando logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-outline">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Nenhum log encontrado com esses filtros.
                </td></tr>
              ) : (
                logs.map(log => (
                  <Fragment key={log.id}>
                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      <td className="px-6 py-3 whitespace-nowrap text-on-surface-variant">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-3">{formatAction(log.action)}</td>
                      <td className="px-6 py-3 font-semibold text-primary">{log.entity_type}</td>
                      <td className="px-6 py-3 text-xs text-outline font-mono truncate max-w-[150px]">{log.entity_id}</td>
                      <td className="px-6 py-3 text-xs text-outline font-mono truncate max-w-[150px]" title={log.actor_id}>{log.actor_id?.split('-')[0] || "Sistema"}</td>
                      <td className="px-6 py-3">
                        <button className="text-primary text-xs font-medium hover:underline">
                          {expandedId === log.id ? "Fechar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-surface-container-low">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-bold text-on-surface mb-1">Dados Anteriores (old_data):</p>
                              <pre className="bg-surface p-3 rounded-lg overflow-auto max-h-40 text-on-surface-variant border border-outline-variant/30">
                                {log.old_data ? JSON.stringify(log.old_data, null, 2) : "—"}
                              </pre>
                            </div>
                            <div>
                              <p className="font-bold text-on-surface mb-1">Dados Novos (new_data):</p>
                              <pre className="bg-surface p-3 rounded-lg overflow-auto max-h-40 text-on-surface-variant border border-outline-variant/30">
                                {log.new_data ? JSON.stringify(log.new_data, null, 2) : "—"}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-surface border border-outline-variant rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors hover:bg-surface-container-highest"
          >
            Anterior
          </button>
          <span className="text-sm font-semibold text-on-surface-variant">Página {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < PAGE_SIZE}
            className="px-4 py-2 bg-surface border border-outline-variant rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors hover:bg-surface-container-highest"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
