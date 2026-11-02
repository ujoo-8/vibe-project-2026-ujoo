# 프로젝트 규약 (Project Conventions)

> 이 문서는 AI 에이전트(바이브코딩)가 **디자인·개발 모든 작업에서 반드시 따르는 규약**이다.
> 작성 기준: 15년차 웹 디자이너 / 15년차 웹 개발자의 실무 기준.
> 스택: **순수 HTML5 + CSS3 + JavaScript(ES2022+)**. 별도 지시가 없으면 프레임워크·라이브러리를 도입하지 않는다.

---

## 0. 문서 사용법

### 0.1 규칙 강도 표기
| 표기 | 의미 |
|---|---|
| **MUST / 반드시** | 예외 없음. 위반 시 작업 미완료로 간주 |
| **SHOULD / 권장** | 특별한 사유가 없으면 따른다. 벗어날 경우 이유를 주석 또는 응답에 명시 |
| **MUST NOT / 금지** | 절대 하지 않는다 |

### 0.2 우선순위 (충돌 시)
1. 사용자의 명시적 지시
2. 이 문서의 MUST / MUST NOT
3. 프로젝트에 이미 존재하는 코드·토큰·컴포넌트 (**기존 패턴 우선**)
4. 이 문서의 SHOULD
5. 에이전트 개인 판단

### 0.3 에이전트 기본 태도
- **추측하지 말고 먼저 읽는다.** 작업 전 기존 파일(`/css/tokens.css`, `/css/components/`, `/js/`)을 확인하고 이미 있는 것을 재사용한다.
- **새로 만들기 전에 재사용을 검토한다.** 비슷한 컴포넌트·유틸이 있으면 확장한다.
- **일관성이 창의성보다 우선한다.** "더 멋진" 방식보다 "이 프로젝트와 같은" 방식을 선택한다.
- **요청 범위만 변경한다.** 요청하지 않은 리팩터링·스타일 변경·파일 이동을 하지 않는다.
- 불명확한 요구는 합리적 가정을 세워 진행하되, **가정한 내용을 응답 끝에 목록으로 명시**한다. 되돌리기 어려운 결정(구조 변경, 파일 삭제)만 먼저 질문한다.

---

# PART 1. DESIGNER 규약

## D1. 디자인 철학
1. **목적 우선**: 모든 화면 요소는 사용자 목표 또는 비즈니스 목표에 기여해야 한다. 장식만을 위한 요소는 넣지 않는다.
2. **시각적 위계**: 한 화면에 **주인공(Primary)은 하나**다. 시선 흐름은 `제목 → 핵심 정보 → CTA` 순으로 설계한다.
3. **일관성**: 같은 역할은 같은 모양. 다른 역할은 다른 모양.
4. **절제**: 색 · 폰트 · 그림자 · 라운드 · 애니메이션은 시스템에 정의된 범위 안에서만 쓴다.
5. **여백은 디자인 요소다**: 빽빽함보다 호흡을 우선한다.
6. **접근성은 기본값**이다. 옵션이 아니다.

## D2. 디자인 토큰 (Single Source of Truth)
모든 시각 값은 **토큰으로만** 사용한다. 컴포넌트 CSS에 **하드코딩된 색상(HEX/RGB), px 간격, 폰트 크기를 직접 쓰는 것을 금지**한다.

토큰 정의 위치: `css/base/tokens.css` (`:root`에 CSS Custom Properties로 정의)

### D2.1 컬러
**MUST**
- 팔레트는 아래 역할 기준으로 **최대 구성**을 지킨다.

| 역할 | 개수 | 설명 |
|---|---|---|
| Brand Primary | 1색 + 명도 스케일(50~900) | 주요 CTA, 링크, 강조 |
| Brand Secondary | 0~1색 + 스케일 | 보조 강조 (필요할 때만) |
| Neutral(Gray) | 스케일 50~900 | 텍스트, 배경, 보더 |
| Semantic | success / warning / danger / info 각 1색(+배경용 연한 톤) | 상태 피드백 |

- 색상 사용 비율 가이드: **Neutral 70~80% / Primary 10~15% / 기타 5~10%**
- 의미 기반 토큰(semantic token)을 컴포넌트에서 사용한다.
  ```css
  /* 원시 토큰 */
  --color-blue-600: #2563eb;
  /* 의미 토큰 (컴포넌트는 이것만 참조) */
  --color-text-default: var(--color-gray-900);
  --color-text-muted: var(--color-gray-600);
  --color-bg-surface: #fff;
  --color-border-default: var(--color-gray-200);
  --color-action-primary: var(--color-blue-600);
  --color-action-primary-hover: var(--color-blue-700);
  --color-focus-ring: var(--color-blue-500);
  ```
- **대비(WCAG 2.2 AA)**: 일반 텍스트 **4.5:1 이상**, 큰 텍스트(18px bold / 24px 이상) 및 UI 컴포넌트 경계·아이콘 **3:1 이상**.
- **색만으로 정보를 전달하지 않는다.** (에러는 색 + 아이콘 + 텍스트)
- 다크모드를 지원하는 경우 의미 토큰을 `prefers-color-scheme` 및 `[data-theme="dark"]`에서 **재정의**한다. 컴포넌트 CSS는 수정하지 않는다.

