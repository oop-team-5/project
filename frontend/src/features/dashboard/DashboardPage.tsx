import { refreshDashboard } from "../../api/client";
import { formatFetchedAt } from "./format";
import { SummaryCards } from "./SummaryCards";
import { useDashboardSnapshot, type SnapshotLoader } from "./useDashboardSnapshot";

// 개발 서버에서 주소에 ?mock이 붙으면 예시 데이터 사용
const isMockMode =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("mock");

const loadSnapshot: SnapshotLoader = isMockMode
  ? async (signal) => (await import("./mock/mockSnapshot")).loadMockSnapshot(signal)
  : refreshDashboard;

/** 작업 영역 4. 대시보드 화면 */
export function DashboardPage() {
  const { snapshot, isLoading, errorMessage, refresh } = useDashboardSnapshot(loadSnapshot);

  // TODO[UI]: DashboardSnapshot을 사용하는 카드·자치구 차트·지도·부족 목록.
  // 전체 갱신은 refreshDashboard()로 요청한다. 실패하면 기존 snapshot을 유지한다.
  // 검색/상태 필터는 지도와 표에만 적용하고, 숫자/상태/평균은 재계산하지 않는다.
  // (진행: 카드와 새로고침 완료 / 남음: 자치구 차트·지도·부족 목록·검색/상태 필터)

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="brand">
            Seoul Cycle<span aria-hidden="true">.</span>
          </p>
          <p className="tagline">서울 공공자전거 따릉이 실시간 거치 현황</p>
        </div>
        <div className="topbar-actions">
          {isMockMode && <span className="badge">예시 데이터</span>}
          {snapshot && (
            <span className="fetched-at">기준 {formatFetchedAt(snapshot.fetchedAt)}</span>
          )}
          <button type="button" onClick={refresh} disabled={isLoading}>
            {isLoading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>
      </header>

      <main className="content">
        {errorMessage && (
          <p className="notice error" role="alert">
            {errorMessage}
            {snapshot && " 마지막으로 불러온 데이터를 계속 표시합니다."}
          </p>
        )}

        {snapshot ? (
          <SummaryCards summary={snapshot.summary} />
        ) : (
          <section className="card empty-state" aria-live="polite">
            {isLoading ? (
              <p>서울시 데이터를 불러오는 중입니다.</p>
            ) : (
              <>
                <p>표시할 데이터가 없습니다.</p>
                {import.meta.env.DEV && !isMockMode && (
                  <p className="hint">
                    백엔드 수집 기능이 완성되기 전에는 주소 뒤에 <code>?mock</code>을 붙여
                    예시 데이터로 화면을 확인할 수 있습니다.
                  </p>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
