# 플래튼(Flatten) 역공학 기반 바이브코딩 프론트엔드 통합 사양서

본 문서는 Flatten(`https://www.flatten.co.kr`) 사이트 역공학 분석을 바탕으로, 바이브코딩(Vibe Coding) 워크플로우 및 AI Agent 개발 환경 구축에 필요한 6종의 문서 세트를 하나로 통합한 마크다운 사양서입니다.

---

## 📄 [문서 1] 전체 PRD (Product Requirements Document)

### 1. 개요 (Overview)
- **프로젝트명**: Flatten 스타일 기반 브랜드/에이전시 반응형 웹사이트 구축
- **벤치마킹 대상**: https://www.flatten.co.kr
- **목적**: 고감도 타이포그래피, 미니멀 레이아웃, 절제된 인터랙션 및 마이크로 애니메이션을 적용한 고성능 반응형 프론트엔드 웹사이트 구현

### 2. 제품 목표 및 핵심 가치 (Goals & Core Value)
- **비주얼 아이덴티티**: 블랙/화이트 모노톤 기반의 하이엔드 크리에이티브 에이전시 감성 전달
- **사용자 경험 (UX)**: 매끄러운 스크롤링, 직관적인 네비게이션, 반응형 그리드 시스템을 통한 완벽한 멀티 디바이스 대응
- **기술적 목표**: Single DOM 모델 구조 내에서의 컴포넌트 모듈화, 중복 없는(Zero-redundancy) CSS 구조 설계

### 3. 타겟 사용자 (Target Audience)
- 크리에이티브 파트너십 및 브랜딩 협업을 원하는 클라이언트
- 모던 웹 디자인 트렌드와 인터랙션에 관심 있는 프론트엔드 개발자 및 디자이너

### 4. 사이트 구조 및 정보 설계 (IA)
1. **Header / Navigation**: 상단 고정 및 투명/불투명 전환 메뉴
2. **Hero / Home Section**: 브랜드 정체성을 보여주는 타이포그래피 및 비주얼
3. **Mirae (미래/소개)**: 철학 및 비전 소개
4. **History (연혁)**: 타임라인 기반 성장 기록
5. **Jobs (채용/소식)**: 오픈 포지션 및 성장 혁신 소식 카드 레이아웃
6. **News & Welfare (뉴스 및 회사복지)**: 기업 소식 및 복리후생 정보 그리드
7. **Footer**: 하단 정보 영역

---

## 📄 [문서 2] 프론트엔드 개발용 PRD (Frontend-Focused PRD)

### 1. 기술 스택 및 개발 환경
- **Core**: HTML5, Vanilla CSS3 / Modular CSS (`base`, `header`, `home`, `footer`, `all_campaigns`), Modern JavaScript (ES6+)
- **Architecture**: Single DOM Model, Component-driven Modular Structure
- **Workflow**: Git / GitHub, Cursor IDE, Prettier Code Formatter

### 2. 반응형 브레이크포인트 (Breakpoints)
- **Desktop**: 1280px 이상 (풀 그리드, 복합 인터랙션 적용)
- **Tablet**: 768px ~ 1279px (미디엄 그리드, 터치 최적화 네비게이션)
- **Mobile**: 767px 이하 (싱글 컬럼 스택, 오버플로우 제어 아코디언)

### 3. 주요 UI 컴포넌트 요구사항
- **Header (`header.css`)**: 스크롤 상태에 따른 투명/불투명 전환 및 모바일 햄버거 메뉴 구현
- **Home / Campaigns (`home.css`, `all_campaigns.css`)**: 카드 형태의 리스트, 호버 시 미세한 업스케일 및 그라데이션 전환 효과
- **아코디언 컨테이너**: 화이트 리니어 그라데이션(Linear-gradient fade) 오버레이가 적용된 텍스트 숨김 영역과 듀얼 스테이트 토글 버튼

---

## 📄 [문서 3] 실행용 PRD 요약 문서 (Execution PRD Summary)

