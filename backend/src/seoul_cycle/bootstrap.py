"""구체 클래스를 연결하는 유일한 조립 지점. 호출마다 새 객체를 만든다."""

from seoul_cycle.analysis.station_analyzer import StationAnalyzer
from seoul_cycle.contracts.ports import (
    StationAnalytics,
    StationReader,
    StationSource,
    StationStore,
)
from seoul_cycle.fetching.api_fetcher import ApiFetcher
from seoul_cycle.presentation.dashboard_controller import DashboardController
from seoul_cycle.settings import Settings, loadSettings
from seoul_cycle.storage.station_repository import StationRepository


def buildController(settings: Settings) -> DashboardController:
    """Protocol 타입 대입을 통해 구체 구현의 계약 적합성을 검사한다."""
    repository: StationStore = StationRepository()
    reader: StationReader = repository
    source: StationSource = ApiFetcher(
        settings.apiUrl, settings.apiKey, timeout=settings.timeout
    )
    analytics: StationAnalytics = StationAnalyzer(reader)
    return DashboardController(source, analytics, repository)


def getController() -> DashboardController:
    """FastAPI 요청에 연결할 의존성. 전역 singleton/cache를 만들지 않는다."""
    return buildController(loadSettings())
