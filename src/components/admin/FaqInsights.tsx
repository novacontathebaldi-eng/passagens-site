"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { AlertCircle, SearchX, ArrowRight } from "lucide-react";

type AggregatedGap = {
  term: string;
  count: number;
};

export default function FaqInsights() {
  const [gaps, setGaps] = useState<AggregatedGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadGaps() {
      // Pega as últimas 500 buscas que falharam
      const { data } = await supabase
        .from("faq_search_analytics")
        .select("search_term")
        .eq("results_count", 0)
        .order("created_at", { ascending: false })
        .limit(500);

      if (data) {
        const gapMap = new Map<string, number>();
        data.forEach(log => {
          const term = log.search_term.toLowerCase().trim();
          gapMap.set(term, (gapMap.get(term) || 0) + 1);
        });

        // Ordena por quantidade
        const sorted = Array.from(gapMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([term, count]) => ({ term, count }))
          .slice(0, 4); // Top 4

        setGaps(sorted);
      }
      setIsLoading(false);
    }
    loadGaps();
  }, [supabase]);

  if (isLoading || gaps.length === 0) return null;

  return (
    <div className="bg-error/5 border border-error/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0 text-error">
          <SearchX className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-error flex items-center gap-1.5">
            Oportunidades de FAQ
          </h3>
          <p className="text-xs text-error/80 mt-1 max-w-lg">
            Os clientes buscaram recentemente por estes termos e não encontraram resposta. Considere adicionar perguntas sobre eles.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {gaps.map(gap => (
              <div key={gap.term} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-error/10 border border-error/20 text-xs font-semibold text-error-dark">
                "{gap.term}"
                <span className="bg-error/20 px-1.5 rounded text-[10px]">{gap.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Link 
        href="/admin/configuracoes/buscas" 
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-error text-white text-xs font-bold rounded-xl hover:bg-error-dark transition-colors"
      >
        Ver Relatório Completo
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
