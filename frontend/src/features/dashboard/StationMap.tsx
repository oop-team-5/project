import { useEffect, useMemo, useState } from "react";
import { divIcon, type LatLngBoundsExpression } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { StationStatus, StationView } from "../../api/types";
import { formatCount, formatRate } from "./format";
import { districtName, messages, type Language } from "./i18n";

const SEOUL_BOUNDS: LatLngBoundsExpression = [
  [37.413, 126.734],
  [37.715, 127.269],
];
const PAN_LIMIT: LatLngBoundsExpression = [
  [37.38, 126.68],
  [37.75, 127.32],
];
const DETAILED_MARKER_ZOOM = 14;
const OVERVIEW_GRID_SIZE = 64;
const bike =
  '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="37" r="6"/><circle cx="38" cy="37" r="6"/><circle cx="33" cy="8" r="4" fill="currentColor" stroke="none"/><path d="m24 15-9 8 8 7v9M24 15l6 8h7"/></svg>';
const icons = Object.fromEntries(
  (["shortage", "normal", "surplus", "unknown"] as StationStatus[]).map(
    (status) => [
      status,
      divIcon({
        className: `bike-marker marker-${status}`,
        html: bike,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    ],
  ),
) as Record<StationStatus, ReturnType<typeof divIcon>>;
function LimitZoomToSeoul() {
  const map = useMap();
  useEffect(() => {
    map.setMinZoom(map.getBoundsZoom(SEOUL_BOUNDS));
  }, [map]);
  return null;
}
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
function StationMarkers({
  stations,
  language,
}: {
  stations: StationView[];
  language: Language;
}) {
  const t = messages[language];
  const map = useMap();
  const [view, setView] = useState(() => ({
    bounds: map.getBounds(),
    zoom: map.getZoom(),
  }));
  useMapEvents({
    moveend: () => setView({ bounds: map.getBounds(), zoom: map.getZoom() }),
  });

  const visibleStations = useMemo(() => {
    const cells = new Set<string>();
    return stations.filter((station) => {
      const position: [number, number] = [station.latitude, station.longitude];
      if (!view.bounds.contains(position)) return false;
      if (view.zoom >= DETAILED_MARKER_ZOOM) return true;

      // Global pixel cells keep the same representative while the map pans.
      const point = map.project(position, view.zoom);
      const cell = `${Math.floor(point.x / OVERVIEW_GRID_SIZE)}:${Math.floor(point.y / OVERVIEW_GRID_SIZE)}`;
      if (cells.has(cell)) return false;
      cells.add(cell);
      return true;
    });
  }, [map, stations, view]);
  const markers = useMemo(
    () =>
      visibleStations.map((station) => (
        <Marker
          key={station.stationId}
          position={[station.latitude, station.longitude]}
          icon={icons[station.status]}
          title={station.stationName}
        >
          <Popup>
            <div className="station-popup">
              <strong lang="ko">{station.stationName}</strong>
              <p>
                {districtName(station.district, language)} ·{" "}
                {formatCount(station.availableBikes)}
                {language === "ko" ? "대" : " bikes"} /{" "}
                {formatCount(station.totalRacks)}
                {language === "ko" ? "대" : " racks"}
              </p>
              <p>
                {t.occupancy} {formatRate(station.occupancyRate)} ·{" "}
                {t.statuses[station.status]}
              </p>
            </div>
          </Popup>
        </Marker>
      )),
    [visibleStations, language, t],
  );
  return (
    <>
      {markers}
      {view.zoom < DETAILED_MARKER_ZOOM && (
        <div className="map-zoom-hint" role="status">
          {t.mapHint}
        </div>
      )}
    </>
  );
}

export function StationMap({
  stations,
  language,
}: {
  stations: StationView[];
  language: Language;
}) {
  const t = messages[language];
  return (
    <section className="map-card" aria-label={t.map}>
      <MapContainer
        bounds={SEOUL_BOUNDS}
        maxBounds={PAN_LIMIT}
        maxBoundsViscosity={1}
        zoomControl={false}
        className="station-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LimitZoomToSeoul />
        <ResizeMap />
        <StationMarkers stations={stations} language={language} />
        <MapZoom language={language} />
      </MapContainer>
      <div className="map-todos" aria-label={t.mapTodos}>
        <strong>TODO</strong>
        <strong>TODO</strong>
      </div>
      <div className="map-legend">
        <span>
          <i className="dot shortage" />
          {t.legendShortage}
        </span>
        <span>
          <i className="dot normal" />
          {t.legendNormal}
        </span>
        <span>
          <i className="dot surplus" />
          {t.legendSurplus}
        </span>
        <span>
          <i className="dot unknown" />
          {t.legendUnknown}
        </span>
      </div>
      <div className="map-location">◎ &nbsp;{t.mapLocation}</div>
    </section>
  );
}
function MapZoom({ language }: { language: Language }) {
  const t = messages[language];
  const map = useMap();
  return (
    <div className="map-zoom leaflet-top leaflet-right">
      <button onClick={() => map.zoomIn()} aria-label={t.zoomIn}>
        +
      </button>
      <button onClick={() => map.zoomOut()} aria-label={t.zoomOut}>
        −
      </button>
    </div>
  );
}
