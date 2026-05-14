import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { createClient } from '@/lib/supabase/client';

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
};

export function useFaqSearch(items: FaqItem[], searchTerm: string, pageName: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce the search term to avoid excessive searching and analytics calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: 'question', weight: 1.0 },
        { name: 'keywords', weight: 0.7 },
        { name: 'answer', weight: 0.3 },
      ],
      threshold: 0.3,
      includeMatches: true,
      ignoreLocation: true,
    });
  }, [items]);

  const results = useMemo(() => {
    const cleanTerm = debouncedTerm.trim();
    if (!cleanTerm) {
      return items.map(item => ({ item, matches: [] }));
    }
    return fuse.search(cleanTerm);
  }, [debouncedTerm, fuse, items]);

  const lastTrackedTerm = useRef<string>("");

  // Analytics: log failures to faq_search_analytics, count all searches in faq_stats
  useEffect(() => {
    const term = debouncedTerm.trim().toLowerCase();
    if (term.length < 3 || term === lastTrackedTerm.current) return;

    // Update last tracked term to avoid double counting same term
    lastTrackedTerm.current = term;

    const supabase = createClient();

    const trackSearch = async () => {
      try {
        if (results.length === 0) {
          // Failure: save full log so admin can see the term
          const { error } = await supabase.from('faq_search_analytics').insert({
            search_term: term,
            results_count: 0,
            page: pageName,
          });
          if (error) console.error('Error logging FAQ failure:', error);
        } else {
          // Success: only increment aggregated counters (no row bloat)
          await Promise.all([
            supabase.rpc('increment_faq_stat', { key_param: 'total_searches' }),
            supabase.rpc('increment_faq_stat', { key_param: `total_searches_${pageName}` })
          ]);
        }
      } catch (err) {
        console.error('FAQ Analytics unexpected error:', err);
      }
    };

    trackSearch();
  }, [debouncedTerm, results.length, pageName]);

  return results;
}
