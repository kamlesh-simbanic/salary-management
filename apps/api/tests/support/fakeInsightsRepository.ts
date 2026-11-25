import type { OutlierCandidate } from '../../src/domain/insights.js';
import type { InsightsRepository } from '../../src/repositories/insightsRepository.js';

// Canned answers; the real SQL is verified in the integration tests.
export function fakeInsightsRepository(
  overrides: Partial<InsightsRepository> = {},
): InsightsRepository {
  return {
    summary: async () => [],
    salaryRange: async () => ({ count: 0, maxUsd: 0 }),
    histogram: async () => [],
    outlierCandidates: async () => [],
    ...overrides,
  };
}

export function aCandidate(overrides: Partial<OutlierCandidate> = {}): OutlierCandidate {
  return {
    id: 1,
    fullName: 'Test Person',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    countryCode: 'IN',
    salaryUsd: 100,
    peerCount: 10,
    q1Usd: 20,
    medianUsd: 30,
    q3Usd: 40,
    ...overrides,
  };
}
