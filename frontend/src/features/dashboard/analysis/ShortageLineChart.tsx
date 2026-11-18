import { useMemo, useState } from "react";
import { formatCount } from "../format";
import { districtName, messages, type Language } from "../i18n";
import { niceMax, sortRows, ticks, type DistrictRow } from "./chartUtils";

const W = 620;
const H = 400;
const M = { top: 30, right: 16, bottom: 86, left: 44 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

export function ShortageLineChart({
  rows,
  language,
  onShowOnMap,
}: {
  rows: DistrictRow[];
  language: Language;
  onShowOnMap: (district: string) => void;
}) {
  const t = messages[language];
  const [hovered, setHovered] = useState<number | null>(null);
  const sorted = useMemo(() => sortRows(rows, "shortageCount", true), [rows]);
  const max = niceMax(Math.max(1, ...sorted.map(([, s]) => s.shortageCount)));
  const band = PLOT_W / Math.max(sorted.length, 1);
  const x = (index: number) => M.left + band * (index + 0.5);
  const y = (value: number) => M.top + PLOT_H - (value / max) * PLOT_H;
  const points = sorted.map(([, stats], index) => [x(index), y(stats.shortageCount)] as const);
  const line = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");
  const area =
    points.length > 0
      ? `${line} L${x(points.length - 1)},${M.top + PLOT_H} L${x(0)},${M.top + PLOT_H} Z`
      : "";
  const active = hovered === null ? undefined : sorted[hovered];

  return (
    <section className="card analysis-card" aria-label={t.shortageLine}>
      <h2>{t.shortageLine}</h2>
      <p className="analysis-note">{t.shortageLineNote}</p>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t.shortageLine}
        onMouseLeave={() => setHovered(null)}
      >
        {ticks(max).map((value) => (
          <g key={value} className="chart-grid">
            <line x1={M.left} x2={W - M.right} y1={y(value)} y2={y(value)} />
            <text x={M.left - 10} y={y(value)} textAnchor="end" dominantBaseline="middle">
              {formatCount(value)}
            </text>
          </g>
        ))}
        <path className="line-area" d={area} />
        <path className="line-path" d={line} />
        {sorted.map(([district, stats], index) => (
          <g key={district}>
            <text
              className="chart-axis"
              x={x(index)}
              y={M.top + PLOT_H + 14}
              textAnchor="end"
              transform={`rotate(-45 ${x(index)} ${M.top + PLOT_H + 14})`}
            >
              {districtName(district, language)}
            </text>
            <circle
              className={hovered === index ? "line-point active" : "line-point"}
              cx={x(index)}
              cy={y(stats.shortageCount)}
              r={hovered === index ? 7 : 5}
            />
            <rect
              className="chart-hit"
              x={x(index) - band / 2}
              y={M.top}
              width={band}
              height={PLOT_H}
              onMouseEnter={() => setHovered(index)}
              onClick={() => onShowOnMap(district)}
            >
              <title>{`${districtName(district, language)} · ${t.statuses.shortage} ${formatCount(stats.shortageCount)}`}</title>
            </rect>
          </g>
        ))}
        {sorted[0] && hovered === null && (
          <text className="chart-label" x={x(0) + 10} y={y(sorted[0][1].shortageCount) - 10}>
            {formatCount(sorted[0][1].shortageCount)}
          </text>
        )}
        {active && hovered !== null && (
          <g
            className="chart-tooltip"
            transform={`translate(${Math.min(x(hovered) + 12, W - M.right - 150)},${Math.max(y(active[1].shortageCount) - 58, 4)})`}
          >
            <rect width="150" height="50" rx="10" />
            <text x="12" y="20">{districtName(active[0], language)}</text>
            <text x="12" y="40" className="tooltip-value">
              {t.statuses.shortage} {formatCount(active[1].shortageCount)}
            </text>
          </g>
        )}
      </svg>
    </section>
  );
}
