import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export function dateLabel(
  value: string | number,
  time = false,
  timeZone = 'Asia/Kolkata',
  dateFormat = 'dd MMM yyyy',
) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const formatted =
    dateFormat === 'yyyy-MM-dd'
      ? `${part('year')}-${part('month')}-${part('day')}`
      : dateFormat === 'MM/dd/yyyy'
        ? `${part('month')}/${part('day')}/${part('year')}`
        : new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone,
          }).format(date);
  if (!time) return formatted;
  const clock = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
  const zone =
    timeZone === 'Asia/Kolkata'
      ? 'IST'
      : timeZone === 'UTC'
        ? 'UTC'
        : new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'short' })
            .formatToParts(date)
            .find((p) => p.type === 'timeZoneName')?.value;
  return `${formatted}, ${clock} ${zone}`;
}
export function downloadCsv(
  rows: Record<string, unknown>[],
  filename = 'crisis-lens-incidents.csv',
) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  // Neutralize spreadsheet formula injection as well as quote delimiters.
  const cell = (v: unknown) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const blob = new Blob(
    [
      '\ufeff' +
        [
          keys.map(cell).join(','),
          ...rows.map((row) => keys.map((k) => cell(row[k])).join(',')),
        ].join('\r\n'),
    ],
    { type: 'text/csv;charset=utf-8;' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
