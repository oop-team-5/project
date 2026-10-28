"""서울시 실시간 대여정보와 대여소 정보를 수집한다. 생성자는 I/O를 하지 않는다."""

import json
import re
from math import isfinite
from typing import cast
from urllib.parse import quote

import httpx

from seoul_cycle.contracts.errors import DataSourceError
from seoul_cycle.contracts.policy import SEOUL_API_PAGE_SIZE, SEOUL_DISTRICTS
from seoul_cycle.domain.bike_station import BikeStation


class ApiFetcher:
    def __init__(
        self, apiUrl: str, apiKey: str, *, timeout: float = 10.0
    ) -> None:
        self._apiUrl = apiUrl
        self._apiKey = apiKey
        self._timeout = timeout

    def fetchRawData(self, startIndex: int = 1, endIndex: int = 1000) -> str:
        """bikeList 한 페이지의 JSON 원문을 반환한다. 범위는 양 끝을 포함한다.

        잘못된 범위는 ValueError, 통신·응답 오류는 DataSourceError이다.
        범위를 벗어난 INFO-200 응답은 마지막 페이지 확인에 사용한다.
        """
        if (
            type(startIndex) is not int
            or type(endIndex) is not int
            or startIndex < 1
            or endIndex < startIndex
            or endIndex - startIndex + 1 > SEOUL_API_PAGE_SIZE
        ):
            raise ValueError("조회 범위는 1부터 시작하며 최대 1,000건입니다.")

        raw = self._requestPage("bikeList", startIndex, endIndex)
        count, rows = self._parsePage(raw, "rentBikeStatus")
        # bikeList의 list_total_count는 전체 건수가 아닌 해당 페이지 건수다.
        if count != len(rows) or len(rows) > endIndex - startIndex + 1:
            raise DataSourceError("실시간 대여정보의 페이지 건수가 일치하지 않습니다.")
        return raw

    def fetchStations(self) -> list[BikeStation]:
        """모든 페이지 수집과 stationId == RENT_ID 결합을 완료한 뒤 반환한다.

        실패 시 부분 결과를 반환하지 않는다. 자치구가 연결되지 않으면 None이며,
        거치율·상태 계산은 BikeStation에 맡긴다.
        """
        districts = self._fetchDistricts()
        stations: list[BikeStation] = []
        stationIds: set[str] = set()
        start = 1

        while True:
            raw = self.fetchRawData(start, start + SEOUL_API_PAGE_SIZE - 1)
            _, rows = self._parsePage(raw, "rentBikeStatus")
            if start == 1 and not rows:
                raise DataSourceError("실시간 대여소 데이터가 없습니다.")

            for row in rows:
                stationId = self._text(row.get("stationId"), "stationId")
                if stationId in stationIds:
                    raise DataSourceError("실시간 대여정보에 중복 대여소 ID가 있습니다.")
                stationIds.add(stationId)
                stations.append(self._toStation(row, stationId, districts.get(stationId)))

            if len(rows) < SEOUL_API_PAGE_SIZE:
                return stations
            start += SEOUL_API_PAGE_SIZE

    def _requestPage(self, service: str, start: int, end: int) -> str:
        if not self._apiKey.strip():
            raise DataSourceError("서울시 API 인증키가 설정되지 않았습니다.")

        key = quote(self._apiKey.strip(), safe="")
        url = f"{self._apiUrl.rstrip('/')}/{key}/json/{service}/{start}/{end}/"
        try:
            response = httpx.get(url, timeout=self._timeout)
            response.raise_for_status()
            return response.content.decode("utf-8-sig")
        except (httpx.HTTPError, ValueError, UnicodeError):
            # 외부 예외에는 인증키를 포함한 URL이 있을 수 있어 전달하지 않는다.
            raise DataSourceError("서울시 API 응답을 가져오지 못했습니다.") from None

    def _fetchDistricts(self) -> dict[str, str | None]:
        districts: dict[str, str | None] = {}
        total: int | None = None
        start = 1
        end = SEOUL_API_PAGE_SIZE

        while True:
            raw = self._requestPage("tbCycleStationInfo", start, end)
            count, rows = self._parsePage(raw, "stationInfo")
            if total is None:
                total = count
                if total == 0:
                    raise DataSourceError("대여소 보조 데이터가 없습니다.")
            # 보조 데이터는 전체 건수다. 중간 누락·수집 중 변경을 성공으로 처리하지 않는다.
            if count != total or len(rows) != min(end, total) - start + 1:
                raise DataSourceError("대여소 보조 데이터의 페이지 건수가 일치하지 않습니다.")

            for row in rows:
                stationId = self._text(row.get("RENT_ID"), "RENT_ID")
                if stationId in districts:
                    raise DataSourceError("보조 데이터에 중복 대여소 ID가 있습니다.")
                if "STA_LOC" not in row:
                    raise DataSourceError("보조 데이터에 STA_LOC이 없습니다.")
                value = row["STA_LOC"]
                if value is None or (isinstance(value, str) and not value.strip()):
                    district = None
                else:
                    district = self._text(value, "STA_LOC")
                    if district not in SEOUL_DISTRICTS:
                        raise DataSourceError("보조 데이터의 자치구가 올바르지 않습니다.")
                districts[stationId] = district

            if end >= total:
                return districts
            start = end + 1
            end = min(start + SEOUL_API_PAGE_SIZE - 1, total)

    @classmethod
    def _parsePage(cls, raw: str, rootName: str) -> tuple[int, list[dict[str, object]]]:
        try:
            value: object = json.loads(raw)
        except ValueError:
            raise DataSourceError("서울시 API가 올바른 JSON을 반환하지 않았습니다.") from None
        document = cls._object(value)
        # 인증·범위 오류는 서비스 루트 없이 최상위 RESULT로 올 수 있다.
        page = cls._object(document[rootName]) if rootName in document else document
        result = cls._object(page.get("RESULT"))
        code = result.get("CODE")
        if code == "INFO-200":
            return 0, []
        if code != "INFO-000":
            raise DataSourceError("서울시 API가 요청을 정상 처리하지 못했습니다.")
        if rootName not in document:
            raise DataSourceError("서울시 API 응답에 데이터가 없습니다.")
        count = cls._integer(page.get("list_total_count"), "list_total_count")
        rows = page.get("row")
        if not isinstance(rows, list):
            raise DataSourceError("서울시 API 응답의 row가 목록이 아닙니다.")
        return count, [cls._object(row) for row in rows]

    @staticmethod
    def _object(value: object) -> dict[str, object]:
        if not isinstance(value, dict):
            raise DataSourceError("서울시 API 응답 형식이 올바르지 않습니다.")
        return cast(dict[str, object], value)

    @staticmethod
    def _text(value: object, field: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise DataSourceError(f"{field} 값이 올바르지 않습니다.")
        return value.strip()

    @staticmethod
    def _integer(value: object, field: str) -> int:
        if type(value) is int and value >= 0:
            return value
        if isinstance(value, str) and re.fullmatch(r"[0-9]+", value.strip()):
            try:
                return int(value.strip())
            except ValueError:
                pass
        raise DataSourceError(f"{field} 값은 0 이상의 정수여야 합니다.")

    @staticmethod
    def _coordinate(value: object, field: str) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float, str)):
            raise DataSourceError(f"{field} 좌표가 올바르지 않습니다.")
        try:
            coordinate = float(value)
        except (ValueError, OverflowError):
            raise DataSourceError(f"{field} 좌표가 올바르지 않습니다.") from None
        if not isfinite(coordinate):
            raise DataSourceError(f"{field} 좌표는 유한한 수여야 합니다.")
        return coordinate

    @classmethod
    def _toStation(
        cls, row: dict[str, object], stationId: str, district: str | None
    ) -> BikeStation:
        try:
            return BikeStation(
                stationId=stationId,
                stationName=cls._text(row.get("stationName"), "stationName"),
                totalRacks=cls._integer(row.get("rackTotCnt"), "rackTotCnt"),
                availableBikes=cls._integer(row.get("parkingBikeTotCnt"), "parkingBikeTotCnt"),
                latitude=cls._coordinate(row.get("stationLatitude"), "stationLatitude"),
                longitude=cls._coordinate(row.get("stationLongitude"), "stationLongitude"),
                district=district,
            )
        except ValueError:
            raise DataSourceError("대여소 데이터가 모델의 유효 범위를 벗어났습니다.") from None
