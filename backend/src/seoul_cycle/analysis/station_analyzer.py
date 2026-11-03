"""작업 영역 3. 읽기 인터페이스만 의존하며 저장소를 변경하지 않는다."""

from collections import Counter
from collections.abc import Iterable
from statistics import fmean

from seoul_cycle.contracts.policy import SEOUL_DISTRICTS
from seoul_cycle.contracts.ports import StationReader
from seoul_cycle.contracts.types import StationStats
from seoul_cycle.domain.bike_station import BikeStation


class StationAnalyzer:
    """저장소의 대여소 사본으로 전체/자치구 통계와 부족 대여소 목록을 계산한다.

    거치율과 상태 판정은 BikeStation 메서드에 위임하고, 여기서는 집계만 한다.
    """

    def __init__(self, repository: StationReader) -> None:
        self._repository = repository

    def calculateDistrictStats(self) -> dict[str, StationStats]:
        """SEOUL_DISTRICTS 25개 키를 모두 반환한다.

        데이터가 없는 구는 개수 0, 평균 None. district=None은 제외한다.
        상태/거치율은 BikeStation 메서드를 사용하고 중복 계산하지 않는다.
        """
        return {
            district: self._buildStats(
                self._repository.getStationsByDistrict(district)
            )
            for district in SEOUL_DISTRICTS
        }

    def getShortageStations(self) -> list[BikeStation]:
        """isDeficit()이 True인 대여소를 (거치율, stationId)순으로 반환."""
        shortages = [
            station
            for station in self._repository.getAllStations()
            if station.isDeficit()
        ]
        return sorted(shortages, key=self._shortageSortKey)

    def calculateSummary(self) -> StationStats:
        """전체 개수와 유효한 거치율의 단순 평균을 반환한다.

        미분류 자치구/거치대 0 대여소도 개수 합계에는 포함한다.
        평균만 None을 제외하며 유효한 거치율이 없으면 평균은 None이다.
        """
        return self._buildStats(self._repository.getAllStations())

    @staticmethod
    def _buildStats(stations: Iterable[BikeStation]) -> StationStats:
        """대여소 목록 하나를 StationStats로 집계한다. 대여소당 한 번씩만 판정한다."""
        stationCount = 0
        totalRacks = 0
        availableBikes = 0
        rates: list[float] = []
        statusCounts: Counter[str] = Counter()

        for station in stations:
            stationCount += 1
            totalRacks += station.totalRacks
            availableBikes += station.availableBikes
            statusCounts[station.getStatus()] += 1

            rate = station.getOccupancyRate()
            if rate is not None:
                rates.append(rate)

        return StationStats(
            stationCount=stationCount,
            totalRacks=totalRacks,
            availableBikes=availableBikes,
            averageOccupancyRate=fmean(rates) if rates else None,
            shortageCount=statusCounts["shortage"],
            normalCount=statusCounts["normal"],
            surplusCount=statusCounts["surplus"],
            unknownCount=statusCounts["unknown"],
        )

    @staticmethod
    def _shortageSortKey(station: BikeStation) -> tuple[float, str]:
        """거치율이 낮은 순, 같으면 stationId 순. 부족 대여소는 거치율이 항상 있다."""
        rate = station.getOccupancyRate()
        return (rate if rate is not None else 0.0, station.stationId)
