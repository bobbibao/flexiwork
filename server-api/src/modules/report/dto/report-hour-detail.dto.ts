export class HourDetail {
  spent_string: string;
  spent: number;
  task: string;
  date: string;
  user: {
    id: number;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
  };
}

export function parseDuration(s: string): number {
  const orig = s;
  let neg = false;
  let totalMilliseconds = 0;

  // Handle leading +/- sign
  if (s[0] === '-' || s[0] === '+') {
    neg = s[0] === '-';
    s = s.slice(1);
  }

  if (s === '0') {
    return 0;
  }

  if (!s) {
    throw new Error(`Invalid duration: ${orig}`);
  }

  const durationRegex = /([0-9]*\.?[0-9]+)([a-z]+)/g;
  let match;
  const unitMap: { [unit: string]: number } = {
    s: 1000, // seconds
    m: 60000, // minutes
    h: 3600000, // hours
    d: 86400000, // days
    w: 604800000, // weeks
  };

  while ((match = durationRegex.exec(s)) !== null) {
    const value = parseFloat(match[1]); // Extract number before unit
    const unit = match[2]; // Extract the unit
    const multiplier = unitMap[unit];

    if (!multiplier) {
      throw new Error(`Unknown unit: ${unit} in duration: ${orig}`);
    }

    totalMilliseconds += value * multiplier;
  }

  if (neg) {
    totalMilliseconds = -totalMilliseconds;
  }

  return totalMilliseconds;
}

// Function to parse the spent_string and convert it to total hours
export function parseSpentStringToHours(spentString: string): number {
  const totalMilliseconds = parseDuration(spentString); // Use the previously defined parseDuration function
  return totalMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours
}
