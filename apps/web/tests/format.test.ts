import { describe, expect, it } from 'vitest';
import { countryName, formatCompactUsd, formatMoney } from '../src/lib/format';

describe('formatMoney', () => {
  it('formats with the currency symbol and no decimals', () => {
    expect(formatMoney(1234567.89, 'USD')).toBe('$1,234,568');
  });
});

describe('countryName', () => {
  it('expands ISO codes and falls back to the code when unknown', () => {
    expect(countryName('IN')).toBe('India');
    expect(countryName('not-a-code')).toBe('not-a-code');
  });
});

describe('formatCompactUsd', () => {
  it.each([
    [0, '$0'],
    [50_000, '$50k'],
    [1_250_000, '$1.3M'],
  ])('formats %i as %s', (amount, expected) => {
    expect(formatCompactUsd(amount)).toBe(expected);
  });
});
