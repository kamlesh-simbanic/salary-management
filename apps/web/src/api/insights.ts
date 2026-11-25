import { request, toQueryString } from './http';

export type GroupBy = 'country' | 'department' | 'jobTitle';

export interface InsightFilters {
  country: string;
  department: string;
  jobTitle: string;
}

export interface SummaryRow {
  group: string;
  headcount: number;
  minUsd: number;
  medianUsd: number;
  avgUsd: number;
  maxUsd: number;
}
export interface SalaryBucket {
  from: number;
  to: number; // exclusive
  count: number;
}
export interface Distribution {
  bandSize: number;
  total: number;
  buckets: SalaryBucket[];
}
export interface Outlier {
  id: number;
  fullName: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  salaryUsd: number;
  peerCount: number;
  q1Usd: number;
  medianUsd: number;
  q3Usd: number;
  direction: 'above' | 'below';
  lowerFenceUsd: number;
  upperFenceUsd: number;
  deviationPct: number;
}
export interface OutliersResult {
  total: number;
  items: Outlier[];
}

// Fetchers take one params object plus a signal so they work directly with useAsync.
export const getSummary = (params: InsightFilters & { groupBy: GroupBy }, signal: AbortSignal) =>
  request<{ groupBy: GroupBy; rows: SummaryRow[] }>(
    `/insights/summary${toQueryString({ ...params })}`,
    { signal },
  );

export const getDistribution = (params: InsightFilters, signal: AbortSignal) =>
  request<Distribution>(`/insights/distribution${toQueryString({ ...params })}`, { signal });

export const getOutliers = (params: InsightFilters, signal: AbortSignal) =>
  request<OutliersResult>(`/insights/outliers${toQueryString({ ...params, limit: 50 })}`, {
    signal,
  });
