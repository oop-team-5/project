"""프로세스 안에서 성공한 스냅샷을 공유하고 동시에 진행되는 수집을 합친다."""

from collections.abc import Callable
from concurrent.futures import Future
from copy import deepcopy
from threading import Lock
from time import monotonic

from seoul_cycle.contracts.ports import DashboardSnapshotProvider
from seoul_cycle.contracts.types import DashboardSnapshot


class CachedDashboardSnapshotProvider:
    def __init__(
        self,
        source: DashboardSnapshotProvider,
        ttl: float = 300.0,
        *,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        self._source = source
        self._ttl = ttl
        self._clock = clock
        self._lock = Lock()
        self._snapshot: DashboardSnapshot | None = None
        self._expiresAt = 0.0
        self._inFlight: Future[DashboardSnapshot] | None = None

    def getSnapshot(self) -> DashboardSnapshot:
        with self._lock:
            cached = (
                self._snapshot
                if self._snapshot is not None and self._clock() < self._expiresAt
                else None
            )
            if cached is None:
                future = self._inFlight
                leader = future is None
                if future is None:
                    future = Future()
                    self._inFlight = future

        if cached is not None:
            # 반환한 DTO의 list/dict를 변경해도 저장된 캐시에 영향을 주지 않는다.
            return deepcopy(cached)

        assert future is not None
        if not leader:
            return deepcopy(future.result())

        try:
            # 캐시는 공급자가 반환한 가변 컬렉션과 별개의 복사본을 소유한다.
            snapshot = deepcopy(self._source.getSnapshot())
            expiresAt = self._clock() + self._ttl
        except BaseException as error:
            # 실패는 저장하지 않고 이번 수집을 기다린 요청들에 같은 오류를 전달한다.
            with self._lock:
                future.set_exception(error)
                self._inFlight = None
            raise

        with self._lock:
            self._snapshot = snapshot
            # 5분은 수집을 시작한 때가 아니라 성공한 때부터 계산한다.
            self._expiresAt = expiresAt
            future.set_result(snapshot)
            self._inFlight = None
        return deepcopy(snapshot)
