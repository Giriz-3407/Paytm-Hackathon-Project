'use client';
import { useUI } from '@/stores/ui-store';
import { dateLabel } from '@/lib/utils';
export function useDateFormatter(fixedTimezone?: string) {
  const timezone = useUI((s) => s.timezone);
  const format = useUI((s) => s.dateFormat);
  return (value: string | number, time = false) =>
    dateLabel(value, time, fixedTimezone || timezone, format);
}
