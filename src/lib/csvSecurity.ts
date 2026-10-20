/**
 * Utility functions for safe CSV formatting and spreadsheet formula injection prevention.
 */

// Characters that spreadsheet applications (Excel, Google Sheets, Calc) treat as formula triggers
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Escapes a field for safe CSV output:
 * 1. Sanitizes leading formula injection characters (=, +, -, @, tab, CR) by prefixing with a single quote.
 * 2. Escapes internal double quotes by doubling them.
 * 3. Wraps the value in double quotes.
 */
export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  // Prevent CSV / Spreadsheet Formula Injection
  const trimmed = str.trimStart();
  if (trimmed.length > 0 && FORMULA_TRIGGER_CHARS.includes(trimmed[0])) {
    str = `'${str}`;
  }

  // Escape double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts a 2D array of rows into a safe CSV string with BOM for Excel UTF-8 compatibility.
 */
export function buildCsvBlob(rows: unknown[][]): Blob {
  const csvString = '\uFEFF' + rows.map((row) => row.map(sanitizeCsvField).join(',')).join('\n');
  return new Blob([csvString], { type: 'text/csv;charset=utf-8' });
}

/**
 * Initiates browser file download for a CSV file.
 */
export function downloadCsvFile(filename: string, rows: unknown[][]): void {
  const blob = buildCsvBlob(rows);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
