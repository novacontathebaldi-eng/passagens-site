"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, SearchX, Activity, Search, AlertCircle, Calendar } from "lucide-react";

type SearchLog = {
  id: string;
  search_term: string;
  results_count: number;
  page: string;
  created_at: string;
};

type AggregatedTerm = {
  term: string;
  count: number;
  lastSearched: string;
  origin: string;
};

export default function FaqAnalyticsPage() {
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPage, setFilterPage] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"GAPS" | "HISTORICO">("GAPS");
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      // Busca as últimas 2000 buscas para análise
      let query = supabase
        .from("faq_search_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);

      const { data } = await query;
      if (data) {
        setLogs(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  // Filtra logs de acordo com o seletor de origem
  const filteredLogs = logs.filter(log => filterPage === "ALL" || log.page === filterPage);

  // Calcula KPIs
  const totalSearches = filteredLogs.length;
  const failedSearches = filteredLogs.filter(l => l.results_count === 0);
  const failureRate = totalSearches > 0 ? ((failedSearches.length / totalSearches) * 100).toFixed(1) : "0";

  // Agrega dados para os "Gaps" (Termos sem resultado)
  const gapMap = new Map<string, AggregatedTerm>();
  failedSearches.forEach(log => {
    const term = log.search_term.toLowerCase().trim();
    if (gapMap.has(term)) {
      const existing = gapMap.get(term)!;
      existing.count += 1;
      // Pega a data mais recente
      if (new Date(log.created_at) > new Date(existing.lastSearched)) {
        existing.lastSearched = log.created_at;
      }
    } else {
      gapMap.set(term, {
        term: log.search_term.trim(),
        count: 1,
        lastSearched: log.created_at,
        origin: log.page
      });
    }
  });

  const sortedGaps = Array.from(gapMap.values()).sort((a, b) => b.count - a.count);
  const topGap = sortedGaps.length > 0 ? sortedGaps[0] : null;

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
      {/* Header com botão de voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/configuracoes" className="text-primary hover:underline text-sm font-semibold flex items-center gap-1.5 mb-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Configurações
          </Link>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-[family-name:var(--font-display)] flex items-center gap-3">
            Analytics de Busca do FAQ
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Descubra o que seus clientes procuram e não encontram para criar novos artigos de ajuda.
          </p>
        </div>
        
        <div className="shrink-0 flex items-center gap-2">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Origem:</label>
          <select 
            value={filterPage} 
            onChange={(e) => setFilterPage(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="ALL">Todas as Páginas</option>
            <option value="home">Home Page</option>
            <option value="painel_ajuda">Painel de Ajuda</option>
          </select>
        </div>
      </div>

      {/* KPIs Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-on-surface-variant mb-1">Total de Buscas</p>
              <h3 className="text-3xl font-bold text-on-surface">{totalSearches}</h3>
            </div>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-outline mt-4">Últimos {logs.length} registros capturados.</p>
        </div>

        <div className="bg-error/5 border border-error/20 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-error mb-1">Buscas Falhas (Gaps)</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-error">{failedSearches.length}</h3>
                <span className="text-sm font-bold bg-error text-white px-2 py-0.5 rounded-full">{failureRate}% do total</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center">
              <SearchX className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-error/80 mt-4">Pesquisas onde o cliente não obteve nenhuma resposta.</p>
        </div>

        <div className="bg-warning-light border border-warning/20 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-warning-dark mb-1">Termo Mais Buscado (Gap)</p>
              <h3 className="text-xl font-bold text-warning-dark truncate max-w-[200px]" title={topGap?.term || "Nenhum"}>
                {topGap ? `"${topGap.term}"` : "Nenhum"}
              </h3>
            </div>
            <div className="w-10 h-10 bg-warning/20 text-warning-dark rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-warning-dark/80 mt-4">
            {topGap ? `${topGap.count} clientes buscaram isso e falharam.` : "Todos os termos retornaram resultados."}
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
            Termos com Zero Resultados (Gaps)
            <span className="ml-1 bg-error text-white text-[10px] px-2 py-0.5 rounded-full">{sortedGaps.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("HISTORICO")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-bold transition-all ${activeTab === "HISTORICO" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-on-surface-variant hover:bg-surface hover:text-on-surface"}`}
          >
            <Activity className="w-4 h-4" />
            Histórico Recente de Buscas
          </button>
        </div>

        {/* Tab Content: GAPS */}
        {activeTab === "GAPS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-on-surface">
              <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Termo Buscado</th>
                  <th className="px-6 py-4 font-bold">Frequência</th>
                  <th className="px-6 py-4 font-bold">Origem Principal</th>
                  <th className="px-6 py-4 font-bold">Última Busca</th>
                  <th className="px-6 py-4 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-outline">Analisando dados...</td></tr>
                ) : sortedGaps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-outline">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                          <Search className="w-6 h-6 text-success" />
                        </div>
                        <p className="font-semibold text-on-surface">Nenhum Gap Encontrado</p>
                        <p className="text-xs">O FAQ parece cobrir todas as buscas recentes.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedGaps.map((item, index) => (
                    <tr key={index} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-on-surface">"{item.term}"</td>
                      <td className="px-6 py-4">
                        <span className="bg-error/10 text-error font-bold px-2 py-1 rounded-lg text-xs">
                          {item.count} vez{item.count !== 1 ? 'es' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-outline">
                        {item.origin}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                        {new Date(item.lastSearched).toLocaleString("pt-BR", {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href="/admin/configuracoes" 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors"
                        >
                          Resolver isso
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: HISTORICO */}
        {activeTab === "HISTORICO" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-on-surface">
              <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Data / Hora</th>
                  <th className="px-6 py-4 font-bold">Termo Buscado</th>
                  <th className="px-6 py-4 font-bold">Resultados</th>
                  <th className="px-6 py-4 font-bold">Página</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-outline">Carregando histórico...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-outline">Nenhum registro encontrado para estes filtros.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-3 text-xs text-on-surface-variant flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                        {new Date(log.created_at).toLocaleString("pt-BR", {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-3 font-medium text-on-surface">"{log.search_term}"</td>
                      <td className="px-6 py-3">
                        {log.results_count > 0 ? (
                          <span className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-lg">
                            {log.results_count} encontrados
                          </span>
                        ) : (
                          <span className="text-error text-xs font-bold bg-error/10 px-2 py-1 rounded-lg">
                            0 (Falha)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs font-mono text-outline">
                        {log.page}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
