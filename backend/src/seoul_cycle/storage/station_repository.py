"""작업 영역 2. 내부 자료구조는 외부 호출자가 직접 접근하지 않는다."""

from collections.abc import Sequence

from seoul_cycle.domain.bike_station import BikeStation


class StationRepository:
    def __init__(self) -> None:
        self._stationsList: list[BikeStation] = []

    def addStation(self, station: BikeStation) -> None:
        """TODO: stationId 기준 추가/갱신. 입력 객체의 사본을 보관한다."""
        raise NotImplementedError("TODO[모델/저장소]: StationRepository.addStation")

    def getStationsByDistrict(self, district: str) -> list[BikeStation]:
        """TODO: 정확히 일치하는 구의 객체 사본을 ID순으로 반환. 없으면 []."""
        raise NotImplementedError(
            "TODO[모델/저장소]: StationRepository.getStationsByDistrict"
        )

    def getAllStations(self) -> list[BikeStation]:
        """TODO: 목록과 각 객체의 사본을 stationId 오름차순으로 반환한다."""
        raise NotImplementedError("TODO[모델/저장소]: StationRepository.getAllStations")

    def replaceAll(self, stations: Sequence[BikeStation]) -> None:
        """TODO: 전체 검증 후 사본으로 교체한다. []은 저장소를 비운다.

        중복 ID/잘못된 객체는 ValueError. 실패 시 기존 저장소를 보존한다.
        """
        raise NotImplementedError("TODO[모델/저장소]: StationRepository.replaceAll")
