# 🍽️ 회식의 정석 (TeamDinner Planner - 성남시 분당구 특화)

> **Serverless & Zero-API 회식 플래너**  
> 백엔드 서버 없이 웹 브라우저 단독으로 실행되며, 네이버 지오코딩 API를 활용한 성남시 분당구 공공데이터(4만건 지원) 일괄 변환 파이프라인과 무료 오픈소스 지도(Leaflet), 룰 기반 의사결정 엔진을 탑재한 웹 애플리케이션입니다.

---

## 🌟 주요 특징

1. **Zero-Backend & Zero-API Key (프론트엔드 단독 실행)**
   - 브라우저에서 `index.html` 더블 클릭만으로 즉시 작동.
   - 무료 오픈 지도(Leaflet + OpenStreetMap)로 1/2/3위 마커 및 팝업 렌더링.
2. **성남시 분당구 공공데이터 4만 건 일괄 전처리 스크립트 제공**
   - 컬럼: `구`, `업종명`, `사업장명`, `영업상태`, `인허가일자`, `폐업일자`, `영업장면적`, `소재지(도로명주소)`, `소재지(지번)`, `데이터기준일자` 지원.
   - 영업/정상 상태 필터링, 분당구 권역별 세분화(판교, 정자, 서현, 야탑 등), 면적 기반 룸 구비 여부 추정, 네이버 지오코딩 API 일괄 변환(`tools/process_public_data.py`).
3. **AI 토큰 비용 0원 (수학적 룰 기반 다면 평가)**
   - 일정 최다 득표일 자동 취합, 확정 인원 총비용 계산, 가중치 기반 Top 3 추천.
4. **슬랙 / 카카오톡 공지문 텍스트 원클릭 복사**

---

## 🔑 .env 설정 (네이버 Maps API 키)

프로젝트 루트의 `.env` 파일에 네이버 클라우드 플랫폼에서 발급받은 API 키를 입력합니다:

```env
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

---

## 📁 프로젝트 구조

```
teamdinner/
├── index.html                  # 메인 웹앱 진입점 (더블 클릭 실행)
├── .env                        # 네이버 Maps API 키 설정 파일
├── .env.example                # 설정 템플릿
├── css/
│   └── style.css               # 모던 반응형 스타일시트
├── js/
│   ├── data.js                 # 공공데이터 정제 식당 DB
│   ├── calculator.js           # 취합, 예산 계산, 다면 스코어링 엔진
│   ├── map.js                  # Leaflet.js 오픈 지도 렌더러
│   └── app.js                  # UI 제어 & 공지문 텍스트 생성
├── tools/
│   ├── process_public_data.py  # 4만건 공공데이터 일괄 변환 파이썬 스크립트
│   └── sample_public_data.csv  # 테스트용 샘플 CSV
└── README.md                   # 프로젝트 설명서
```

---

## 🚀 4만 건 공공데이터 일괄 변환 실행 방법

보유하고 계신 공공데이터 CSV 파일을 프로젝트 폴더에 넣고 아래 명령어를 실행하면 `js/data.js` 파일이 자동으로 생성됩니다:

```bash
# 기본 실행 (tools/sample_public_data.csv 변환)
python tools/process_public_data.py

# 사용자의 실제 공공데이터 CSV 파일 변환
python tools/process_public_data.py "경로/보유하신_공공데이터.csv"
```
