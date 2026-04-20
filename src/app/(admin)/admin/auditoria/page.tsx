"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  auth_users: { email: string } | null;
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [supabase, page]);

  async function fetchLogs() {
    setIsLoading(true);
    
    // Na vida real, auth_users não é facilmente "joineada" via API public sem views personalizadas,
    // então para simplificar o log e não quebrar, vamos listar o audit_logs limpo.
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`*`)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (data) {
      setLogs(data as any);
    }
    setIsLoading(false);
  }

  const formatAction = (action: string) => {
    switch (action) {
      case "INSERT": return <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-bold">CRIAÇÃO</span>;
      case "UPDATE": return <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-bold">ATUALIZAÇÃO</span>;
      case "DELETE": return <span className="bg-error/10 text-error px-2 py-1 rounded text-xs font-bold">EXCLUSÃO</span>;
      default: return <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-xs font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Logs de Auditoria
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Rastreamento de todas as alterações críticas no banco de dados.
          </p>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-outline">Carregando logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-outline">Nenhum log de auditoria encontrado.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-on-surface-variant">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3">{formatAction(log.action)}</td>
                    <td className="px-6 py-3 font-semibold text-primary">{log.entity_type}</td>
                    <td className="px-6 py-3 text-xs text-outline font-mono truncate max-w-[150px]">{log.entity_id}</td>
                    <td className="px-6 py-3 text-xs text-outline font-mono truncate max-w-[150px]" title={log.actor_id}>{log.actor_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
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
