import { format, differenceInMinutes, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

export function toTimezone(date: Date | string, timezone: string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(d, timezone);
}

export function fromTimezone(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

export function formatTimeForDisplay(
  date: Date | string,
  timezone: string,
  formatStr: string = 'h:mm a'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const zoned = toZonedTime(d, timezone);
  return formatTz(zoned, formatStr, { timeZone: timezone });
}

export function formatDateForDisplay(
  date: Date | string,
  timezone: string,
  formatStr: string = 'MMM d, yyyy'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const zoned = toZonedTime(d, timezone);
  return format(zoned, formatStr);
}

export function calculateDailyHours(
  clockIn: Date | string,
  clockOut: Date | string | null,
  breakMinutes: number = 0
): number {
  if (!clockOut) return 0;
  const start = typeof clockIn === 'string' ? parseISO(clockIn) : clockIn;
  const end = typeof clockOut === 'string' ? parseISO(clockOut) : clockOut;
  const totalMinutes = differenceInMinutes(end, start) - breakMinutes;
  return Math.max(0, Math.round((totalMinutes / 60) * 100) / 100);
}

export function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function getCurrentTimezoneAbbr(timezone: string): string {
  return formatTz(toZonedTime(new Date(), timezone), 'zzz', { timeZone: timezone });
}
