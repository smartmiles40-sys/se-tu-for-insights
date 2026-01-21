import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Get the current date/time in Brazil timezone
 */
export function getBrazilDate(): Date {
  return toZonedTime(new Date(), BRAZIL_TIMEZONE);
}

/**
 * Get today's date in YYYY-MM-DD format in Brazil timezone
 */
export function getTodayBrazil(): string {
  return formatInTimeZone(new Date(), BRAZIL_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get current month (1-12) in Brazil timezone
 */
export function getCurrentMonthBrazil(): number {
  return getBrazilDate().getMonth() + 1;
}

/**
 * Get current year in Brazil timezone
 */
export function getCurrentYearBrazil(): number {
  return getBrazilDate().getFullYear();
}

/**
 * Get current day of month in Brazil timezone
 */
export function getCurrentDayBrazil(): number {
  return getBrazilDate().getDate();
}

/**
 * Format a date string or Date object in Brazil timezone
 */
export function formatBrazilDate(date: Date | string, pattern: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, BRAZIL_TIMEZONE, pattern, { locale: ptBR });
}

/**
 * Get first day of current month in YYYY-MM-DD format (Brazil timezone)
 */
export function getFirstDayOfMonthBrazil(): string {
  const today = getBrazilDate();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Get date parts (year, month, day) in Brazil timezone
 */
export function getBrazilDateParts(): { year: number; month: number; day: number } {
  const today = getBrazilDate();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  };
}
