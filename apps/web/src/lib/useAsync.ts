import { useCallback, useEffect, useState } from 'react';

interface Result<T> {
  key: string; // which request this result belongs to
  data?: T;
  error?: string;
}

/**
 * Runs `fetcher(params, signal)` whenever `params` change and tracks loading/error.
 * - A newer request aborts the older one, so a slow old response can never overwrite a newer one.
 * - `data` keeps the last successful result while the next loads, so the screen dims instead of flashing empty.
 * - "loading" is derived (latest result isn't for the current request) rather than set inside the effect.
 * `fetcher` must be a stable function (module-level), not an inline closure.
 */
export function useAsync<P, T>(fetcher: (params: P, signal: AbortSignal) => Promise<T>, params: P) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [lastData, setLastData] = useState<T | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const paramsKey = JSON.stringify(params); // equal values -> equal key, so a fresh-but-identical object doesn't refetch
  const key = `${reloadToken}:${paramsKey}`;

  useEffect(() => {
    const controller = new AbortController();
    fetcher(JSON.parse(paramsKey) as P, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return; // never trust a late answer to a request we already replaced
        setResult({ key, data });
        setLastData(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded by a newer request (or unmounted)
        setResult({ key, error: err instanceof Error ? err.message : 'Something went wrong' });
      });
    return () => controller.abort();
  }, [fetcher, key, paramsKey]);

  const current = result?.key === key ? result : null;
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  return { data: lastData, loading: current === null, error: current?.error ?? null, reload };
}
