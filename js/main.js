document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  const sections = Array.from(document.querySelectorAll(".section"));
  const dots = document.querySelectorAll(".scroll-indicator__dot");
  const indicator = document.getElementById("scroll-indicator");

  // 0. Newsroom Swiper (슬라이드 1장 = 카드 3장 묶음 → 한 번에 3장씩 이동)
  if (window.Swiper) {
    new Swiper("#newsroom-swiper", {
      slidesPerView: 1,
      speed: 500,
      grabCursor: true,
      pagination: { el: "#newsroom-pagination", clickable: true },
      navigation: { prevEl: "#newsroom-prev", nextEl: "#newsroom-next" },
    });
  }

  // 현재 섹션: 뷰포트 중앙선이 걸쳐 있는 섹션 (100vh보다 큰 섹션에서도 정확)
  const getCurrentIndex = () => {
    const mid = window.innerHeight / 2;
    let found = sections.length - 1; // 어느 섹션에도 없으면(푸터 구간) 마지막 섹션
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        found = i;
        break;
      }
    }
    // why가 hero와 겹쳐 있으므로 why 상단에 도달하면 why로 판단
    if (found === 0 && window.pageYOffset >= sections[1].offsetTop - 10)
      return 1;
    return found;
  };

  // 1. Hero: 스크롤 진행도에 따라 hero-img-box3가 화면 전체(100%)로 확대 (역방향 스크롤 시 원래 위치/크기로 복귀)
  const hero = sections[0];
  const GROW_RATIO = 0.8; // 뷰포트 높이의 80%만큼 스크롤하면 100% 도달
  let heroBox = null,
    heroExpand = null,
    heroR0 = null,
    heroP = 0,
    heroMedia = [];

  // 인트로 애니메이션(박스 펼침)이 끝난 뒤에만 확대용 박스를 생성/교체
  let introDone = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  hero.querySelectorAll(".hero-img-box3").forEach((b) => {
    b.addEventListener("animationend", (e) => {
      if (e.animationName !== "heroBoxOpen") return;
      introDone = true;
      refreshHero();
    });
  });

  const buildHero = () => {
    if (!introDone) return;
    const box = Array.from(hero.querySelectorAll(".hero-img-box3")).find(
      (b) => b.getClientRects().length > 0,
    ); // PC / 모바일 중 보이는(display:none 아닌) 박스
    if (!box) return;
    if (!heroExpand) {
      heroExpand = document.createElement("div");
      heroExpand.className = "hero-expand";
      hero.appendChild(heroExpand);
    }
    if (heroBox !== box) {
      if (heroBox) heroBox.style.visibility = "";
      heroBox = box;
      heroExpand.innerHTML = box.innerHTML;
      heroExpand.querySelectorAll("video").forEach((v) => {
        v.muted = true;
        v.play && v.play().catch(() => {});
      });
      heroMedia = Array.from(heroExpand.querySelectorAll("video, img"));
      box.style.visibility = "hidden"; // 자리는 유지, 표시는 확대용 박스가 대신함
    }
    const hr = hero.getBoundingClientRect(),
      br = box.getBoundingClientRect();
    heroR0 = {
      l: br.left - hr.left,
      t: br.top - hr.top,
      w: br.width,
      h: br.height,
    };
  };

  const renderHero = () => {
    if (!heroExpand || !heroR0) return;
    const vh = window.innerHeight;
    const vw = hero.clientWidth;
    const heroH = hero.offsetHeight;
    const y = -hero.getBoundingClientRect().top; // 히어로 기준 스크롤량
    const p = Math.min(1, Math.max(0, y / (vh * GROW_RATIO)));
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
    heroP = p;
    const st = heroExpand.style;
    const top = heroR0.t * (1 - e) + Math.max(0, y) * e;
    // 아래쪽 끝은 박스 하단 → 히어로 하단까지 확장 (뷰포트 하단에 흰 여백이 남지 않음)
    const bottom = (heroR0.t + heroR0.h) * (1 - e) + heroH * e;
    st.left = heroR0.l * (1 - e) + "px";
    st.top = top + "px";
    st.width = heroR0.w + (vw - heroR0.w) * e + "px";
    st.height = Math.max(0, bottom - top) + "px";
    st.borderRadius = 4 * (1 - e) + "px";
    // 스크롤 진행도에 따라 이미지/영상 투명도가 서서히 내려가며 깔려 있던 검정 배경이 드러남
    const fade = Math.min(1, Math.max(0, (p - 0.2) / 0.6));
    heroMedia.forEach((m) => (m.style.opacity = 1 - fade));
    // 65% 도달 → why 콘텐츠 순차 등장 (역방향이면 되돌아감)
    whySection.classList.toggle("is-revealed", p >= 0.65);
  };

  const whySection = sections[1];
  Array.from(
    whySection.querySelectorAll(
      ".why-collage__card--building, .why-collage__card--concert, .why-collage__card--phone, .why-title, .why-desc, .text-wrapper a",
    ),
  ).forEach((el, i) => {
    el.classList.add("why-reveal-item");
    el.style.setProperty("--i", i);
  });

  // 1-1. solutions / campaigns / newsroom: 스크롤로 진입하는 순서대로 하나씩 등장 (한 번 보이면 유지)
  const revealTargets = document.querySelectorAll(
    ".section--solutions .solutions-header, .section--solutions .solution-row, " +
      ".section--campaigns .campaigns-header, .section--campaigns .campaign-card, " +
      ".section--newsroom .newsroom-header, .section--newsroom .newsroom-swiper",
  );
  revealTargets.forEach((el) => el.classList.add("scroll-reveal"));
  if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(
      (entries) => {
        let n = 0;
        entries
          .filter((en) => en.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left,
          )
          .forEach((en) => {
            en.target.style.transitionDelay = n++ * 0.45 + "s"; //0.15
            en.target.classList.add("is-visible");
            revealIO.unobserve(en.target); // 다시 숨기지 않음
          });
      },
      { threshold: 0.12, rootMargin: "0px 0px -20% 0px" },
    );
    revealTargets.forEach((el) => revealIO.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  // 2. Active dot / header theme
  let lastIdx = -1,
    lastDark = null;
  const updateActive = () => {
    renderHero();
    const idx = getCurrentIndex();
    const dark =
      sections[idx].getAttribute("data-theme") === "dark" ||
      (idx === 0 && heroP > 0.6);
    if (idx !== lastIdx) {
      lastIdx = idx;
      dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
    }
    if (dark !== lastDark) {
      lastDark = dark;
      header.classList.toggle("header--dark", dark);
      indicator.classList.toggle("scroll-indicator--dark", dark);
    }
  };
  // capture: true → 어떤 요소가 스크롤 컨테이너여도 감지
  document.addEventListener("scroll", updateActive, {
    passive: true,
    capture: true,
  });
  window.addEventListener("scroll", updateActive, { passive: true });
  const refreshHero = () => {
    buildHero();
    updateActive();
  };
  window.addEventListener("resize", refreshHero);
  window.addEventListener("load", refreshHero);
  refreshHero();

  // 3. Dot click
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (sections[index])
        smoothTo(
          sections[index].getBoundingClientRect().top +
            window.pageYOffset,
        );
    });
  });

  // 4. Smooth scroll (wheel / keyboard / anchor) - lerp 방식의 관성 스크롤
  const root = document.documentElement;
  let sTarget = window.pageYOffset,
    sCurrent = sTarget,
    sRaf = null;
  const maxScroll = () =>
    Math.max(0, root.scrollHeight - window.innerHeight);
  const clampY = (y) => Math.min(maxScroll(), Math.max(0, y));
  const menuOpen = () => root.classList.contains("menu-open");

  const tick = () => {
    const diff = sTarget - sCurrent;
    if (Math.abs(diff) < 0.4) {
      sCurrent = sTarget;
      window.scrollTo({ top: sCurrent, behavior: "instant" });
      sRaf = null;
      return;
    }
    sCurrent += diff * 0.1;
    window.scrollTo({ top: sCurrent, behavior: "instant" });
    sRaf = requestAnimationFrame(tick);
  };
  const smoothTo = (y) => {
    sTarget = clampY(y);
    if (!sRaf) {
      sCurrent = window.pageYOffset;
      sRaf = requestAnimationFrame(tick);
    }
  };
  const baseY = () => (sRaf ? sTarget : window.pageYOffset);

  // 스크롤바 드래그/터치 등 외부 스크롤 시 동기화
  window.addEventListener(
    "scroll",
    () => {
      if (!sRaf) sTarget = sCurrent = window.pageYOffset;
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    sTarget = clampY(sTarget);
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || menuOpen()) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 가로 스와이프(Swiper)는 그대로
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 32;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      smoothTo(baseY() + d);
    },
    { passive: false },
  );

  window.addEventListener("keydown", (e) => {
    if (menuOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (
      t &&
      (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
        t.isContentEditable)
    )
      return;
    const vh = window.innerHeight;
    let target = null;
    if (e.key === "ArrowDown") target = baseY() + 100;
    else if (e.key === "ArrowUp") target = baseY() - 100;
    else if (e.key === "PageDown") target = baseY() + vh * 0.9;
    else if (e.key === "PageUp") target = baseY() - vh * 0.9;
    else if (e.key === " " && (t === document.body || t === root))
      target = baseY() + (e.shiftKey ? -1 : 1) * vh * 0.9;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = maxScroll();
    if (target === null) return;
    e.preventDefault();
    smoothTo(target);
  });

  // 페이지 내 앵커(#page-N, #) 클릭도 부드럽게
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (hash === "#") {
      e.preventDefault();
      return;
    }
    const t = document.querySelector(hash);
    if (!t) return;
    e.preventDefault();
    smoothTo(t.getBoundingClientRect().top + window.pageYOffset);
  });

  // 5. Mobile menu drawer
  const menu = document.getElementById("mobile-menu");
  const openBtn = document.getElementById("hamburger-btn");
  const closeBtn = document.getElementById("menu-close-btn");
  const setMenu = (open) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    openBtn.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("menu-open", open);
    if (open) menu.scrollTop = 0;
  };
  openBtn.addEventListener("click", () => setMenu(true));
  closeBtn.addEventListener("click", () => setMenu(false));
  // 메뉴 항목 클릭 → 메뉴 닫기 (이동은 위의 앵커 핸들러가 부드럽게 처리)
  menu.querySelectorAll("[data-menu-link]").forEach((a) => {
    a.addEventListener("click", () => setMenu(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) setMenu(false);
  });
});
