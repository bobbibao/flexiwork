import * as moment from 'moment';
export default class DateFormatter {
  // Define valid formatting function names
  private static dateFormatMappings: [string, keyof typeof DateFormatter][] = [
    ['created_at', 'removeTrailingZeros'],
    ['updated_at', 'removeTrailingZeros'],
    ['due_on', 'removeTrailingZeros'],
    ['charged_on', 'removeTrailingZeros'],
    ['end_on', 'removeTrailingZeros'],
    ['start_date', 'removeTrailingZeros'],
    ['end_date', 'removeTrailingZeros'],
    ['date', 'removeAllTrailingZeros'],
  ];

  // Static method to format the dates in the DTO based on the field name and formatting function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static formatDTO(dto: any, defaultFormatFunction: keyof typeof DateFormatter = 'formatDate'): any {
    // Iterate over each field in the DTO
    for (const key of Object.keys(dto)) {
      const value = dto[key];
      // Check if the field is in the dateFormatMappings array
      const mapping = this.dateFormatMappings.find(([fieldName]) => fieldName === key);

      if (mapping && (typeof dto[key] === 'string' || typeof dto[key] === 'object')) {
        // Apply the corresponding formatting method for the matching field name
        const formatFunction = mapping[1];
        const method = this[formatFunction];

        // Check if the method is a function before invoking it
        if (typeof method === 'function') {
          dto[key] = method.call(this, value);
        }
      } else if (value instanceof Date) {
        // If it's a Date object, apply the default formatting method
        const defaultMethod = this[defaultFormatFunction];

        // Check if the default method is a function before invoking it
        if (typeof defaultMethod === 'function') {
          dto[key] = defaultMethod.call(this, value);
        }
      }
    }
    return dto;
  }

  // Static method to format a date string or Date object into ISO format
  public static formatDate(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    let milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    // Extend milliseconds to 5 digits if needed
    milliseconds = milliseconds.padEnd(5, '0');

    // Trim trailing zeros from milliseconds and limit to 5 characters
    const trimmedMilliseconds = milliseconds.replace(/0+$/, '').slice(0, 5);

    // Check if the date string ends with '00:00.000Z'
    if (`${hours}:${minutes}:${seconds}.${milliseconds}Z` === '00:00:00.00000Z') {
      return `${year}-${month}-${day}T00:00:00.00Z`;
    }

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${trimmedMilliseconds}Z`;
  }

  // Static method to remove trailing zeros from timestamp strings
  public static removeTrailingZeros(timestamp: string): string {
    // Check if the timestamp is not a string
    if (typeof timestamp !== 'string') {
      timestamp = JSON.stringify(timestamp).replaceAll('"', '');
    }

    // Check if the timestamp ends with '00:00.000Z'
    if (timestamp.endsWith('00:00.000Z')) {
      return timestamp.replace('00:00.000Z', '00:00.00Z');
    }

    const regex = /(\.\d*?)0+Z$/;
    const modifiedTimestamp = timestamp.replace(regex, '$1Z');
    return modifiedTimestamp.replace(/\.Z$/, 'Z');
  }

  // Static method to remove all trailing zeros from timestamp strings
  // example: 2021-01-01T00:00:00.000Z ---> 2021-01-01T00:00:00Z
  public static removeAllTrailingZeros(timestamp: string): string {
    // Check if the timestamp is not a string
    if (typeof timestamp !== 'string') {
      timestamp = JSON.stringify(timestamp).replaceAll('"', '');
    }

    // Check if the timestamp ends with '00:00.000Z'
    if (timestamp.endsWith('00:00.000Z')) {
      return timestamp.replace('00:00.000Z', '00:00Z');
    }

    if (timestamp.endsWith('00:00.00Z')) {
      return timestamp.replace('00:00.00Z', '00:00Z');
    }

    if (timestamp.endsWith('00:00:00.000000Z')) {
      return timestamp.replace('00:00:00.000000Z', '00:00:00Z');
    }

    return timestamp;
  }
}

// Static method to format a date string or Date object into ISO format with machine timezone
export function formatDateToISOStringWithMachineTimezone(date: Date): string {
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? '+' : '-';
  const pad = (n: number) => (n < 10 ? '0' : '') + Math.floor(Math.abs(n));
  const milliseconds = (date.getMilliseconds() / 1000).toFixed(7).slice(2);
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    (+milliseconds === 0 ? '' : '.' + milliseconds) +
    diff +
    pad(tzOffset / 60) +
    ':' +
    pad(tzOffset % 60)
  );
}

// Static method to parse a date string into a Date object
export function parseDate(date: string | Date): Date | null {
  if (date instanceof Date) {
    return date;
  }

  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

// Static method to get the first date of the year from a date string or Date object
export function getParsedOrFirstDateOfYear(dateOrYear: string | Date = new Date()): Date {
  const date = parseDate(dateOrYear);

  if (!date) {
    return new Date(new Date().getFullYear(), 0, 1);
  }

  return date;
}

// Static method to get the last date of the year from a date string or Date object
export function getParsedOrLastDateOfYear(dateOrYear: string | Date = new Date()): Date {
  const date = parseDate(dateOrYear);

  if (!date) {
    return new Date(new Date().getFullYear(), 11, 31);
  }

  return date;
}

// Static method to get the first date of the month from a date string or Date object
export function getParsedOrFirstDateOfMonth(dateOrYear: string | Date = new Date()): Date {
  const date = parseDate(dateOrYear);

  if (!date) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return date;
}

// Static method to get the last date of the month from a date string or Date object
export function getParsedOrLastDateOfMonth(dateOrYear: string | Date = new Date()): Date {
  const date = parseDate(dateOrYear);

  if (!date) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return date;
}

// Static method to get the first date of the year from a date string
export function getFirstDateOfMonth(date: string | Date): Date {
  const parsedDate = parseDate(date);
  const now = new Date();
  return parsedDate
    ? new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
}

// Static method to get the first date of the year from a date string
export function getLastDateOfMonth(date: string | Date): Date {
  const parsedDate = parseDate(date);
  const now = new Date();
  return parsedDate
    ? new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 0)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Pad month with leading zero
  const day = date.getDate().toString().padStart(2, '0'); // Pad day with leading zero

  return `${year}-${month}-${day}`;
}

export function compareDates(date1: string | Date, date2: string | Date): number {
  // Parse the date strings into Date objects
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Compare the Date objects
  if (d1.getTime() === d2.getTime()) {
    return 0; // Dates are equal
  } else if (d1.getTime() < d2.getTime()) {
    return -1; // date1 is before date2
  } else {
    return 1; // date1 is after date2
  }
}

/**
 * @description: Check string format is valid 'YYYY-MM-DD' then convert to Date object
 */
export function formatStringToDate(dateString: string): Date | null {
  const REGEX_PATTERN = /\d{4}-\d{1,2}-\d{1,2}/;

  if (!REGEX_PATTERN.test(dateString)) {
    return null;
  }
  const dateParams = dateString.split('-');
  const day = parseInt(dateParams[2]);
  const month = parseInt(dateParams[1]) - 1;
  const year = parseInt(dateParams[0]);

  return new Date(year, month, day);
}

export function timeInRange(submitStart: Date, submitEnd: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const submitStartMoment = moment(submitStart);
  const submitEndMoment = moment(submitEnd);
  const rangeStartMoment = moment(rangeStart);
  const rangeEndMoment = moment(rangeEnd);

  // Check if both start and end dates are equal
  if (submitStartMoment.isSame(rangeStartMoment) && submitEndMoment.isSame(rangeEndMoment)) {
    return true;
  }

  // Check if start dates are equal and submit end date is after range end date
  if (submitStartMoment.isSame(rangeStartMoment) && submitEndMoment.isAfter(rangeEndMoment)) {
    return true;
  }

  // Check if submit start date is before range start date and end dates are equal
  if (submitStartMoment.isBefore(rangeStartMoment) && submitEndMoment.isSame(rangeEndMoment)) {
    return true;
  }

  // Check if submit start date is before range start date and submit end date is after range end date
  if (submitStartMoment.isBefore(rangeStartMoment) && submitEndMoment.isAfter(rangeEndMoment)) {
    return true;
  }

  // If none of the above conditions are true, return false
  return false;
}

export function shortTime(date: Date, toEnd: boolean): Date {
  // Create a new date object to avoid mutating the original date
  const cur = new Date(date);

  // Set the hours, minutes, seconds, and milliseconds to zero to truncate the date to midnight
  cur.setHours(0, 0, 0, 0);

  if (toEnd) {
    // If toEnd is true, return the end of the day (just before midnight)
    const endOfDay = new Date(cur);
    endOfDay.setDate(endOfDay.getDate() + 1); // Move to the next day
    endOfDay.setSeconds(endOfDay.getSeconds() - 1); // Set to one second before midnight
    return endOfDay;
  }

  // Return the start of the day
  return cur;
}

export function daysCountSince(start: Date, end: Date) {
  const millisecondsInADay = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsInADay);
}

export function dateToShortString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

export function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export function parseDuration(duration: string): moment.Duration {
  // Check if the duration is '0' or empty => return a zero duration
  if (duration === '0' || duration === '') {
    return moment.duration(0);
  }

  const regex = /^(?:(\d*\.?\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/;
  const matches = duration.match(regex);

  if (!matches) {
    throw new Error('Invalid duration format');
  }

  const hours = matches[1] ? parseFloat(matches[1]) : 0;
  const fullHours = Math.floor(hours); // Whole hours in integer
  const fractionalHours = hours - fullHours; // Fractional part to convert to minutes

  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

  // Convert the fractional part of hours to minutes
  const extraMinutes = Math.round(fractionalHours * 60);
  const totalMinutes = minutes + extraMinutes;

  const parsedDuration = moment.duration({
    hours: fullHours,
    minutes: totalMinutes,
    seconds: seconds,
  });

  if (parsedDuration.asMilliseconds() === 0) {
    throw new Error('Invalid duration format');
  }

  return parsedDuration;
}

export function formatDuration(duration: moment.Duration): string {
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  if (hours === 0 && minutes === 0 && seconds === 0) {
    return '0s';
  } else if (hours === 0 && minutes === 0) {
    return `${seconds}s`;
  } else if (hours === 0) {
    return `${minutes}m${seconds}s`;
  }

  return `${hours}h${minutes}m${seconds}s`;
}

export function formatDateToDotSeparated(date: string): string {
  const arr = date.split('-');
  const reversedArr = arr.reverse();
  return reversedArr.join('.');
}

export function formatDate(date: Date | string | null, format: string, useUTCTimezone: boolean = false) {
  if (!date) {
    return '';
  }
  if (typeof date === 'string') {
    date = new Date(date);
  }
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const year = useUTCTimezone ? date.getUTCFullYear() : date.getFullYear();
  const month = ('0' + (useUTCTimezone ? date.getUTCMonth() + 1 : date.getMonth() + 1)).slice(-2);
  const day = ('0' + (useUTCTimezone ? date.getUTCDate() : date.getDate())).slice(-2);
  const hours24 = useUTCTimezone ? date.getUTCHours() : date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = ('0' + (useUTCTimezone ? date.getUTCMinutes() : date.getMinutes())).slice(-2);
  const seconds = ('0' + (useUTCTimezone ? date.getUTCSeconds() : date.getSeconds())).slice(-2);
  const ampm = hours24 >= 12 ? 'PM' : 'AM';

  return format
    .replace('YYYY', year.toString())
    .replace('YY', (year % 100).toString().padStart(2, '0'))
    .replace('MM', month)
    .replace('DD', day)
    .replace('hh', ('0' + hours12).slice(-2))
    .replace('HH', ('0' + hours24).slice(-2))
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('A', ampm);
}

export function daysBetween(startDate: Date, endDate: Date): number {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  const diffInMs = Math.abs(endTime - startTime);

  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday (0) or Saturday (6)
}

export function dateInRange(startDate: Date, endDate: Date | null, dateToCheck: Date): boolean {
  const now = new Date();

  if (!endDate) {
    return dateToCheck > startDate && dateToCheck < now;
  }

  return dateToCheck > startDate && dateToCheck < endDate;
}

export function generateFormatDateSQL(column: string): string {
  // return `COALESCE(CASE WHEN EXTRACT(MICROSECONDS FROM ${column}) = 0 THEN TO_CHAR(${column}, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' ELSE TO_CHAR(${column}, 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z' END, '0001-01-01T00:00:00Z')`;
  return `COALESCE(TO_CHAR(${column}, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z', '0001-01-01T00:00:00Z')`;
}

export function removeMsFromDate(date: Date | string): string {
  // Return the date string in UTC format without milliseconds
  return new Date(date).toISOString().split('.')[0] + 'Z';
}
