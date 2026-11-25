import { describe, expect, it } from 'vitest';
import { MAX_IMPORT_ROWS, parseEmployeeCsv } from '../src/domain/employeeCsv.js';
import { ValidationError } from '../src/errors.js';

const HEADER = 'fullName,email,jobTitle,department,countryCode,currencyCode,annualSalary,hireDate';
const GOOD = 'Asha Rao,asha@acme.example,Software Engineer,Engineering,IN,INR,1500000,2022-04-01';
const csv = (...lines: string[]) => [HEADER, ...lines].join('\n');

describe('parseEmployeeCsv', () => {
  it('parses a valid row into a typed employee', () => {
    const { rows, errors, totalRows } = parseEmployeeCsv(csv(GOOD));

    expect(errors).toEqual([]);
    expect(totalRows).toBe(1);
    expect(rows[0]?.input).toMatchObject({
      fullName: 'Asha Rao',
      annualSalary: 1_500_000,
      countryCode: 'IN',
    });
  });

  it('accepts friendly header spellings, any column order, and ignores unknown columns', () => {
    const text = [
      'Email,Full Name,Job_Title,DEPARTMENT,Country Code,Currency Code,Annual Salary,Hire Date,Notes',
      'asha@acme.example,Asha Rao,Software Engineer,Engineering,in,inr,1500000,2022-04-01,ignore me',
    ].join('\n');

    const { rows, errors } = parseEmployeeCsv(text);

    expect(errors).toEqual([]);
    expect(rows[0]?.input).toMatchObject({
      fullName: 'Asha Rao',
      countryCode: 'IN',
      currencyCode: 'INR',
    });
  });

  it('understands short Excel-style headers such as Name, Country, Currency and Salary', () => {
    const text = [
      'Name,Email,Title,Department,Country,Currency,Salary,Hire Date',
      'Asha Rao,asha@acme.example,Software Engineer,Engineering,IN,INR,1500000,2022-04-01',
    ].join('\n');

    expect(parseEmployeeCsv(text).errors).toEqual([]);
  });

  it('handles Excel-style salaries with thousands separators and quoted fields', () => {
    const line =
      '"Rao, Asha",asha@acme.example,Software Engineer,Engineering,IN,INR,"1,500,000.50",2022-04-01';

    const { rows } = parseEmployeeCsv(csv(line));

    expect(rows[0]?.input).toMatchObject({ fullName: 'Rao, Asha', annualSalary: 1_500_000.5 });
  });

  it('copes with a BOM, Windows line endings and blank lines', () => {
    const BOM = String.fromCharCode(0xfeff); // written as code so editors/linters don't mangle it
    const text = `${BOM}${HEADER}\r\n\r\n${GOOD}\r\n\r\n`;

    expect(parseEmployeeCsv(text).rows).toHaveLength(1);
  });

  it('reports bad rows with their file line number and keeps the good ones', () => {
    const bad = 'Bob,not-an-email,QA,Engineering,IN,INR,-5,2022-13-45';

    const { rows, errors } = parseEmployeeCsv(csv(GOOD, bad));

    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.row).toBe(3); // header is line 1, GOOD is line 2
    expect(errors[0]?.message).toMatch(/email.*annualSalary.*hireDate/);
  });

  it('flags a non-numeric salary and a row with too few columns', () => {
    const { errors } = parseEmployeeCsv(
      csv('Bob,bob@acme.example,QA,Engineering,IN,INR,lots,2022-04-01', 'Carl,carl@acme.example'),
    );

    expect(errors.map((e) => e.row)).toEqual([2, 3]);
    expect(errors[0]?.message).toMatch(/annualSalary/);
  });

  it('flags the second occurrence of an email within the file, pointing at the first', () => {
    const { rows, errors } = parseEmployeeCsv(csv(GOOD, GOOD.replace('Asha Rao', 'Asha R')));

    expect(rows).toHaveLength(1);
    expect(errors).toEqual([{ row: 3, message: 'email: duplicate of row 2 in this file' }]);
  });

  it('rejects the whole file when required columns are missing', () => {
    const text = 'fullName,email\nAsha,asha@acme.example';

    expect(() => parseEmployeeCsv(text)).toThrow(/Missing required column.*jobTitle.*annualSalary/);
  });

  it('rejects an empty file, a header-only file and an oversized file', () => {
    expect(() => parseEmployeeCsv('')).toThrow(ValidationError);
    expect(() => parseEmployeeCsv(HEADER)).toThrow(/no employee rows/);
    const huge = csv(...Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => GOOD));
    expect(() => parseEmployeeCsv(huge)).toThrow(/Too many rows/);
  });
});
