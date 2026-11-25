import { useCallback, useEffect, useState } from 'react';
import { listEmployees } from '../../api/employees';
import type { Employee, EmployeeListParams, Page } from '../../api/types';

interface Result {
  key: string; // which request this result belongs to
  data?: Page<Employee>;
  error?: string;
}

export function useEmployees(params: EmployeeListParams) {
  const [result, setResult] = useState<Result | null>(null);
  const [lastData, setLastData] = useState<Page<Employee> | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const paramsKey = JSON.stringify(params); // stable dependency: a new object with equal values doesn't refetch
  const key = `${reloadToken}:${paramsKey}`;

  useEffect(() => {
    const controller = new AbortController();
    listEmployees(
      JSON.parse(key.slice(key.indexOf(':') + 1)) as EmployeeListParams,
      controller.signal,
    )
      .then((data) => {
        setResult({ key, data });
        setLastData(data);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return; // superseded by a newer request
        setResult({ key, error: err instanceof Error ? err.message : 'Something went wrong' });
      });
    // Aborting stale requests means a slow old response can never overwrite a newer one.
    return () => controller.abort();
  }, [key, paramsKey]);

  // "Loading" is derived: we are loading whenever the latest result isn't for the current request.
  const current = result?.key === key ? result : null;
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  return {
    data: lastData, // keep showing the previous page (dimmed) while the next one loads
    loading: current === null,
    error: current?.error ?? null,
    reload,
  };
}
