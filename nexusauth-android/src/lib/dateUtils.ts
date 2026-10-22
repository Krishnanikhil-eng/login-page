/**
 * NexusAuth Date Utilities
 * Ensures date-only values (PostgreSQL DATE) avoid lossy UTC conversion that shifts dates by one day
 * across different timezones (e.g., IST +05:30 or Western Hemisphere timezones).
 */

/**
 * Formats a local Date object into a pure calendar YYYY-MM-DD string.
 * Uses local getFullYear, getMonth, getDate instead of toISOString().
 */
export const formatDateToLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string into a local Date object preserving the exact calendar day.
 */
export const parseLocalDateStringToDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0); // Midday prevents daylight-saving boundary shifts
};

/**
 * Formats date for UI display: YYYY-MM-DD (matches Postgres DATE)
 */
export const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Not provided';
  return dateStr;
};
