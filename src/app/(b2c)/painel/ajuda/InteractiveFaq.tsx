"use client";

import { useState } from "react";
import { HelpCircle, Search, FileQuestion } from "lucide-react";
import { useFaqSearch } from "@/hooks/useFaqSearch";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
};

interface InteractiveFaqProps {
  faqItems: FaqItem[];
}

export function InteractiveFaq({ faqItems }: InteractiveFaqProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!faqItems || faqItems.length === 0) {
    return null;
  }

  const searchResults = useFaqSearch(faqItems, searchTerm, "painel");

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" /> Perguntas Frequentes
        </h2>
        
        <div className="relative max-w-full sm:max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-on-surface-variant" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-outline-variant/40 rounded-2xl leading-5 bg-surface text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors sm:text-sm"
            placeholder="Buscar dúvida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {searchResults.length > 0 ? (
          searchResults.map(({ item: faq, matches }, i) => (
            <details
              key={faq.id || i}
              className="group border border-outline-variant/30 rounded-2xl bg-surface overflow-hidden [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between p-4 font-semibold text-on-surface cursor-pointer hover:bg-surface-container-lowest transition-colors">
                {faq.question}
                <span className="ml-4 flex-shrink-0 text-primary transition duration-300 group-open:-rotate-180">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="p-4 pt-4 text-sm text-on-surface-variant leading-relaxed bg-surface-container-lowest border-t border-outline-variant/20 transition-all duration-300 ease-in-out whitespace-pre-wrap">
                {faq.answer}
              </div>
            </details>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-surface rounded-2xl border border-dashed border-outline-variant/50">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Nenhuma resposta encontrada</h3>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Não encontramos nenhum resultado para "{searchTerm}". Tente usar outras palavras ou entre em contato com nosso suporte.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