**MUST NOT**: 순수 `#000` 텍스트 + 순수 `#fff` 배경의 고대비 남용, 그라디언트 남발, 무지개식 다색 사용.

### D2.2 타이포그래피
- 폰트 패밀리는 **최대 2종**(본문/UI 1종 + 디스플레이 1종 선택). 한국어 서비스는 한글 폰트 우선.
  ```css
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
               "Segoe UI", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  ```
- **타입 스케일**은 고정된 비율(예: Major Third 1.25)로 정의하고 그 밖의 크기는 쓰지 않는다.

| 토큰 | 용도 | 데스크톱 | 모바일 | line-height | weight |
|---|---|---|---|---|---|
| `--fs-display` | 히어로 | 56px | 36px | 1.2 | 700 |
| `--fs-h1` | 페이지 제목 | 40px | 30px | 1.25 | 700 |
| `--fs-h2` | 섹션 제목 | 32px | 24px | 1.3 | 700 |
| `--fs-h3` | 소제목 | 24px | 20px | 1.35 | 600 |
| `--fs-h4` | 카드 제목 | 20px | 18px | 1.4 | 600 |
| `--fs-body` | 본문 | 16px | 16px | 1.6~1.7 | 400 |
| `--fs-small` | 보조 | 14px | 14px | 1.5 | 400 |
| `--fs-caption` | 캡션/라벨 | 12~13px | 12~13px | 1.4 | 500 |

- **본문 최소 16px.** 12px 미만 텍스트 금지. 모바일 입력창은 **16px 이상**(iOS 자동 확대 방지).
- 한 줄 길이: 본문은 **한글 기준 약 35~45자 / 영문 45~75자** (`max-width: 65ch` 내외).
- 한글은 `word-break: keep-all; overflow-wrap: break-word;`를 기본 적용한다.
- 굵기는 **400 / 500 / 600 / 700** 중에서만 사용한다. 한 화면에서 굵기 3종 이내.
- `letter-spacing`: 한글 본문 `-0.01em ~ 0`, 대문자 라벨만 양수 허용. `text-align: justify` 금지.
- 폰트는 `font-display: swap`, 가능하면 서브셋/가변 폰트 사용.

### D2.3 간격 (Spacing) – 8pt 시스템
- 기본 단위 **4px**, 레이아웃 단위 **8px**. 허용 값만 사용한다.
  ```css
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --space-9: 96px; --space-10: 128px;
  ```
- **근접성 원칙**: 관련된 요소 간격 < 무관한 요소 간격. 섹션 간 세로 간격은 데스크톱 `--space-9`, 모바일 `--space-7` 기준.
- 임의의 `margin: 13px`, `padding: 7px` 같은 매직 넘버 **금지**.

### D2.4 레이아웃 & 그리드
- 컨테이너 최대폭: **1200px** (텍스트 중심 페이지 720~800px). 좌우 패딩 모바일 16px / 태블릿 24px / 데스크톱 32px.
- 그리드: **12컬럼**, gutter 데스크톱 24px / 모바일 16px.
- **모바일 퍼스트**로 설계한다. 브레이크포인트는 아래만 사용한다.

| 이름 | 범위 | 토큰 |
|---|---|---|
| xs (기본) | ~ 479px | (기본 스타일) |
| sm | ≥ 480px | `--bp-sm` |
| md | ≥ 768px | `--bp-md` |
| lg | ≥ 1024px | `--bp-lg` |
| xl | ≥ 1280px | `--bp-xl` |

- 레이아웃이 깨지는 지점이 있어도 **새 브레이크포인트를 추가하지 말고** 컴포넌트를 유연하게(`auto-fit`, `clamp`) 만든다.
- 시각적 정렬: 좌측 정렬 기본. 중앙 정렬은 히어로·짧은 문구에만 사용.

### D2.5 모서리 / 보더 / 그림자 / 레이어
```css
--radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 16px;  --radius-full: 9999px;
--shadow-sm: 0 1px 2px rgb(0 0 0 / .06);
--shadow-md: 0 4px 12px rgb(0 0 0 / .08);
--shadow-lg: 0 12px 32px rgb(0 0 0 / .12);
--z-dropdown: 100; --z-sticky: 200; --z-overlay: 300; --z-modal: 400; --z-toast: 500;
```
- 라운드는 **프로젝트 성격에 맞게 하나의 기조**(각진/둥근)를 정하고 유지한다. 한 화면에 상충하는 라운드 혼용 금지.
- 그림자는 **높이(elevation)** 를 의미한다. 3단계를 초과하지 않는다.
- `z-index` 임의 숫자(`9999`) **금지**, 토큰만 사용.

## D3. 컴포넌트 디자인 규칙

### D3.1 공통
모든 인터랙티브 컴포넌트는 아래 **상태를 전부 디자인**한다. (하나라도 누락 시 미완료)

`default · hover · focus-visible · active(pressed) · disabled · loading · error · success` (해당되는 것)

- **터치 타깃 최소 44×44px**(데스크톱 최소 32px 이상). 인접 타깃 간 간격 8px 이상.
- **포커스 링은 반드시 보여야 한다**: 2px 이상 outline, 배경 대비 3:1 이상. `outline: none`만 쓰고 대체 스타일을 안 주는 행위 **금지**.
- hover는 데스크톱 보조 수단이다. **hover에만 의존하는 정보·기능 금지.**

