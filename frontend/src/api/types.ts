// 타입 원본은 Python contracts/types.py이다. 이 파일에는 타입 별칭만 둔다.
import type { components } from "./schema";

export type HealthResponse = components["schemas"]["HealthResponse"];
export type DashboardSnapshot = components["schemas"]["DashboardSnapshot"];
export type StationStats = components["schemas"]["StationStats"];
export type StationView = components["schemas"]["StationView"];
export type StationStatus = StationView["status"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
