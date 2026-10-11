"""환경 설정. 읽기만 수행하며 API 호출은 하지 않는다."""

import os
from dataclasses import dataclass, field

from dotenv import dotenv_values


@dataclass(frozen=True, slots=True, kw_only=True)
class Settings:
    apiUrl: str = "http://openapi.seoul.go.kr:8088"
    apiKey: str = field(default="", repr=False)
    timeout: float = 10.0


def loadSettings() -> Settings:
    """저장소 루트의 .env보다 프로세스 환경변수가 우선한다."""
    values = {**dotenv_values(".env"), **os.environ}
    return Settings(
        apiUrl=values.get("SEOUL_API_BASE_URL") or "http://openapi.seoul.go.kr:8088",
        apiKey=values.get("SEOUL_API_KEY") or "",
        timeout=float(values.get("SEOUL_API_TIMEOUT") or "10.0"),
    )
