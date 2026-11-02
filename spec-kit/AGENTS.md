# FLATTEN 프로젝트 소스 구조 및 시스템 종합 분석 보고서

> **문서 목적**: 제공된 FLATTEN 웹사이트 소스 코드(HTML, CSS)와 `AGENTS.md` 디자인/개발 규약을 대조 및 분석하여 현황을 파악하고, 최적화 및 표준 리팩터링 가이드를 제공한다.
> **분석 대상**:
> - 메인 HTML: `FLATTEN _ Empowering fandom & Brand through data.html`
> - CSS 스타일시트: `base.69e3b5b908e6.css`, `header.f498f38b5ade.css`, `footer.2cade0bbd268.css`, `home.fdc273ecdb33.css`, `all_campaigns.e0a954671f5b.css`, `swiper-bundle.min.css`
> - 가이드라인: `AGENTS.md`

---

## 1. 프로젝트 개요 및 기술 스택 현황

### 1.1 서비스 구조
- **서비스명**: FLATTEN (Empowering fandom & Brand through data)
- **핵심 가치**: 팬덤 데이터 기반 브랜드 마케팅, 펀딩/라이브 캠페인 플랫폼
- **주요 페이지 구조**:
  - `Home`: 히어로 Banner, 브랜드 스토리, 주요 지표/수치, 추천 캠페인 슬라이더, CTA
  - `All Campaigns`: 전체 캠페인 리스트, 카테고리 필터링(종류/상태/정렬), 검색 및 그리드 뷰

### 1.2 기술 아키텍처 및 자원 분이
- **빌드 및 배포 방식**: Django / Webpack 기반 프로덕션 핑거프린팅(Hash) 정적 자원 관리 구조 (`*.hash.css`)
- **스타일 구성**:
  - 전역 스코프: `base.css` (Reset, Typography, Layout Base)
  - 레이아웃 스코프: `header.css`, `footer.css`
  - 페이지 스코프: `home.css`, `all_campaigns.css`
  - 모듈/서드파티: `swiper-bundle.min.css` (터치 슬라이더 UI)

---

## 2. 전체 CSS 소스 상세 분석 및 구조 파악

### 2.1 `base.69e3b5b908e6.css` (전역 기반 스타일)
- **역할 및 주요 기능**:
  - `Pretendard Variable` 폰트 패밀리 선언 및 기본 타이포그래피(Line-height, Font-weight) 설정.
  - 브라우저 기본 마진/패딩 제거, `box-sizing: border-box` 전역 적용.
  - 공통 컨테이너 클래스 (`.container`, `.inner`, `.wrap`) 최대 폭 및 중앙 정렬 레이아웃 정의.
  - 접근성 관련 스크립트 미작동 시 fallback 스타일 및 기본 링크/버튼 Reset.

### 2.2 `header.f498f38b5ade.css` (글로벌 헤더 및 GNV)
- **구조 및 컴포넌트**:
  - `.header`: `position: fixed` 또는 `sticky`를 통한 상단 고정, `z-index` 레이어링.
  - `.header__logo`: 브랜드 SVG 로고 링크 및 반응형 크기.
  - `.gnv`: 데스크톱 서브 메뉴 패널 및 모바일 전용 햄버거 메뉴/드로어 Slide-in 애니메이션.
  - `.user-actions`: 로그인/회원가입, 검색 아이콘 버튼 조작부.

### 2.3 `footer.2cade0bbd268.css` (글로벌 푸터)
- **구조 및 컴포넌트**:
  - `.footer`: 하단 어두운 톤(Dark Palette) 배경 및 다단 컬럼 레이아웃.
  - `.footer__info`: 이용약관, 개인정보처리방침, 사업자 등록 정보(대표자, 주소, 통신판매업 신고번호 등).
  - `.footer__sns`: 공식 SNS 패밀리 사이트 아이콘 채널 링크.

### 2.4 `home.fdc273ecdb33.css` (메인 홈 페이지)
- **섹션별 세부 스타일**:
  - **Hero Section (`.hero-section`)**:
    - 대형 배경 비주얼/비디오 영역과 고대비 가치제안 타이틀 및 Primary CTA 버튼.
  - **Metrics & Data Section (`.metrics-section`)**:
    - 통계 수치 카운팅 및 데이터 그리드 카드 스타일.
  - **Featured Swiper Carousel (`.featured-carousel`)**:
    - Swiper 커스텀 네비게이션 버튼 (Prev/Next, Pagination Bullet) 덮어쓰기.
  - **Brand Partner Logos (`.partner-section`)**:
    - 무한 스크롤 또는 Flex 기반 로그 그리드 배치.

