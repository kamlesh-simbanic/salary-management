import { QueryTypes } from 'sequelize';
import type { GroupBy, InsightFilters, OutlierCandidate, SummaryRow } from '../domain/insights.js';
import { MIN_PEER_GROUP, TUKEY_K } from '../domain/stats.js';
import { Employee } from '../db/models/employee.js';
import type { InsightsRepository } from './insightsRepository.js';

// Whitelist: group-by names are mapped to columns here, so user input never becomes SQL text.
const GROUP_COLUMN: Record<GroupBy, string> = {
  country: 'country_code',
  department: 'department',
  jobTitle: 'job_title',
};

/**
 * MySQL 8 has no MEDIAN()/PERCENTILE(). Rows are numbered by salary inside each group (`rn`) and the
 * group size is `n`, so a percentile is found by linear interpolation between the two neighbouring ranks
 * (the same definition as Excel's PERCENTILE.INC). The median is simply percentile 0.5.
 * Must be used in a query that exposes the columns `usd`, `rn` and `n` and groups by the group key.
 */
function percentileSql(p: number): string {
  const pos = `((n - 1) * ${p})`;
  const lowRank = `(FLOOR(${pos}) + 1)`;
  const highRank = `LEAST(FLOOR(${pos}) + 2, n)`;
  const frac = `(${pos} - FLOOR(${pos}))`;
  return (
    `SUM(CASE WHEN rn = ${lowRank} THEN usd * (1 - ${frac}) ELSE 0 END)` +
    ` + SUM(CASE WHEN rn = ${highRank} THEN usd * ${frac} ELSE 0 END)`
  );
}

// Optional filters become bound parameters, never string-concatenated values.
function filterClause(filters: InsightFilters, alias: string) {
  const conditions: string[] = [];
  const replacements: Record<string, string> = {};
  if (filters.country) {
    conditions.push(`${alias}.country_code = :country`);
    replacements.country = filters.country;
  }
  if (filters.department) {
    conditions.push(`${alias}.department = :department`);
    replacements.department = filters.department;
  }
  if (filters.jobTitle) {
    conditions.push(`${alias}.job_title = :jobTitle`);
    replacements.jobTitle = filters.jobTitle;
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', replacements };
}

const USD = 'e.annual_salary * r.rate_to_usd';
const round2 = (value: unknown) => Math.round(Number(value) * 100) / 100;

export class SequelizeInsightsRepository implements InsightsRepository {
  private get db() {
    return Employee.sequelize!;
  }

  async summary(groupBy: GroupBy, filters: InsightFilters): Promise<SummaryRow[]> {
    const col = GROUP_COLUMN[groupBy];
    const { where, replacements } = filterClause(filters, 'e');
    const rows = await this.db.query<Record<string, unknown>>(
      `WITH base AS (
         SELECT e.${col} AS grp, ${USD} AS usd
         FROM employees e JOIN currency_rates r ON r.code = e.currency_code
         ${where}
       ), ranked AS (
         SELECT grp, usd,
                ROW_NUMBER() OVER (PARTITION BY grp ORDER BY usd) AS rn,
                COUNT(*) OVER (PARTITION BY grp) AS n
         FROM base
       )
       SELECT grp, MAX(n) AS headcount, MIN(usd) AS minUsd, AVG(usd) AS avgUsd, MAX(usd) AS maxUsd,
              ${percentileSql(0.5)} AS medianUsd
       FROM ranked GROUP BY grp ORDER BY headcount DESC, grp ASC`,
      { replacements, type: QueryTypes.SELECT },
    );
    return rows.map((r) => ({
      group: String(r.grp),
      headcount: Number(r.headcount),
      minUsd: round2(r.minUsd),
      medianUsd: round2(r.medianUsd),
      avgUsd: round2(r.avgUsd),
      maxUsd: round2(r.maxUsd),
    }));
  }

  async salaryRange(filters: InsightFilters) {
    const { where, replacements } = filterClause(filters, 'e');
    const [row] = await this.db.query<{ cnt: string; maxUsd: string | null }>(
      `SELECT COUNT(*) AS cnt, MAX(${USD}) AS maxUsd
       FROM employees e JOIN currency_rates r ON r.code = e.currency_code ${where}`,
      { replacements, type: QueryTypes.SELECT },
    );
    return { count: Number(row?.cnt ?? 0), maxUsd: Number(row?.maxUsd ?? 0) };
  }

  async histogram(filters: InsightFilters, step: number) {
    const { where, replacements } = filterClause(filters, 'e');
    const rows = await this.db.query<{ bucket: string; cnt: string }>(
      `SELECT FLOOR((${USD}) / :step) AS bucket, COUNT(*) AS cnt
       FROM employees e JOIN currency_rates r ON r.code = e.currency_code ${where}
       GROUP BY bucket ORDER BY bucket`,
      { replacements: { ...replacements, step }, type: QueryTypes.SELECT },
    );
    return rows.map((r) => ({ bucket: Number(r.bucket), count: Number(r.cnt) }));
  }

  async outlierCandidates(filters: { country?: string; department?: string }) {
    // Peer groups are computed over ALL employees; filters only narrow which people are reported.
    const { where, replacements } = filterClause(filters, 'r2');
    const rows = await this.db.query<Record<string, unknown>>(
      `WITH base AS (
         SELECT e.id, e.full_name, e.job_title, e.department, e.country_code, ${USD} AS usd
         FROM employees e JOIN currency_rates r ON r.code = e.currency_code
       ), ranked AS (
         SELECT base.*,
                ROW_NUMBER() OVER (PARTITION BY job_title, country_code ORDER BY usd) AS rn,
                COUNT(*) OVER (PARTITION BY job_title, country_code) AS n
         FROM base
       ), stats AS (
         SELECT job_title, country_code, MAX(n) AS n,
                ${percentileSql(0.25)} AS q1, ${percentileSql(0.5)} AS median, ${percentileSql(0.75)} AS q3
         FROM ranked GROUP BY job_title, country_code
         HAVING MAX(n) >= :minPeers
       )
       SELECT r2.id, r2.full_name, r2.job_title, r2.department, r2.country_code, r2.usd,
              s.n, s.q1, s.median, s.q3
       FROM base r2 JOIN stats s ON s.job_title = r2.job_title AND s.country_code = r2.country_code
       ${where ? `${where} AND` : 'WHERE'}
         (r2.usd < s.q1 - :k * (s.q3 - s.q1) OR r2.usd > s.q3 + :k * (s.q3 - s.q1))`,
      {
        replacements: { ...replacements, minPeers: MIN_PEER_GROUP, k: TUKEY_K },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map((r): OutlierCandidate => ({
      id: Number(r.id),
      fullName: String(r.full_name),
      jobTitle: String(r.job_title),
      department: String(r.department),
      countryCode: String(r.country_code),
      salaryUsd: round2(r.usd),
      peerCount: Number(r.n),
      q1Usd: round2(r.q1),
      medianUsd: round2(r.median),
      q3Usd: round2(r.q3),
    }));
  }
}
