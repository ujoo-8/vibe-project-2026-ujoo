# Spec-Kit: Frontend Engineering & Implementation Standard

## 1. 문서 목적 및 기술 전제

본 문서는 AI 코딩 도구가 웹사이트를 구현·수정할 때 따라야 할 프론트엔드 개발 기준이다. 목표는 읽기 쉽고, 접근 가능하며, 반응형이고, 유지보수 가능한 코드를 일관되게 작성하는 것이다.

### 1.1 기본 기술 스택
- HTML5 (Semantic HTML)
- CSS3 (CSS Custom Properties, Flexbox, Grid, Media Queries)
- Vanilla JavaScript (ES Modules)
- 별도 프레임워크나 라이브러리는 사용자가 요청하거나 프로젝트에 이미 포함된 경우에만 사용한다.

### 1.2 기존 프로젝트 우선 원칙
1. 작업 전에 기존 파일, 디렉터리, 의존성, 네이밍, 코드 스타일을 확인한다.
2. 기존 구조가 정상적으로 작동하면 불필요하게 전면 재작성하지 않는다.
3. 사용자가 지정한 기술 스택과 파일 구조를 우선한다.
4. 새 라이브러리, 빌드 도구 또는 서버 의존성을 임의로 추가하지 않는다.
5. 요구사항이 모호하거나 기존 구현과 충돌하면 추측으로 동작을 변경하지 말고 확인한다.

---

## 2. 프로젝트 구조 및 모듈 설계

아래 구조는 여러 페이지 또는 컴포넌트가 있는 프로젝트를 위한 예시다. 작은 정적 사이트에서는 파일 수를 줄여 단순하게 유지한다.

