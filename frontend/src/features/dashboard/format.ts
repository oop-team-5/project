import type { Language } from "./i18n";
const countFormat = new Intl.NumberFormat("en-US");
const fetchedAtFormats: Record<Language, Intl.DateTimeFormat> = {
  ko: new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }),
};
export function formatCount(value: number): string {
  return countFormat.format(value);
}
export function formatRate(rate: number | null): string {
  return rate === null ? "-" : `${rate.toFixed(1)}%`;
}
export function formatFetchedAt(isoTime: string, language: Language): string {
  return fetchedAtFormats[language].format(new Date(isoTime));
}
