import type {
  Distribution,
  GroupBy,
  InsightFilters,
  Outlier,
  SummaryRow,
} from '../domain/insights.js';
import { buildBuckets, niceStep, outlierDirection, tukeyFences } from '../domain/stats.js';
import type { InsightsRepository } from '../repositories/insightsRepository.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

export class InsightsService {
  constructor(private readonly repo: InsightsRepository) {}

  summary(groupBy: GroupBy, filters: InsightFilters): Promise<SummaryRow[]> {
    return this.repo.summary(groupBy, filters);
  }

  async distribution(filters: InsightFilters, bands: number): Promise<Distribution> {
    const { count, maxUsd } = await this.repo.salaryRange(filters);
    if (count === 0) return { bandSize: 0, total: 0, buckets: [] };

    const bandSize = niceStep(maxUsd, bands);
    const counts = await this.repo.histogram(filters, bandSize);
    return { bandSize, total: count, buckets: buildBuckets(counts, bandSize, maxUsd) };
  }

  async outliers(
    filters: InsightFilters,
    limit: number,
  ): Promise<{ total: number; items: Outlier[] }> {
    const candidates = await this.repo.outlierCandidates(filters);

    const outliers = candidates
      .map((c): Outlier | null => {
        const fences = tukeyFences(c.q1Usd, c.q3Usd);
        const direction = outlierDirection(c.salaryUsd, fences);
        if (!direction) return null; // defensive: the repository should already have filtered these
        return {
          ...c,
          direction,
          lowerFenceUsd: round2(fences.lower),
          upperFenceUsd: round2(fences.upper),
          deviationPct: Math.round((Math.abs(c.salaryUsd - c.medianUsd) / c.medianUsd) * 1000) / 10,
        };
      })
      .filter((o): o is Outlier => o !== null)
      .sort((a, b) => b.deviationPct - a.deviationPct);

    return { total: outliers.length, items: outliers.slice(0, limit) };
  }
}
