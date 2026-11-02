# FLATTEN — Empowering fandom & Brand through data

> **AI 에이전트(바이브코딩) 및 개발자 안내문**
> 이 프로젝트에 참여하는 모든 개발자 및 AI 에이전트는 작업 시작 전 본 문서와 `spec-kit/` 내 규약을 반드시 숙지하고 준수해야 합니다.

---

## 🚨 [필수] 작업 시작 전 확인 사항 (AI Agent Guidelines)

모든 디자인·개발 작업은 **`spec-kit/AGENTS.md`에 정의된 규약(Project Conventions)**을 엄격히 따른다.

1. **규정 문서 위치**: `/spec-kit/AGENTS.md` (디자인 토큰, BEM 네이밍, HTML/CSS/JS 개발 규약 및 접근성 표준)
2. **분석 보고서 위치**: `/docs/project_analysis.md` (기존 소스 분석 및 리팩터링 실행 계획)
3. **작업 철학**:
   - **기존 코드 분석 우선**: 코드 작성 전 `/css/base/tokens.css`, 컴포넌트, 유틸리티를 먼저 확인하고 재사용한다.
   - **일관성 보장**: 스타일·스크립트를 직접 하드코딩하지 말고 정의된 토큰과 규칙을 사용한다.
   - **단일 책임 & 순수 스택**: HTML5 + CSS3 + Vanilla JS(ES2022+) 기준이며, 허가 없는 외부 라이브러리 추가를 금지한다.

---

## 📁 디렉터리 구조 (Target Structure)

프로젝트 코드는 아래 고정 구조를 기준으로 유지·리팩터링한다.

```
/
├─ index.html                  # 메인 페이지 (Home)
├─ pages/                      # 추가 페이지 (all_campaigns.html 등)
├─ spec-kit/
│  └─ AGENTS.md                # [MUST] 에이전트 필수 준수 디자인/개발 규약
├─ docs/
│  └─ project_analysis.md      # 프로젝트 분석 및 개선 계획 문서
├─ assets/
│  ├─ fonts/
│  ├─ images/                  # webp/avif 우선
│  ├─ icons/                   # svg
│  └─ media/
├─ css/
│  ├─ base/
│  │  ├─ tokens.css            # [Single Source of Truth] 디자인 토큰
│  │  ├─ reset.css             # 기본 초기화 및 Reduced Motion 대응
│  │  └─ typography.css
│  ├─ layout/                  # header.css, footer.css, grid.css
│  ├─ components/              # button.css, card.css 등 컴포넌트 단위
│  ├─ pages/                   # home.css, all-campaigns.css
│  └─ main.css                 # @layer 선언 및 스타일 진입점
├─ js/
│  ├─ main.js                  # 진입점 (Module)
│  ├─ components/              # header.js, carousel.js 등
│  └─ utils/                   # dom.js, storage.js 등
├─ README.md                   # 프로젝트 진입점 안내 (본 문서)
└─ AGENTS.md -> /spec-kit/AGENTS.md
```

---

## 🛠 주요 개발 수칙 요약

* **CSS / Styling**:
  - CSS Custom Properties(`var(--color-primary)`)로만 스타일 지정 (HEX/RGB 직접 사용 금지).
  - BEM 표기법(`block__element--modifier`) 준수.
  - `@layer reset, tokens, base, layout, components, pages, utilities;` 명시도 관리.
* **HTML / Accessibility**:
  - 시맨틱 태그(`<header>`, `<nav>`, `<main>`, `<footer>`) 및 `h1`~`h3` 계층 명확화.
  - ARIA 속성 및 `:focus-visible` 포커스 링, 터치 타깃 44px 이상 보장.
* **JavaScript**:
  - `data-js-*` 속성 선택자 이용 (클래스명 직접 결합 금지).
  - ES Modules (`type="module"`) 활용, global 오염 금지.

---

## 📋 Definition of Done (작업 완료 기준)

- [ ] `/spec-kit/AGENTS.md` 규약 검수 완료
- [ ] 하드코딩된 색상/치수 없이 디자인 토큰 사용 확인
- [ ] W3C HTML 유효성 검사 및 브라우저 콘솔 에러 0건
- [ ] 반응형 브레이크포인트(375, 768, 1280) 및 키보드 웹 접근성 동작 확인
- [ ] 에이전트 응답 프로토콜(A2) 양식에 맞춰 작업 결과 보고

---

**작업 시작 명령**: 에이전트는 `/spec-kit/AGENTS.md`와 `/docs/project_analysis.md`를 읽은 후 주어진 Task를 이행하십시오.