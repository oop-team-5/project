import type { LatLngBoundsExpression, Layer, PathOptions } from "leaflet";
import { GeoJSON, MapContainer } from "react-leaflet";
import type { Feature } from "geojson";
import "leaflet/dist/leaflet.css";
import type { StationStats } from "../../../api/types";
import { formatRate } from "../format";
import { districtName, messages, type Language } from "../i18n";
import { SEOUL_DISTRICT_SHAPES } from "./seoulDistrictShapes";

const SEOUL_BOUNDS: LatLngBoundsExpression = [
  [37.413, 126.764],
  [37.715, 127.184],
];
// 평균 거치율 구간과 색. 노란색 한 가지의 진하기 단계로,
// 연할수록 부족 쪽(낮음), 진할수록 과잉 쪽(높음)이다.
// 구간 경계는 고정이라 날마다 같은 색이 같은 범위를 뜻한다. 100%는 75~100% 칸에 넣는다.
const BINS = [
  { below: 50, color: "#faf5dc", label: "0–50%" },
  { below: 75, color: "#f2e5a8", label: "50–75%" },
  { upTo: 100, color: "#e9d176", label: "75–100%" },
  { upTo: 120, color: "#d8b347", label: "100–120%" },
  { upTo: 140, color: "#b8902a", label: "120–140%" },
  { color: "#8c6a14", label: "140%+" },
] as const;
const NO_DATA = "#3a3b38";

function colorOf(rate: number | null): string {
  if (rate === null) return NO_DATA;
  const bin = BINS.find((b) =>
    "below" in b ? rate < b.below : "upTo" in b ? rate <= b.upTo : true,
  );
  return bin?.color ?? NO_DATA;
}

// 경계 데이터의 구 이름 (서버 자치구 이름과 같다)
const nameOf = (feature?: Feature): string => String(feature?.properties?.name ?? "");

export function DistrictHeatmap({
  districtStats,
  language,
  onShowOnMap,
}: {
  districtStats: Record<string, StationStats>;
  language: Language;
  onShowOnMap: (district: string) => void;
}) {
  const t = messages[language];

  const rateOf = (name: string) => districtStats[name]?.averageOccupancyRate ?? null;
  const styleOf = (feature?: Feature): PathOptions => ({
    color: "#1d1f1e",
    weight: 1.5,
    fillColor: colorOf(rateOf(nameOf(feature))),
    fillOpacity: 1,
  });
  const bindDistrict = (feature: Feature, layer: Layer) => {
    const name = nameOf(feature);
    layer.bindTooltip(
      `<b>${districtName(name, language)}</b><span>${formatRate(rateOf(name))}</span>`,
      { permanent: true, direction: "center", className: "district-label" },
    );
    layer.on({
      click: () => onShowOnMap(name),
      mouseover: (event) => event.target.setStyle({ color: "#f5f5f0", weight: 3 }),
      mouseout: (event) => event.target.setStyle({ color: "#1d1f1e", weight: 1.5 }),
    });
  };
  // 새로고침이나 언어 전환 때 라벨을 새로 붙이도록 다시 그린다.
  const layerKey = `${language}:${Object.values(districtStats)
    .map((stats) => stats.averageOccupancyRate ?? "-")
    .join(",")}`;

  return (
    <section className="card analysis-card" aria-label={t.rateHeatmap}>
      <h2>{t.rateHeatmap}</h2>
      <p className="analysis-note">{t.rateHeatmapNote}</p>
      <MapContainer
        bounds={SEOUL_BOUNDS}
        maxBounds={SEOUL_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        attributionControl={false}
        className="district-heatmap"
      >
        <GeoJSON
          key={layerKey}
          data={SEOUL_DISTRICT_SHAPES}
          style={styleOf}
          onEachFeature={bindDistrict}
        />
      </MapContainer>
      <ul className="heatmap-legend">
        {BINS.map((bin) => (
          <li key={bin.label}>
            <i style={{ background: bin.color }} />
            {bin.label}
          </li>
        ))}
        <li>
          <i style={{ background: NO_DATA }} />
          {t.noData}
        </li>
      </ul>
      <p className="analysis-source">{t.boundarySource}</p>
    </section>
  );
}
