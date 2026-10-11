"""공통 반환 타입의 원본. HTTP 명세와 TypeScript 타입도 여기에서 파생된다.

dataclass는 데이터 전달만 담당하며 수집, 계산, 표시 로직을 포함하지 않는다.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, TypeAlias

StationStatus: TypeAlias = Literal["shortage", "normal", "surplus", "unknown"]
ErrorCode: TypeAlias = Literal["NOT_IMPLEMENTED", "DATA_SOURCE_ERROR"]


@dataclass(frozen=True, slots=True, kw_only=True)
class StationStats:
    """평균은 유효한 대여소별 거치율의 단순 평균, 단위는 퍼센트다."""

    stationCount: int
    totalRacks: int
    availableBikes: int
    averageOccupancyRate: float | None
    shortageCount: int
    normalCount: int
    surplusCount: int
    unknownCount: int


@dataclass(frozen=True, slots=True, kw_only=True)
class StationView:
    """브라우저로 전달하는 대여소 한 개. 계산된 값을 그대로 표시한다."""

    stationId: str
    stationName: str
    totalRacks: int
    availableBikes: int
    latitude: float
    longitude: float
    district: str | None
    occupancyRate: float | None
    status: StationStatus


@dataclass(frozen=True, slots=True, kw_only=True)
class ChartData:
    """전체 요약 및 25개 자치구 통계. 차트 라이브러리와 독립적인 데이터."""

    summary: StationStats
    districtStats: dict[str, StationStats]


@dataclass(frozen=True, slots=True, kw_only=True)
class DashboardSnapshot:
    """한 번의 갱신 결과. fetchedAt은 시간대가 있는 수집 완료 시각이다."""

    fetchedAt: datetime
    summary: StationStats
    districtStats: dict[str, StationStats]
    stations: list[StationView]
    shortageStationIds: list[str]


@dataclass(frozen=True, slots=True, kw_only=True)
class HealthResponse:
    """프로세스 실행 상태이며 데이터 수집 구현 완료를 의미하지 않는다."""

    status: Literal["ok"]


@dataclass(frozen=True, slots=True, kw_only=True)
class ErrorResponse:
    code: ErrorCode
    message: str