### D3.2 버튼
- 위계: **Primary(화면당 1개) → Secondary → Tertiary(Ghost/Text)**. 한 화면에 Primary 2개 이상 금지.
- 크기: `sm 32px / md 40px / lg 48px` 높이. 좌우 패딩은 높이 비례(예: md = 20px).
- 버튼 라벨은 **동사로 시작**하는 2~8자 내외(예: "저장하기", "문의 보내기"). "확인", "클릭" 같은 모호한 문구 지양.
- 위험 동작(삭제 등)은 danger 스타일 + 확인 단계를 둔다.
- 로딩 시 **너비 유지**, 스피너 + `aria-busy`, 중복 클릭 방지.

### D3.3 폼
- 라벨은 **항상 보이게**(placeholder를 라벨 대용으로 쓰지 않는다). 라벨 위치: 입력창 **상단**.
- 필수/선택 표시를 통일한다. (예: 필수에 `*` + 스크린리더 텍스트)
- 에러 메시지는 **입력창 바로 아래**, 원인 + 해결 방법을 설명(“이메일 형식이 올바르지 않습니다. 예: name@example.com”).
- 유효성 검사는 **blur 시 + 제출 시**. 입력 중 과도한 실시간 에러 금지.
- 입력 필드 높이 `40~48px`, 모바일 `48px`, 폰트 16px 이상.
- 적절한 `type`, `inputmode`, `autocomplete`를 사용한다.

### D3.4 내비게이션
- 글로벌 내비 항목은 **최대 5~7개**. 현재 위치를 명확히 표시(`aria-current="page"`).
- 모바일: 햄버거/드로어 또는 하단 탭. 열림/닫힘 시 포커스 트랩과 `Esc` 닫기 제공.
- 로고 클릭 → 홈. 헤더는 sticky 시 높이 축소 등 콘텐츠 가림을 최소화.

### D3.5 카드 / 리스트 / 테이블
- 카드는 **한 가지 목적**만 갖는다. 내부 위계: 이미지 → 제목 → 설명 → 액션. 카드 전체 클릭 영역 사용 시 중첩 링크 금지.
- 테이블은 모바일에서 **가로 스크롤 래퍼 또는 카드형 변환**을 제공한다.
- 빈 상태(Empty), 로딩 상태(Skeleton), 에러 상태 화면을 **반드시** 설계한다.

### D3.6 모달 / 토스트 / 툴팁
- 모달은 **최후의 수단**. 가능하면 인라인으로 해결한다. 모달 내부에 모달 금지.
- 모달: 제목, 닫기 버튼, 배경 스크롤 잠금, 포커스 트랩, `Esc`/오버레이 클릭 닫기(파괴적 동작은 오버레이 클릭 닫기 금지).
- 토스트: 3~5초 후 자동 소멸, 중요한 오류는 자동 소멸 금지. `role="status"`(오류는 `role="alert"`).

## D4. 이미지 · 아이콘 · 미디어
- 아이콘 세트는 **하나의 라이브러리/스타일로 통일**(선 두께, 라운드, 크기). 24px 그리드 기준, 크기 `16/20/24/32`.
- 아이콘은 **SVG** 사용. 단독 아이콘 버튼은 반드시 접근 가능한 이름 제공.
- 이미지는 **고정 비율**(`16:9`, `4:3`, `1:1`, `3:4`)만 사용하고 `aspect-ratio`로 CLS를 방지한다.
- 이미지 위 텍스트는 **오버레이/그라디언트로 대비 확보**.
- 사진 톤(색감·채도·밝기)을 사이트 전체에서 통일한다. 임의의 스톡 이미지 남용 금지, 플레이스홀더는 `placeholder` 표시를 분명히 한다.
- 일러스트·사진·아이콘 스타일을 **한 페이지에서 혼용하지 않는다.**

## D5. 모션 & 인터랙션
- 목적: **피드백 / 상태 전환 / 주의 유도**에 한정. 장식용 상시 애니메이션 금지.
- 시간: 마이크로 인터랙션 `150~200ms`, 일반 전환 `200~300ms`, 큰 전환 `≤ 400ms`.
  ```css
  --ease-standard: cubic-bezier(.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0, 1);
  --ease-exit: cubic-bezier(.3, 0, 1, 1);
  --dur-fast: 150ms; --dur-base: 250ms; --dur-slow: 400ms;
  ```
- **애니메이션 속성은 `transform`, `opacity`만** 사용한다. (`width/height/top/left` 애니메이션 금지)
- **`prefers-reduced-motion: reduce`를 반드시 존중**한다. (패럴랙스·자동 슬라이드·큰 이동은 제거 또는 즉시 전환)
- 자동 재생 캐러셀 금지(필요 시 정지 버튼 제공). 깜빡임(초당 3회 이상) 금지.

## D6. 접근성 (디자인 관점, WCAG 2.2 AA)
- 색 대비 · 터치 타깃 · 포커스 · 텍스트 크기 조절(200% 확대 시 깨짐 없음) 충족.
- 정보 구조는 **제목 위계(h1 → h2 → h3)** 로 표현 가능해야 한다. 크기만 키운 가짜 제목 금지.
- 링크는 본문 내에서 **색 외에 밑줄 등 추가 단서**를 제공한다.
- 에러/성공/로딩 등 상태 변화는 시각 외에 **텍스트로도** 전달한다.
- 모든 이미지·아이콘에 대체 텍스트 정책(의미 있음 / 장식)을 지정한다.