```text
/
├── index.html
├── pages/                    # 다중 페이지일 때만 사용
├── css/
│   ├── main.css
│   ├── reset.css
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   └── components/
│       ├── header.css
│       └── accordion.css
├── js/
│   ├── main.js
│   ├── utils/
│   │   └── dom.js
│   └── components/
│       ├── Header.js
│       └── Accordion.js
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

### 2.1 모듈 설계 원칙
- 기능과 책임이 명확한 단위로 모듈을 분리한다.
- 모든 UI를 클래스로 만들거나 모든 기능에 EventBus를 도입하지 않는다.
- 단순한 기능은 함수와 이벤트 리스너만으로 구현한다.
- 상태와 생명주기 관리가 필요한 복잡한 UI에 한해 컴포넌트 클래스를 사용한다.
- 모듈 간 순환 참조를 피하고 의존성 방향을 단순하게 유지한다.
- 파일 및 폴더는 실제로 필요한 경우에만 생성한다.

### 2.2 ES Modules
브라우저에서 ES Modules를 사용할 때는 `type="module"`을 지정하고, 로컬 개발은 HTTP 서버 환경에서 실행한다.

```html
<script type="module" src="./js/main.js"></script>
```

---

## 3. HTML 구조 및 접근성

### 3.1 시맨틱 HTML
- 페이지 구조에 적합한 `header`, `nav`, `main`, `section`, `article`, `aside`, `footer` 등을 사용한다.
- 버튼 동작은 `<button>`, 페이지 이동은 `<a>`로 구현한다.
- 제목 태그는 시각적 크기가 아니라 문서 구조에 맞춰 계층적으로 사용한다.
- 입력 요소는 연결된 `<label>`을 제공한다.
- 의미 없는 `div` 중첩과 불필요한 ARIA 속성을 줄인다.

### 3.2 접근성 구현
- 키보드로 모든 주요 인터랙션을 사용할 수 있어야 한다.
- 포커스 표시를 제거하지 않는다.
- 아이콘 전용 버튼에는 accessible name을 제공한다.
- 이미지의 목적에 맞게 `alt`를 작성하고 장식용 이미지는 `alt=""`로 처리한다.
- 동적 상태는 필요한 경우 `aria-expanded`, `aria-controls`, `aria-current`, `aria-live` 등으로 전달한다.
- ARIA는 네이티브 HTML 요소만으로 의미를 전달할 수 없을 때 사용한다.
- 모달은 열릴 때 적절한 곳으로 포커스를 이동하고, 닫힐 때 호출 요소로 복귀시킨다.
- 메뉴·탭·아코디언은 패턴에 맞는 키보드 조작을 구현한다. ARIA 속성만 추가하고 실제 동작을 빠뜨리지 않는다.

### 3.3 아코디언 예시
```javascript
export function toggleAccordion(trigger, panel) {
  const expanded = trigger.getAttribute("aria-expanded") === "true";

  trigger.setAttribute("aria-expanded", String(!expanded));
  panel.hidden = expanded;
}
```

---

## 4. CSS 아키텍처 및 반응형 구현

### 4.1 CSS 구성
- `variables.css`: 디자인 토큰
- `reset.css`: 브라우저 기본 스타일 정리
- `base.css`: body, 기본 타이포그래피, 공통 요소
- `layout.css`: 컨테이너 및 페이지 레이아웃
- `components/`: 컴포넌트별 스타일

프로젝트에 기존 CSS 구조가 있으면 그 구조를 우선하며, 동일한 역할의 파일을 중복 생성하지 않는다.

### 4.2 네이밍 및 선택자
- 컴포넌트 스타일은 BEM을 권장한다: `block__element--modifier`.
- 예: `.header__nav`, `.button--primary`.
- ID 선택자와 태그 선택자를 전면 금지하지 않는다. 다만 컴포넌트 스타일의 범위가 불필요하게 넓어지지 않도록 클래스 중심으로 작성한다.
- `!important`는 불가피한 예외에만 사용하고 이유를 확인한다.
- 전역 스타일과 컴포넌트 스타일의 책임을 분리한다.

### 4.3 디자인 토큰
- 색상, 간격, 폰트, 모서리, 레이어 등 반복되는 값은 CSS Custom Properties로 관리한다.
- 기존 토큰이 있으면 재사용한다.
- 토큰에 적합하지 않은 일회성 값까지 무조건 변수화하지 않는다.
- 임의의 하드코딩 값을 무조건 금지하지 말고, 반복·공통 값은 토큰을 우선 사용한다.

### 4.4 반응형 기준
기본 기준은 다음과 같으며, 실제 브레이크포인트는 콘텐츠와 레이아웃에 따라 조정한다.
- Wide Desktop: 1440px 이상
- Desktop/Laptop: 1024~1439px
- Tablet: 768~1023px
- Mobile: 767px 이하

필수 확인 사항:
- 고정 너비 요소가 화면 밖으로 넘치지 않는가?
- 이미지와 동영상이 부모 컨테이너를 벗어나지 않는가?
- 텍스트가 잘리거나 겹치지 않는가?
- 그리드와 컬럼이 작은 화면에서 적절히 재배치되는가?
- 모바일 메뉴의 열기·닫기, 바깥 영역 및 Escape 키 동작이 적절한가?
- 페이지 전체에 의도하지 않은 가로 스크롤이 생기지 않는가?
- 브라우저 확대 및 긴 텍스트에서도 콘텐츠가 사용 가능한가?

### 4.5 레이어 관리
```css
:root {
  --layer-base: 1;
  --layer-header: 100;
  --layer-dropdown: 200;
  --layer-overlay: 900;
  --layer-modal: 1000;
  --layer-toast: 1100;
}
```
`z-index`는 stacking context의 영향을 받으므로 숫자만 높이는 방식으로 해결하지 말고 부모 요소의 `position`, `transform`, `isolation` 등도 확인한다.

---

## 5. JavaScript 이벤트 및 상태 관리

### 5.1 이벤트 처리 원칙
- 동일한 유형의 이벤트를 반복 요소에 연결해야 할 때 이벤트 위임을 고려한다.
- 모든 이벤트를 무조건 상위 요소 하나에 위임하지 않는다. 이벤트 빈도, 컴포넌트 구조, 유지보수성을 고려한다.
- 동적으로 등록한 이벤트 리스너와 구독은 제거할 수 있는 방법을 마련한다.
- 이벤트 핸들러에서 DOM을 반복 탐색하거나 불필요한 레이아웃 측정을 반복하지 않는다.

### 5.2 이벤트 위임 유틸리티 예시
```javascript
export function delegateEvent(target, selector, eventType, handler) {
  const listener = (event) => {
    const origin = event.target;
    if (!(origin instanceof Element)) return;

    const matched = origin.closest(selector);
    if (matched && target.contains(matched)) {
      handler.call(matched, event, matched);
    }
  };

  target.addEventListener(eventType, listener);
  return () => target.removeEventListener(eventType, listener);
}
```

필요한 경우 `addEventListener`의 `signal` 옵션과 `AbortController`를 이용해 관련 이벤트를 묶어서 정리할 수 있다.

### 5.3 컴포넌트 생명주기
컴포넌트가 실제로 제거되거나 재초기화될 수 있는 경우에만 명시적인 cleanup 구조를 사용한다.

```javascript
export class Component {
  constructor(container, props = {}) {
    if (!container) {
      throw new Error("Component container is required.");
    }

    this.container = container;
    this.props = props;
    this.cleanups = [];
    this.mounted = false;
  }

