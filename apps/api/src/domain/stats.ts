// Pure statistics rules for the insights. No I/O, so they are unit-tested directly.

/** Tukey's rule: a value is an outlier if it lies more than 1.5 x IQR outside the quartiles. */
export const TUKEY_K = 1.5;

/** Peer groups smaller than this are skipped: quartiles of 3 people say nothing about outliers. */
export const MIN_PEER_GROUP = 5;

export function tukeyFences(q1: number, q3: number, k = TUKEY_K) {
  const iqr = q3 - q1;
  return { lower: q1 - k * iqr, upper: q3 + k * iqr };
}

export function outlierDirection(value: number, fences: { lower: number; upper: number }) {
  if (value < fences.lower) return 'below';
  if (value > fences.upper) return 'above';
  return null;
}

/** Picks a "round" band width (1, 2, 5 x 10^n) so that `max` fits in roughly `bands` bands. */
export function niceStep(max: number, bands: number): number {
  if (max <= 0) return 1;
  const raw = max / bands;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const factor = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return factor * magnitude;
}

/** Turns sparse DB counts into a contiguous list of buckets starting at 0, including empty ones. */
export function buildBuckets(
  counts: { bucket: number; count: number }[],
  step: number,
  max: number,
) {
  const byIndex = new Map(counts.map((c) => [c.bucket, c.count]));
  const bucketCount = Math.floor(max / step) + 1;
  return Array.from({ length: bucketCount }, (_, i) => ({
    from: i * step,
    to: (i + 1) * step,
    count: byIndex.get(i) ?? 0,
  }));
}
