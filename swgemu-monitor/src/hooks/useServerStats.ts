import { useState, useEffect, useRef, useCallback } from 'react';
import type { StatsResponse } from '../lib/types';
import { fetchStats } from '../lib/api';

interface UseServerStatsReturn {
  stats: StatsResponse | null;
  prevStats: StatsResponse | null;
  isConnected: boolean;
  error: string | null;
  lastFetchTime: Date | null;
}

const MAX_BACKOFF_SECONDS = 60;

export function useServerStats(
  token: string,
  intervalSeconds: number,
  enabled: boolean
): UseServerStatsReturn {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [prevStats, setPrevStats] = useState<StatsResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const failuresRef = useRef(0);

  const doFetch = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchStats(token);
      setPrevStats((prev) => prev);
      setStats((prev) => {
        setPrevStats(prev);
        return data;
      });
      setIsConnected(true);
      setError(null);
      setLastFetchTime(new Date());
      failuresRef.current = 0;
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
      failuresRef.current += 1;
    }
  }, [token]);

  useEffect(() => {
    if (!enabled || !token) return;

    let cancelled = false;

    async function poll() {
      await doFetch();
      if (cancelled) return;
      const backoff = Math.min(
        intervalSeconds * Math.pow(2, failuresRef.current),
        MAX_BACKOFF_SECONDS
      );
      timeoutRef.current = window.setTimeout(poll, backoff * 1000);
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [doFetch, intervalSeconds, enabled, token]);

  return { stats, prevStats, isConnected, error, lastFetchTime };
}
