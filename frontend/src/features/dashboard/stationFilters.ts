import type { StationStatus, StationView } from "../../api/types";

export type StatusFilter = "all" | StationStatus;

export interface StationFilters {
  query: string;
  status: StatusFilter;
  district: string | null;
}

// 띄어쓰기와 대소문자 차이는 무시하고 비교한다.
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

export function matchesSearch(station: StationView, query: string): boolean {
  const keyword = normalize(query);
  return keyword === "" || normalize(station.stationName).includes(keyword);
}

export function matchesDistrict(
  station: StationView,
  district: string | null,
): boolean {
  return district === null || station.district === district;
}

// 상태는 서버가 판정한 값을 그대로 비교한다.
export function filterStations(
  stations: StationView[],
  { query, status, district }: StationFilters,
): StationView[] {
  return stations.filter(
    (station) =>
      (status === "all" || station.status === status) &&
      matchesDistrict(station, district) &&
      matchesSearch(station, query),
  );
}

export function isFilterActive({ query, status, district }: StationFilters): boolean {
  return query.trim() !== "" || status !== "all" || district !== null;
}
