import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function toUserDay(date: Date, tz: string) {
  return dayjs(date).tz(tz).startOf("day").toDate();
}

export function toUserDateTime(date: Date, tz: string) {
  return dayjs(date).tz(tz).toDate();
}

export function nowUtc() {
  return new Date();
}

export function minutesBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

export function parseLocalTimeToDate(baseDate: Date, time: string, tz: string) {
  const [h, m] = time.split(":").map(Number);
  return dayjs(baseDate)
    .tz(tz)
    .hour(h)
    .minute(m)
    .second(0)
    .millisecond(0)
    .toDate();
}