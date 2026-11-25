import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, toQueryString } from '../src/api/http';

afterEach(() => vi.unstubAllGlobals());

const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

describe('toQueryString', () => {
  it('omits empty and undefined values', () => {
    expect(toQueryString({ page: 2, q: '', country: undefined, sort: 'fullName' })).toBe(
      '?page=2&sort=fullName',
    );
  });

  it('returns an empty string when there is nothing to send', () => {
    expect(toQueryString({ q: '' })).toBe('');
  });

  it('encodes special characters', () => {
    expect(toQueryString({ q: 'a&b c' })).toBe('?q=a%26b+c');
  });
});

describe('request', () => {
  it('returns the parsed JSON body on success', async () => {
    respond(200, { ok: true });

    expect(await request('/x')).toEqual({ ok: true });
  });

  it('turns the API error shape into an ApiError', async () => {
    respond(409, { error: { code: 'CONFLICT', message: 'Email exists' } });

    await expect(request('/x')).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
      message: 'Email exists',
    });
  });

  it('reports an unreachable server as a friendly network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = (await request('/x').catch((e) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('NETWORK');
  });
});
