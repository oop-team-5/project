
"""작업 영역 2. 대여소 데이터 저장 및 관리."""

from collections.abc import Sequence
from dataclasses import replace

from seoul_cycle.domain.bike_station import BikeStation


class StationRepository:
    """자전거 대여소 데이터를 저장하고 조회하는 클래스."""

    def __init__(self) -> None:
        """대여소 목록을 초기화한다."""
        self._stationsList: list[BikeStation] = []

    def addStation(self, station: BikeStation) -> None:
        """stationId를 기준으로 대여소를 추가하거나 갱신한다."""

        if not isinstance(station, BikeStation):
            raise ValueError("station must be a BikeStation object")

        # 외부 객체와 내부 객체를 분리하기 위해 복사본을 저장한다.
        station_copy = replace(station)

        for index, existing in enumerate(self._stationsList):
            if existing.stationId == station.stationId:
                self._stationsList[index] = station_copy
                return

        self._stationsList.append(station_copy)

    def getStationsByDistrict(self, district: str) -> list[BikeStation]:
        """지정한 자치구의 대여소를 ID 오름차순으로 반환한다."""

        result = [
            replace(station)
            for station in self._stationsList
            if station.district == district
        ]

        return sorted(result, key=lambda station: station.stationId)

    def getAllStations(self) -> list[BikeStation]:
        """모든 대여소의 복사본을 ID 오름차순으로 반환한다."""

        result = [
            replace(station)
            for station in self._stationsList
        ]

        return sorted(result, key=lambda station: station.stationId)

    def replaceAll(self, stations: Sequence[BikeStation]) -> None:
        """전체 대여소 데이터를 검증한 후 교체한다."""

        new_stations: list[BikeStation] = []
        station_ids: set[str] = set()

        # 모든 데이터 검증이 끝나기 전에는 기존 목록을 변경하지 않는다.
        try:
            for station in stations:
                if not isinstance(station, BikeStation):
                    raise ValueError("All items must be BikeStation objects")

                if station.stationId in station_ids:
                    raise ValueError(
                        f"Duplicate stationId: {station.stationId}"
                    )

                station_ids.add(station.stationId)
                new_stations.append(replace(station))

        except (TypeError, ValueError) as error:
            raise ValueError("Invalid station data") from error

        # 검증이 모두 성공한 경우에만 저장소를 교체한다.
        self._stationsList = new_stations
