import { useEffect, useState } from "react";
import { ApiError, refreshDashboard } from "../../api/client";
import { formatFetchedAt } from "./format";
import { initialLanguage, LANGUAGE_KEY, messages } from "./i18n";
import { BikeIcon } from "./Icons";
import { StationMap } from "./StationMap";
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
          <span className="nav-active">{t.overviewNav}</span>
          <span>{t.districtNav}</span>
          <span>{t.stationsNav}</span>
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
      {snapshot ? (
        <main className="content">
          <div className="left-column">
            <SummaryCards
              language={language}
              summary={snapshot.summary}
              fetchedAt={snapshot.fetchedAt}
              onRefresh={refresh}
              isLoading={isLoading}
            />
            <section className="card district-card">
              <h2>{t.districtComparison}</h2>
              <strong className="todo">TODO</strong>
            </section>
          </div>
          <div className="right-column">
            <StationMap stations={snapshot.stations} language={language} />
            <section className="card shortage-card">
              <h2>{t.shortageStations}</h2>
              <strong className="todo">TODO</strong>
            </section>
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
