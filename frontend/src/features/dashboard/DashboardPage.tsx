import { useEffect, useState } from "react";
import { getHealth } from "../../api/client";

type ConnectionState = "checking" | "connected" | "disconnected";

const statusLabels: Record<ConnectionState, string> = {
  checking: "백엔드 연결 확인 중",
  connected: "백엔드 연결됨",
  disconnected: "백엔드 연결 안 됨",
};

/** 작업 영역 4. 지금은 연결 안내만 표시하며 대시보드 구현은 담당자에게 남긴다. */
export function DashboardPage() {
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setConnection("checking");
    void getHealth(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setConnection("connected");
      })
      .catch(() => {
        if (!controller.signal.aborted) setConnection("disconnected");
      });
    return () => controller.abort();
  }, [attempt]);

  // TODO[UI]: DashboardSnapshot을 사용하는 카드·자치구 차트·지도·부족 목록.
  // 전체 갱신은 refreshDashboard()로 요청한다. 실패하면 기존 snapshot을 유지한다.
  // 검색/상태 필터는 지도와 표에만 적용하고, 숫자/상태/평균은 재계산하지 않는다.
  return (
    <main className="welcome">
      <p className="brand">Seoul Cycle<span aria-hidden="true">.</span></p>
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="eyebrow">TEAM PROJECT · DEVELOPMENT</p>
        <h1 id="welcome-title">대시보드 구현 준비가 되었습니다.</h1>
        <p className="description">
          서울 공공자전거 데이터를 연결할 기본 구조입니다.
          <br />{" "}
          수집·저장·분석·시각화는 각 담당 영역에서 구현합니다.
        </p>
        <div className="connection" role="status" aria-live="polite">
          <span className={`status-dot ${connection}`} aria-hidden="true" />
          <span>{statusLabels[connection]}</span>
        </div>
        {connection === "disconnected" && (
          <p className="hint">백엔드 실행 후 연결을 다시 확인해 주세요.</p>
        )}
        <button
          type="button"
          disabled={connection === "checking"}
          onClick={() => setAttempt((previous) => previous + 1)}
        >
          연결 다시 확인
        </button>
      </section>
      <p className="footer-note">공유 계약을 기준으로 각자의 구현을 연결합니다.</p>
    </main>
  );
}
