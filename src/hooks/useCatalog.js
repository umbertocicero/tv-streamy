import { useState, useEffect } from 'react';
import { dataService } from '../data/dataService.js';

export function useCatalog(force = false) {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await dataService.fetchCatalog(force);
        if (mounted) {
          setTitles(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Failed to load catalog:', err);
          setError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [force]);

  return { titles, loading, error };
}
