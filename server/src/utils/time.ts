export function toUserDay(date: Date, _tz: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toUserDateTime(date: Date, _tz: string) {
  return new Date(date);
}

export function nowUtc() {
  return new Date();
}

export function minutesBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

export function parseLocalTimeToDate(baseDate: Date, time: string, _tz: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}