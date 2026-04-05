import { useState, useCallback, useRef } from 'react';

interface UseApiActionReturn<T> {
  execute: (...args: unknown[]) => Promise<T | undefined>;
  result: T | null;
  error: string | null;
  loading: boolean;
  reset: () => void;
}

export function useApiAction<T>(
  action: (...args: unknown[]) => Promise<T>
): UseApiActionReturn<T> {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await action(...args);
        setResult(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
        inFlight.current = false;
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, result, error, loading, reset };
}
