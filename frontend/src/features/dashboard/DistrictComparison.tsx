import { useMemo } from "react";
import type { StationStats, StationStatus } from "../../api/types";
import { formatCount, formatRate } from "./format";
import { districtName, messages, type Language } from "./i18n";

// 막대에 표시할 상태와 그 개수(서버가 센 값)
const SEGMENTS: { status: StationStatus; count: (stats: StationStats) => number }[] = [
  { status: "shortage", count: (stats) => stats.shortageCount },
  { status: "normal", count: (stats) => stats.normalCount },
  { status: "surplus", count: (stats) => stats.surplusCount },
];

export function DistrictComparison({
  districtStats,
  selected,
  onSelect,
  language,
}: {
  districtStats: Record<string, StationStats>;
  selected: string | null;
  onSelect: (district: string | null) => void;
  language: Language;
}) {
  const t = messages[language];

  // 서버가 계산한 구별 평균을 높은 순으로 보여 준다. 평균이 없는 구는 맨 아래.
  const rows = useMemo(
    () =>
      Object.entries(districtStats).sort(
        ([, a], [, b]) =>
          (b.averageOccupancyRate ?? -1) - (a.averageOccupancyRate ?? -1),
      ),
    [districtStats],
  );

  return (
    <section className="card district-card" aria-label={t.districtComparison}>
      <div className="district-heading">
        <h2>{t.districtComparison}</h2>
        {selected !== null && (
          <button
            type="button"
            className="district-reset"
            onClick={() => onSelect(null)}
          >
            {t.showAll}
          </button>
        )}
      </div>
      <p className="district-note">{t.districtNote}</p>
      <div className="district-legend" aria-hidden="true">
        {SEGMENTS.map(({ status }) => (
          <span key={status}>
            <i className={status} />
            {t.statuses[status]}
          </span>
        ))}
      </div>
      <ul className="district-list">
        {rows.map(([district, stats]) => {
          const rate = stats.averageOccupancyRate;
          const isSelected = district === selected;
          return (
            <li key={district}>
              <button
                type="button"
                className={isSelected ? "district-row selected" : "district-row"}
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : district)}
              >
                <span className="district-name">{districtName(district, language)}</span>
                <span
                  className="district-bar"
                  title={SEGMENTS.map(
                    ({ status, count }) =>
                      `${t.statuses[status]} ${formatCount(count(stats))}`,
                  ).join(" · ")}
                >
                  {SEGMENTS.map(({ status, count }) => (
                    <span
                      key={status}
                      className={status}
                      style={{ flexGrow: count(stats) }}
                    />
                  ))}
                </span>
                <span className="district-rate">{formatRate(rate)}</span>
                <span className="district-shortage">
                  {t.shortageShort(formatCount(stats.shortageCount))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
