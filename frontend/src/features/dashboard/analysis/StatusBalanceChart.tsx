import { useMemo } from "react";
import { formatCount } from "../format";
import { districtName, messages, type Language } from "../i18n";
import { sortRows, type DistrictRow } from "./chartUtils";

// 가운데 구 이름을 두고 왼쪽에 부족, 오른쪽에 과잉 대여소 수를 그리는 나비형 막대
export function StatusBalanceChart({
  rows,
  language,
  onShowOnMap,
}: {
  rows: DistrictRow[];
  language: Language;
  onShowOnMap: (district: string) => void;
}) {
  const t = messages[language];
  const sorted = useMemo(() => sortRows(rows, "shortageCount", true), [rows]);
  const max = Math.max(
    1,
    ...sorted.flatMap(([, stats]) => [stats.shortageCount, stats.surplusCount]),
  );
  const width = (value: number) => `${(value / max) * 100}%`;

  return (
    <section className="card analysis-card" aria-label={t.balanceTitle}>
      <h2>{t.balanceTitle}</h2>
      <p className="analysis-note">{t.balanceNote}</p>
      <div className="balance-legend" aria-hidden="true">
        <span>
          <i className="shortage" />← {t.statuses.shortage}
        </span>
        <span>
          {t.statuses.surplus} →<i className="surplus" />
        </span>
      </div>
      <ul className="balance-chart">
        {sorted.map(([district, stats]) => (
          <li key={district}>
            <button
              type="button"
              onClick={() => onShowOnMap(district)}
              title={`${districtName(district, language)} · ${t.statuses.shortage} ${formatCount(stats.shortageCount)} · ${t.statuses.surplus} ${formatCount(stats.surplusCount)}`}
            >
              <span className="balance-side left">
                <b>{formatCount(stats.shortageCount)}</b>
                <span className="balance-track">
                  <span className="shortage" style={{ width: width(stats.shortageCount) }} />
                </span>
              </span>
              <span className="balance-name">{districtName(district, language)}</span>
              <span className="balance-side right">
                <span className="balance-track">
                  <span className="surplus" style={{ width: width(stats.surplusCount) }} />
                </span>
                <b>{formatCount(stats.surplusCount)}</b>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
