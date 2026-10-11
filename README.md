# Seoul Cycle

서울 공공자전거의 거치율, 자치구별 현황, 부족 대여소를 보여 주는 객체지향프로그래밍 팀 프로젝트

## How to run
### requirements
- Python **3.12 이상**
- Node.js **22.12 이상**
- npm

### 최초 설치

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock -e "./backend[dev]"
npm.cmd --prefix frontend ci
Copy-Item .env.example .env
```

실제 서울시 API 인증키는 `.env`의 `SEOUL_API_KEY`에 or 시스템 환경 변수
참고: 키가 비어 있어도 안내 화면, 서버 상태 확인 가능

### 백엔드: 터미널 1

```powershell
.\.venv\Scripts\python.exe -m uvicorn seoul_cycle.main:app --host 127.0.0.1 --port 8000 --reload
```

- [서버 상태](http://127.0.0.1:8000/api/health): `{"status":"ok"}`
- [HTTP 계약 문서](http://127.0.0.1:8000/docs)

### 프론트엔드: 터미널 2

```powershell
npm.cmd --prefix frontend run dev
```


## 구조 및 역할

```text
backend/
  pyproject.toml, requirements.lock
  src/seoul_cycle/
    contracts/      # 공동: Protocol, DTO, 상태/자치구 상수, 예외
    fetching/       # 영역 1: ApiFetcher
    domain/         # 영역 2: BikeStation
    storage/        # 영역 2: StationRepository
    analysis/       # 영역 3: StationAnalyzer
    presentation/   # 영역 4: DashboardController, HTTP 어댑터
    bootstrap.py    # 공동: 요청마다 객체를 조립하는 유일한 지점
    settings.py     # 공동: 백엔드 환경 설정
    main.py         # 공동: FastAPI 진입점과 오류 어댑터
    export_openapi.py
frontend/
  src/api/          # HTTP 클라이언트, 자동 생성 타입
  src/features/dashboard/  # 영역 4: 화면 구현 시작점
  src/styles/       # 영역 4: 스타일
contracts/openapi.json     # 자동 생성 HTTP 명세
```

| 작업 영역 | 책임 | 시작 파일 |
|---|---|---|
| API 수집 | 전체 페이지, 보조 데이터 결합, 문자열 정규화 | [ApiFetcher](backend/src/seoul_cycle/fetching/api_fetcher.py) |
| 모델·저장소 | 거치율/상태 규칙, 객체 소유, 조회/전체 교체 | [BikeStation](backend/src/seoul_cycle/domain/bike_station.py), [StationRepository](backend/src/seoul_cycle/storage/station_repository.py) |
| 분석 | 전체/25개 구 통계, 부족 대여소 정렬 | [StationAnalyzer](backend/src/seoul_cycle/analysis/station_analyzer.py) |
| UI·시각화 | 흐름 조정, 응답 조립, React 화면과 지도/차트 | [DashboardController](backend/src/seoul_cycle/presentation/dashboard_controller.py), [DashboardPage](frontend/src/features/dashboard/DashboardPage.tsx) |


## 클래스 다이어그램


```mermaid
classDiagram
    class BikeStation {
        +str stationId
        +str stationName
        +int totalRacks
        +int availableBikes
        +float latitude
        +float longitude
        +Optional~str~ district
        +__init__(str stationId, str stationName, int totalRacks, int availableBikes, float latitude, float longitude, Optional~str~ district=None)
        +getOccupancyRate() Optional~float~
        +isDeficit() bool
        +updateStatus(int availableBikes, Optional~int~ totalRacks=None) None
        +getStatus() StationStatus
    }
    class StationRepository {
        -list~BikeStation~ stationsList
        +__init__()
        +addStation(BikeStation station) None
        +getStationsByDistrict(str district) list~BikeStation~
        +getAllStations() list~BikeStation~
        +replaceAll(Sequence~BikeStation~ stations) None
    }
    class ApiFetcher {
        -str apiUrl
        -str apiKey
        -float timeout
        +__init__(str apiUrl, str apiKey, float timeout=10.0)
        +fetchRawData(int startIndex=1, int endIndex=1000) str
        +fetchStations() list~BikeStation~
    }
    class StationAnalyzer {
        -StationReader repository
        +__init__(StationReader repository)
        +calculateDistrictStats() DistrictStatsMap
        +getShortageStations() list~BikeStation~
        +calculateSummary() StationStats
    }
    class DashboardController {
        -StationSource fetcher
        -StationAnalytics analyzer
        -StationStore repository
        -Optional~datetime~ fetchedAt
        +__init__(StationSource fetcher, StationAnalytics analyzer, StationStore repository)
        +refreshData() None
        +renderCharts() ChartData
        +renderHeatmap() list~StationView~
        +getDashboard() DashboardSnapshot
    }
    StationRepository "1" *-- "*" BikeStation : 보관 및 관리
    ApiFetcher ..> BikeStation : 생성
    StationAnalyzer --> StationRepository : StationReader로 조회
    DashboardController --> ApiFetcher : StationSource로 수집
    DashboardController --> StationAnalyzer : StationAnalytics로 분석
    DashboardController --> StationRepository : StationStore로 갱신 및 조회
    DashboardController ..> BikeStation : StationView로 변환
```
