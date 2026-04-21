"use client";

import { useCallback } from "react";
import { ExcursionItem, normalize, fuzzyMatch, matchCategorySynonym } from "@/lib/search-utils";

interface CategoryPillsProps {
  categories: string[];
  excursions: ExcursionItem[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryPills({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryPillsProps) {
  const handleClick = useCallback(
    (category: string) => {
      // Toggle: if already active, deselect
      const next = activeCategory === category ? "" : category;
      onCategoryChange(next);

      // Scroll to excursions section
      const section = document.getElementById("excursoes");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    },
    [activeCategory, onCategoryChange]
  );

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleClick(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === cat
              ? "bg-white text-on-surface shadow-md"
              : "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

/** Filter excursions by search query and/or category (client-side) */
export function filterExcursions(
  excursions: ExcursionItem[],
  query: string,
  category: string
): { filtered: ExcursionItem[]; fallback: boolean; fallbackMessage: string } {
  let result = excursions;
  let fallback = false;
  let fallbackMessage = "";

  // Filter by category first
  if (category) {
    result = result.filter(
      (exc) => normalize(exc.tour_package.category ?? "") === normalize(category)
    );
  }

  // Filter by search query
  if (query.trim()) {
    const queryFiltered = result.filter(
      (exc) =>
        fuzzyMatch(query, exc.tour_package.title) ||
        fuzzyMatch(query, exc.tour_package.short_description)
    );

    if (queryFiltered.length > 0) {
      result = queryFiltered;
    } else {
      // Try synonym match
      const synonymCat = matchCategorySynonym(query);
      if (synonymCat) {
        const synonymFiltered = excursions.filter(
          (exc) => normalize(exc.tour_package.category ?? "") === normalize(synonymCat)
        );
        if (synonymFiltered.length > 0) {
          result = synonymFiltered;
          fallback = true;
          fallbackMessage = `Não encontramos "${query}", mas temos excursões na categoria ${synonymCat}:`;
        }
      }

      // If still no results, show everything with empathetic message
      if (result.length === 0 || (fallback === false && queryFiltered.length === 0)) {
        result = excursions;
        fallback = true;
        fallbackMessage = `Ainda não temos excursões para "${query}", mas veja nossas próximas aventuras! 🚌`;
      }
    }
  }

  return { filtered: result, fallback, fallbackMessage };
}
