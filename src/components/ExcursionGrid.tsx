"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExcursionItem } from "@/lib/search-utils";
import { filterExcursions } from "@/components/CategoryPills";
import { formatBRL, formatDate } from "@/lib/utils";

interface ExcursionGridProps {
  excursions: ExcursionItem[];
  categories: string[];
}

export function ExcursionGrid({ excursions, categories }: ExcursionGridProps) {
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const handleCategory = (e: CustomEvent<string>) => setActiveCategory(e.detail);
    window.addEventListener("setCategory", handleCategory as EventListener);
    return () => window.removeEventListener("setCategory", handleCategory as EventListener);
  }, []);

  const { filtered, fallback, fallbackMessage } = filterExcursions(
    excursions,
    "", // query filtering happens via page navigation, not here
    activeCategory
  );

  return (
    <section id="excursoes" className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
            Próximas Excursões
          </h2>
          <p className="mt-3 text-on-surface-variant text-lg max-w-2xl mx-auto">
            Escolha seu destino e garanta sua vaga. Pagamento facilitado via PIX
            com confirmação em até 24h.
          </p>
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory("")}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-outline-variant/20 text-on-surface-variant hover:bg-outline-variant/30 transition-colors"
                >
                  Todos
                </button>
              )}
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(activeCategory === cat ? "" : cat);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === cat
                      ? "gradient-primary text-on-primary shadow-md"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fallback message */}
        {fallback && fallbackMessage && (
          <div className="mb-6 text-center">
            <p className="text-on-surface-variant text-base bg-surface-container-low rounded-2xl py-3 px-6 inline-block">
              {fallbackMessage}
            </p>
          </div>
        )}

        {/* Cards Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((exc) => (
              <article
                key={exc.id}
                className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md transition-shadow duration-300 hover:shadow-xl flex flex-col cursor-pointer"
              >
                {/* Stretched link — makes the entire card clickable */}
                <Link
                  href={`/excursao/${exc.tour_package.slug}`}
                  className="absolute inset-0 z-[1]"
                  aria-label={`Ver detalhes de ${exc.tour_package.title}`}
                  tabIndex={-1}
                />

                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={exc.tour_package.cover_image}
                    alt={exc.tour_package.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Category badge */}
                  {exc.tour_package.category && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-on-surface">
                      {exc.tour_package.category}
                    </span>
                  )}

                  {/* Highlight badge */}
                  {exc.highlight_text && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full gradient-cta text-on-cta text-xs font-bold shadow-md">
                      {exc.highlight_text}
                    </span>
                  )}

                  {/* Price overlay */}
                  <div className="absolute bottom-3 right-3 bg-white rounded-xl px-3 py-1.5 shadow-lg">
                    <span className="text-xs text-on-surface-variant">
                      a partir de
                    </span>
                    <p className="text-lg font-bold text-primary -mt-0.5">
                      {formatBRL(Number(exc.price_per_seat))}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
                    {exc.tour_package.title}
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant leading-relaxed line-clamp-2 flex-1">
                    {exc.tour_package.short_description}
                  </p>

                  {/* Meta */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-outline">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(exc.departure_date)}
                    </span>
                    {exc.vehicle_capacity && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {exc.vehicle_capacity} vagas
                      </span>
                    )}
                  </div>

                  {/* CTA — positioned above the stretched link */}
                  <Link
                    href={`/excursao/${exc.tour_package.slug}`}
                    className="relative z-[2] mt-4 block text-center py-3 rounded-xl gradient-cta text-on-cta font-semibold text-sm shadow-sm hover:shadow-glow-cta transition-all"
                  >
                    Ver detalhes e reservar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-outline"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="mt-4 text-lg text-on-surface-variant">
              Novas excursões em breve! Cadastre-se para ser avisado.
            </p>
          </div>
        )}

        {/* View all button */}
        <div className="mt-12 text-center flex justify-center">
          <Link
            href="/excursoes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container hover:text-primary font-semibold transition-all duration-200"
          >
            Ver todas as excursões
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
