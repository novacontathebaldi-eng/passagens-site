"use client";

import { useState } from "react";
import { Search, FileQuestion } from "lucide-react";
import { useFaqSearch } from "@/hooks/useFaqSearch";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = useFaqSearch(items, searchTerm, "home");

  return (
    <div className="space-y-8">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-on-surface-variant" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-3 border border-outline-variant/40 rounded-2xl leading-5 bg-surface-container-lowest shadow-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
          placeholder="Buscar dúvida..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {searchResults.length > 0 ? (
          searchResults.map(({ item: faq }, i) => (
            <details
              key={faq.id || i}
              className="group border border-outline-variant/30 rounded-2xl bg-surface overflow-hidden [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between p-4 sm:p-5 font-semibold text-on-surface cursor-pointer hover:bg-surface-container-lowest transition-colors text-sm sm:text-base">
                {faq.question}
                <span className="ml-4 flex-shrink-0 text-primary transition duration-300 group-open:-rotate-180">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="p-4 sm:p-5 pt-4 text-sm sm:text-[0.9375rem] text-on-surface-variant leading-relaxed bg-surface-container-lowest border-t border-outline-variant/20 transition-all duration-300 ease-in-out whitespace-pre-wrap">
                {faq.answer}
              </div>
            </details>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/50">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Nenhuma resposta encontrada</h3>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Não encontramos resultados para "{searchTerm}". Tente outras palavras ou fale conosco pelo WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
