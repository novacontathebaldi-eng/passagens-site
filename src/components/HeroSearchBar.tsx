"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ExcursionItem, getSuggestions, SearchSuggestion } from "@/lib/search-utils";

interface HeroSearchBarProps {
  excursions: ExcursionItem[];
  categories: string[];
}

export function HeroSearchBar({ excursions, categories }: HeroSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formWrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTrackedRef = useRef<string>("");

  // Ensure portal only renders client-side (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamically position the portal dropdown beneath the form
  useLayoutEffect(() => {
    if (!isOpen || !formWrapperRef.current) return;

    const updatePosition = () => {
      const rect = formWrapperRef.current!.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    observer.observe(document.documentElement);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const updateSuggestions = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      const results = getSuggestions(value, excursions, categories);
      setSuggestions(results);
      setIsOpen(true);
      setActiveIndex(-1);
    },
    [excursions, categories]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSuggestions(value), 200);
  }

  function handleFocus() {
    if (query.trim()) {
      updateSuggestions(query);
    }
  }

  function logSearch(term: string, count: number) {
    const cleanTerm = term.trim().toLowerCase();
    if (cleanTerm.length < 2) return;
    // Dedup: don't track the same term twice in a session
    if (cleanTerm === lastTrackedRef.current) return;
    lastTrackedRef.current = cleanTerm;
    fetch("/api/search-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: cleanTerm, result_count: count, page_origin: "hero" }),
    }).catch(() => {});
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    logSearch(query, suggestions.filter((s) => s.type === "excursion").length);
    router.push(`/excursoes?q=${encodeURIComponent(query.trim())}&src=hero`);
  }

  function handleSelect(suggestion: SearchSuggestion) {
    setIsOpen(false);
    setQuery("");
    logSearch(suggestion.label, 1);
    router.push(suggestion.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const allItems = [...suggestions, { type: "all" as const, label: "", href: "" }];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const excursionSuggestions = suggestions.filter((s) => s.type === "excursion");
  const categorySuggestions = suggestions.filter((s) => s.type === "category");

  const showDropdown = isOpen && (suggestions.length > 0 || query.trim().length > 0);

  const dropdownContent = showDropdown ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden max-h-[360px] overflow-y-auto"
    >
      {excursionSuggestions.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-outline uppercase tracking-wider">
            Destinos
          </p>
          {excursionSuggestions.map((s, i) => (
            <button
              key={s.href}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                activeIndex === i
                  ? "bg-primary/10"
                  : "hover:bg-surface-container"
              }`}
            >
              <svg
                className="w-4 h-4 text-primary shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {s.label}
                </p>
                {s.sublabel && (
                  <p className="text-xs text-primary font-semibold">
                    {s.sublabel}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {categorySuggestions.length > 0 && (
        <div className={excursionSuggestions.length > 0 ? "border-t border-outline-variant/20" : ""}>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-outline uppercase tracking-wider">
            Categorias
          </p>
          {categorySuggestions.map((s, i) => {
            const idx = excursionSuggestions.length + i;
            return (
              <button
                key={s.href}
                onClick={() => handleSelect(s)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  activeIndex === idx
                    ? "bg-primary/10"
                    : "hover:bg-surface-container"
                }`}
              >
                <svg
                  className="w-4 h-4 text-outline shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {s.label}
                  </p>
                  {s.sublabel && (
                    <p className="text-xs text-outline">{s.sublabel}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Always show "Ver todas" link */}
      <div className="border-t border-outline-variant/20">
        <button
          onClick={() => {
            setIsOpen(false);
            if (query.trim()) {
              logSearch(query, suggestions.filter((s) => s.type === "excursion").length);
            }
            router.push(query.trim() ? `/excursoes?q=${encodeURIComponent(query.trim())}&src=hero` : "/excursoes");
          }}
          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
            activeIndex === suggestions.length
              ? "bg-primary/10"
              : "hover:bg-surface-container"
          }`}
        >
          <svg
            className="w-4 h-4 text-primary shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm font-medium text-primary">
            {query.trim()
              ? `Buscar "${query.trim()}" em todas as excursões`
              : "Ver todas as excursões disponíveis"}
          </p>
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={formWrapperRef}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Para onde você quer viajar?"
            autoComplete="off"
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-on-surface text-base placeholder:text-outline shadow-xl focus:ring-2 focus:ring-cta focus:outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-8 py-4 rounded-2xl gradient-cta text-on-cta font-bold text-base shadow-xl hover:shadow-glow-cta transition-all whitespace-nowrap"
        >
          Buscar
        </button>
      </form>

      {/* Dropdown rendered via Portal to escape hero overflow-hidden */}
      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