## D7. UX 라이팅
- 어조: 프로젝트 톤(친근/전문)을 하나로 정해 통일. 존댓말 `~해요/~합니다` 중 **하나만** 사용.
- 문장은 짧게, 능동형, 사용자 관점. 전문 용어·내부 용어 지양.
- 에러 문구 공식: **무슨 일이 일어났는지 + 왜 + 어떻게 해결하는지**.
- 용어 통일: 같은 개념에는 같은 단어(예: "로그인"/"로그 인" 혼용 금지). 용어집은 `docs/glossary.md`에 관리.
- 더미 텍스트(Lorem ipsum) 대신 **실제와 유사한 카피**를 쓴다. 불가피하면 `[TODO: 카피]`로 표시.

## D8. 페이지 구성 원칙
1. 첫 화면(Above the fold)에 **가치 제안 + 주 CTA**가 보여야 한다.
2. 섹션은 **하나의 메시지**를 갖고, 섹션 간 배경·간격으로 구분한다.
3. 페이지당 CTA 종류는 최대 2종(Primary / Secondary).
4. 신뢰 요소(후기·로고·수치·보증)는 CTA 근처에 배치.
5. 푸터에는 필수 정보(연락처, 약관·개인정보 처리방침, 사업자 정보 등)를 둔다.

## D9. 디자이너 산출물 체크리스트 (Definition of Done)
- [ ] 모든 값이 토큰에서 왔다 (색/폰트/간격/라운드/그림자)
- [ ] 모바일(375) · 태블릿(768) · 데스크톱(1280) 레이아웃 정의
- [ ] 컴포넌트 전 상태(default~error) 정의
- [ ] 빈/로딩/에러 상태 정의
- [ ] 대비 AA 충족, 포커스 스타일 정의, 터치 타깃 44px
- [ ] 모션은 토큰 값, reduced-motion 대응 정의
- [ ] 카피가 실제 문구이며 용어가 통일됨

---

# PART 2. DEVELOPER 규약

## V1. 개발 철학
1. **단순함**: 가장 단순한 해법을 먼저 택한다. 추상화는 중복이 **3번 이상** 나타날 때만.
2. **의미론(Semantics) 우선**: HTML이 구조, CSS가 표현, JS가 동작. 역할을 섞지 않는다.
3. **점진적 향상(Progressive Enhancement)**: JS가 실패해도 핵심 콘텐츠와 링크·폼은 동작해야 한다.
4. **읽히는 코드**: 6개월 뒤의 내가, 타인이 이해할 수 있어야 한다. 영리함보다 명료함.
5. **접근성·성능·보안은 기능이다.** 나중에 붙이지 않는다.
6. **외부 의존성은 비용이다.** 도입 전 필요성·번들 크기·유지보수 상태를 검토하고, 지시 없이 추가하지 않는다.

