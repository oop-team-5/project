"""작업 영역 2. 생성자·필드는 준비되어 있으며 동작은 담당자가 구현한다."""

from dataclasses import dataclass

from seoul_cycle.contracts.types import StationStatus


@dataclass(slots=True, kw_only=True)
class BikeStation:
    """공개 필드와 시그니처는 공유 계약이다.

    TODO[모델/저장소]: 생성 시 식별자·개수·유한 좌표를 검증한다.
    totalRacks=0과 availableBikes>totalRacks는 허용한다.
    district는 서울 25개 자치구 또는 None이다.
    """

    stationId: str
    stationName: str
    totalRacks: int
    availableBikes: int
    latitude: float
    longitude: float
    district: str | None = None

    def getOccupancyRate(self) -> float | None:
        """TODO: 자전거/거치대*100. 거치대 0은 None. 반올림/상한 제한 없음."""
        raise NotImplementedError("TODO[모델/저장소]: BikeStation.getOccupancyRate")

    def isDeficit(self) -> bool:
        """TODO: 상태가 shortage인 경우만 True. unknown은 False."""
        raise NotImplementedError("TODO[모델/저장소]: BikeStation.isDeficit")

    def updateStatus(
        self, availableBikes: int, totalRacks: int | None = None
    ) -> None:
        """TODO: 개수를 검증한 뒤 함께 갱신. totalRacks=None이면 기존 값 유지.

        잘못된 입력은 ValueError이며 어떤 필드도 변경하지 않는다.
        """
        raise NotImplementedError("TODO[모델/저장소]: BikeStation.updateStatus")

    def getStatus(self) -> StationStatus:
        """TODO: <20 shortage, 20~100 normal, >100 surplus, None unknown."""
        raise NotImplementedError("TODO[모델/저장소]: BikeStation.getStatus")
