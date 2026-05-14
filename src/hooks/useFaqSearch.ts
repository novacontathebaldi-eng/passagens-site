import { useState, useEffect, useMemo } from 'react';
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
    if (!debouncedTerm.trim()) {
      return items.map(item => ({ item, matches: [] }));
    }
    return fuse.search(debouncedTerm);
  }, [debouncedTerm, fuse, items]);

  // Analytics for empty results
  useEffect(() => {
    const term = debouncedTerm.trim();
    if (term.length >= 3 && results.length === 0) {
      const supabase = createClient();
      // Fire and forget
      supabase.from('faq_search_analytics').insert({
        search_term: term,
        results_count: 0,
        page: pageName,
      }).then(({ error }) => {
        if (error) console.error('Error logging FAQ search:', error);
      });
    }
  }, [debouncedTerm, results.length, pageName]);

  return results;
}
