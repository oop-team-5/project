import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardSnapshot } from "../../api/types";

// 실제 API와 예시 데이터를 같은 형태로 넘겨받기 위한 타입
export type SnapshotLoader = (
  signal: AbortSignal,
) => Promise<DashboardSnapshot>;

export interface DashboardSnapshotState {
  snapshot: DashboardSnapshot | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

// 갱신에 실패하면 마지막으로 성공한 스냅샷을 유지한다.
export function useDashboardSnapshot(
  loadSnapshot: SnapshotLoader,
): DashboardSnapshotState {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const inFlight = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setIsLoading(true);
    setError(null);

    void loadSnapshot(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setSnapshot(next);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(error);
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

  return { snapshot, isLoading, error, refresh };
}
