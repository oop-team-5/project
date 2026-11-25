import { useMemo } from "react";
import type { StationStats } from "../../api/types";
import { CapacityChart } from "./analysis/CapacityChart";
import { sortRows, toRows } from "./analysis/chartUtils";
import { DistrictHeatmap } from "./analysis/DistrictHeatmap";
import { DistrictTable } from "./analysis/DistrictTable";
import { ShortageLineChart } from "./analysis/ShortageLineChart";
import { StatusBalanceChart } from "./analysis/StatusBalanceChart";
import { formatCount, formatRate } from "./format";
import { districtName, messages, type Language } from "./i18n";

// 자치구 분석 화면. 모든 숫자는 서버가 계산한 districtStats와 summary를 그대로 쓴다.
export function DistrictAnalysis({
  districtStats,
  summary,
  language,
  onShowOnMap,
}: {
  districtStats: Record<string, StationStats>;
  summary: StationStats;
  language: Language;
  onShowOnMap: (district: string) => void;
}) {
  const t = messages[language];
  const rows = useMemo(() => toRows(districtStats), [districtStats]);
  const byRate = sortRows(rows, "averageOccupancyRate", true).filter(
    ([, stats]) => stats.averageOccupancyRate !== null,
  );
  const highest = byRate[0];
  const lowest = byRate[byRate.length - 1];
  const mostShortage = sortRows(rows, "shortageCount", true)[0];

  return (
    <main className="analysis">
      <div className="analysis-highlights">
        {highest && (
          <section className="card highlight">
            <span>{t.highestRate}</span>
            <strong>{districtName(highest[0], language)}</strong>
            <b>{formatRate(highest[1].averageOccupancyRate)}</b>
          </section>
        )}
        {lowest && (
          <section className="card highlight">
            <span>{t.lowestRate}</span>
            <strong>{districtName(lowest[0], language)}</strong>
            <b>{formatRate(lowest[1].averageOccupancyRate)}</b>
          </section>
        )}
        {mostShortage && (
          <section className="card highlight shortage-highlight">
            <span>{t.mostShortage}</span>
            <strong>{districtName(mostShortage[0], language)}</strong>
            <b>{t.stationCount(formatCount(mostShortage[1].shortageCount))}</b>
          </section>
        )}
        <section className="card highlight">
          <span>{t.seoulAverage}</span>
          <strong>{t.allDistricts}</strong>
          <b>{formatRate(summary.averageOccupancyRate)}</b>
        </section>
      </div>

      <div className="analysis-charts">
        <DistrictHeatmap
          districtStats={districtStats}
          language={language}
          onShowOnMap={onShowOnMap}
        />
        <ShortageLineChart rows={rows} language={language} onShowOnMap={onShowOnMap} />
      </div>

      <div className="analysis-section-heading">
        <h2>{t.districtTable}</h2>
        <p>{t.districtTableNote}</p>
      </div>
      <div className="analysis-charts">
        <StatusBalanceChart rows={rows} language={language} onShowOnMap={onShowOnMap} />
        <CapacityChart rows={rows} language={language} onShowOnMap={onShowOnMap} />
      </div>
      <details className="card analysis-card analysis-details">
        <summary>{t.showTable}</summary>
        <DistrictTable rows={rows} language={language} onShowOnMap={onShowOnMap} />
      </details>
    </main>
  );
}
