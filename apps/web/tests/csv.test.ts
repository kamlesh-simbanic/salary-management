import { describe, expect, it } from 'vitest';
import { errorsToCsv, TEMPLATE_CSV } from '../src/lib/csv';

describe('errorsToCsv', () => {
  it('writes a header and one line per problem', () => {
    expect(errorsToCsv([{ row: 3, message: 'email: Invalid email' }])).toBe(
      'row,problem\n3,email: Invalid email\n',
    );
  });

  it('quotes messages containing commas, quotes or semicolons-with-commas so Excel keeps one column', () => {
    const csv = errorsToCsv([{ row: 5, message: 'name: too long, "x"' }]);

    expect(csv).toBe('row,problem\n5,"name: too long, ""x"""\n');
  });
});

describe('TEMPLATE_CSV', () => {
  it('has the header the importer requires, plus one example row', () => {
    const [header, example] = TEMPLATE_CSV.trim().split('\n');

    expect(header).toBe(
      'fullName,email,jobTitle,department,countryCode,currencyCode,annualSalary,hireDate',
    );
    expect(example?.split(',')).toHaveLength(8);
  });
});
