import { z } from 'zod';

// ---------- Query params ----------
const optionalText = z.string().trim().min(1).optional();
const filterShape = {
  country: z.string().trim().toUpperCase().length(2).optional(),
  department: optionalText,
  jobTitle: optionalText,
};

export const GROUP_BY = ['country', 'department', 'jobTitle'] as const;
export type GroupBy = (typeof GROUP_BY)[number];

export const summaryQuerySchema = z.object({
  groupBy: z.enum(GROUP_BY).default('country'),
  ...filterShape,
});
export const distributionQuerySchema = z.object({
  bands: z.coerce.number().int().min(3).max(30).default(12),
  ...filterShape,
});
export const outliersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  ...filterShape,
});

export type InsightFilters = { country?: string; department?: string; jobTitle?: string };

// ---------- Results ----------
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

// What the repository returns per candidate; the service decides direction, fences and ranking.
export interface OutlierCandidate {
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
}
export interface Outlier extends OutlierCandidate {
  direction: 'above' | 'below';
  lowerFenceUsd: number;
  upperFenceUsd: number;
  deviationPct: number; // distance from the peer median, as % of the median
}
