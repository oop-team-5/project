"""DashboardController 테스트. 다른 클래스는 정해진 값만 돌려주는 가짜 객체로 대신한다.

실행(저장소 루트): python -m unittest discover -s backend/tests -v
"""

import unittest
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, timedelta

from seoul_cycle.contracts.errors import DataSourceError
from seoul_cycle.contracts.types import StationStats, StationStatus
from seoul_cycle.domain.bike_station import BikeStation
from seoul_cycle.presentation.dashboard_controller import DashboardController


@dataclass(kw_only=True)
class StubStation(BikeStation):
    presetRate: float | None
    presetStatus: StationStatus

    def getOccupancyRate(self) -> float | None:
        return self.presetRate

    def getStatus(self) -> StationStatus:
        return self.presetStatus


def makeStation(
    stationId: str, *, rate: float | None, status: StationStatus
) -> StubStation:
    return StubStation(
        stationId=stationId,
        stationName=f"대여소 {stationId}",
        totalRacks=10,
        availableBikes=3,
        latitude=37.5,
        longitude=127.0,
        district="강남구",
        presetRate=rate,
        presetStatus=status,
    )


SUMMARY = StationStats(
    stationCount=3,
    totalRacks=30,
    availableBikes=9,
    averageOccupancyRate=42.0,
    shortageCount=1,
    normalCount=1,
    surplusCount=0,
    unknownCount=1,
)
DISTRICT_STATS = {"강남구": SUMMARY}


class FakeSource:
    def __init__(self, stations: list[BikeStation]) -> None:
        self.stations = stations
        self.error: Exception | None = None
        self.callCount = 0

    def fetchStations(self) -> list[BikeStation]:
        self.callCount += 1
        if self.error is not None:
            raise self.error
        return list(self.stations)


class FakeStore:
    def __init__(self) -> None:
        self.stations: list[BikeStation] = []
        self.replaceCalls: list[list[BikeStation]] = []
        self.error: Exception | None = None

    def addStation(self, station: BikeStation) -> None:
        self.stations.append(station)

    def replaceAll(self, stations: Sequence[BikeStation]) -> None:
        if self.error is not None:
            raise self.error
        self.replaceCalls.append(list(stations))
        self.stations = list(stations)

    def getStationsByDistrict(self, district: str) -> list[BikeStation]:
        return []

    def getAllStations(self) -> list[BikeStation]:
        return list(self.stations)


class FakeAnalytics:
    def __init__(self, shortage: list[BikeStation]) -> None:
        self.shortage = shortage

    def calculateDistrictStats(self) -> dict[str, StationStats]:
        return DISTRICT_STATS

    def getShortageStations(self) -> list[BikeStation]:
        return list(self.shortage)

    def calculateSummary(self) -> StationStats:
        return SUMMARY


class DashboardControllerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.normal = makeStation("ST-2", rate=50.0, status="normal")
        self.unknown = makeStation("ST-9", rate=None, status="unknown")
        self.shortageA = makeStation("ST-5", rate=10.0, status="shortage")
        self.shortageB = makeStation("ST-1", rate=5.0, status="shortage")

        self.source = FakeSource([self.normal, self.unknown, self.shortageA, self.shortageB])
        self.store = FakeStore()
        self.analytics = FakeAnalytics([self.shortageB, self.shortageA])
        self.controller = DashboardController(self.source, self.analytics, self.store)

    def test_getDashboard_before_refresh_raises(self) -> None:
        with self.assertRaises(RuntimeError):
            self.controller.getDashboard()

    def test_refresh_replaces_repository_with_fetched_stations(self) -> None:
        self.controller.refreshData()

        self.assertEqual(len(self.store.replaceCalls), 1)
        self.assertEqual(
            [s.stationId for s in self.store.replaceCalls[0]],
            ["ST-2", "ST-9", "ST-5", "ST-1"],
        )

    def test_fetchedAt_is_timezone_aware_utc(self) -> None:
        self.controller.refreshData()

        fetchedAt = self.controller.getDashboard().fetchedAt
        self.assertIs(fetchedAt.tzinfo, UTC)
        self.assertEqual(fetchedAt.utcoffset(), timedelta(0))

    def test_fetch_failure_propagates_and_keeps_state(self) -> None:
        self.source.error = DataSourceError("페이지 수집 실패")

        with self.assertRaises(DataSourceError):
            self.controller.refreshData()
        self.assertEqual(self.store.replaceCalls, [])
        with self.assertRaises(RuntimeError):
            self.controller.getDashboard()

    def test_replace_failure_propagates_without_recording_time(self) -> None:
        self.store.error = ValueError("저장소가 거부한 입력")

        with self.assertRaises(ValueError):
            self.controller.refreshData()
        with self.assertRaises(RuntimeError):
            self.controller.getDashboard()

    def test_failed_second_refresh_keeps_previous_snapshot(self) -> None:
        self.controller.refreshData()
        firstFetchedAt = self.controller.getDashboard().fetchedAt

        self.source.error = DataSourceError("일시 장애")
        with self.assertRaises(DataSourceError):
            self.controller.refreshData()

        snapshot = self.controller.getDashboard()
        self.assertEqual(snapshot.fetchedAt, firstFetchedAt)
        self.assertEqual(len(snapshot.stations), 4)

    def test_getDashboard_passes_analyzer_results_through(self) -> None:
        self.controller.refreshData()

        snapshot = self.controller.getDashboard()

        self.assertEqual(snapshot.summary, SUMMARY)
        self.assertEqual(snapshot.districtStats, DISTRICT_STATS)
        self.assertEqual(snapshot.shortageStationIds, ["ST-1", "ST-5"])

    def test_stations_keep_repository_order(self) -> None:
        self.controller.refreshData()

        ids = [v.stationId for v in self.controller.renderHeatmap()]

        self.assertEqual(ids, ["ST-2", "ST-9", "ST-5", "ST-1"])

    def test_station_view_copies_fields_and_model_results(self) -> None:
        self.controller.refreshData()

        views = {v.stationId: v for v in self.controller.renderHeatmap()}

        self.assertEqual(views["ST-2"].occupancyRate, 50.0)
        self.assertEqual(views["ST-2"].status, "normal")
        self.assertIsNone(views["ST-9"].occupancyRate)
        self.assertEqual(views["ST-9"].status, "unknown")
        self.assertEqual(views["ST-2"].stationName, "대여소 ST-2")
        self.assertEqual(views["ST-2"].totalRacks, 10)
        self.assertEqual(views["ST-2"].availableBikes, 3)
        self.assertEqual((views["ST-2"].latitude, views["ST-2"].longitude), (37.5, 127.0))
        self.assertEqual(views["ST-2"].district, "강남구")

    def test_getDashboard_does_not_fetch_again(self) -> None:
        self.controller.refreshData()
        self.controller.getDashboard()
        self.controller.getDashboard()

        self.assertEqual(self.source.callCount, 1)


if __name__ == "__main__":
    unittest.main()
