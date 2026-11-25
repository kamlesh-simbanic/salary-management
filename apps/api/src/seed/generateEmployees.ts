import {
  COUNTRIES,
  CURRENCY_RATES,
  DEPARTMENT_WEIGHTS,
  FIRST_NAMES,
  JOBS,
  LAST_NAMES,
} from './catalog.js';
import { createRandom } from './random.js';

export interface SeedEmployee {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  currencyCode: string;
  annualSalary: number; // local currency, 2 decimals
  hireDate: string; // YYYY-MM-DD
}

const OUTLIER_RATE = 0.01; // ~1% of people are deliberately mispaid so the outlier insight has something to find
const HIRE_START = Date.UTC(2012, 0, 1);
const HIRE_END = Date.UTC(2025, 9, 31); // fixed end date keeps output independent of today's date

export function generateEmployees(count: number, seed = 42): SeedEmployee[] {
  const rnd = createRandom(seed);
  const countryOptions = COUNTRIES.map((c) => ({ value: c, weight: c.weight }));
  const employees: SeedEmployee[] = [];

  for (let i = 0; i < count; i++) {
    const country = rnd.pickWeighted(countryOptions);
    const department = rnd.pickWeighted(DEPARTMENT_WEIGHTS);
    const titles = Object.entries(JOBS[department] ?? {});
    const [jobTitle, baseUsd] = rnd.pick(titles) as [string, number];

    // Average of two uniforms gives a bell-ish spread of about +/-15% around the base.
    const noise = 0.85 + (rnd.next() + rnd.next()) * 0.15;
    let usd = baseUsd * country.payFactor * noise;
    if (rnd.next() < OUTLIER_RATE) usd *= rnd.next() < 0.5 ? 2.5 : 0.3;

    const rate = CURRENCY_RATES[country.currency] as number;
    const first = rnd.pick(FIRST_NAMES);
    const last = rnd.pick(LAST_NAMES);

    employees.push({
      fullName: `${first} ${last}`,
      // The running index guarantees a unique email, since names alone collide at 10k people.
      email: `${first}.${last}.${i + 1}@acme.example`.toLowerCase(),
      jobTitle,
      department,
      countryCode: country.code,
      currencyCode: country.currency,
      annualSalary: Math.round((usd / rate) * 100) / 100,
      hireDate: new Date(rnd.int(HIRE_START, HIRE_END)).toISOString().slice(0, 10),
    });
  }
  return employees;
}