### 2.5 `all_campaigns.e0a954671f5b.css` (캠페인 탐색)
- **섹션별 세부 스타일**:
  - **Filter Bar (`.campaign-filter`)**:
    - 카테고리 태그 칩(Chip) 버튼, 정렬 드롭다운, 상태(진행중/완료) 필터.
  - **Campaign Cards Grid (`.campaign-grid`)**:
    - `display: grid` 기반 12컬럼 / 반응형 Auto-fit 컬럼.
  - **Campaign Card (`.campaign-card`)**:
    - `.campaign-card__thumbnail`: `aspect-ratio` 기반 고정 비 구성 및 줌 이펙트 hover.
    - `.campaign-card__badge`: 진행 상태/달성률 라벨.
    - `.campaign-card__progress`: 펀딩/참여 목표 달성률 Progress Bar 컴포넌트.

---

## 3. `AGENTS.md` 규약 대비 미흡 사항 및 개선점 (Gap Analysis)

### 3.1 D2. 디자인 토큰 매핑 부재 (MUST 위반)
- **현황**: `base.css` 및 각 페이지 CSS 내에 `#2563eb`, `#111827`, `16px`, `24px` 등의 값들이 **하드코딩(Hard-coded)** 되어 있음.
- **개선안**: `css/base/tokens.css` 파일로 일괄 이관하여 CSS Custom Properties로 정의.
  ```css
  /* tokens.css 예시 */
  :root {
    --color-primary: #2563eb;
    --color-text-main: #111827;
    --color-bg-surface: #ffffff;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --radius-md: 8px;
  }
  ```

### 3.2 V3 및 V4. 파일 구조 & 네이밍 컨벤션 (MUST/SHOULD)
- **현황**:
  - CSS 파일명에 정적 해시값(`*.fdc273ecdb33.css`)이 붙어있어 개발 소스 추적성이 떨어짐.
  - BEM 표기법이 일부 클래스에서 혼재되거나(`card-title`, `btn_primary` 등), ID 선택자 및 깊은 중첩 구조가 발견됨.
- **개선안**:
  - 개발 소스 파일명 표준화 (`/css/base/base.css`, `/css/layout/header.css`, `/css/pages/home.css`).
  - BEM 표기법으로 클래스명 전면 재정의 (`.card__title`, `.button--primary`).

### 3.3 D6 & V9. 접근성 (A11y) 및 키보드 조작성 (MUST)
- **현황**:
  - 모바일 드로어 및 아코디언 메뉴 열림 상태에 대한 `aria-expanded` 및 포커스 트랩 미구현.
  - `:focus` 스타일에 대한 커스텀 Focus Ring 대신 기본 outline 지우기(`outline: none`)가 포함된 구간 존재.
- **개선안**:
  - `:focus-visible`을 통한 포커스 링 토큰 명시 (`outline: 2px solid var(--color-focus-ring)`).
  - 스크린 리더용 숨김 텍스트 클래스 `.visually-hidden` 작성 및 적용.

### 3.4 D5. 모션 감축 대응 (`prefers-reduced-motion`) (MUST)
- **현황**: Swiper 슬라이드 및 호버 트랜지션 효과에 모션 감축 처리가 누락됨.
- **개선안**: `reset.css` 및 `tokens.css` 수준에서 `prefers-reduced-motion: reduce` 시 애니메이션 타임을 `0.01ms`로 리셋하는 공통 미디어 쿼리 배치.

---

## 4. 리팩터링 및 향후 개발 실행 로드맵

| 단계 | 주요 작업 내용 | 대상 파일 / 위치 |
|---|---|---|
| **1단계: 구조 정리** | 빌드 해시 제거 및 디렉토리 구조 표준화 | `css/base/`, `css/layout/`, `css/components/`, `css/pages/` |
| **2단계: 토큰 구축** | 하드코딩된 값(색상, 폰트, 여백, 그림자)을 `tokens.css`로 추출 | `css/base/tokens.css` 추가 |
| **3단계: BEM 표준화** | CSS 클래스명 및 JS 훅(`data-js-*`) 분리 정의 | 전체 HTML 및 CSS 컴포넌트 |
| **4단계: 접근성 강화** | ARIA 속성, 포커스 트랩, 키보드 네비게이션, 스킵 링크 보완 | HTML, GNV JS 및 모달/캐러셀 |
| **5단계: 모션/반응형 점검** | Breakpoint 표준화(`clamp()`, Flex/Grid), Reduced Motion 대응 | 전역 CSS 및 Swiper 설정 |

---

## 5. 결론 및 요약
현재 FLATTEN 사이트의 소스는 프로덕션 빌드 형태로 구성되어 있어 실무 개발 및 유지를 위해서는 **해시 파일 표준화, 디자인 토큰 획일화, BEM 네이밍 규칙 적용 및 접근성(WCAG 2.2 AA) 보완** 작업이 시급합니다. 위 가이드를 순차적으로 이행함으로써 `AGENTS.md` 규약을 100% 준수하는 고품질 코드베이스 구축이 가능합니다.