  mount() {
    if (this.mounted) return;
    this.mounted = true;
    this.render();
    this.bindEvents();
  }

  render() {}
  bindEvents() {}

  addCleanup(cleanup) {
    if (typeof cleanup === "function") {
      this.cleanups.push(cleanup);
    }
  }

  unmount() {
    if (!this.mounted) return;

    for (const cleanup of this.cleanups.splice(0).reverse()) {
      try {
        cleanup();
      } catch (error) {
        console.error("Component cleanup failed:", error);
      }
    }

    this.mounted = false;
  }
}
```

주의 사항:
- 생성자에서 DOM 렌더링이나 이벤트 등록을 자동 실행하지 않는다. 생성과 마운트 시점을 분리한다.
- `unmount()`가 호출됐다는 이유만으로 컨테이너 전체의 `innerHTML`을 비우지 않는다. 해당 컴포넌트가 소유한 DOM만 정리한다.
- 중복 mount 및 cleanup 호출에 안전해야 한다.
- 단순한 UI에는 이 Base Class를 도입하지 않는다.

---

## 6. 성능 및 렌더링 최적화

### 6.1 DOM 및 레이아웃
- DOM 측정(`getBoundingClientRect`, `offsetHeight` 등)과 DOM 변경을 불필요하게 번갈아 실행하지 않는다.
- 여러 요소를 변경할 때는 가능하면 변경 작업을 묶는다.
- 스크롤 및 리사이즈 이벤트에서 무거운 작업을 직접 반복하지 않는다.
- `requestAnimationFrame`은 화면 갱신과 동기화해야 하는 작업에 사용한다.
- `requestAnimationFrame`은 일반적인 debounce/throttle을 대체하는 만능 도구가 아니다.
- 이미지에는 적절한 크기와 포맷을 사용하고, 화면 아래 콘텐츠는 필요에 따라 lazy loading을 적용한다.
- 레이아웃 이동을 줄이기 위해 이미지·동영상의 `width`와 `height` 또는 `aspect-ratio`를 지정한다.

### 6.2 애니메이션
- 애니메이션은 `transform`과 `opacity`를 우선 고려한다.
- `width`, `height`, `top`, `left` 등 레이아웃에 영향을 주는 속성의 애니메이션은 필요한 경우에만 사용하고 성능을 확인한다.
- `will-change`를 모든 요소에 상시 적용하지 않는다.
- `prefers-reduced-motion` 설정을 지원한다.

### 6.3 requestAnimationFrame throttle 예시
```javascript
export function rafThrottle(callback) {
  let frameId = null;
  let latestArgs = [];
  let latestThis = null;

  function throttled(...args) {
    latestArgs = args;
    latestThis = this;

    if (frameId !== null) return;

    frameId = requestAnimationFrame(() => {
      frameId = null;
      callback.apply(latestThis, latestArgs);
    });
  }

  throttled.cancel = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  return throttled;
}
```

---

## 7. 보안 및 오류 처리

- 사용자 입력을 HTML 문자열로 직접 삽입하지 않는다. 텍스트 출력은 기본적으로 `textContent`를 사용한다.
- 불가피하게 HTML을 삽입해야 한다면 신뢰 가능한 데이터인지 검증하고 적절한 sanitization 방식을 사용한다.
- URL을 동적으로 사용할 때 허용할 프로토콜과 입력값을 검증한다.
- 비밀번호, API 키, 토큰 등 민감한 정보를 프론트엔드 코드에 하드코딩하지 않는다.
- 콘솔 오류와 네트워크 실패를 방치하지 말고 사용자에게 이해 가능한 오류 상태를 제공한다.
- 오류를 숨기기 위해 무조건 빈 catch를 사용하지 않는다.
- 외부 리소스가 실패해도 페이지의 핵심 콘텐츠가 이용 가능하도록 대체 상태를 고려한다.

---

## 8. 브라우저 호환성 및 코드 품질

- 프로젝트에서 지원해야 하는 브라우저 범위를 먼저 확인한다.
- 사용하려는 CSS 및 JavaScript API의 지원 범위를 확인하고 필요한 경우 대체 구현을 제공한다.
- 의미 없는 추상화, 중복 코드, 사용하지 않는 파일과 변수를 만들지 않는다.
- 함수와 변수는 역할을 알 수 있는 이름을 사용한다.
- 전역 변수 오염을 피하고 ES Modules의 import/export를 사용한다.
- 비동기 작업은 `async/await` 또는 Promise 흐름을 명확하게 처리한다.
- 이벤트 리스너, 타이머, observer, 구독은 필요가 끝나면 정리한다.

---

## 9. AI 개발 작업 절차 (필수)

AI 코딩 도구는 코드를 수정하기 전에 다음 절차를 따른다.

### Step 1. 프로젝트 분석
- 제공된 파일과 디렉터리 구조를 확인한다.
- HTML, CSS, JavaScript 간의 연결 관계를 파악한다.
- 기존 기능, 반응형 규칙, 디자인 토큰 및 네이밍을 확인한다.
- 수정 대상과 영향을 받는 파일을 식별한다.

### Step 2. 구현 계획
- 요구사항을 작업 단위로 나눈다.
- 기존 기능을 유지해야 하는 부분과 변경할 부분을 구분한다.
- 새 파일이나 라이브러리가 실제로 필요한지 판단한다.
- 불확실하거나 충돌하는 요구사항은 구현 전에 질문한다.

### Step 3. 구현
- 기존 코드 스타일과 구조를 최대한 유지한다.
- 요청하지 않은 콘텐츠, 디자인, 기능을 임의로 변경하지 않는다.
- 공통 기능은 재사용하고 불필요한 중복을 피한다.
- HTML, CSS, JavaScript 변경 사항이 서로 일치하는지 확인한다.

### Step 4. 자체 검증
- 문법 오류와 잘못된 경로 및 import를 확인한다.
- 주요 기능의 정상 동작과 기존 기능의 회귀 여부를 확인한다.
- 데스크톱, 태블릿, 모바일 크기에서 레이아웃을 확인한다.
- 콘솔 오류, 이미지 로딩 실패, 가로 오버플로우를 확인한다.
- 키보드 접근성, 포커스, 버튼 및 링크 동작을 확인한다.
- 실행 환경에서 검증할 수 없는 항목은 검증했다고 주장하지 말고 미검증 항목으로 표시한다.

### Step 5. 작업 결과 보고
작업 완료 시 다음을 간결하게 보고한다.
- 수정한 파일
- 주요 변경 사항
- 유지하거나 개선한 기존 기능
- 실행 및 검증 결과
- 남아 있는 문제 또는 사용자가 확인해야 할 사항

---

## 10. 개발자 코드 리뷰 체크리스트

### 구조 및 유지보수
- [ ] 기존 프로젝트 구조와 기술 스택을 존중했는가?
- [ ] 기능 단위가 명확하고 불필요한 추상화가 없는가?
- [ ] 중복 코드와 사용하지 않는 코드가 없는가?
- [ ] 모듈 간 순환 참조 및 전역 변수 오염이 없는가?

### UI 및 반응형
- [ ] 데스크톱·태블릿·모바일에서 레이아웃이 정상인가?
- [ ] 이미지, 텍스트, 버튼이 화면 밖으로 넘치거나 잘리지 않는가?
- [ ] 메뉴, 모달, 아코디언 등 인터랙션 상태가 정상인가?
- [ ] 디자인 토큰과 컴포넌트 스타일이 일관되게 적용되었는가?

### 접근성 및 보안
- [ ] 시맨틱 HTML과 적절한 label 및 alt를 사용했는가?
- [ ] 키보드만으로 주요 기능을 조작할 수 있는가?
- [ ] ARIA 상태와 실제 UI 상태가 동기화되는가?
- [ ] 사용자 입력 및 동적 URL을 안전하게 처리하는가?

### 성능 및 안정성
- [ ] 불필요한 DOM 측정·변경 반복이 없는가?
- [ ] 이벤트 리스너, observer, 타이머가 적절히 정리되는가?
- [ ] 이미지 크기와 로딩 전략이 적절한가?
- [ ] 콘솔 오류, 깨진 리소스 및 주요 기능 오류가 없는가?
- [ ] 검증하지 않은 항목을 검증 완료로 보고하지 않았는가?
