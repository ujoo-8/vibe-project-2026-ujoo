# Spec-Kit: UI/UX Design & Visual System Standard

## 1. 문서 목적 및 적용 원칙

본 문서는 웹사이트의 UI/UX 설계와 시각적 일관성을 유지하기 위한 디자인 기준이다. AI 코딩 도구는 이 문서를 디자인 의사결정 및 구현 검수의 기준으로 사용한다.

### 1.1 기본 원칙
- **사용자 우선:** 시각적 완성도보다 콘텐츠 이해, 탐색 편의성, 작업 완료 가능성을 우선한다.
- **브랜드 일관성:** 사이트의 목적, 타깃 사용자, 브랜드 자료 및 기존 화면이 제공된 경우 이를 우선 반영한다.
- **일관성과 유연성:** 공통 디자인 토큰을 사용하되, 모든 화면에 동일한 레이아웃을 강제하지 않는다.
- **반응형 우선:** 특정 화면 크기에 고정된 디자인이 아니라 콘텐츠와 사용 맥락에 맞춰 자연스럽게 재배치한다.
- **구현 가능성:** 실제 HTML/CSS/JavaScript로 구현할 수 있고 유지보수 가능한 디자인을 제안한다.

### 1.2 우선순위
요구사항이 충돌하면 다음 순서로 판단한다.
1. 사용자 요구사항 및 기능 명세
2. 기존 사이트의 브랜드·콘텐츠·디자인 기준(제공된 경우)
3. 접근성 및 사용성
4. 본 문서의 디자인 시스템
5. AI의 임의적인 시각적 제안

정보가 부족한 경우 임의로 브랜드 정체성이나 기능을 만들어내지 말고, 합리적인 기본값을 사용하거나 필요한 사항을 질문한다.

---

## 2. 디자인 토큰 시스템 (Design Tokens)

모든 페이지에서 반복되는 색상, 타이포그래피, 간격, 모서리, 그림자, 레이어 및 모션은 CSS Custom Properties로 관리한다. 토큰으로 관리할 수 있는 반복 값은 개별 CSS에 중복 선언하지 않는다.

파일 위치 예시: `css/variables.css`

