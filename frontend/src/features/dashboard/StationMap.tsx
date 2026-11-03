import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { StationStatus, StationView } from "../../api/types";
import { formatCount, formatRate } from "./format";
import { STATUS_LABELS, STATUS_ORDER } from "./statusMeta";

interface StationMapProps {
  stations: StationView[];
}

// 서울시 경계를 감싸는 사각형과, 화면을 움직일 수 있는 범위(조금 여유를 둠)
const SEOUL_BOUNDS: LatLngBoundsExpression = [
  [37.413, 126.734],
  [37.715, 127.269],
];
const PAN_LIMIT: LatLngBoundsExpression = [
  [37.38, 126.68],
  [37.75, 127.32],
];

// 서울 전체가 보이는 배율보다 더 축소되지 않게 한다.
function LimitZoomToSeoul() {
  const map = useMap();
  useEffect(() => {
    map.setMinZoom(map.getBoundsZoom(SEOUL_BOUNDS));
  }, [map]);
  return null;
}

// 범례와 같은 색을 쓰도록 base.css의 상태 색 변수를 읽는다.
function readStatusColors(): Record<StationStatus, string> {
  const style = getComputedStyle(document.documentElement);
  const colors = {} as Record<StationStatus, string>;
  for (const status of STATUS_ORDER) {
    colors[status] = style.getPropertyValue(`--status-${status}`).trim();
  }
  return colors;
}

export function StationMap({ stations }: StationMapProps) {
  const colors = useMemo(readStatusColors, []);

  const markers = useMemo(
    () =>
      stations.map((station) => (
        <CircleMarker
          key={station.stationId}
          center={[station.latitude, station.longitude]}
          radius={6}
          pathOptions={{
            color: "#ffffff",
            weight: 1.5,
            fillColor: colors[station.status],
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <div className="station-popup">
              <strong>{station.stationName}</strong>
              <dl>
                <dt>자치구</dt>
                <dd>{station.district ?? "미분류"}</dd>
                <dt>자전거</dt>
                <dd>
                  {formatCount(station.availableBikes)}대 / 거치대{" "}
                  {formatCount(station.totalRacks)}개
                </dd>
                <dt>거치율</dt>
                <dd>{formatRate(station.occupancyRate)}</dd>
                <dt>상태</dt>
                <dd>{STATUS_LABELS[station.status]}</dd>
              </dl>
            </div>
          </Popup>
        </CircleMarker>
      )),
    [stations, colors],
  );

  return (
    <section className="card map-card" aria-label="대여소 지도">
      <div className="map-card-header">
        <h2>대여소 지도</h2>
        <ul className="status-legend">
          {STATUS_ORDER.map((status) => (
            <li key={status}>
              <span className={`legend-dot status-${status}`} aria-hidden="true" />
              {STATUS_LABELS[status]}
            </li>
          ))}
        </ul>
      </div>
      <MapContainer
        bounds={SEOUL_BOUNDS}
        maxBounds={PAN_LIMIT}
        maxBoundsViscosity={1}
        preferCanvas
        className="station-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LimitZoomToSeoul />
        {markers}
      </MapContainer>
    </section>
  );
}
