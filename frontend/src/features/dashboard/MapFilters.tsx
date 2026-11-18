import { formatCount } from "./format";
import { messages, type Language } from "./i18n";
import { SearchIcon } from "./Icons";
import type { StatusFilter } from "./stationFilters";

const STATUS_OPTIONS: StatusFilter[] = ["all", "shortage", "normal", "surplus"];

export function MapFilters({
  language,
  query,
  status,
  resultCount,
  isFiltering,
  onQueryChange,
  onStatusChange,
}: {
  language: Language;
  query: string;
  status: StatusFilter;
  resultCount: number;
  isFiltering: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: StatusFilter) => void;
}) {
  const t = messages[language];
  return (
    <div className="map-filters">
      <label className="map-search">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
        />
      </label>
      <select
        className="map-status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
        aria-label={t.statusFilterLabel}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? t.allStatuses : t.statuses[option]}
          </option>
        ))}
      </select>
      {isFiltering && (
        <p className="map-filter-result" role="status">
          {resultCount === 0 ? t.noMatch : t.matchCount(formatCount(resultCount))}
        </p>
      )}
    </div>
  );
}
