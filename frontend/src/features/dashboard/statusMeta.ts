import type { StationStatus } from "../../api/types";

export const STATUS_ORDER: readonly StationStatus[] = [
  "shortage",
  "normal",
  "surplus",
  "unknown",
];

export const STATUS_LABELS: Record<StationStatus, string> = {
  shortage: "부족",
  normal: "보통",
  surplus: "과잉",
  unknown: "정보 없음",
};
