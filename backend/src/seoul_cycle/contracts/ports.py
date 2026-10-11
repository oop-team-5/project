"""클래스 사이의 최소 인터페이스. 구체 구현을 서로 생성하지 않는다."""

from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING, Protocol

from seoul_cycle.contracts.types import StationStats

if TYPE_CHECKING:
    from seoul_cycle.domain.bike_station import BikeStation


class StationSource(Protocol):
    def fetchStations(self) -> list[BikeStation]: ...


class StationReader(Protocol):
    def getStationsByDistrict(self, district: str) -> list[BikeStation]: ...

    def getAllStations(self) -> list[BikeStation]: ...


class StationWriter(Protocol):
    def addStation(self, station: BikeStation) -> None: ...

    def replaceAll(self, stations: Sequence[BikeStation]) -> None: ...


class StationStore(StationReader, StationWriter, Protocol):
    """조회와 갱신 모두 필요한 컨트롤러에만 전달한다."""


class StationAnalytics(Protocol):
    def calculateDistrictStats(self) -> dict[str, StationStats]: ...

    def getShortageStations(self) -> list[BikeStation]: ...

    def calculateSummary(self) -> StationStats: ...
