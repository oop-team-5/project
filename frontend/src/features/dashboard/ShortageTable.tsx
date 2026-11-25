import { useMemo } from "react";
import type { StationView } from "../../api/types";
import { formatCount, formatRate } from "./format";
import { districtName, messages, type Language } from "./i18n";
import { matchesDistrict, matchesSearch } from "./stationFilters";

export function ShortageTable({
  stations,
  shortageStationIds,
  query,
  district,
  language,
}: {
  stations: StationView[];
  shortageStationIds: string[];
  query: string;
  district: string | null;
  language: Language;
}) {
  const t = messages[language];

  // 서버가 정한 부족 순서(거치율 낮은 순)를 그대로 따르고, ID로 대여소 정보만 찾아 붙인다.
  const rows = useMemo(() => {
    const byId = new Map(stations.map((station) => [station.stationId, station]));
    return shortageStationIds.flatMap((id) => {
      const station = byId.get(id);
      return station &&
        matchesDistrict(station, district) &&
        matchesSearch(station, query)
        ? [station]
        : [];
    });
  }, [stations, shortageStationIds, query, district]);

  return (
    <section className="card shortage-card" aria-label={t.shortageStations}>
      <div className="shortage-heading">
        <h2>{t.shortageStations}</h2>
        <span className="shortage-count">{t.stationCount(formatCount(rows.length))}</span>
      </div>
      <p className="shortage-note">{t.shortageOrder}</p>
      {rows.length === 0 ? (
        <p className="shortage-empty">
          {query.trim() === "" && district === null
            ? t.noShortage
            : t.noShortageMatch}
        </p>
      ) : (
        <div className="shortage-table-wrap">
          <table className="shortage-table">
            <thead>
              <tr>
                <th scope="col" className="col-rank">#</th>
                <th scope="col">{t.tableStation}</th>
                <th scope="col">{t.tableDistrict}</th>
                <th scope="col" className="col-number">{t.tableBikes}</th>
                <th scope="col" className="col-number">{t.occupancy}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((station, index) => (
                <tr key={station.stationId}>
                  <td className="col-rank">{index + 1}</td>
                  <td className="col-name" lang="ko" title={station.stationName}>
                    {station.stationName}
                  </td>
                  <td>{districtName(station.district, language)}</td>
                  <td className="col-number">
                    {formatCount(station.availableBikes)} / {formatCount(station.totalRacks)}
                  </td>
                  <td className="col-number col-rate">{formatRate(station.occupancyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
