"""공동 합의한 값만 보관한다. 상태 판정의 구현은 BikeStation 담당이다."""

from typing import Final

SHORTAGE_THRESHOLD: Final[float] = 20.0
SURPLUS_THRESHOLD: Final[float] = 100.0
SEOUL_API_PAGE_SIZE: Final[int] = 1000

SEOUL_DISTRICTS: Final[tuple[str, ...]] = (
    "강남구", "강동구", "강북구", "강서구", "관악구",
    "광진구", "구로구", "금천구", "노원구", "도봉구",
    "동대문구", "동작구", "마포구", "서대문구", "서초구",
    "성동구", "성북구", "송파구", "양천구", "영등포구",
    "용산구", "은평구", "종로구", "중구", "중랑구",
)
