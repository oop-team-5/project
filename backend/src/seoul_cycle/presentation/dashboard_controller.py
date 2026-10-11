"""작업 영역 4. 분석을 조정하고 화면용 데이터를 전달한다. HTML을 그리지 않는다."""

from datetime import datetime

from seoul_cycle.contracts.ports import (
    StationAnalytics,
    StationSource,
    StationStore,
)
from seoul_cycle.contracts.types import ChartData, DashboardSnapshot, StationView


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
        """TODO: 전체 수집 성공 -> replaceAll -> 수집 완료 시각 기록.

        시각은 timezone-aware UTC datetime. 실패는 그대로 전파하며
        미구현/실패를 빈 정상 데이터로 취급하지 않는다.
        """
        raise NotImplementedError("TODO[UI]: DashboardController.refreshData")

    def renderCharts(self) -> ChartData:
        """TODO: 분석기의 전체/자치구 통계를 ChartData로 전달한다."""
        raise NotImplementedError("TODO[UI]: DashboardController.renderCharts")

    def renderHeatmap(self) -> list[StationView]:
        """TODO: 저장소 사본을 StationView로 변환. 거치율/상태는 모델에 위임."""
        raise NotImplementedError("TODO[UI]: DashboardController.renderHeatmap")

    def getDashboard(self) -> DashboardSnapshot:
        """TODO: 성공한 refreshData의 결과를 하나의 응답으로 조립한다.

        갱신 전 호출은 RuntimeError. renderCharts/renderHeatmap과 분석기의
        부족 목록 ID를 사용한다. 여기서 API를 다시 호출하거나 통계를
        재계산하지 않는다. 각 DTO의 개수/시간/ID는 같은 갱신에 속해야 한다.
        """
        raise NotImplementedError("TODO[UI]: DashboardController.getDashboard")
