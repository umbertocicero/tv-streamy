import { useState, useCallback } from 'react';
import { dataService } from '../data/dataService.js';

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await dataService.searchTitles(query);
      setResults(data);
    } catch (err) {
      console.warn('Search failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
