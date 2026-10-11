"""FastAPI 진입점. 생성/import/health에는 API 키나 서울시 연결이 필요 없다."""

from dataclasses import asdict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from seoul_cycle.contracts.errors import DataSourceError
from seoul_cycle.contracts.types import ErrorResponse
from seoul_cycle.presentation.http import router


async def notImplementedHandler(_request: Request, _exc: Exception) -> JSONResponse:
    error = ErrorResponse(code="NOT_IMPLEMENTED", message="아직 구현되지 않은 기능입니다.")
    return JSONResponse(status_code=501, content=asdict(error))


async def dataSourceErrorHandler(_request: Request, _exc: Exception) -> JSONResponse:
    # 원본 예외에는 인증키를 포함한 URL 등이 있을 수 있어 HTTP 응답에 전달하지 않는다.
    error = ErrorResponse(
        code="DATA_SOURCE_ERROR",
        message="서울시 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    )
    return JSONResponse(status_code=502, content=asdict(error))


def createApp() -> FastAPI:
    application = FastAPI(
        title="Seoul Cycle API",
        version="0.1.0",
        description="공통 응답 계약. 수집·저장·분석·시각화는 팀원별 구현 예정입니다.",
    )
    application.add_exception_handler(NotImplementedError, notImplementedHandler)
    application.add_exception_handler(DataSourceError, dataSourceErrorHandler)
    application.include_router(router)
    return application


app = createApp()
