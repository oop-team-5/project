const countFormat = new Intl.NumberFormat("ko-KR");

const fetchedAtFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatCount(value: number): string {
  return countFormat.format(value);
}

export function formatRate(rate: number | null): string {
  return rate === null ? "-" : `${rate.toFixed(1)}%`;
}

export function formatFetchedAt(isoTime: string): string {
  return fetchedAtFormat.format(new Date(isoTime));
}
