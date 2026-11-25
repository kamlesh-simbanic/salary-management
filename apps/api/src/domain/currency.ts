// Converts a local-currency amount to USD. Rounded to cents; `rateToUsd` is "1 unit of local currency in USD".
export function toUsd(amount: number, rateToUsd: number): number {
  return Math.round(amount * rateToUsd * 100) / 100;
}
