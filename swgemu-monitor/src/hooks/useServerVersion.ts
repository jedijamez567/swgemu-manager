import { useState, useEffect } from 'react';
import type { VersionResponse } from '../lib/types';
import { fetchVersion } from '../lib/api';

interface UseServerVersionReturn {
  version: VersionResponse | null;
  error: string | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

export function useServerVersion(token: string): UseServerVersionReturn {
  const [version, setVersion] = useState<VersionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let attempt = 0;

    async function tryFetch() {
      while (attempt < MAX_RETRIES && !cancelled) {
        try {
          const data = await fetchVersion(token);
          if (!cancelled) {
            setVersion(data);
            setError(null);
          }
          return;
        } catch (err) {
          attempt++;
          if (!cancelled && attempt >= MAX_RETRIES) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          } else if (!cancelled) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }
        }
      }
    }

    tryFetch();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { version, error };
}
