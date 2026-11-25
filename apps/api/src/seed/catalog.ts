// Static reference data used by the seed. Plausible, not real. Numbers are annual base pay in USD for a US hire.

// 1 unit of currency in USD. Static on purpose (see requirements: no live FX).
export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  CAD: 0.73,
  AUD: 0.65,
  SGD: 0.74,
  JPY: 0.0067,
  BRL: 0.18,
  AED: 0.2723,
};

export interface CountryProfile {
  code: string;
  currency: string;
  weight: number; // share of the workforce
  payFactor: number; // pay level relative to the US
}

export const COUNTRIES: readonly CountryProfile[] = [
  { code: 'IN', currency: 'INR', weight: 30, payFactor: 0.3 },
  { code: 'US', currency: 'USD', weight: 22, payFactor: 1 },
  { code: 'GB', currency: 'GBP', weight: 10, payFactor: 0.8 },
  { code: 'DE', currency: 'EUR', weight: 9, payFactor: 0.82 },
  { code: 'CA', currency: 'CAD', weight: 6, payFactor: 0.85 },
  { code: 'AU', currency: 'AUD', weight: 5, payFactor: 0.85 },
  { code: 'SG', currency: 'SGD', weight: 5, payFactor: 0.8 },
  { code: 'BR', currency: 'BRL', weight: 5, payFactor: 0.38 },
  { code: 'JP', currency: 'JPY', weight: 4, payFactor: 0.7 },
  { code: 'AE', currency: 'AED', weight: 4, payFactor: 0.75 },
];

export const JOBS: Record<string, Record<string, number>> = {
  Engineering: {
    'Software Engineer': 95000,
    'Senior Software Engineer': 125000,
    'Staff Engineer': 160000,
    'QA Engineer': 75000,
    'DevOps Engineer': 105000,
    'Engineering Manager': 150000,
  },
  Sales: { 'Sales Representative': 60000, 'Account Executive': 80000, 'Sales Manager': 110000 },
  Marketing: { 'Marketing Specialist': 62000, 'Marketing Manager': 100000 },
  'Human Resources': { 'HR Specialist': 58000, 'HR Manager': 95000 },
  Finance: { Accountant: 65000, 'Financial Analyst': 80000, 'Finance Manager': 115000 },
  Product: { 'Product Manager': 130000, 'Product Designer': 90000 },
  Support: { 'Support Agent': 45000, 'Support Lead': 70000 },
};

// Roughly how big each department is.
export const DEPARTMENT_WEIGHTS: readonly { value: string; weight: number }[] = [
  { value: 'Engineering', weight: 40 },
  { value: 'Sales', weight: 15 },
  { value: 'Support', weight: 15 },
  { value: 'Marketing', weight: 8 },
  { value: 'Finance', weight: 8 },
  { value: 'Product', weight: 8 },
  { value: 'Human Resources', weight: 6 },
];

export const FIRST_NAMES = [
  'Aarav',
  'Priya',
  'Rohan',
  'Ananya',
  'Vikram',
  'Sneha',
  'Arjun',
  'Meera',
  'James',
  'Emily',
  'Michael',
  'Sophia',
  'Daniel',
  'Olivia',
  'Lukas',
  'Hannah',
  'Mateus',
  'Camila',
  'Yuki',
  'Haruto',
  'Omar',
  'Layla',
  'Wei',
  'Mei',
  'Liam',
  'Chloe',
  'Noah',
  'Isla',
  'Ethan',
  'Zara',
] as const;

export const LAST_NAMES = [
  'Sharma',
  'Patel',
  'Iyer',
  'Gupta',
  'Reddy',
  'Smith',
  'Johnson',
  'Brown',
  'Taylor',
  'Wilson',
  'Muller',
  'Schmidt',
  'Silva',
  'Santos',
  'Tanaka',
  'Sato',
  'Khan',
  'Haddad',
  'Chen',
  'Tan',
  'Singh',
  'Nair',
  'Evans',
  'Clark',
  'Wright',
  'Lopez',
  'Weber',
  'Costa',
  'Ito',
  'Ali',
] as const;
