import { describe, expect, it } from 'vitest';
import { buildBuckets, niceStep, outlierDirection, tukeyFences } from '../src/domain/stats.js';

describe('tukeyFences', () => {
  it('extends 1.5 x IQR beyond the quartiles', () => {
    expect(tukeyFences(20, 40)).toEqual({ lower: -10, upper: 70 });
  });
});

describe('outlierDirection', () => {
  const fences = { lower: 10, upper: 70 };

  it('flags values outside the fences and ignores values on or inside them', () => {
    expect(outlierDirection(100, fences)).toBe('above');
    expect(outlierDirection(5, fences)).toBe('below');
    expect(outlierDirection(70, fences)).toBeNull();
    expect(outlierDirection(10, fences)).toBeNull();
  });
});

describe('niceStep', () => {
  it.each([
    [340_000, 12, 50_000], // raw 28.3k -> rounds up to 50k
    [100, 10, 10],
    [95_000, 10, 10_000],
    [0, 10, 1],
  ])('max %i over %i bands -> step %i', (max, bands, expected) => {
    expect(niceStep(max, bands)).toBe(expected);
  });
});

describe('buildBuckets', () => {
  it('fills empty bands so the histogram is contiguous from 0', () => {
    const buckets = buildBuckets(
      [
        { bucket: 0, count: 3 },
        { bucket: 2, count: 1 },
      ],
      10,
      25,
    );

    expect(buckets).toEqual([
      { from: 0, to: 10, count: 3 },
      { from: 10, to: 20, count: 0 },
      { from: 20, to: 30, count: 1 },
    ]);
  });
});
