/* Shared site chrome for the main site, solutions, and notice pages. */
(function () {
  'use strict';

  const isSubPage = /\/(pages|notice-board|qna-board)\//.test(location.pathname);
  const root = isSubPage ? '../' : './';
  const home = `${root}index.html`;
  const image = `${root}images/`;
  const nav = [
    ['Why FLATTEN', `${home}#page-2`],
    ['Our Solutions', `${root}pages/oursolutions.html`],
    ['All Campaigns', `${home}#page-4`],
    ['Newsroom', `${home}#page-5`],
    ['Contact Us', '#'],
    ['Notice', `${root}notice-board/notice.html`],
    ['묻고답하기', `${root}qna-board/qna.html`],
  ];
  const headerNav = nav;

  const links = (className) =>
    headerNav.map(([label, href]) => `<li><a href="${href}" class="${className}">${label}</a></li>`).join('');

  const escapeText = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));

  const headerHtml = () => `
    <header class="header" id="site-header">
      <div class="notice" id="site-notice" role="region" aria-label="공지사항 미리보기">
        <div class="notice__items" id="notice-preview-items"></div>
        <div class="notice__controls">
          <button type="button" class="notice__control" id="notice-play" aria-label="공지사항 재생" aria-pressed="false" hidden>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#fff"><path d="M9.5,16.5l7-4.5l-7-4.5v9ZM12,22q-2.07,0-3.9-0.79q-1.82-0.79-3.17-2.14Q3.58,17.73 2.79,15.9T2,12Q2,9.92 2.79,8.1Q3.58,6.27 4.93,4.93Q6.28,3.57 8.1,2.79Q9.93,2 12,2t3.9,0.79t3.17,2.14q1.35,1.35 2.14,3.17Q22,9.92 22,12t-0.79,3.9t-2.14,3.17q-1.35,1.35-3.17,2.14T12,22Zm0-2q3.35,0 5.68-2.32T20,12T17.68,6.32T12,4T6.33,6.32T4,12t2.33,5.68T12,20Zm0-8Z"/></svg>
          </button>
          <button type="button" class="notice__control" id="notice-pause" aria-label="공지사항 정지">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#fff"><path d="M9,16h2V8H9v8Zm4,0h2V8H13v8Zm-1,6q-2.07,0-3.9-0.79q-1.82-0.79-3.17-2.14Q3.58,17.73 2.79,15.9T2,12Q2,9.92 2.79,8.1Q3.58,6.27 4.93,4.93Q6.28,3.57 8.1,2.79Q9.93,2 12,2t3.9,0.79t3.17,2.14q1.35,1.35 2.14,3.17Q22,9.92 22,12t-0.79,3.9t-2.14,3.17q-1.35,1.35-3.17,2.14T12,22Zm0-2q3.35,0 5.68-2.32T20,12T17.68,6.32T12,4T6.33,6.32T4,12t2.33,5.68T12,20Zm0-8Z"/></svg>
          </button>
          <button type="button" class="notice__control notice__close" id="notice-close" aria-label="공지사항 닫기">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#fff"><path d="M6.4,19L5,17.6L10.6,12L5,6.4L6.4,5L12,10.6L17.6,5L19,6.4L13.4,12L19,17.6L17.6,19L12,13.4L6.4,19Z"/></svg>
          </button>
        </div>
      </div>
      <div class="header--wrap">
        <div class="header__logo">
          <a href="${home}" aria-label="FLATTEN 홈"><img src="https://static.shoeprize.com/flatten/logo-flatten.svg" alt="FLATTEN" /></a>
        </div>
        <nav class="header__nav" aria-label="메인 네비게이션">
          <ul class="header__menu-list">${links('header__menu-link')}<li class="nav-auth" id="nav-auth" hidden></li></ul>
          <button class="header__hamburger" aria-label="모바일 메뉴 열기" aria-controls="mobile-menu" aria-expanded="false" id="hamburger-btn"><span></span><span></span><span></span></button>
        </nav>
      </div>
    </header>
    <aside class="mobile-menu" id="mobile-menu" aria-hidden="true" aria-label="모바일 메뉴">
      <div class="header--inner">
        <a href="${home}" aria-label="FLATTEN 홈"><img class="logo" src="${image}logo-flatten.svg" alt="FLATTEN" /></a>
        <button class="mobile-menu__close" id="menu-close-btn" aria-label="메뉴 닫기"></button>
      </div>
      <div class="mobile-menu__inner">
        <ul class="mobile-menu__list">${nav.map(([label, href]) => `<li class="mobile-menu__item"><a href="${href}" class="mobile-menu__link" data-menu-link>${label}</a></li>`).join('')}</ul>
        <div class="mobile-menu__cta-wrap"><a href="${root}notice-board/login.html" class="mobile-menu__cta">Login/Join</a></div>
      </div>
    </aside>`;

  const footerHtml = () => `
    <footer class="footer" id="site-footer">
      <div class="footer__inner">
        <div class="footer__top">
          <a href="${home}" class="footer__logo" aria-label="FLATTEN"><img src="${image}logo-flatten-g.svg" alt="FLATTEN" /></a>
          <ul class="footer__nav">
            <li><a href="${home}#page-2">Why FLATTEN</a></li>
            <li><a href="${root}pages/oursolutions.html">Our Solutions</a><ul class="footer__sub"><li><a href="${root}pages/oursolutions.html">shoeprize</a></li><li><a href="${root}pages/oursolutions.html">FLATTEN ERP</a></li><li><a href="${root}pages/oursolutions.html">FLATTEN QUEUE</a></li></ul></li>
            <li><a href="${home}#page-4">All Campaigns</a></li>
            <li><a href="${home}#page-5">Newsroom</a></li>
            <li><a href="#" target="_blank" rel="noopener">Careers &#8599;</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <hr class="footer__divider" />
        <p class="footer__name">FLATTEN Co., Ltd.</p>
        <p class="footer__info"><span class="footer__info-line">CEO: Lee Sang In</span><span class="sep">|</span><span class="footer__info-line footer__info-line--addr">Address: L117, L1 Floor, 15, Nonhyeon-ro 152-gil, Gangnam-gu, Seoul, Republic of Korea</span><span class="sep">|</span><span class="footer__info-line footer__info-line--biz">Business Registration No: 637-87-01821</span></p>
        <a href="${home}" class="footer__bottom-logo" aria-label="FLATTEN"><img src="${image}logo-flatten-g.svg" alt="FLATTEN" /></a>
      </div>
    </footer>`;

  function mount() {
    const main = document.querySelector('main');
    if (!main) return;
    document.getElementById('site-header')?.remove();
    document.getElementById('mobile-menu')?.remove();
    document.getElementById('site-footer')?.remove();
    main.insertAdjacentHTML('beforebegin', headerHtml());
    main.insertAdjacentHTML('afterend', footerHtml());
    window.__commonLayoutMounted = true;

    const notice = document.getElementById('site-notice');
    const items = document.getElementById('notice-preview-items');
    const playButton = document.getElementById('notice-play');
    const pauseButton = document.getElementById('notice-pause');
    const noticeCloseButton = document.getElementById('notice-close');
    let notices = [];
    let current = 0;
    let timer = null;
    let paused = false;
    const updatePlaybackButtons = () => {
      playButton.hidden = !paused;
      pauseButton.hidden = paused;
      playButton.setAttribute('aria-pressed', String(!paused));
    };
    const renderNotice = (index) => {
      if (!items || !notices.length) return;
      current = index % notices.length;
      items.innerHTML = notices.map((item, itemIndex) => `
        <a class="notice__item${itemIndex === current ? ' is-active' : ''}" href="${root}notice-board/notice-detail.html?id=${encodeURIComponent(item.id)}">
          <span class="notice__label">NOTICE</span><span class="notice__title">${escapeText(item.title)}</span>
        </a>`).join('');
    };
    const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
    const startTimer = () => {
      stopTimer();
      if (paused || notices.length < 2) return;
      timer = setInterval(() => renderNotice(current + 1), 5000);
    };
    const loadNotices = async () => {
      if (!window.__getNoticePreviews) return;
      try {
        notices = await window.__getNoticePreviews();
        if (!notices.length) { notice.hidden = true; return; }
        renderNotice(0);
        startTimer();
      } catch (error) {
        console.error('Failed to load notice preview', error);
        notice.hidden = true;
      }
    };
    window.addEventListener('notice-service-ready', loadNotices, { once: true });
    updatePlaybackButtons();
    loadNotices();
    pauseButton.addEventListener('click', () => {
      paused = true;
      stopTimer();
      updatePlaybackButtons();
    });
    playButton.addEventListener('click', () => {
      paused = false;
      updatePlaybackButtons();
      startTimer();
    });
    noticeCloseButton.addEventListener('click', () => {
      stopTimer();
      notice.hidden = true;
    });

    const authNav = document.getElementById('nav-auth');
    const renderAuth = (user) => {
      if (!authNav) return;
      authNav.hidden = false;
      if (user) {
        authNav.innerHTML = `<span class="nav-auth__welcome"><span class="username">${escapeText(user.name)}님</span> 환영합니다</span><button type="button" class="nav-auth__btn" id="logout-btn">Logout</button>`;
      } else {
        const current = `${location.pathname}${location.search}`;
        const loginHref = `${root}notice-board/login.html?redirect=${encodeURIComponent(current)}`;
        authNav.innerHTML = `<a href="${loginHref}" class="header__menu-link">Login</a>`;
      }
    };
    const bindAuth = () => {
      const service = window.__authService;
      if (!service || !authNav || authNav.dataset.bound === 'true') return;
      authNav.dataset.bound = 'true';
      service.onChange(renderAuth);
      service.ready().then(renderAuth);
      authNav.addEventListener('click', async (event) => {
        if (!event.target.closest('#logout-btn')) return;
        try {
          await service.logout();
        } catch (error) {
          console.error('Logout failed', error);
        }
        location.href = home;
      });
    };
    window.addEventListener('auth-service-ready', bindAuth, { once: true });
    bindAuth();

    const menu = document.getElementById('mobile-menu');
    const openButton = document.getElementById('hamburger-btn');
    const closeButton = document.getElementById('menu-close-btn');
    if (!menu || !openButton || !closeButton) return;
    const setMenu = (open) => {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      openButton.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('menu-open', open);
    };
    openButton.addEventListener('click', () => setMenu(true));
    closeButton.addEventListener('click', () => setMenu(false));
    menu.querySelectorAll('[data-menu-link]').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) setMenu(false);
    });
  }

  mount();
})();