```css
:root {
  /* Colors: 프로젝트 브랜드에 맞게 조정 */
  --color-brand: #111827;
  --color-brand-hover: #374151;
  --color-bg: #ffffff;
  --color-surface: #f8f9fa;
  --color-surface-muted: #f1f3f5;
  --color-text: #111827;
  --color-text-muted: #4b5563;
  --color-text-subtle: #6b7280;
  --color-border: #e5e7eb;
  --color-border-strong: #9ca3af;
  --color-focus: #2563eb;
  --color-success: #15803d;
  --color-warning: #b45309;
  --color-danger: #b91c1c;

  /* Typography */
  --font-family-base: "Pretendard Variable", Pretendard, system-ui, sans-serif;
  --font-family-mono: "JetBrains Mono", monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 2.5rem;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-heading: 1.35;
  --line-height-body: 1.6;

  /* Spacing: 4px 기반 */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* Layout */
  --container-max: 1440px;
  --gutter-desktop: 40px;
  --gutter-tablet: 24px;
  --gutter-mobile: 16px;

  /* Shape and elevation */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 999px;
  --shadow-sm: 0 1px 3px rgb(0 0 0 / 8%);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 10%);

  /* Layer */
  --layer-base: 1;
  --layer-header: 100;
  --layer-dropdown: 200;
  --layer-overlay: 900;
  --layer-modal: 1000;
  --layer-toast: 1100;

  /* Motion */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

### 2.1 토큰 사용 규칙
- 위 값은 시작 템플릿이며 사이트의 브랜드 컬러와 실제 디자인에 맞게 조정한다.
- 모든 색상에 임의의 의미를 부여하지 말고 역할에 맞는 semantic token을 사용한다.
- 간격은 4px 기반을 권장하되, 시각적·기능적으로 필요한 예외값을 허용한다.
- 1회성 세부 조정까지 무조건 토큰화하지 않는다. 반복되거나 시스템 전반에 영향을 주는 값부터 토큰화한다.
- 프로젝트에서 이미 사용 중인 토큰이 있다면 새 토큰 체계를 중복 생성하지 말고 기존 체계를 확장한다.

---

## 3. 타이포그래피 및 콘텐츠 가독성

### 3.1 기본 원칙
- 본문은 일반적으로 16px(1rem) 이상을 기준으로 하며, 작은 보조 텍스트도 읽기 어려울 정도로 축소하지 않는다.
- 제목, 본문, 캡션 간 크기·굵기·행간 차이로 정보 위계를 명확히 한다.
- 본문 행간은 일반적으로 1.5~1.7 범위를 권장한다.
- 한글과 영문이 혼합될 때 글꼴 대체 및 줄바꿈이 자연스러운지 확인한다.
- 긴 본문은 적절한 최대 너비를 설정해 한 줄이 지나치게 길어지지 않게 한다.

### 3.2 유동형 타이포그래피
뷰포트에 따라 크기가 변해야 하는 제목에는 `clamp()`를 사용할 수 있다.

```css
.hero__title {
  font-size: clamp(2rem, 4vw + 1rem, 4.5rem);
  line-height: var(--line-height-tight);
}
```

모든 텍스트에 `clamp()`를 적용하지 말고, 고정 크기가 더 적합한 본문 및 UI 텍스트에는 명시적인 토큰을 사용한다.

### 3.3 폰트 렌더링
`-webkit-font-smoothing` 등의 속성은 플랫폼별 렌더링을 완전히 동일하게 만들지 않는다. 기본값으로 강제 적용하기보다 실제 기기에서 확인한 후 필요한 경우에만 사용한다.

---

## 4. 레이아웃 및 반응형 디자인

### 4.1 기준 뷰포트
다음은 기본 가이드이며, 실제 브레이크포인트는 콘텐츠와 레이아웃이 자연스럽게 유지되는 지점에 맞춰 조정한다.

| 구분 | 기준 폭 | 설계 방향 |
|---|---:|---|
| Wide Desktop | 1440px 이상 | 최대 너비 컨테이너, 넓은 여백 |
| Desktop / Laptop | 1024~1439px | 유동형 그리드, 콘텐츠 폭 조정 |
| Tablet | 768~1023px | 컬럼 수 및 내비게이션 재구성 |
| Mobile | 767px 이하 | 단일 컬럼 중심, 터치 조작 최적화 |

### 4.2 반응형 필수 기준
- `width: 100%`, `max-width`, Grid, Flexbox 및 유동형 단위를 적절히 사용한다.
- 이미지와 미디어는 부모 영역을 벗어나지 않도록 `max-width: 100%` 등을 적용한다.
- 고정 너비·높이는 콘텐츠 잘림이나 가로 스크롤을 유발하지 않는지 검토한다.
- 데스크톱 요소를 단순히 축소하지 말고 모바일에서는 콘텐츠 순서, 정렬, 메뉴 구조를 재설계한다.
- 모바일 내비게이션은 햄버거 버튼 등 명확한 진입점을 제공하고 열림/닫힘 상태를 알 수 있게 한다.
- 터치 대상은 가능하면 최소 44×44 CSS px를 확보하고 인접한 버튼 사이에 충분한 간격을 둔다.
- 가로 스크롤이 의도된 컴포넌트가 아니라면 페이지 전체의 불필요한 가로 스크롤을 허용하지 않는다.
- 텍스트 확대 및 긴 번역 문구에서도 레이아웃이 유지되는지 확인한다.

### 4.3 컨테이너 예시
```css
.container {
  width: min(
    calc(100% - 2 * var(--gutter-desktop)),
    var(--container-max)
  );
  margin-inline: auto;
}

@media (max-width: 1023px) {
  .container {
    width: calc(100% - 2 * var(--gutter-tablet));
  }
}

