import type { StationStats } from "../../../api/types";

export type DistrictRow = [district: string, stats: StationStats];
export type NumericKey = keyof StationStats;

export function toRows(districtStats: Record<string, StationStats>): DistrictRow[] {
  return Object.entries(districtStats);
}

// 서버가 계산한 값의 순서만 바꾼다. 값이 없는 구는 방향과 상관없이 항상 맨 아래.
export function sortRows(
  rows: DistrictRow[],
  key: NumericKey | "district",
  descending: boolean,
): DistrictRow[] {
  const direction = descending ? -1 : 1;
  return [...rows].sort((a, b) => {
    if (key === "district") return direction * a[0].localeCompare(b[0], "ko");
    const left = a[1][key];
    const right = b[1][key];
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return direction * (left - right);
  });
}

// 축 눈금용: 최댓값을 보기 좋은 수로 올린다. (예: 37 → 40, 143 → 150)
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, index) => (max / count) * index);
}
