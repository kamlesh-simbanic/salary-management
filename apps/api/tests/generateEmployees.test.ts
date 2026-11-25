import { describe, expect, it } from 'vitest';
import { COUNTRIES, CURRENCY_RATES } from '../src/seed/catalog.js';
import { generateEmployees } from '../src/seed/generateEmployees.js';

describe('generateEmployees', () => {
  const employees = generateEmployees(2000, 1);

  it('returns exactly the requested number of employees', () => {
    expect(employees).toHaveLength(2000);
  });

  it('is deterministic for the same seed and differs for another seed', () => {
    expect(generateEmployees(50, 7)).toEqual(generateEmployees(50, 7));
    expect(generateEmployees(50, 7)).not.toEqual(generateEmployees(50, 8));
  });

  it('produces unique emails', () => {
    const emails = new Set(employees.map((e) => e.email));
    expect(emails.size).toBe(employees.length);
  });

  it('pairs every country with its own currency and a known FX rate', () => {
    const currencyByCountry = new Map(COUNTRIES.map((c) => [c.code, c.currency]));
    for (const e of employees) {
      expect(e.currencyCode).toBe(currencyByCountry.get(e.countryCode));
      expect(CURRENCY_RATES[e.currencyCode]).toBeGreaterThan(0);
    }
  });

  it('only generates positive salaries and valid ISO hire dates', () => {
    for (const e of employees) {
      expect(e.annualSalary).toBeGreaterThan(0);
      expect(e.hireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('spreads people across several countries and departments', () => {
    expect(new Set(employees.map((e) => e.countryCode)).size).toBe(COUNTRIES.length);
    expect(new Set(employees.map((e) => e.department)).size).toBeGreaterThan(5);
  });
});
