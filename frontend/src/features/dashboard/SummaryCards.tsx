import type { StationStats, StationStatus } from "../../api/types";
import { formatCount, formatRate } from "./format";
import { STATUS_LABELS, STATUS_ORDER } from "./statusMeta";

interface SummaryCardsProps {
  summary: StationStats;
}

function countOf(summary: StationStats, status: StationStatus): number {
  switch (status) {
    case "shortage":
      return summary.shortageCount;
    case "normal":
      return summary.normalCount;
    case "surplus":
      return summary.surplusCount;
    case "unknown":
      return summary.unknownCount;
  }
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const total = summary.stationCount;

  return (
    <section className="summary" aria-label="전체 요약">
      <div className="kpi-grid">
        <article className="card kpi">
          <h2>전체 대여소</h2>
          <p className="kpi-value">{formatCount(summary.stationCount)}</p>
          <p className="kpi-sub">곳</p>
        </article>
        <article className="card kpi">
          <h2>대여 가능 자전거</h2>
          <p className="kpi-value">{formatCount(summary.availableBikes)}</p>
          <p className="kpi-sub">거치대 {formatCount(summary.totalRacks)}개</p>
        </article>
        <article className="card kpi">
          <h2>평균 거치율</h2>
          <p className="kpi-value">{formatRate(summary.averageOccupancyRate)}</p>
          <p className="kpi-sub">대여소별 거치율의 평균</p>
        </article>
        <article className="card kpi alert">
          <h2>부족 대여소</h2>
          <p className="kpi-value">{formatCount(summary.shortageCount)}</p>
          <p className="kpi-sub">서버가 부족으로 판정한 곳</p>
        </article>
      </div>

      <article className="card status-card">
        <h2>상태별 대여소</h2>
        <div className="status-bar" aria-hidden="true">
          {total > 0 &&
            STATUS_ORDER.map((status) => (
              <span
                key={status}
                className={`status-segment status-${status}`}
                style={{ flexGrow: countOf(summary, status) }}
              />
            ))}
        </div>
        <ul className="status-legend">
          {STATUS_ORDER.map((status) => (
            <li key={status}>
              <span className={`legend-dot status-${status}`} aria-hidden="true" />
              {STATUS_LABELS[status]}
              <strong>{formatCount(countOf(summary, status))}</strong>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
