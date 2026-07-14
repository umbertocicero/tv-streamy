import { useState, useEffect } from 'react';
import { dataService } from '../data/dataService.js';

export function useTitle(id) {
  const [title, setTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const data = await dataService.fetchTitle(id);
        if (mounted) {
          setTitle(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.warn(`Failed to load title ${id}:`, err);
          setError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  return { title, loading, error };
}
