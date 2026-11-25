"""대시보드의 구체 구현과 수명을 조립한다."""

from seoul_cycle.analysis.station_analyzer import StationAnalyzer
from seoul_cycle.contracts.ports import (
    DashboardSnapshotProvider,
    StationAnalytics,
    StationReader,
    StationSource,
    StationStore,
)
from seoul_cycle.fetching.api_fetcher import ApiFetcher
from seoul_cycle.presentation.dashboard_controller import (
    DashboardController,
    FreshDashboardSnapshotProvider,
)
from seoul_cycle.settings import Settings, loadSettings
from seoul_cycle.snapshot_cache import CachedDashboardSnapshotProvider
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


def buildDashboardSnapshotProvider() -> DashboardSnapshotProvider:
    """앱마다 캐시 하나를 두고 실제 수집이 필요할 때만 컨트롤러를 만든다."""
    source = FreshDashboardSnapshotProvider(lambda: buildController(loadSettings()))
    return CachedDashboardSnapshotProvider(source)
