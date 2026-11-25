const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "IN" -> "India". Falls back to the code for anything Intl doesn't know. */
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** 1_250_000 -> "$1.3M", 50_000 -> "$50k". For chart axes and tight spaces. */
export function formatCompactUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
    .format(amount)
    .replace('K', 'k');
}
