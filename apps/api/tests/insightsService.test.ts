import { describe, expect, it } from 'vitest';
import { InsightsService } from '../src/services/insightsService.js';
import { aCandidate, fakeInsightsRepository } from './support/fakeInsightsRepository.js';

describe('InsightsService.distribution', () => {
  it('returns an empty distribution when nobody matches the filters', async () => {
    const service = new InsightsService(fakeInsightsRepository());

    expect(await service.distribution({}, 10)).toEqual({ bandSize: 0, total: 0, buckets: [] });
  });

  it('chooses a round band size and fills empty buckets', async () => {
    const service = new InsightsService(
      fakeInsightsRepository({
        salaryRange: async () => ({ count: 4, maxUsd: 95_000 }),
        histogram: async (_f, step) => {
          expect(step).toBe(10_000); // 95,000 over 10 bands -> 10k
          return [
            { bucket: 1, count: 3 },
            { bucket: 9, count: 1 },
          ];
        },
      }),
    );

    const result = await service.distribution({}, 10);

    expect(result.buckets).toHaveLength(10);
    expect(result.buckets[1]).toEqual({ from: 10_000, to: 20_000, count: 3 });
    expect(result.buckets[5]?.count).toBe(0);
    expect(result.total).toBe(4);
  });
});

describe('InsightsService.outliers', () => {
  // Peer group quartiles 100/110/120 -> fences 70..150 (IQR 20, 1.5 x 20 = 30).
  const peers = { q1Usd: 100, medianUsd: 110, q3Usd: 120 };

  it('adds fences and direction, ranks by deviation from the peer median and applies the limit', async () => {
    const service = new InsightsService(
      fakeInsightsRepository({
        outlierCandidates: async () => [
          aCandidate({ id: 1, salaryUsd: 160, ...peers }), // above: |160-110|/110 = 45.5%
          aCandidate({ id: 2, salaryUsd: 50, ...peers }), // below: |50-110|/110 = 54.5%
          aCandidate({ id: 3, salaryUsd: 400, ...peers }), // above: 263.6%
        ],
      }),
    );

    const { total, items } = await service.outliers({}, 2);

    expect(total).toBe(3);
    expect(items.map((o) => o.id)).toEqual([3, 2]); // biggest deviation first, cut to the limit
    expect(items[1]).toMatchObject({
      direction: 'below',
      lowerFenceUsd: 70,
      upperFenceUsd: 150,
      deviationPct: 54.5,
    });
  });

  it('drops candidates that are actually inside the fences', async () => {
    const service = new InsightsService(
      fakeInsightsRepository({
        outlierCandidates: async () => [aCandidate({ salaryUsd: 110, ...peers })],
      }),
    );

    expect(await service.outliers({}, 10)).toEqual({ total: 0, items: [] });
  });
});
