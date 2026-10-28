"""작업 영역 2. BikeStation 모델 및 상태 관리."""

from dataclasses import dataclass
from math import isfinite

from seoul_cycle.contracts.policy import (
    SEOUL_DISTRICTS,
    SHORTAGE_THRESHOLD,
    SURPLUS_THRESHOLD,
)
from seoul_cycle.contracts.types import StationStatus


@dataclass(slots=True, kw_only=True)
class BikeStation:
    """서울 공공자전거 대여소의 정보를 관리하는 클래스."""

    stationId: str
    stationName: str
    totalRacks: int
    availableBikes: int
    latitude: float
    longitude: float
    district: str | None = None

    def __post_init__(self) -> None:
        """객체 생성 시 입력 데이터의 유효성을 검사한다."""

        # 대여소 ID 검사
        if not isinstance(self.stationId, str) or not self.stationId.strip():
            raise ValueError("stationId must be a non-empty string")

        # 대여소 이름 검사
        if not isinstance(self.stationName, str) or not self.stationName.strip():
            raise ValueError("stationName must be a non-empty string")

        # 자전거 수와 거치대 수 검사
        self._validate_counts(self.availableBikes, self.totalRacks)

        # 위도와 경도 검사
        for name, value in (
            ("latitude", self.latitude),
            ("longitude", self.longitude),
        ):
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"{name} must be a finite number")

            if not isfinite(value):
                raise ValueError(f"{name} must be finite")

        if not -90 <= self.latitude <= 90:
            raise ValueError("latitude is out of range")

        if not -180 <= self.longitude <= 180:
            raise ValueError("longitude is out of range")

        # 자치구 이름 유효성 검사
        if self.district is not None:
            if (
                not isinstance(self.district, str)
                or self.district not in SEOUL_DISTRICTS
            ):
                raise ValueError(
                    "district must be one of Seoul's 25 districts or None"
                )

    @staticmethod
    def _validate_counts(availableBikes: int, totalRacks: int) -> None:
        """자전거 수와 거치대 수의 유효성을 검사한다."""

        if type(availableBikes) is not int or availableBikes < 0:
            raise ValueError(
                "availableBikes must be a non-negative integer"
            )

        if type(totalRacks) is not int or totalRacks < 0:
            raise ValueError(
                "totalRacks must be a non-negative integer"
            )

    def getOccupancyRate(self) -> float | None:
        """거치율을 백분율로 계산한다. 거치대가 0이면 None을 반환한다."""

        if self.totalRacks == 0:
            return None

        return self.availableBikes / self.totalRacks * 100

    def isDeficit(self) -> bool:
        """자전거 부족 상태인지 확인한다."""

        return self.getStatus() == "shortage"

    def updateStatus(
        self,
        availableBikes: int,
        totalRacks: int | None = None,
    ) -> None:
        """입력값 검증 후 자전거 수와 거치대 수를 갱신한다."""

        new_total = self.totalRacks if totalRacks is None else totalRacks

        # 검증 실패 시 기존 데이터를 변경하지 않는다.
        self._validate_counts(availableBikes, new_total)

        self.availableBikes = availableBikes
        self.totalRacks = new_total

    def getStatus(self) -> StationStatus:
        """거치율에 따라 대여소 상태를 반환한다."""

        rate = self.getOccupancyRate()

        if rate is None:
            return "unknown"

        if rate < SHORTAGE_THRESHOLD:
            return "shortage"

        if rate <= SURPLUS_THRESHOLD:
            return "normal"

        return "surplus"
