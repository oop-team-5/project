import { useEffect, useMemo, useState } from "react";
import { ApiError, refreshDashboard } from "../../api/client";
import { formatFetchedAt } from "./format";
import { initialLanguage, LANGUAGE_KEY, messages } from "./i18n";
import { DistrictAnalysis } from "./DistrictAnalysis";
import { DistrictComparison } from "./DistrictComparison";
import { BikeIcon } from "./Icons";
import { MapFilters } from "./MapFilters";
import { ShortageTable } from "./ShortageTable";
import { StationMap } from "./StationMap";
import {
  filterStations,
  isFilterActive,
  type StatusFilter,
} from "./stationFilters";
import { SummaryCards } from "./SummaryCards";
import {
  useDashboardSnapshot,
  type SnapshotLoader,
} from "./useDashboardSnapshot";

const isMockMode =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has("mock");
const loadSnapshot: SnapshotLoader = isMockMode
  ? async (signal) =>
      (await import("./mock/mockSnapshot")).loadMockSnapshot(signal)
  : refreshDashboard;

export function DashboardPage() {
  const [language, setLanguage] = useState(initialLanguage);
  const t = messages[language];
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.documentTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t.description);
  }, [language, t]);
  const toggleLanguage = () => {
    const next = language === "ko" ? "en" : "ko";
    setLanguage(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      /* Storage may be unavailable. */
    }
  };
  const { snapshot, isLoading, error, refresh } =
    useDashboardSnapshot(loadSnapshot);
  // 검색, 상태, 자치구 선택은 지도와 표에만 적용하고, 요약과 통계 숫자에는 적용하지 않는다.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [district, setDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "districts">("overview");
  const showAnalysis = () => {
    setView("districts");
    window.scrollTo({ top: 0 });
  };
  const showDistrictOnMap = (name: string) => {
    setDistrict(name);
    setView("overview");
    window.scrollTo({ top: 0 });
  };
  const filters = useMemo(
    () => ({ query, status: statusFilter, district }),
    [query, statusFilter, district],
  );
  const mapStations = useMemo(
    () => filterStations(snapshot?.stations ?? [], filters),
    [snapshot, filters],
  );
  const isFiltering = isFilterActive(filters);
  const errorMessage =
    error instanceof ApiError
      ? language === "ko"
        ? error.message
        : error.code === "DATA_SOURCE_ERROR"
          ? t.sourceError
          : error.code === "NOT_IMPLEMENTED"
            ? t.notImplemented
            : t.genericError
      : error
        ? t.networkError
        : null;
  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <BikeIcon />
          <span>Seoul Cycle.</span>
        </div>
        <nav aria-label={t.navigation}>
          <button
            type="button"
            className={view === "overview" ? "nav-active" : undefined}
            aria-current={view === "overview" ? "page" : undefined}
            onClick={() => setView("overview")}
          >
            {t.overviewNav}
          </button>
          <button
            type="button"
            className={view === "districts" ? "nav-active" : undefined}
            aria-current={view === "districts" ? "page" : undefined}
            onClick={() => setView("districts")}
          >
            {t.districtNav}
          </button>
        </nav>
        <div className="topbar-actions">
          {isMockMode && <span>{t.sample}</span>}
          {snapshot && (
            <span>
              {t.timestamp(formatFetchedAt(snapshot.fetchedAt, language))}
            </span>
          )}
          <button
            className="language-toggle"
            type="button"
            onClick={toggleLanguage}
            aria-label={
              language === "ko" ? "Switch to English" : "한국어로 전환"
            }
            title={language === "ko" ? "Switch to English" : "한국어로 전환"}
          >
            {language === "ko" ? "EN" : "한"}
          </button>
          <button
            className="refresh-header"
            onClick={refresh}
            disabled={isLoading}
            aria-label={t.refresh}
            title={t.refresh}
          >
            ↻
          </button>
        </div>
      </header>
      {errorMessage && (
        <p className="notice" role="alert">
          {errorMessage}
          {snapshot && t.lastData}
        </p>
      )}
      {snapshot && view === "districts" ? (
        <DistrictAnalysis
          districtStats={snapshot.districtStats}
          summary={snapshot.summary}
          language={language}
          onShowOnMap={showDistrictOnMap}
        />
      ) : snapshot ? (
        <main className="content">
          <div className="left-column">
            <SummaryCards
              language={language}
              summary={snapshot.summary}
              fetchedAt={snapshot.fetchedAt}
              onRefresh={refresh}
              onShowAnalysis={showAnalysis}
              isLoading={isLoading}
            />
            <DistrictComparison
              districtStats={snapshot.districtStats}
              selected={district}
              onSelect={setDistrict}
              language={language}
            />
          </div>
          <div className="right-column">
            <StationMap
              stations={mapStations}
              language={language}
              focusOnStations={isFiltering}
              controls={
                <MapFilters
                  language={language}
                  query={query}
                  status={statusFilter}
                  resultCount={mapStations.length}
                  isFiltering={isFiltering}
                  onQueryChange={setQuery}
                  onStatusChange={setStatusFilter}
                />
              }
            />
            <ShortageTable
              stations={snapshot.stations}
              shortageStationIds={snapshot.shortageStationIds}
              query={query}
              district={district}
              language={language}
            />
          </div>
        </main>
      ) : (
        <main className="card empty-state" aria-live="polite">
          {isLoading ? t.loading : t.empty}
        </main>
      )}
    </div>
  );
}
