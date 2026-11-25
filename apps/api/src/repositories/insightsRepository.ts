import type { GroupBy, InsightFilters, OutlierCandidate, SummaryRow } from '../domain/insights.js';

export interface InsightsRepository {
  summary(groupBy: GroupBy, filters: InsightFilters): Promise<SummaryRow[]>;
  salaryRange(filters: InsightFilters): Promise<{ count: number; maxUsd: number }>;
  histogram(filters: InsightFilters, step: number): Promise<{ bucket: number; count: number }[]>;
  /** Employees outside their (job title, country) peer group's Tukey fences. */
  outlierCandidates(filters: {
    country?: string;
    department?: string;
  }): Promise<OutlierCandidate[]>;
}
