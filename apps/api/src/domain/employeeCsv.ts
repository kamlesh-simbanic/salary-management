import { parse } from 'csv-parse/sync';
import { employeeInputSchema, type EmployeeInput } from './employee.js';
import { ValidationError } from '../errors.js';

export const MAX_IMPORT_ROWS = 20_000;

export interface RowError {
  row: number; // line number in the file (the header is line 1), so HR can find it in Excel
  message: string;
}

export interface ParsedCsv {
  totalRows: number;
  rows: { row: number; input: EmployeeInput }[];
  errors: RowError[];
}

const FIELDS = [
  'fullName',
  'email',
  'jobTitle',
  'department',
  'countryCode',
  'currencyCode',
  'annualSalary',
  'hireDate',
] as const;
type Field = (typeof FIELDS)[number];

// "Full Name", "full_name" and "fullName" all mean the same column: compare headers lowercase, letters/digits only.
const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
// Plus the short names people actually type in Excel.
const ALIASES: Record<string, Field> = {
  name: 'fullName',
  title: 'jobTitle',
  country: 'countryCode',
  currency: 'currencyCode',
  salary: 'annualSalary',
};
const FIELD_BY_HEADER = new Map<string, Field>([
  ...FIELDS.map((f): [string, Field] => [squash(f), f]),
  ...Object.entries(ALIASES),
]);

// Excel exports "1,500,000" or " 90000 "; strip separators, but never guess at anything stranger.
function parseSalary(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, '');
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : NaN;
}

export function parseEmployeeCsv(text: string): ParsedCsv {
  const foundFields = new Set<Field>();
  let records: { record: Record<string, string | undefined>; info: { lines: number } }[];

  try {
    records = parse(text, {
      // Unknown columns map to `false`, which tells csv-parse to ignore them.
      columns: (header: string[]) =>
        header.map((h) => {
          const field = FIELD_BY_HEADER.get(squash(h));
          if (field) foundFields.add(field);
          return field ?? false;
        }),
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true, // a short row becomes a row-level validation error, not a failed file
      info: true,
    });
  } catch (err) {
    throw new ValidationError(`The file is not valid CSV: ${(err as Error).message}`);
  }

  const missing = FIELDS.filter((f) => !foundFields.has(f));
  if (missing.length > 0) {
    throw new ValidationError(`Missing required column(s): ${missing.join(', ')}`, { missing });
  }
  if (records.length === 0) throw new ValidationError('The file has a header but no employee rows');
  if (records.length > MAX_IMPORT_ROWS) {
    throw new ValidationError(
      `Too many rows (${records.length}); the limit is ${MAX_IMPORT_ROWS} per import`,
    );
  }

  const rows: ParsedCsv['rows'] = [];
  const errors: RowError[] = [];
  const firstRowOfEmail = new Map<string, number>();

  for (const { record, info } of records) {
    const row = info.lines;
    const result = employeeInputSchema.safeParse({
      ...Object.fromEntries(FIELDS.map((f) => [f, record[f] ?? ''])),
      annualSalary: parseSalary(record.annualSalary ?? ''),
    });

    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      errors.push({ row, message });
      continue;
    }

    const email = result.data.email;
    const firstSeen = firstRowOfEmail.get(email);
    if (firstSeen !== undefined) {
      errors.push({ row, message: `email: duplicate of row ${firstSeen} in this file` });
      continue;
    }
    firstRowOfEmail.set(email, row);
    rows.push({ row, input: result.data });
  }

  return { totalRows: records.length, rows, errors };
}
