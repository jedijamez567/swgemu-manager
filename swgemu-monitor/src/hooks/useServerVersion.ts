import { useState, useEffect } from 'react';
import type { VersionResponse } from '../lib/types';
import { fetchVersion } from '../lib/api';

interface UseServerVersionReturn {
  version: VersionResponse | null;
  error: string | null;
}

export function useServerVersion(token: string): UseServerVersionReturn {
  const [version, setVersion] = useState<VersionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    fetchVersion(token)
      .then((data) => {
        if (!cancelled) {
          setVersion(data);
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
  }, [token]);

  return { version, error };
}
