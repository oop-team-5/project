// 개발용 예시 데이터. 개발 서버에서 주소에 ?mock을 붙였을 때만 사용한다.
// 화면 확인용 가짜 값이며 실제 데이터나 백엔드 판정 규칙과는 관계없다.
import type {
  DashboardSnapshot,
  StationStats,
  StationStatus,
  StationView,
} from "../../../api/types";

const DISTRICT_CENTERS: ReadonlyArray<readonly [string, number, number]> = [
  ["강남구", 37.5172, 127.0473], ["강동구", 37.5301, 127.1238], ["강북구", 37.6396, 127.0257],
  ["강서구", 37.5509, 126.8495], ["관악구", 37.4784, 126.9516], ["광진구", 37.5385, 127.0823],
  ["구로구", 37.4954, 126.8874], ["금천구", 37.4569, 126.8955], ["노원구", 37.6542, 127.0568],
  ["도봉구", 37.6688, 127.0471], ["동대문구", 37.5744, 127.0396], ["동작구", 37.5124, 126.9393],
  ["마포구", 37.5663, 126.9019], ["서대문구", 37.5791, 126.9368], ["서초구", 37.4837, 127.0324],
  ["성동구", 37.5633, 127.0371], ["성북구", 37.5894, 127.0167], ["송파구", 37.5145, 127.1059],
  ["양천구", 37.5169, 126.8664], ["영등포구", 37.5264, 126.8962], ["용산구", 37.5326, 126.9905],
  ["은평구", 37.6027, 126.9291], ["종로구", 37.5735, 126.979], ["중구", 37.5641, 126.9979],
  ["중랑구", 37.6066, 127.0927],
];

const RACK_SIZES = [5, 8, 10, 12, 15, 20] as const;

// 매번 같은 예시가 나오도록 시드를 고정한 난수
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pickStatus(random: () => number): StationStatus {
  const roll = random();
  if (roll < 0.22) return "shortage";
  if (roll < 0.8) return "normal";
  if (roll < 0.93) return "surplus";
  return "unknown";
}

function pickBikes(random: () => number, status: StationStatus, racks: number): number {
  switch (status) {
    case "shortage":
      return pickInt(random, 0, Math.floor(racks * 0.19));
    case "normal":
      return pickInt(random, Math.ceil(racks * 0.2), racks);
    case "surplus":
      return pickInt(random, racks + 1, racks * 2);
    case "unknown":
      return 0;
  }
}

function createStation(
  random: () => number,
  index: number,
  district: string | null,
  center: readonly [number, number],
): StationView {
  const status = pickStatus(random);
  const totalRacks = status === "unknown" ? 0 : (RACK_SIZES[pickInt(random, 0, 5)] ?? 10);
  const availableBikes = pickBikes(random, status, totalRacks);
  const id = String(index).padStart(4, "0");

  return {
    stationId: `ST-${id}`,
    stationName: `${district ?? "미분류"} 예시 대여소 ${id}`,
    totalRacks,
    availableBikes,
    latitude: center[0] + (random() - 0.5) * 0.03,
    longitude: center[1] + (random() - 0.5) * 0.035,
    district,
    occupancyRate: totalRacks === 0 ? null : (availableBikes / totalRacks) * 100,
    status,
  };
}

function summarize(stations: readonly StationView[]): StationStats {
  const rates = stations.flatMap((s) => (s.occupancyRate === null ? [] : [s.occupancyRate]));
  const countStatus = (status: StationStatus) => stations.filter((s) => s.status === status).length;

  return {
    stationCount: stations.length,
    totalRacks: stations.reduce((sum, s) => sum + s.totalRacks, 0),
    availableBikes: stations.reduce((sum, s) => sum + s.availableBikes, 0),
    averageOccupancyRate: rates.length === 0 ? null : rates.reduce((a, b) => a + b, 0) / rates.length,
    shortageCount: countStatus("shortage"),
    normalCount: countStatus("normal"),
    surplusCount: countStatus("surplus"),
    unknownCount: countStatus("unknown"),
  };
}

export function createMockSnapshot(): DashboardSnapshot {
  const random = createRandom(20261027);
  const stations: StationView[] = [];
  let index = 1;

  for (const [district, lat, lng] of DISTRICT_CENTERS) {
    const count = pickInt(random, 6, 16);
    for (let i = 0; i < count; i += 1) {
      stations.push(createStation(random, index++, district, [lat, lng]));
    }
  }
  for (let i = 0; i < 3; i += 1) {
    stations.push(createStation(random, index++, null, [37.55, 126.99]));
  }

  const districtStats: Record<string, StationStats> = {};
  for (const [district] of DISTRICT_CENTERS) {
    districtStats[district] = summarize(stations.filter((s) => s.district === district));
  }

  const shortageStationIds = stations
    .filter((s) => s.status === "shortage")
    .sort((a, b) => (a.occupancyRate ?? 0) - (b.occupancyRate ?? 0) || a.stationId.localeCompare(b.stationId))
    .map((s) => s.stationId);

  return {
    fetchedAt: new Date().toISOString(),
    summary: summarize(stations),
    districtStats,
    stations,
    shortageStationIds,
  };
}

export function loadMockSnapshot(signal: AbortSignal): Promise<DashboardSnapshot> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(createMockSnapshot()), 500);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("요청이 취소되었습니다.", "AbortError"));
    });
  });
}
