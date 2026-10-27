"""작업 영역 4. 분석을 조정하고 화면용 데이터를 전달한다. HTML을 그리지 않는다."""

from datetime import UTC, datetime

from seoul_cycle.contracts.ports import (
    StationAnalytics,
    StationSource,
    StationStore,
)
from seoul_cycle.contracts.types import ChartData, DashboardSnapshot, StationView
from seoul_cycle.domain.bike_station import BikeStation


class DashboardController:
    def __init__(
        self,
        fetcher: StationSource,
        analyzer: StationAnalytics,
        repository: StationStore,
    ) -> None:
        self._fetcher = fetcher
        self._analyzer = analyzer
        self._repository = repository
        self._fetchedAt: datetime | None = None

    def refreshData(self) -> None:
        """전체 수집 성공 -> replaceAll -> 수집 완료 시각 기록.

        시각은 timezone-aware UTC datetime. 실패는 그대로 전파하며
        미구현/실패를 빈 정상 데이터로 취급하지 않는다.
        """
        stations = self._fetcher.fetchStations()
        completedAt = datetime.now(UTC)
        self._repository.replaceAll(stations)
        self._fetchedAt = completedAt

    def renderCharts(self) -> ChartData:
        """분석기의 전체/자치구 통계를 ChartData로 전달한다."""
        return ChartData(
            summary=self._analyzer.calculateSummary(),
            districtStats=self._analyzer.calculateDistrictStats(),
        )

    def renderHeatmap(self) -> list[StationView]:
        """저장소 사본을 StationView로 변환. 거치율/상태는 모델에 위임."""
        return [
            self._toStationView(station)
            for station in self._repository.getAllStations()
        ]

    def getDashboard(self) -> DashboardSnapshot:
        """성공한 refreshData의 결과를 하나의 응답으로 조립한다.

        갱신 전 호출은 RuntimeError. renderCharts/renderHeatmap과 분석기의
        부족 목록 ID를 사용한다. 여기서 API를 다시 호출하거나 통계를
        재계산하지 않는다. 각 DTO의 개수/시간/ID는 같은 갱신에 속해야 한다.
        """
        if self._fetchedAt is None:
            raise RuntimeError("refreshData()가 성공한 뒤에 호출해야 합니다.")

        charts = self.renderCharts()
        return DashboardSnapshot(
            fetchedAt=self._fetchedAt,
            summary=charts.summary,
            districtStats=charts.districtStats,
            stations=self.renderHeatmap(),
            shortageStationIds=[
                station.stationId
                for station in self._analyzer.getShortageStations()
            ],
        )

    @staticmethod
    def _toStationView(station: BikeStation) -> StationView:
        return StationView(
            stationId=station.stationId,
            stationName=station.stationName,
            totalRacks=station.totalRacks,
            availableBikes=station.availableBikes,
            latitude=station.latitude,
            longitude=station.longitude,
            district=station.district,
            occupancyRate=station.getOccupancyRate(),
            status=station.getStatus(),
        )