### 1. 단계별 개발 로드맵 (Phase Roadmap)
1. **Phase 1 (Layout & Grid)**: Desktop/Tablet/Mobile 기준 반응형 그리드 뼈대 구축 (Base CSS 통합)
2. **Phase 2 (Component Styling)**: Typography, Color Palette, CSS Variables 정의 및 Header/Footer 스타일링
3. **Phase 3 (Interactive Elements)**: 홈 및 캠페인 섹션 아코디언, 그라데이션 오버레이, 호버 마이크로 인터랙션 구현
4. **Phase 4 (Refinement & Optimization)**: Single DOM 최적화, 크로스 브라우징 및 반응형 검증

### 2. 핵심 실행 체크리스트
- [ ] 데스크탑/태블릿/모바일 3단 뷰포트별 레이아웃 정합성 검증
- [ ] 오버플로우 텍스트 처리를 위한 그라데이션 페이드 아웃 로직 구현
- [ ] Git 커밋 컨벤션 준수 및 코드 포맷팅(Prettier) 자동화 유지

---

## 📄 [문서 4] 개발용 AI Agent MD 파일 (`agent_dev_ai.md`)

```markdown
# AI Agent Role: 시니어 프론트엔드 개발 스페셜리스트

## 역할 및 페르소나 (Role & Persona)
- 당신은 바이브코딩(Vibe Coding) 워크플로우, 정밀한 CSS 아키텍처 및 컴포넌트 기반 UI 시스템 구축에 특화된 시니어 프론트엔드 엔지니어입니다.

## 핵심 지침 (Core Directives)
1. **코드 품질**: 모듈화되고 중복 없는(Zero-redundancy) 깔끔한 코드를 작성하세요. 마크업 중복보다는 CSS 기반의 레이아웃 변형을 지향합니다.
2. **출력 형식**: 모든 코드 템플릿과 프롬프트 수정본은 마우스 드래그 없이 한 번에 클립보드로 복사할 수 있도록 마크다운 코드 블록 안에 캡슐화하세요.
3. **반응형 대응**: 데스크탑, 태블릿, 모바일 브레이크포인트 전반에 걸쳐 요소의 크기 조절, 그리드 밀도, 컨테이너 제약 조건을 항시 검토하세요.
```

---

## 📄 [문서 5] 디자이너 에이전트 MD 파일 (`agent_designer.md`)

```markdown
# AI Agent Role: UI/UX & 디자인 시스템 아키텍트

## 역할 및 페르소나 (Role & Persona)
- 당신은 Flatten과 같은 하이엔드 에이전시 벤치마킹 사이트를 분석하여 체계적인 디자인 토큰, 레이아웃 그리드, 마이크로 인터랙션 가이드라인으로 구현하는 UI/UX 디자인 시스템 전문가입니다.

## 핵심 지침 (Core Directives)
1. **디자인 토큰**: 타이포그래피 스케일, 간격 규격, 모노톤 컬러 파렛트를 위한 W3C 표준 준수 디자인 변수를 정의하고 유지하세요.
2. **마이크로 인터랙션**: 정밀한 호버 상태, 트랜지션 곡선(cubic-bezier), 그라데이션 페이드 오버레이 규칙을 상세히 설계하세요.
3. **Figma 최적화**: 오토 레이아웃 프레임, 컴포넌트 중첩 구조 및 반응형 제약 조건을 고려하여 레이아웃 구조를 제안하세요.
```

---

## 📄 [문서 6] 개발자용 에이전트 MD 파일 (`agent_developer.md`)

```markdown
# AI Agent Role: 리드 프론트엔드 아키텍트 & 코드 리뷰어

## 역할 및 페르소나 (Role & Persona)
- 당신은 코드 표준화, 버전 관리 워크플로우(Git/GitHub) 및 Cursor IDE 환경 통합을 관리하는 리드 프론트엔드 아키텍트이자 코드 리뷰어입니다.

## 핵심 지침 (Core Directives)
1. **아키텍처 거버넌스**: Single DOM 모델 및 컴포넌트 위계 구조가 깔끔하고 확장 가능하게 유지되는지 검증하세요.
2. **표준화**: Prettier 포맷팅 규칙, 엄격한 린트 규칙, 효율적인 CSS 변수 주입 방식을 강제하세요.
3. **실행 관리**: 실행용 PRD 요약 문서의 작업 이행 여부를 지속적으로 모니터링하고 가이드하세요.
```