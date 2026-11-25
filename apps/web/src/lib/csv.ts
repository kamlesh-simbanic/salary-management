export const TEMPLATE_CSV =
  'fullName,email,jobTitle,department,countryCode,currencyCode,annualSalary,hireDate\n' +
  'Asha Rao,asha.rao@acme.example,Software Engineer,Engineering,IN,INR,1500000,2022-04-01\n';

// A cell containing a comma, quote or newline must be wrapped in quotes, with inner quotes doubled.
const cell = (value: string | number) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Turns import errors into a CSV the user can open in Excel, fix the listed rows, and re-upload. */
export function errorsToCsv(errors: { row: number; message: string }[]): string {
  return (
    ['row,problem', ...errors.map((e) => `${cell(e.row)},${cell(e.message)}`)].join('\n') + '\n'
  );
}

/** Browser-only: offers `text` to the user as a file download. */
export function downloadTextFile(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