## V2. 기술 스택 & 지원 범위
- **MUST**: HTML5, CSS3(Custom Properties, Grid, Flexbox, `clamp()`, `:where()`, `:has()`, 컨테이너 쿼리 활용 가능), JavaScript **ES Modules**(`type="module"`).
- **MUST NOT**: jQuery, 인라인 이벤트 핸들러(`onclick=""`), `var`, `document.write`, `eval`, `with`, 빌드 필요 없는 곳에 불필요한 번들러 도입.
- **지원 브라우저**: 최신 2개 메이저 버전의 Chrome / Edge / Safari / Firefox, iOS Safari 16+, Android Chrome. (IE 미지원)
- 최신 CSS/JS 기능은 [Baseline](https://web.dev/baseline) 기준 **Widely available**인 것만 사용한다. 신규 기능은 `@supports` 또는 기능 탐지로 폴백을 제공한다.
- 라이브러리가 꼭 필요하면(차트, 지도, 날짜 등) **용도·대안·크기를 응답에 명시**하고, 버전 고정 후 `/vendor` 또는 패키지 매니저로 관리한다. CDN 직접 링크는 SRI(`integrity`) + `crossorigin` 필수.

## V3. 디렉터리 구조 (고정)
```
/
├─ index.html
├─ pages/                  # 추가 페이지 (about.html, contact.html ...)
├─ assets/
│  ├─ fonts/
│  ├─ images/              # webp/avif 우선, 원본은 /assets/images/_src
│  ├─ icons/               # svg
│  └─ media/
├─ css/
│  ├─ base/
│  │  ├─ tokens.css        # 디자인 토큰 (유일한 값 정의처)
│  │  ├─ reset.css
│  │  ├─ typography.css
│  │  └─ utilities.css
│  ├─ layout/              # header, footer, grid, container
│  ├─ components/          # button.css, card.css, form.css, modal.css ...
│  ├─ pages/               # 페이지 전용 스타일 (최소화)
│  └─ main.css             # @import / @layer 선언 진입점
├─ js/
│  ├─ main.js              # 진입점 (초기화만)
│  ├─ components/          # 컴포넌트별 모듈 (modal.js, accordion.js ...)
│  ├─ utils/               # 순수 함수 (dom.js, format.js, storage.js ...)
│  ├─ services/            # API 통신, 데이터 계층
│  └─ config.js            # 상수/환경 설정
├─ docs/                   # glossary.md, decisions.md 등
├─ AGENTS.md               # 이 문서
└─ README.md
```
- 파일 하나 = 책임 하나. 컴포넌트 CSS와 JS는 **같은 이름**으로 쌍을 이룬다(`modal.css` ↔ `modal.js`).
- 새 폴더·구조 변경은 사용자 승인 없이 하지 않는다.

## V4. 네이밍 규칙
| 대상 | 규칙 | 예 |
|---|---|---|
| 파일/폴더 | `kebab-case`, 영문 소문자 | `product-card.css` |
| CSS 클래스 | **BEM** `block__element--modifier` | `.card__title--large` |
| 상태 클래스 | `is-` / `has-` 접두 | `.is-open`, `.has-error` |
| JS 훅 | `data-js-*` 속성 (스타일 클래스와 분리) | `data-js="modal-trigger"` |
| CSS 변수 | `--카테고리-이름` | `--color-text-muted` |
| JS 변수/함수 | `camelCase`, 함수는 **동사로 시작** | `openModal()` |
| JS 상수 | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| JS 클래스 | `PascalCase` | `class Accordion {}` |
| 불리언 | `is/has/can/should` 접두 | `isOpen`, `hasError` |
| 이벤트 핸들러 | `handle + 대상 + 이벤트` | `handleFormSubmit` |

- 약어·축약·한글 로마자 표기 금지(`btn`, `tmp`, `data1`, `ggoom`). 널리 쓰이는 `id`, `url`, `api`만 허용.
- 클래스명은 **외형이 아닌 역할**로 짓는다(`.red-box` ✗ → `.alert--danger` ✓).

## V5. HTML 규칙

### V5.1 문서 기본
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>페이지명 | 사이트명</title>
  <meta name="description" content="120~160자 요약">
  <link rel="canonical" href="https://example.com/">
  <link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#2563eb">
  <!-- OG / Twitter Card -->
  <link rel="stylesheet" href="/css/main.css">
  <script type="module" src="/js/main.js"></script>
</head>
```
- `lang` 필수. `viewport`에 `user-scalable=no`, `maximum-scale=1` **금지**(확대 허용).
- 페이지마다 **고유한** `title`, `description`, OG 태그.
- 스크립트는 `type="module"`(자동 defer) 또는 `defer`. 렌더 블로킹 스크립트 금지.

### V5.2 시맨틱 구조
- 랜드마크: `<header> <nav> <main> <footer>`(+ `<aside>`, `<section>`, `<article>`). `<main>`은 페이지당 1개.
- **스킵 링크**("본문 바로가기")를 `<body>` 최상단에 둔다.
- 제목은 `h1`(페이지당 1개) → `h2` → `h3` 순서로 **건너뛰지 않는다**. 스타일 목적으로 제목 레벨을 고르지 않는다.
- 클릭 가능한 것: **이동 → `<a href>`**, **동작 → `<button type="button">`**. `div`/`span`에 클릭 이벤트로 버튼을 만드는 행위 **금지**.
- 리스트는 `ul/ol`, 표는 `table`(`caption`, `th scope`), 폼 요소는 `label`과 연결(`for`/`id`).
- `<div>`/`<span>`은 **적절한 시맨틱 요소가 없을 때만** 사용한다.
- 인라인 `style=""` 금지(동적 값은 CSS 변수 주입: `el.style.setProperty('--x', v)`).
- 들여쓰기 2칸, 속성은 쌍따옴표, 불린 속성 값 생략, 자체 닫는 태그 슬래시 생략.

### V5.3 이미지/미디어
```html
<img src="..." alt="의미 있는 설명" width="800" height="450" loading="lazy" decoding="async">
```
- `alt` 필수(장식은 `alt=""`). `width`/`height` 필수(CLS 방지).
- 뷰포트 상단(LCP) 이미지는 `loading="lazy"` **금지**, `fetchpriority="high"` 고려.
- 반응형: `srcset` + `sizes` 또는 `<picture>`로 **avif/webp** 제공.
- 비디오: `controls`, `preload="metadata"`, 자막 `<track>`, 자동재생 시 `muted playsinline` + 정지 수단.

### V5.4 ARIA 원칙
- **ARIA 첫 번째 규칙: 네이티브 요소로 해결되면 ARIA를 쓰지 않는다.**
- 쓸 때는 완전하게: 역할(role) + 상태(`aria-expanded`, `aria-controls`, `aria-selected`) + 키보드 동작을 **세트로** 구현한다.
- 아이콘 버튼: `aria-label` 또는 시각적으로 숨긴 텍스트(`.visually-hidden`).
- 동적 알림: `aria-live="polite"` / `role="alert"`.

## V6. CSS 규칙

### V6.1 아키텍처
- **`@layer`로 우선순위를 관리**한다.
  ```css
  @layer reset, tokens, base, layout, components, pages, utilities;
  ```
- **명시도(Specificity)를 낮게 유지**: 선택자는 클래스 1개 수준(BEM), 중첩 깊이 **최대 3단계**.
- **`!important` 금지**(유틸리티 레이어의 `.visually-hidden` 등 명확한 예외만).
- **ID 선택자 스타일링 금지**, 태그+클래스 결합(`div.card`) 금지, 속성 선택자 남용 금지.
- 컴포넌트 CSS는 **자기 영역만** 스타일링한다. 다른 컴포넌트 내부를 덮어쓰지 않는다(필요 시 modifier 추가).
- 전역 스타일은 `reset/base`에만 둔다.

### V6.2 작성 규칙
- **모바일 퍼스트**: 기본 스타일 = 모바일, `@media (min-width: …)`로 확장. `max-width` 미디어쿼리 지양.
- **토큰만 사용**: `color: #333` ✗ → `color: var(--color-text-default)` ✓.
- **논리 속성** 선호: `margin-inline`, `padding-block`, `inset-inline-start` 등.
- 단위: 폰트 `rem`(루트 16px 유지, `html { font-size: 100% }`), 간격 토큰(`rem` 기반), 보더·그림자 `px`, 유동 값 `clamp()`.
- 레이아웃: **Grid(2차원) / Flex(1차원)**. `float`, `position: absolute` 레이아웃, 테이블 레이아웃 금지. `gap` 사용(마진 해킹 금지).
- `box-sizing: border-box` 전역 적용. 고정 `height` 지양(`min-height`).
- 반응형 이미지: `max-inline-size: 100%; block-size: auto;`.
- 속성 순서: **레이아웃(display/position/grid) → 박스모델(size/margin/padding) → 타이포 → 시각(color/background/border/shadow) → 기타(transition/cursor)**.
- 벤더 프리픽스는 직접 쓰지 않는다(필요 시 Autoprefixer 사용 안내).
- 주석은 **"왜"** 를 설명한다. 섹션 구분 주석 형식을 통일한다.

### V6.3 상태/인터랙션 CSS
```css
.button { /* default */ }
.button:hover { }                     /* @media (hover: hover) 안에서만 */
.button:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.button:active { }
.button:disabled, .button[aria-disabled="true"] { }
```
- hover는 `@media (hover: hover) and (pointer: fine)` 안에 둔다.
- `:focus` 대신 **`:focus-visible`** 사용. `outline: none` 단독 사용 금지.
- 전환은 `transition: <property> var(--dur-base) var(--ease-standard)`로 **속성을 명시**한다(`transition: all` 금지).
- 모션 대응:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
  }
  ```
  (이 블록은 `reset.css`에서 유일하게 `!important` 허용)
- 접근성 유틸: `.visually-hidden`(스크린리더 전용), `[hidden]` 존중.

### V6.4 성능
- 크리티컬 CSS는 가볍게, 미사용 CSS 누적 금지(삭제 시 확인 후 제거).
- 비싼 속성(`filter`, `backdrop-filter`, 큰 `box-shadow`)은 제한적으로. 필요 시 `will-change`는 **짧게**만.
- 긴 리스트는 `content-visibility: auto` 고려.

## V7. JavaScript 규칙

### V7.1 기본
- `"use strict"` 불필요(ES Module은 기본 strict). **`const` 기본, 재할당 필요 시 `let`**. `var` 금지.
- `===`/`!==`만 사용. 옵셔널 체이닝(`?.`), 널 병합(`??`), 구조분해, 템플릿 리터럴 적극 활용.
- 세미콜론 사용, 문자열 작은따옴표(HTML 템플릿은 백틱), 들여쓰기 2칸, 줄 길이 ≤ 100자.
- **함수는 한 가지 일만** 한다. 함수 길이 ≤ 40줄, 인자 ≤ 3개(초과 시 객체), 중첩 깊이 ≤ 3.
- 매직 넘버·문자열 금지 → `config.js` 또는 상수로 이름 부여.
- **전역 변수/`window` 오염 금지**. 모듈 스코프를 사용한다.
- 주석은 **왜**를 쓴다. 죽은 코드·주석 처리된 코드는 커밋하지 않는다. `console.log` 잔존 금지.
- JSDoc으로 공개 함수의 입력·출력 타입을 문서화한다.

### V7.2 DOM & 이벤트
- 선택자는 **`data-js-*` 훅**으로만 잡는다(스타일 클래스에 의존 금지).
  ```js
  const modal = document.querySelector('[data-js="modal"]');
  ```
- **이벤트 위임**을 사용하고, 리스너 등록은 초기화 함수에서만 한다. 제거가 필요한 경우 `AbortController` 사용.
- 스타일 변경은 **클래스 토글**(`classList.toggle('is-open')`) 또는 `data-*`/`aria-*` 속성으로. 인라인 스타일 직접 조작 금지.
- `innerHTML`에 **사용자 입력/외부 데이터 삽입 금지** → `textContent`, `createElement`, 또는 검증된 템플릿 사용.
- 스크롤/리사이즈 핸들러는 `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame`, 디바운스/쓰로틀로 처리. **강제 리플로우(읽기/쓰기 교차) 금지.** `passive: true` 리스너 사용.
- 컴포넌트는 **idempotent 초기화**(중복 초기화해도 안전)하도록 작성한다.
  ```js
  export function initAccordion(root = document) {
    root.querySelectorAll('[data-js="accordion"]:not([data-init])').forEach((el) => {
      el.dataset.init = 'true';
      // ...
    });
  }
  ```

### V7.3 컴포넌트 접근성 (JS 담당)
| 컴포넌트 | 필수 구현 |
|---|---|
| 모달 | `<dialog>` 우선, 포커스 이동·복귀, 포커스 트랩, `Esc`, 배경 스크롤 잠금, `aria-modal`/`aria-labelledby` |
| 아코디언 | `button` + `aria-expanded` + `aria-controls`, `Enter/Space` |
| 탭 | `role=tablist/tab/tabpanel`, 화살표키 이동, `aria-selected`, roving tabindex |
| 드롭다운/메뉴 | `aria-expanded`, `Esc` 닫기, 바깥 클릭 닫기, 포커스 관리 |
| 토스트/알림 | `aria-live` 영역 |
| 캐러셀 | 정지 버튼, 키보드 조작, `prefers-reduced-motion` 대응 |

- 모든 기능은 **키보드만으로** 사용 가능해야 한다. 포커스 순서는 DOM 순서와 시각 순서가 일치한다.

### V7.4 비동기 · 에러 · 데이터
- `async/await` + `try/catch`. 콜백 지옥·`.then` 체인 남용 금지.
- 네트워크 호출은 `services/`에 모은다. `fetch` 래퍼에서 **타임아웃(AbortController), 상태 코드 검사(`response.ok`), 에러 정규화**를 처리한다.
- 사용자에게는 **이해 가능한 메시지**를, 개발자에게는 **원인 로그**(개발 환경에서만)를 남긴다. 에러를 삼키는(`catch {}`) 코드 금지.
- 로딩/성공/실패/빈 상태를 **모두 UI로 처리**한다.
- `localStorage/sessionStorage`는 `utils/storage.js` 래퍼를 통해 접근하고 `try/catch`로 보호(사생활 모드·용량 초과 대비). **민감 정보 저장 금지.**
- 날짜·숫자·통화는 `Intl.DateTimeFormat`, `Intl.NumberFormat` 사용. 하드코딩된 `ko-KR` 대신 `config.js`의 로케일.
- 폼: 제출 가로채기 시에도 **네이티브 검증(`required`, `pattern`, `type`) 우선** + `setCustomValidity`/에러 영역 연동. 중복 제출 방지.

### V7.5 성능
- 초기 JS는 **작게**. 필요한 곳에서만 동적 `import()`로 지연 로드.
- 메인 스레드 작업이 50ms를 넘으면 쪼갠다. 무거운 연산은 Web Worker 고려.
- DOM 일괄 갱신은 `DocumentFragment` 또는 한 번에 렌더.
- 이미지/섹션 지연 로딩은 `IntersectionObserver` 또는 네이티브 `loading="lazy"`.
- 메모리 누수 방지: 리스너·옵저버·타이머 정리.

## V8. 성능 예산 (Performance Budget)
| 지표 | 목표 (모바일 4G, 중급 기기) |
|---|---|
| LCP | ≤ 2.5s |
| INP | ≤ 200ms |
| CLS | ≤ 0.1 |
| TTFB | ≤ 0.8s |
| 초기 HTML+CSS+JS 전송량 | ≤ 170KB (gzip) |
| 페이지 전체 이미지 | 뷰포트 상단 ≤ 200KB/장, 총 ≤ 1MB 권장 |
| Lighthouse (Perf/A11y/BP/SEO) | 각 **90+** |

- 이미지: avif/webp, 적정 해상도, `srcset`. 아이콘은 SVG 스프라이트/인라인.
- 폰트: 가변·서브셋·`preload`(핵심 1~2개), `font-display: swap`.
- 서드파티 스크립트(분석·채팅 등)는 `async/defer`, 필요 시 지연 로딩. 추가 시 성능 영향 명시.
- 캐싱: 정적 자원 해시 파일명 + 장기 캐시 헤더 권고.

## V9. 접근성 (개발 관점, WCAG 2.2 AA)
- 자동 검사(Lighthouse/axe) **0 오류** + 수동 점검: 키보드 이동, 스크린리더(NVDA/VoiceOver) 기본 흐름, 200% 확대, 모바일 가로/세로.
- 폼 에러는 `aria-invalid`, `aria-describedby`로 연결하고 첫 에러 필드로 포커스 이동.
- 페이지 전환·SPA식 갱신 시 **포커스와 제목(document.title) 업데이트**.
- 시간 제한·자동 갱신 콘텐츠는 사용자 제어 수단 제공.
- 텍스트 간격·리플로우: 가로 스크롤 없이 320px 폭에서 사용 가능.

## V10. SEO & 메타
- 페이지당 `h1` 1개, 의미 있는 `title`(50~60자) / `description`(120~160자).
- 시맨틱 마크업 + **JSON-LD 구조화 데이터**(Organization, BreadcrumbList, Article 등 해당 시).
- `robots.txt`, `sitemap.xml`, canonical, OG/Twitter 이미지(1200×630).
- 링크 텍스트는 의미 있게("자세히 보기" 단독 지양). 외부 링크 `rel="noopener noreferrer"`(`target="_blank"` 시).
- 404 페이지 별도 제작(홈/검색 유도).

## V11. 보안
- **XSS**: 사용자·외부 데이터를 DOM에 삽입 시 항상 이스케이프/`textContent`. `innerHTML`, `insertAdjacentHTML`, `outerHTML` 사용 시 반드시 sanitize.
- **CSP**(`Content-Security-Policy`) 적용 권고, 인라인 스크립트 지양. 외부 리소스는 **HTTPS + SRI**.
- **시크릿 금지**: API 키·토큰·비밀번호를 클라이언트 코드/저장소에 두지 않는다. `.env`는 커밋하지 않는다.
- 폼: CSRF 토큰(서버 연동 시), 입력 검증은 **서버가 최종 책임**(클라이언트 검증은 UX용).
- 쿠키: `Secure`, `HttpOnly`, `SameSite`.
- `target="_blank"` 링크의 `opener` 차단, `iframe`은 `sandbox`/`referrerpolicy` 고려.
- 개인정보 수집 시 동의 UI, 처리방침 링크, 최소 수집 원칙.

## V12. 품질 · 도구 · 협업

### V12.1 코드 품질 도구 (프로젝트에 설정 존재 시 반드시 준수)
- **Prettier**(포맷), **ESLint**(JS), **Stylelint**(CSS), **HTMLHint/html-validate**(HTML), **axe/Lighthouse**(접근성·성능).
- 설정 파일이 없으면 임의로 규칙을 만들지 말고, 이 문서 기준으로 코드를 작성한 뒤 도구 도입을 **제안**한다.
- 저장 전 **HTML 유효성(W3C)**, **콘솔 에러 0**, **404 리소스 0** 확인.

### V12.2 Git
- 브랜치: `main`(배포) / `feat/*`, `fix/*`, `chore/*`, `refactor/*`.
- 커밋 메시지: **Conventional Commits** — `feat: 문의 폼 유효성 검사 추가`, `fix: 모바일 메뉴 포커스 트랩 오류 수정`. 한 커밋 = 한 논리적 변경.
- 대용량 바이너리·`node_modules`·빌드 산출물·비밀 정보 커밋 금지 (`.gitignore` 관리).

### V12.3 문서화
- `README.md`: 프로젝트 개요, 실행 방법, 폴더 구조, 브라우저 지원, 스크립트.
- 설계 의사결정은 `docs/decisions.md`에 **날짜 + 결정 + 이유**로 기록.
- 컴포넌트는 사용 예시(HTML 스니펫)를 주석 또는 `docs/components.md`에 남긴다.

## V13. 개발자 산출물 체크리스트 (Definition of Done)
- [ ] 시맨틱 HTML, 제목 위계, 랜드마크, 스킵 링크
- [ ] 모든 시각 값이 토큰 사용, 하드코딩 없음, `!important` 없음
- [ ] 모바일 퍼스트 반응형: 320 / 375 / 768 / 1024 / 1280 확인
- [ ] 키보드 단독 조작 가능, 포커스 표시, ARIA 올바름
- [ ] 로딩/빈/에러/성공 상태 처리
- [ ] 이미지 `alt`·`width`·`height`·`lazy`·`srcset` 점검
- [ ] 콘솔 에러/경고 0, 네트워크 실패 0
- [ ] `prefers-reduced-motion`, 다크모드(지원 시) 확인
- [ ] 성능 예산 및 Lighthouse 90+ 충족
- [ ] 사용자 입력 이스케이프, 시크릿 노출 없음
- [ ] 불필요한 의존성·죽은 코드·`console.log` 제거

---

# PART 3. 에이전트 작업 프로토콜

## A1. 작업 순서 (매 요청마다)
1. **파악**: 요청을 한 문장으로 재정의하고, 영향받는 파일을 확인한다.
2. **재사용 점검**: `tokens.css`, 기존 컴포넌트, 유틸을 먼저 읽는다.
3. **계획**: 변경 파일 목록과 접근 방식을 간단히 정리한다(큰 작업만).
4. **구현**: 한 번에 하나의 관심사만 구현한다. HTML → CSS → JS 순.
5. **자체 검수**: D9, V13 체크리스트로 점검한다.
6. **보고**: 아래 형식으로 요약한다.

## A2. 응답 보고 형식
```
## 변경 요약
- (무엇을 왜 변경했는지 2~4줄)

## 변경 파일
- path/to/file — 변경 내용

## 가정 / 확인 필요
- (가정한 사항, 사용자가 결정해야 할 사항)

## 검증
- (확인한 항목: 반응형, 키보드, 콘솔, 접근성 등)
```

## A3. 하지 말 것 (MUST NOT 총정리)
- 요청하지 않은 파일 삭제·이동·대규모 리팩터링
- 토큰에 없는 색/간격/폰트 크기 임의 사용, 매직 넘버
- 외부 라이브러리/CDN/폰트를 사용자 확인 없이 추가
- `!important`, 인라인 스타일/이벤트, `var`, `innerHTML`로 외부 데이터 삽입
- `div` 클릭 버튼, `outline: none` 단독, `alt` 누락, 제목 레벨 건너뛰기
- placeholder를 라벨로 사용, 색만으로 상태 전달
- 기존 패턴과 다른 새 네이밍/구조 도입
- 테스트·검수 없이 "완료" 선언
- 실제 동작하지 않는 코드를 동작하는 것처럼 보고

## A4. 막혔을 때
- 규약끼리 충돌하거나 규약에 없는 상황이면 **0.2 우선순위**를 따른다.
- 그래도 판단이 어려우면 **가장 보수적이고 접근성 높은 선택**을 하고, 근거를 보고에 남긴다.
- 규약 자체의 개선이 필요하다고 판단되면 **임의로 이 문서를 수정하지 말고 제안**한다.

---

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-02 | 1.0.0 | 최초 작성 (Designer / Developer / Agent Protocol) |
