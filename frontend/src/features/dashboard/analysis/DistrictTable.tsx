import { useMemo, useState } from "react";
import { formatCount, formatRate } from "../format";
import { districtName, messages, type Language } from "../i18n";
import { sortRows, type DistrictRow, type NumericKey } from "./chartUtils";

type SortKey = NumericKey | "district";

const COLUMNS: SortKey[] = [
  "district",
  "stationCount",
  "availableBikes",
  "totalRacks",
  "averageOccupancyRate",
  "shortageCount",
  "normalCount",
  "surplusCount",
];

export function DistrictTable({
  rows,
  language,
  onShowOnMap,
}: {
  rows: DistrictRow[];
  language: Language;
  onShowOnMap: (district: string) => void;
}) {
  const t = messages[language];
  const [sortKey, setSortKey] = useState<SortKey>("averageOccupancyRate");
  const [descending, setDescending] = useState(true);
  const sorted = useMemo(
    () => sortRows(rows, sortKey, descending),
    [rows, sortKey, descending],
  );
  const label: Partial<Record<SortKey, string>> = {
    district: t.tableDistrict,
    stationCount: t.colStations,
    availableBikes: t.colBikes,
    totalRacks: t.colRacks,
    averageOccupancyRate: t.colAverage,
    shortageCount: t.statuses.shortage,
    normalCount: t.statuses.normal,
    surplusCount: t.statuses.surplus,
  };
  const sortBy = (key: SortKey) => {
    if (key === sortKey) {
      setDescending(!descending);
    } else {
      setSortKey(key);
      setDescending(key !== "district");
    }
  };

  return (
    <div className="analysis-table-wrap">
      <table className="analysis-table">
        <thead>
          <tr>
            {COLUMNS.map((key) => (
              <th
                key={key}
                scope="col"
                className={key === "district" ? undefined : "col-number"}
                aria-sort={
                  key === sortKey ? (descending ? "descending" : "ascending") : undefined
                }
              >
                <button type="button" onClick={() => sortBy(key)}>
                  {label[key]}
                  {key === sortKey ? (descending ? " ▼" : " ▲") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(([district, stats]) => (
            <tr key={district}>
              <th scope="row">
                <button
                  type="button"
                  className="analysis-district"
                  onClick={() => onShowOnMap(district)}
                  title={t.showOnMap}
                >
                  {districtName(district, language)}
                </button>
              </th>
              <td className="col-number">{formatCount(stats.stationCount)}</td>
              <td className="col-number">{formatCount(stats.availableBikes)}</td>
              <td className="col-number">{formatCount(stats.totalRacks)}</td>
              <td className="col-number col-strong">
                {formatRate(stats.averageOccupancyRate)}
              </td>
              <td className="col-number col-shortage">{formatCount(stats.shortageCount)}</td>
              <td className="col-number">{formatCount(stats.normalCount)}</td>
              <td className="col-number">{formatCount(stats.surplusCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
