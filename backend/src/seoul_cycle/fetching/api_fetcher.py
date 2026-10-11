"""작업 영역 1. HTTP 호출/파싱은 이 영역에만 둔다. 생성자는 I/O를 하지 않는다."""

from seoul_cycle.domain.bike_station import BikeStation


class ApiFetcher:
    def __init__(
        self, apiUrl: str, apiKey: str, *, timeout: float = 10.0
    ) -> None:
        self._apiUrl = apiUrl
        self._apiKey = apiKey
        self._timeout = timeout

    def fetchRawData(self, startIndex: int = 1, endIndex: int = 1000) -> str:
        """TODO: bikeList 한 페이지의 원본 JSON 문자열을 반환한다.

        인덱스는 1부터 시작하며 양 끝을 포함한다. 최대 1,000건.
        잘못된 범위는 ValueError, 외부 통신/결과 오류는 DataSourceError.
        숫자 문자열 변환과 객체 생성은 fetchStations 쪽에서 수행한다.
        """
        raise NotImplementedError("TODO[API]: ApiFetcher.fetchRawData")

    def fetchStations(self) -> list[BikeStation]:
        """TODO: 모든 페이지와 보조 데이터를 수집하여 정규화된 객체를 반환한다.

        bikeList/rentBikeStatus.row + tbCycleStationInfo/stationInfo.row를
        stationId == RENT_ID로 결합한다. STA_LOC은 district가 된다.
        shared 대신 개수를 보존하고, 미연결 자치구는 None으로 둔다.
        키 누락, 페이지 실패, 잘못된 행, 중복 ID는 DataSourceError로
        변환한다. 일부 데이터나 가짜 정상 []을 반환하지 않는다.
        메타데이터 수집은 이 클래스의 비공개 보조 함수로 구현한다.
        """
        raise NotImplementedError("TODO[API]: ApiFetcher.fetchStations")
