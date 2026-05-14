"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, SearchX, Activity, Search, AlertCircle,
  Calendar, TrendingUp, Radio, Trash2, Copy, ExternalLink, MapPin,
} from "lucide-react";

type SearchLog = {
  id: string;
  search_term: string;
  result_count: number;
  page_origin: string;
  created_at: string;
};

type AggregatedTerm = {
  term: string;
  count: number;
  lastSearched: string;
  origins: Set<string>;
};

type ExcursionStats = {
  total: number;
  success: number;
  failure: number;
  total_hero: number;
  total_catalog: number;
};

export default function ExcursionSearchAnalyticsPage() {
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [stats, setStats] = useState<ExcursionStats>({
    total: 0, success: 0, failure: 0, total_hero: 0, total_catalog: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterOrigin, setFilterOrigin] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"GAPS" | "HISTORICO">("GAPS");
  const [isLive, setIsLive] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [logsResult, statsResult] = await Promise.all([
      supabase
        .from("excursion_search_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("excursion_search_stats")
        .select("key, value"),
    ]);

    if (logsResult.data) setLogs(logsResult.data);

    if (statsResult.data) {
      const mapped: ExcursionStats = {
        total: 0, success: 0, failure: 0, total_hero: 0, total_catalog: 0,
      };
      statsResult.data.forEach((row: { key: string; value: number }) => {
        const k = row.key as keyof ExcursionStats;
        if (k in mapped) mapped[k] = Number(row.value);
      });
      setStats(mapped);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load + Realtime subscriptions
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
      setIsLive(true);
    }
    init();

    const logsChannel = supabase
      .channel("excursion-analytics-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "excursion_search_analytics" },
        (payload) => {
          const newLog = payload.new as SearchLog;
          setLogs(prev => [newLog, ...prev].slice(0, 2000));
        }
      )
      .subscribe();

    const statsChannel = supabase
      .channel("excursion-analytics-stats")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "excursion_search_stats" },
        (payload) => {
          const updated = payload.new as { key: string; value: number };
          setStats(prev => {
            const next = { ...prev };
            const k = updated.key as keyof ExcursionStats;
            if (k in next) next[k] = Number(updated.value);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(statsChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset all analytics data
  const handleReset = async () => {
    if (resetConfirmText !== "RESETAR") return;

    setIsResetting(true);
    try {
      const { error } = await supabase.rpc("reset_excursion_analytics");
      if (error) {
        toast.error("Erro ao resetar dados", { description: error.message });
      } else {
        setLogs([]);
        setStats({ total: 0, success: 0, failure: 0, total_hero: 0, total_catalog: 0 });
        setShowResetModal(false);
        setResetConfirmText("");
        toast.success("Dados resetados com sucesso", {
          description: "Todos os logs e contadores de excursões foram zerados.",
        });
      }
    } catch {
      toast.error("Erro inesperado ao resetar");
    } finally {
      setIsResetting(false);
    }
  };

  // Copy term and navigate to create excursion
  const handleCreateExcursion = async (term: string) => {
    try {
      await navigator.clipboard.writeText(term);
      toast.success(`Termo copiado: "${term}"`, {
        description: "Use-o como referência ao criar uma nova excursão.",
      });
    } catch {
      toast.info(`Termo: "${term}"`, {
        description: "Copie manualmente para referência.",
      });
    }
  };

  // Translate page_origin labels
  const originLabel = (origin: string) => {
    if (origin === "hero") return "Home (Hero)";
    if (origin === "catalog") return "Catálogo";
    return origin;
  };

  // Filtered logs based on origin selector
  const filteredLogs = logs.filter(log =>
    filterOrigin === "ALL" || log.page_origin === filterOrigin
  );

  // Compute stats considering active filter
  const totalSearchesReal =
    filterOrigin === "hero" ? stats.total_hero :
    filterOrigin === "catalog" ? stats.total_catalog :
    stats.total;

  const successCount =
    filterOrigin === "ALL" ? stats.success :
    // When filtering by origin, success = total for that origin - failures for that origin
    totalSearchesReal - filteredLogs.length;

  const failedCount = filteredLogs.length;
  const totalForRate = totalSearchesReal;
  const failureRate = totalForRate > 0 ? ((failedCount / totalForRate) * 100).toFixed(1) : "0";

  // Aggregate gaps
  const gapMap = new Map<string, AggregatedTerm>();
  filteredLogs.forEach(log => {
    const term = log.search_term.toLowerCase().trim();
    if (gapMap.has(term)) {
      const existing = gapMap.get(term)!;
      existing.count += 1;
      existing.origins.add(log.page_origin);
      if (new Date(log.created_at) > new Date(existing.lastSearched)) {
        existing.lastSearched = log.created_at;
      }
    } else {
      gapMap.set(term, {
        term: log.search_term.trim(),
        count: 1,
        lastSearched: log.created_at,
        origins: new Set([log.page_origin]),
      });
    }
  });

  const sortedGaps = Array.from(gapMap.values()).sort((a, b) => b.count - a.count);
  const topGap = sortedGaps.length > 0 ? sortedGaps[0] : null;

  return (
    <>
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/admin/configuracoes" className="text-primary hover:underline text-sm font-semibold flex items-center gap-1.5 mb-2 w-fit">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Configurações
            </Link>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-[family-name:var(--font-display)]">
              Analytics de Busca de Excursões
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Descubra quais destinos seus clientes buscam e não encontram para criar novas excursões.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            {isLive && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-success">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Tempo Real
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Origem:</label>
              <select
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="ALL">Todas</option>
                <option value="hero">Home (Hero)</option>
                <option value="catalog">Catálogo</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-error/80 hover:text-error bg-error/5 hover:bg-error/10 border border-error/20 rounded-xl transition-colors"
              title="Resetar todos os dados de analytics"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Resetar
            </button>
          </div>
        </div>

        {/* KPIs Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total de Buscas */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-on-surface-variant mb-1">Total de Buscas</p>
                <h3 className="text-3xl font-bold text-on-surface">
                  {isLoading ? "..." : totalSearchesReal.toLocaleString("pt-BR")}
                </h3>
              </div>
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-outline mt-4">
              {Math.max(0, successCount).toLocaleString("pt-BR")} com resultado · {failedCount} sem resultado
            </p>
          </div>

          {/* Buscas com Sucesso */}
          <div className="bg-success/5 border border-success/20 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-success mb-1">Buscas com Resultado</p>
                <h3 className="text-3xl font-bold text-success">
                  {isLoading ? "..." : Math.max(0, successCount).toLocaleString("pt-BR")}
                </h3>
              </div>
              <div className="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-success/80 mt-4">Clientes que encontraram excursões disponíveis.</p>
          </div>

          {/* Buscas Falhas */}
          <div className="bg-error/5 border border-error/20 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-error mb-1">Destinos não Encontrados</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-error">{failedCount}</h3>
                  <span className="text-sm font-bold bg-error text-white px-2 py-0.5 rounded-full">{failureRate}%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center">
                <SearchX className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-error/80 mt-4">Buscas onde o cliente não encontrou nenhuma excursão.</p>
          </div>

          {/* Top Gap */}
          <div className="bg-warning-light border border-warning/20 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-warning-dark mb-1">Destino Mais Buscado</p>
                <h3 className="text-xl font-bold text-warning-dark truncate max-w-[160px]" title={topGap?.term || "Nenhum"}>
                  {topGap ? `"${topGap.term}"` : "—"}
                </h3>
              </div>
              <div className="w-10 h-10 bg-warning/20 text-warning-dark rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-warning-dark/80 mt-4">
              {topGap ? `${topGap.count} vez${topGap.count !== 1 ? "es" : ""} buscado sem resultado.` : "Nenhum gap identificado."}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex border-b border-outline-variant/30">
            <button
              onClick={() => setActiveTab("GAPS")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-bold transition-all ${activeTab === "GAPS" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-on-surface-variant hover:bg-surface hover:text-on-surface"}`}
            >
              <AlertCircle className="w-4 h-4" />
              Destinos não Encontrados
              <span className="ml-1 bg-error text-white text-[10px] px-2 py-0.5 rounded-full">{sortedGaps.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("HISTORICO")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-bold transition-all ${activeTab === "HISTORICO" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-on-surface-variant hover:bg-surface hover:text-on-surface"}`}
            >
              <Activity className="w-4 h-4" />
              Histórico Recente
            </button>
          </div>

          {/* Tab: GAPS */}
          {activeTab === "GAPS" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Destino Buscado</th>
                    <th className="px-6 py-4 font-bold">Frequência</th>
                    <th className="px-6 py-4 font-bold">Origem</th>
                    <th className="px-6 py-4 font-bold">Última Busca</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-outline">Analisando dados...</td></tr>
                  ) : sortedGaps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-outline">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                            <Search className="w-6 h-6 text-success" />
                          </div>
                          <p className="font-semibold text-on-surface">Nenhum Gap Encontrado</p>
                          <p className="text-xs">Todos os destinos buscados foram encontrados no catálogo.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedGaps.map((item, index) => (
                      <tr key={index} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface">&quot;{item.term}&quot;</td>
                        <td className="px-6 py-4">
                          <span className="bg-error/10 text-error font-bold px-2 py-1 rounded-lg text-xs">
                            {item.count} vez{item.count !== 1 ? "es" : ""}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-outline">
                          {Array.from(item.origins).map(o => originLabel(o)).join(", ")}
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                            {new Date(item.lastSearched).toLocaleString("pt-BR", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.term);
                                toast.success(`Copiado: "${item.term}"`);
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                              title="Copiar termo"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCreateExcursion(item.term)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Criar Excursão
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: HISTÓRICO */}
          {activeTab === "HISTORICO" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Data / Hora</th>
                    <th className="px-6 py-4 font-bold">Destino Buscado</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-outline">Carregando histórico...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-outline">Nenhum registro encontrado para este filtro.</td></tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                            {new Date(log.created_at).toLocaleString("pt-BR", {
                              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium text-on-surface">&quot;{log.search_term}&quot;</td>
                        <td className="px-6 py-3">
                          <span className="text-error text-xs font-bold bg-error/10 px-2 py-1 rounded-lg">
                            0 resultados
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-outline">{originLabel(log.page_origin)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-error" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">Resetar Analytics de Excursões</h2>
                <p className="text-xs text-on-surface-variant">Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="bg-error/5 border border-error/20 rounded-2xl p-4 text-sm text-error space-y-2">
              <p className="font-bold">⚠️ Todos os dados serão permanentemente excluídos:</p>
              <ul className="list-disc list-inside text-xs space-y-1 text-error/90">
                <li>Todos os logs de buscas sem resultado ({logs.length} registros)</li>
                <li>Contadores de buscas com sucesso ({stats.success})</li>
                <li>Todos os gaps e histórico</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Digite <span className="font-mono bg-error/10 text-error px-1.5 py-0.5 rounded">RESETAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                placeholder="RESETAR"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-mono text-center tracking-widest focus:border-error focus:ring-1 focus:ring-error outline-none bg-surface"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText("");
                }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-on-surface-variant bg-surface border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirmText !== "RESETAR" || isResetting}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-error rounded-xl hover:bg-error/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Resetar Tudo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
