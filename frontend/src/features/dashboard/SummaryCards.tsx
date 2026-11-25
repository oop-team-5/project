import { messages, type Language } from "./i18n";
import type { StationStats } from "../../api/types";
import { formatCount, formatFetchedAt } from "./format";
import { ArrowIcon, InfoIcon } from "./Icons";

export function SummaryCards({
  language,
  summary,
  fetchedAt,
  onRefresh,
  onShowAnalysis,
  isLoading,
}: {
  language: Language;
  summary: StationStats;
  fetchedAt: string;
  onRefresh: () => void;
  onShowAnalysis: () => void;
  isLoading: boolean;
}) {
  const t = messages[language];
  const rate = summary.averageOccupancyRate;
  const gauge = Math.max(0, Math.min(100, rate ?? 0));
  return (
    <section className="card overview" aria-label={t.title}>
      <div className="section-heading">
        <div>
          <h1>{t.title}</h1>
          <p>{t.timestamp(formatFetchedAt(fetchedAt, language))}</p>
        </div>
        <button
          className="refresh"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label={t.refresh}
          title={t.refresh}
        >
          ↗
        </button>
      </div>
      <div className="gauge">
        <svg viewBox="0 0 240 135" aria-hidden="true">
          <path
            d="M 16 120 A 104 104 0 0 1 224 120"
            pathLength="100"
            className="gauge-track"
          />
          <path
            d="M 16 120 A 104 104 0 0 1 224 120"
            pathLength="100"
            className="gauge-value"
            strokeDasharray={`${gauge} 100`}
          />
        </svg>
        <div className="gauge-label">
          <strong>
            {rate === null ? "-" : Math.round(rate)}
            <small>%</small>
          </strong>
          <span>{t.averageRate}</span>
        </div>
      </div>
      <p className="overview-meta">
        {t.stationTotal(formatCount(summary.stationCount))}
        <span aria-hidden="true"> · </span>
        {t.rackTotal(formatCount(summary.totalRacks))}
      </p>
      <div className="overview-stats">
        <div>
          <strong>
            {formatCount(summary.availableBikes)}
            <small>{t.bikeUnit}</small>
          </strong>
          <span>{t.available}</span>
        </div>
        <div className="shortage-text">
          <strong>
            {formatCount(summary.shortageCount)}
            <small>{t.stationUnit}</small>
          </strong>
          <span>{t.shortage}</span>
          <small>{t.shortageRule}</small>
        </div>
        <div className="surplus-text">
          <strong>
            {formatCount(summary.surplusCount)}
            <small>{t.stationUnit}</small>
          </strong>
          <span>{t.surplus}</span>
          <small>{t.surplusRule}</small>
        </div>
      </div>
      <button className="overview-action" type="button" onClick={onShowAnalysis}>
        <strong>{t.viewDistricts}</strong>
        <ArrowIcon />
      </button>
      <div className="criteria">
        <InfoIcon />
        <span>{t.criteria}</span>
        <span>
          {t.below} <b>{t.statuses.shortage}</b>
        </span>
        <span>{t.normalRule}</span>
        <span>{t.aboveRule}</span>
      </div>
    </section>
  );
}
