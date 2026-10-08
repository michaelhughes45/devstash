// Dates are stored in UTC, so they're shown in UTC to read the same everywhere

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const SHORT_DATE_WITH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

// e.g. "Oct 8"
export function formatShortDate(date: Date): string {
  return SHORT_DATE.format(date);
}

// e.g. "Oct 8, 2026"
export function formatShortDateWithYear(date: Date): string {
  return SHORT_DATE_WITH_YEAR.format(date);
}

// e.g. "October 8, 2026"
export function formatLongDate(date: Date): string {
  return LONG_DATE.format(date);
}
