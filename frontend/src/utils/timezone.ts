// Timezone utilities for UTC+8 (Singapore/Malaysia timezone)

/**
 * Get current date in UTC+8 timezone
 */
export const getCurrentDateUTCPlus8 = (): Date => {
  const now = new Date();
  // Convert to UTC+8 by adding 8 hours
  return new Date(now.getTime() + (8 * 60 * 60 * 1000));
};

/**
 * Generate available dates (next 14 days) in UTC+8
 */
export const generateAvailableDatesUTCPlus8 = (): string[] => {
  const dates: string[] = [];
  const now = new Date();
  
  // Get current date in local timezone (which should be UTC+8)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

  for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
    // Format as YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
};

/**
 * Format datetime string to UTC+8 timezone for display
 */
export const formatDateTimeUTCPlus8 = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  // Convert to UTC+8 for display
  const utcPlus8 = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  
  return utcPlus8.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time for display in UTC+8
 */
export const formatTimeUTCPlus8 = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  // Convert to UTC+8 for display
  const utcPlus8 = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  
  const hour = utcPlus8.getUTCHours();
  
  if (hour === 12) return '12:00 PM';
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
};

/**
 * Create a datetime string in UTC+8 format for API calls
 */
export const createDateTimeUTCPlus8 = (date: string, time: string): string => {
  // date is in YYYY-MM-DD format, time is in HH:MM format
  return `${date}T${time}:00+08:00`;
};

/**
 * Convert UTC datetime to UTC+8 for display
 */
export const convertUTCToUTCPlus8 = (utcDateTimeString: string): string => {
  const date = new Date(utcDateTimeString);
  const utcPlus8 = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  return utcPlus8.toISOString().replace('Z', '+08:00');
};

/**
 * Check if a datetime is in the past (considering UTC+8 timezone)
 */
export const isDateTimeInPast = (dateTimeString: string): boolean => {
  const now = new Date();
  const targetDate = new Date(dateTimeString);
  
  // Compare directly - JavaScript Date handles timezone conversion automatically
  return targetDate < now;
};