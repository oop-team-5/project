from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from threading import Event
from unittest import TestCase
from unittest.mock import Mock

from seoul_cycle.contracts.errors import DataSourceError
from seoul_cycle.contracts.ports import DashboardSnapshotProvider
from seoul_cycle.contracts.types import DashboardSnapshot, StationStats
from seoul_cycle.snapshot_cache import CachedDashboardSnapshotProvider


def makeSnapshot(stationId: str) -> DashboardSnapshot:
    stats = StationStats(
        stationCount=0, totalRacks=0, availableBikes=0, averageOccupancyRate=None,
        shortageCount=0, normalCount=0, surplusCount=0, unknownCount=0,
    )
    return DashboardSnapshot(
        fetchedAt=datetime(2026, 1, 1, tzinfo=UTC),
        summary=stats,
        districtStats={},
        stations=[],
        shortageStationIds=[stationId],
    )


class SnapshotCacheTests(TestCase):
    def testTtlStartsAfterCollection(self) -> None:
        now = 0.0
        source = Mock(spec=DashboardSnapshotProvider)

        def collect() -> DashboardSnapshot:
            nonlocal now
            now += 30
            return makeSnapshot(str(now))

        source.getSnapshot.side_effect = collect
        cache = CachedDashboardSnapshotProvider(source, clock=lambda: now)

        self.assertEqual(cache.getSnapshot().shortageStationIds, ["30.0"])
        now = 329.9
        self.assertEqual(cache.getSnapshot().shortageStationIds, ["30.0"])
        source.getSnapshot.assert_called_once_with()
        now = 330.0
        self.assertEqual(cache.getSnapshot().shortageStationIds, ["360.0"])
        self.assertEqual(source.getSnapshot.call_count, 2)

    def testCacheOwnsItsCollections(self) -> None:
        upstream = makeSnapshot("original")
        source = Mock(spec=DashboardSnapshotProvider)
        source.getSnapshot.return_value = upstream
        cache = CachedDashboardSnapshotProvider(source)

        caller = cache.getSnapshot()
        upstream.shortageStationIds.clear()
        caller.shortageStationIds.append("changed")
        self.assertEqual(cache.getSnapshot().shortageStationIds, ["original"])
        source.getSnapshot.assert_called_once_with()

    def testConcurrentExpiredRequestsShareCollectionAndCanRetryAfterFailure(self) -> None:
        for error in (None, DataSourceError("collection failed"), RuntimeError("unexpected")):
            with self.subTest(error=error):
                self.checkConcurrentRefresh(error)

    def checkConcurrentRefresh(self, error: Exception | None) -> None:
        now = 0.0
        expiredRead = Event()
        entered = Event()
        release = Event()

        def clock() -> float:
            if entered.is_set():
                expiredRead.set()
            return now

        def collect() -> DashboardSnapshot:
            entered.set()
            if not release.wait(timeout=5):
                raise TimeoutError("test did not release the collection")
            if error is not None:
                raise error
            return fresh

        fresh = makeSnapshot("fresh")
        source = Mock(spec=DashboardSnapshotProvider)
        source.getSnapshot.return_value = makeSnapshot("old")
        cache = CachedDashboardSnapshotProvider(source, clock=clock)
        cache.getSnapshot()
        now = 300.0
        source.getSnapshot.side_effect = collect

        with ThreadPoolExecutor(max_workers=2) as pool:
            leader = pool.submit(cache.getSnapshot)
            try:
                self.assertTrue(entered.wait(timeout=5))
                follower = pool.submit(cache.getSnapshot)
                self.assertTrue(expiredRead.wait(timeout=5))
            finally:
                release.set()

            if error is None:
                self.assertEqual(leader.result(timeout=5), fresh)
                self.assertEqual(follower.result(timeout=5), fresh)
            else:
                with self.assertRaises(type(error)):
                    leader.result(timeout=5)
                with self.assertRaises(type(error)):
                    follower.result(timeout=5)
            self.assertEqual(source.getSnapshot.call_count, 2)

        source.getSnapshot.side_effect = None
        source.getSnapshot.return_value = fresh
        self.assertEqual(cache.getSnapshot(), fresh)
        self.assertEqual(source.getSnapshot.call_count, 2 if error is None else 3)
