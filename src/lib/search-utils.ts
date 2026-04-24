/**
 * Client-side fuzzy search utilities for the Partiu Turismo catalogue.
 * No external dependencies — lightweight string matching + synonym mapping.
 */

/** Remove accents and lowercase for comparison */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Synonym dictionary — maps popular search terms to categories */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  Praia: ["praia", "praias", "sol", "mar", "litoral", "areia", "oceano", "costa", "beach", "verao"],
  Serra: ["serra", "frio", "montanha", "montanhas", "inverno", "neve", "altitude", "campo", "campos"],
  Religioso: ["religioso", "igreja", "fe", "santo", "santa", "santuario", "aparecida", "romaria", "devocao"],
  "Bate-volta": ["bate-volta", "bate volta", "rapido", "1 dia", "um dia", "pertinho", "perto", "curto", "ida e volta"],
};

/** Find which category a search term maps to via synonyms */
export function matchCategorySynonym(term: string): string | null {
  const normalized = normalize(term);
  for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (synonyms.some((s) => normalized.includes(s) || s.includes(normalized))) {
      return category;
    }
  }
  return null;
}

/** Check if a search term fuzzy-matches a target string */
export function fuzzyMatch(term: string, target: string): boolean {
  const nTerm = normalize(term);
  const nTarget = normalize(target);

  // Direct inclusion (most common case)
  if (nTarget.includes(nTerm) || nTerm.includes(nTarget)) return true;

  // Word-level match: any word in target starts with the term
  const targetWords = nTarget.split(/\s+/);
  if (targetWords.some((w) => w.startsWith(nTerm) || nTerm.startsWith(w))) return true;

  return false;
}

/** Excursion data shape passed from server to client */
export interface ExcursionItem {
  id: string;
  price_per_seat: number;
  departure_date: string;
  return_date: string | null;
  status: string;
  highlight_text: string | null;
  tour_package: {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    category: string | null;
    cover_image: string;
  };
  vehicle_capacity: number | null;
}

/** Search result from the autocomplete */
export interface SearchSuggestion {
  type: "excursion" | "category" | "all";
  label: string;
  sublabel?: string;
  href: string;
  category?: string;
}

/** Generate autocomplete suggestions from a search term */
export function getSuggestions(
  term: string,
  excursions: ExcursionItem[],
  categories: string[]
): SearchSuggestion[] {
  if (!term.trim()) return [];

  const suggestions: SearchSuggestion[] = [];

  // Match excursions by title or description
  const matchedExcursions = excursions.filter(
    (exc) =>
      fuzzyMatch(term, exc.tour_package.title) ||
      fuzzyMatch(term, exc.tour_package.short_description)
  );

  for (const exc of matchedExcursions.slice(0, 4)) {
    suggestions.push({
      type: "excursion",
      label: exc.tour_package.title,
      sublabel: `A partir de R$ ${exc.price_per_seat.toFixed(2).replace(".", ",")}`,
      href: `/excursao/${exc.tour_package.slug}`,
    });
  }

  // Match categories by name or synonym
  const synonymCategory = matchCategorySynonym(term);
  const matchedCategories = categories.filter(
    (cat) => fuzzyMatch(term, cat) || normalize(cat) === normalize(synonymCategory ?? "")
  );

  for (const cat of matchedCategories) {
    suggestions.push({
      type: "category",
      label: cat,
      href: `/excursoes?cat=${encodeURIComponent(cat)}`,
      category: cat,
    });
  }

  // If synonym matched a category not already included
  if (synonymCategory && !matchedCategories.includes(synonymCategory) && categories.includes(synonymCategory)) {
    suggestions.push({
      type: "category",
      label: synonymCategory,
      sublabel: "Categoria sugerida",
      href: `/excursoes?cat=${encodeURIComponent(synonymCategory)}`,
      category: synonymCategory,
    });
  }

  return suggestions;
}
