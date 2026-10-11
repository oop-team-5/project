"""작업 영역 3. 읽기 인터페이스만 의존하며 저장소를 변경하지 않는다."""

from seoul_cycle.contracts.ports import StationReader
from seoul_cycle.contracts.types import StationStats
from seoul_cycle.domain.bike_station import BikeStation


class StationAnalyzer:
    def __init__(self, repository: StationReader) -> None:
        self._repository = repository

    def calculateDistrictStats(self) -> dict[str, StationStats]:
        """TODO: SEOUL_DISTRICTS 25개 키를 모두 반환한다.

        데이터가 없는 구는 개수 0, 평균 None. district=None은 제외한다.
        상태/거치율은 BikeStation 메서드를 사용하고 중복 계산하지 않는다.
        """
        raise NotImplementedError("TODO[분석]: StationAnalyzer.calculateDistrictStats")

    def getShortageStations(self) -> list[BikeStation]:
        """TODO: isDeficit()이 True인 대여소를 (거치율, stationId)순으로 반환."""
        raise NotImplementedError("TODO[분석]: StationAnalyzer.getShortageStations")

    def calculateSummary(self) -> StationStats:
        """TODO: 전체 개수와 유효한 거치율의 단순 평균을 반환한다.

        미분류 자치구/거치대 0 대여소도 개수 합계에는 포함한다.
        평균만 None을 제외하며 유효한 거치율이 없으면 평균은 None이다.
        """
        raise NotImplementedError("TODO[분석]: StationAnalyzer.calculateSummary")
