const APP_TIMEZONE = "Asia/Kolkata";

/**
 * All "today" boundaries use IST regardless of server/client timezone,
 * since Postgres's CURRENT_DATE default runs in UTC and would misalign
 * with the user's actual day for hours around midnight IST.
 */
export function getTodayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

export function getISTHour(): number {
  return Number(
    new Date().toLocaleString("en-US", { timeZone: APP_TIMEZONE, hour: "2-digit", hour12: false }),
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Manually formatted (not Intl.DateTimeFormat) so server and client render
 * identical text — Node's built-in ICU and the browser's can punctuate the
 * same locale differently (e.g. "Tuesday 7 Jul" vs "Tuesday, 7 Jul"), which
 * causes a hydration mismatch when used directly in JSX.
 */
export function formatDisplayDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? WEEKDAYS[date.getDay()];
  const day = parts.find((p) => p.type === "day")?.value ?? String(date.getDate());
  const month = parts.find((p) => p.type === "month")?.value ?? MONTHS[date.getMonth()];

  return `${weekday}, ${day} ${month}`;
}

/**
 * Same rationale as formatDisplayDate: builds the "8:30 AM" string from
 * numeric parts instead of toLocaleTimeString, since some Intl
 * implementations insert a narrow no-break space before AM/PM instead of
 * a regular space, which would also mismatch between server and client.
 */
export function formatDisplayTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "12";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayPeriod = (parts.find((p) => p.type === "dayPeriod")?.value ?? "AM").toUpperCase();

  return `${hour}:${minute} ${dayPeriod}`;
}
