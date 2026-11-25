import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAsync } from '../src/lib/useAsync';

// Lets a test decide when (and whether) each request finishes.
function controllableFetcher() {
  const calls: {
    params: unknown;
    resolve: (v: string) => void;
    reject: (e: Error) => void;
    signal: AbortSignal;
  }[] = [];
  const fetcher = (params: unknown, signal: AbortSignal) =>
    new Promise<string>((resolve, reject) => {
      calls.push({ params, resolve, reject, signal });
    });
  return { fetcher, calls };
}

describe('useAsync', () => {
  it('reports loading, then data', async () => {
    const { fetcher, calls } = controllableFetcher();
    const { result } = renderHook(() => useAsync(fetcher, 'a'));
    expect(result.current.loading).toBe(true);

    await act(async () => calls[0]!.resolve('result-a'));

    expect(result.current).toMatchObject({ loading: false, data: 'result-a', error: null });
  });

  it('aborts the previous request and ignores its late response', async () => {
    const { fetcher, calls } = controllableFetcher();
    const { result, rerender } = renderHook(({ p }) => useAsync(fetcher, p), {
      initialProps: { p: 'a' },
    });

    rerender({ p: 'b' });
    expect(calls[0]!.signal.aborted).toBe(true);
    await act(async () => calls[1]!.resolve('result-b'));
    await act(async () => calls[0]!.resolve('stale-a')); // slow response arrives last

    expect(result.current.data).toBe('result-b');
  });

  it('keeps the previous data visible while the next request loads', async () => {
    const { fetcher, calls } = controllableFetcher();
    const { result, rerender } = renderHook(({ p }) => useAsync(fetcher, p), {
      initialProps: { p: 'a' },
    });
    await act(async () => calls[0]!.resolve('result-a'));

    rerender({ p: 'b' });

    expect(result.current).toMatchObject({ loading: true, data: 'result-a' });
  });

  it('surfaces errors and refetches on reload()', async () => {
    const { fetcher, calls } = controllableFetcher();
    const { result } = renderHook(() => useAsync(fetcher, 'a'));
    await act(async () => calls[0]!.reject(new Error('Boom')));
    expect(result.current.error).toBe('Boom');

    act(() => result.current.reload());
    await waitFor(() => expect(calls).toHaveLength(2));
    await act(async () => calls[1]!.resolve('ok'));

    expect(result.current).toMatchObject({ error: null, data: 'ok' });
  });

  it('does not refetch when params are a new object with equal values', async () => {
    const { fetcher, calls } = controllableFetcher();
    const { rerender } = renderHook(({ p }) => useAsync(fetcher, p), {
      initialProps: { p: { x: 1 } },
    });

    rerender({ p: { x: 1 } });

    expect(calls).toHaveLength(1);
  });
});