@media (max-width: 767px) {
  .container {
    width: calc(100% - 2 * var(--gutter-mobile));
  }
}
```

---

## 5. UI 컴포넌트 및 인터랙션 디자인

### 5.1 공통 컴포넌트
버튼, 입력창, 카드, 내비게이션, 탭, 아코디언, 모달 등 반복 UI는 공통 스타일과 상태를 정의한다.

각 컴포넌트는 다음 상태를 필요에 따라 고려한다.
- Default
- Hover (마우스 입력을 지원하는 환경)
- Focus-visible
- Active / Pressed
- Disabled
- Loading
- Error / Success (해당 기능이 있을 때)

### 5.2 인터랙션 원칙
- 클릭 가능한 요소는 시각적으로 클릭 가능함을 알 수 있어야 한다.
- hover만으로 핵심 정보나 기능을 제공하지 않는다.
- 버튼과 링크의 역할을 구분한다. 페이지 이동은 링크, 동작 실행은 버튼을 사용한다.
- 상태 변화에는 사용자가 이해할 수 있는 피드백을 제공한다.
- 모션은 기능 이해를 돕는 범위에서 사용하고 과도한 장식 효과는 피한다.
- 모션을 지원하지 않거나 줄이기를 요청한 사용자도 콘텐츠와 기능을 동일하게 이용할 수 있어야 한다.

### 5.3 모션 접근성
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

애니메이션은 `transform`과 `opacity`를 우선 사용한다. 다만 모든 애니메이션을 이 두 속성으로만 제한하지는 않는다. 실제 사용성에 필요한 레이아웃 전환은 성능을 확인한 후 적용한다.

---

## 6. 접근성 및 사용성 (Accessibility & UX)

- 텍스트와 배경의 명도 대비는 WCAG 2.2 AA 기준을 목표로 한다. 일반 텍스트는 4.5:1, 큰 텍스트는 3:1 이상을 기준으로 확인한다.
- 색상만으로 상태나 의미를 전달하지 말고 텍스트, 아이콘, 패턴 등을 함께 사용한다.
- 키보드만으로 주요 기능에 접근하고 조작할 수 있어야 한다.
- 포커스 표시를 제거하지 말고 명확하게 제공한다.
- 입력 요소에는 식별 가능한 label과 오류 안내를 제공한다.
- 이미지에는 목적에 맞는 대체 텍스트를 제공한다. 장식용 이미지는 빈 alt를 사용한다.
- 제목은 논리적인 순서로 구성하고 페이지의 정보 구조를 명확히 한다.
- 모달이나 메뉴가 열렸을 때 초점 이동, 닫기 동작, 초점 복귀를 고려한다.
- 자동 재생, 깜박임, 강제 애니메이션 등 사용자의 제어를 방해하는 요소를 피한다.

---

## 7. 디자이너 산출물 및 개발 전달 기준

디자인 작업을 마칠 때 다음 항목을 명확히 한다.
- 페이지 및 섹션의 목적과 콘텐츠 위계
- 공통 컴포넌트와 페이지 전용 컴포넌트 구분
- 주요 화면 크기별 레이아웃 변화
- 버튼·메뉴·탭·아코디언 등 인터랙션 상태
- 이미지 비율, 크롭 방식 및 대체 이미지 처리
- 폰트, 색상, 간격 등 토큰 적용 기준
- 접근성 고려사항과 예외 사항

제공되지 않은 이미지, 문구, 브랜드 로고 또는 기능을 임의로 실제 자산처럼 만들어내지 않는다. 필요한 경우 placeholder임을 명시한다.

---

## 8. 디자이너 검수 체크리스트

- [ ] 사이트의 목적과 사용자 요구에 맞는 시각적 위계가 형성되어 있는가?
- [ ] 디자인 토큰이 일관되게 사용되고 중복 값이 불필요하게 늘어나지 않았는가?
- [ ] 데스크톱·태블릿·모바일에서 콘텐츠 순서와 레이아웃이 적절한가?
- [ ] 이미지 비율, 텍스트 줄바꿈, 버튼 크기 및 여백이 자연스러운가?
- [ ] 텍스트 대비, 폰트 크기, 행간이 읽기 쉬운가?
- [ ] 키보드 포커스와 터치 조작을 고려했는가?
- [ ] hover, focus, active, disabled 등 필요한 상태가 정의되어 있는가?
- [ ] 모션을 줄이는 사용자 설정을 존중하는가?
- [ ] 실제 제공된 브랜드 자산과 콘텐츠를 정확하게 반영했는가?
- [ ] 디자인 의도가 개발자가 구현할 수 있을 정도로 구체적으로 전달되었는가?
