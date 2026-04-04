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
  const intervalRef = useRef<number | null>(null);

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
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [token]);

  useEffect(() => {
    if (!enabled || !token) return;

    doFetch();
    intervalRef.current = window.setInterval(doFetch, intervalSeconds * 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [doFetch, intervalSeconds, enabled, token]);

  return { stats, prevStats, isConnected, error, lastFetchTime };
}
