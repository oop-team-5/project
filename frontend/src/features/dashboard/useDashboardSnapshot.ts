import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import type { DashboardSnapshot } from "../../api/types";

// 실제 API와 예시 데이터를 같은 형태로 넘겨받기 위한 타입
export type SnapshotLoader = (signal: AbortSignal) => Promise<DashboardSnapshot>;

export interface DashboardSnapshotState {
  snapshot: DashboardSnapshot | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
}

const NETWORK_ERROR_MESSAGE =
  "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.";

function toErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : NETWORK_ERROR_MESSAGE;
}

// 갱신에 실패하면 마지막으로 성공한 스냅샷을 유지한다.
export function useDashboardSnapshot(loadSnapshot: SnapshotLoader): DashboardSnapshotState {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setIsLoading(true);
    setErrorMessage(null);

    void loadSnapshot(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setSnapshot(next);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setErrorMessage(toErrorMessage(error));
      })
      .finally(() => {
        if (inFlight.current === controller) {
          inFlight.current = null;
          setIsLoading(false);
        }
      });
  }, [loadSnapshot]);

  useEffect(() => {
    refresh();
    return () => inFlight.current?.abort();
  }, [refresh]);

  return { snapshot, isLoading, errorMessage, refresh };
}
