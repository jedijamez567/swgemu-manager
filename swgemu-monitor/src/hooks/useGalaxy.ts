import { useState, useEffect } from 'react';
import type { Galaxy } from '../lib/types';
import { fetchGalaxy } from '../lib/api';

interface UseGalaxyReturn {
  galaxy: Galaxy | null;
  error: string | null;
}

export function useGalaxy(): UseGalaxyReturn {
  const [galaxy, setGalaxy] = useState<Galaxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchGalaxy()
      .then((data) => {
        if (!cancelled) {
          setGalaxy(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { galaxy, error };
}
