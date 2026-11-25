"""HTTP 요청을 대시보드 스냅샷 공급자에 연결한다."""

from fastapi import APIRouter

from seoul_cycle.contracts.ports import DashboardSnapshotProvider
from seoul_cycle.contracts.types import DashboardSnapshot, ErrorResponse, HealthResponse


def createRouter(snapshotProvider: DashboardSnapshotProvider) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.get(
        "/health", response_model=HealthResponse, operation_id="getHealth",
        summary="서버 실행 상태 확인",
    )
    def getHealth() -> HealthResponse:
        return HealthResponse(status="ok")

    @router.post(
        "/dashboard/refresh",
        response_model=DashboardSnapshot,
        operation_id="refreshDashboard",
        summary="전체 데이터 갱신 후 하나의 대시보드 스냅샷 반환",
        responses={
            501: {"model": ErrorResponse, "description": "아직 구현되지 않은 기능"},
            502: {"model": ErrorResponse, "description": "외부 데이터 수집 실패"},
        },
    )
    def refreshDashboard() -> DashboardSnapshot:
        """본문이 없는 요청. refreshData가 완료된 후 같은 객체에서 결과를 읽는다."""
        return snapshotProvider.getSnapshot()

    return router
