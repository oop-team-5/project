import { useMemo } from "react";
import { formatCount } from "../format";
import { districtName, messages, type Language } from "../i18n";
import { sortRows, type DistrictRow } from "./chartUtils";

// 구마다 거치대 수(빈 원)와 자전거 수(채운 원)를 한 줄에 놓고 선으로 잇는다.
// 채운 원이 오른쪽에 있으면 거치대보다 자전거가 많다는 뜻이다.
export function CapacityChart({
  rows,
  language,
  onShowOnMap,
}: {
  rows: DistrictRow[];
  language: Language;
  onShowOnMap: (district: string) => void;
}) {
  const t = messages[language];
  const sorted = useMemo(() => sortRows(rows, "totalRacks", true), [rows]);
  const max = Math.max(
    1,
    ...sorted.flatMap(([, stats]) => [stats.totalRacks, stats.availableBikes]),
  );
  const position = (value: number) => (value / max) * 100;

  return (
    <section className="card analysis-card" aria-label={t.capacityTitle}>
      <h2>{t.capacityTitle}</h2>
      <p className="analysis-note">{t.capacityNote}</p>
      <div className="capacity-legend" aria-hidden="true">
        <span>
          <i className="capacity-bikes" />
          {t.colBikes}
        </span>
        <span>
          <i className="capacity-racks" />
          {t.colRacks}
        </span>
      </div>
      <ul className="capacity-chart">
        {sorted.map(([district, stats]) => {
          const bikes = position(stats.availableBikes);
          const racks = position(stats.totalRacks);
          return (
            <li key={district}>
              <button
                type="button"
                onClick={() => onShowOnMap(district)}
                title={`${districtName(district, language)} · ${t.colBikes} ${formatCount(stats.availableBikes)} · ${t.colRacks} ${formatCount(stats.totalRacks)}`}
              >
                <span className="capacity-name">{districtName(district, language)}</span>
                <span className="capacity-track">
                  <span
                    className="capacity-link"
                    style={{
                      left: `${Math.min(bikes, racks)}%`,
                      width: `${Math.abs(bikes - racks)}%`,
                    }}
                  />
                  <i className="capacity-racks" style={{ left: `${racks}%` }} />
                  <i className="capacity-bikes" style={{ left: `${bikes}%` }} />
                </span>
                <span className="capacity-values">
                  {formatCount(stats.availableBikes)} / {formatCount(stats.totalRacks)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
