import createClient from "openapi-fetch";
import type { paths } from "./schema";
import type { DashboardSnapshot, HealthResponse } from "./types";

// 같은 origin의 /api는 개발 중 Vite 프록시를 통한다. 서울시 API 키를 전달하지 않는다.
const client = createClient<paths>();

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const result = await client.GET("/api/health", { signal });
  if (!result.response.ok || !result.data) {
    throw new ApiError(result.response.status, "HTTP_ERROR", "서버 연결을 확인해 주세요.");
  }
  return result.data;
}

export async function refreshDashboard(
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  const result = await client.POST("/api/dashboard/refresh", { signal });
  if (!result.response.ok || !result.data) {
    throw new ApiError(
      result.response.status,
      result.error?.code ?? "HTTP_ERROR",
      result.error?.message ?? "데이터를 불러오지 못했습니다.",
    );
  }
  return result.data;
}
