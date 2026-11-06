/**
 * FLATTEN 공지사항 게시판 (Firebase 연동 버전)
 *
 * 구성 (위에서 아래 순서)
 *   1. 모델/상수            2. [DATA] Firebase Firestore 서비스   3. 서비스 진입점
 *   4. 공통 유틸/레이아웃   5. 리치 에디터                         6. 페이지 로직 (목록/상세/글쓰기·수정)
 */
(function () {
  'use strict';

/* ======================================================================
 * 1. MODEL / CONSTANTS
 * ====================================================================== */
const NOTICE_CATEGORIES = ['공지사항'];
const PAGE_SIZE = 10;
const NEW_BADGE_DAYS = 7;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'pdf'];

/* ======================================================================
 * 2. DATA LAYER — Firebase Firestore & Storage Service
 * ====================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, orderBy, limit, startAfter, where, increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 사용자가 제공해주신 Firebase SDK 설정
const firebaseConfig = {
  apiKey: "AIzaSyCsS5dW0CrHb5yHPZ9v9lk-xuZSE1RYhF8",
  authDomain: "vibe-project-ujoo.firebaseapp.com",
  projectId: "vibe-project-ujoo",
  storageBucket: "vibe-project-ujoo.firebasestorage.app",
  messagingSenderId: "626569777591",
  appId: "1:626569777591:web:0a36dd2d2aa911c99f9832"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const COLLECTION_NAME = "notices";

const noticeFirebaseService = {
  getAll: async () => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getById: async (id) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  },

  list: async ({ page = 1, pageSize = 5, category = '', keyword = '' } = {}) => {
    // Firestore는 복잡한 full-text search나 다중 필터링 시 인덱스가 필요하므로 테스트용으로 전체를 가져와서 정렬/필터링 처리
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (category) list = list.filter((n) => n.category === category);
    const kw = keyword.trim().toLowerCase();
    if (kw) list = list.filter((n) => n.title.toLowerCase().includes(kw));

    const total = list.length;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total, page, pageSize };
  },

  getLatest: async (n = 3) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"), limit(n));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getAdjacent: async (id) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return { prev: null, next: null };
    const pick = (n) => (n ? { id: n.id, title: n.title } : null);
    return { prev: pick(list[idx + 1]), next: pick(list[idx - 1]) };
  },

  create: async (dto) => {
    const now = new Date().toISOString();
    // 번호(no) 자동 계산을 위해 전체 문서 수 조회
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const newNo = snapshot.size + 1;

    const noticeData = {
      ...dto,
      no: newNo,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), noticeData);
    return { id: docRef.id, ...noticeData };
  },

  update: async (id, dto) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updatedAt = new Date().toISOString();
    const updateData = { ...dto, updatedAt };
    await updateDoc(docRef, updateData);
    const updatedSnap = await getDoc(docRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  },

  increaseViews: async (id) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { views: increment(1) });
    const updatedSnap = await getDoc(docRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  },

  delete: async (id) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },
};

/**
 * 파일 스토리지 서비스 (Firebase Storage 연동)
 */
const fileStorageFirebase = {
  uploadFile: async (file) => {
    const filePath = `attachments/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { 
      name: file.name, 
      size: file.size, 
      type: file.type, 
      url: downloadURL, 
      path: filePath 
    };
  },

  uploadImage: async (file) => {
    const filePath = `editor_images/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  remove: async (attachment) => {
    if (!attachment || !attachment.path) return;
    try {
      const storageRef = ref(storage, attachment.path);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("파일 삭제 실패 또는 파일이 존재하지 않습니다:", err);
    }
  },
};

// 조회수 중복 증가 방지 (세션 스토리지 사용)
const KEY = 'notice_viewed_ids';
const viewGuard = {
  markIfFirst(id) {
    try {
      const ids = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      if (ids.includes(id)) return false;
      ids.push(id);
      sessionStorage.setItem(KEY, JSON.stringify(ids));
      return true;
    } catch {
      return true;
    }
  },
};

/* ======================================================================
 * 3. SERVICE ENTRY POINTS — Firebase 서비스로 연결
 * ====================================================================== */
const noticeService = noticeFirebaseService;
const fileStorageService = fileStorageFirebase;

/* ======================================================================
 * 4. COMMON UTILS / LAYOUT (banner, header, footer)
 * ====================================================================== */
const svg = (inner, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const alignIcon = (d) => svg(`<path d="${d}"/>`, 20);

const ICONS = {
  megaphone: svg('<path d="M3 11v3a1 1 0 0 0 1 1h2l8 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M18 9a4 4 0 0 1 0 6"/>', 20),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 16),
  eye: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 16),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>', 16),
  chevronLeft: svg('<path d="M15 18l-6-6 6-6"/>', 16),
  chevronRight: svg('<path d="M9 18l6-6-6-6"/>', 16),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 18),
  paperclip: svg('<path d="M21.4 11.1l-9.2 9.2a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5"/>', 18),
  link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>', 20),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-9 9"/>', 20),
  more: svg('<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/>', 20),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 14),
  alignLeft: alignIcon('M4 6h16M4 10h10M4 14h16M4 18h10'),
  alignCenter: alignIcon('M4 6h16M7 10h10M4 14h16M7 18h10'),
  alignRight: alignIcon('M4 6h16M10 10h10M4 14h16M10 18h10'),
  alignJustify: alignIcon('M4 6h16M4 10h16M4 14h16M4 18h16'),
};

const getParam = (name) => new URLSearchParams(location.search).get(name);

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

const isNew = (iso) => Date.now() - new Date(iso).getTime() < NEW_BADGE_DAYS * 86400000;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

const validateAttachment = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return `${file.name}: jpg, png, pdf 파일만 첨부할 수 있습니다.`;
  if (file.size > MAX_FILE_SIZE) return `${file.name}: 10MB 이하의 파일만 첨부할 수 있습니다.`;
  return null;
};

function showToast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-show'));
  setTimeout(() => {
    el.classList.remove('is-show');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'DIV', 'SPAN', 'A', 'IMG',
  'UL', 'OL', 'LI', 'FONT', 'H1', 'H2', 'H3', 'BLOCKQUOTE',
]);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT']);
const ALLOWED_STYLE = new Set([
  'text-align', 'font-family', 'font-size', 'font-weight', 'font-style',
  'text-decoration', 'color', 'background-color',
]);

const isSafeUrl = (value, allowDataImage = false) => {
  const v = value.trim();
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v)) return true;
  if (/^(https?:|mailto:|tel:)/i.test(v)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(v);
};

function cleanStyle(el) {
  const out = [];
  for (const prop of Array.from(el.style)) {
    if (!ALLOWED_STYLE.has(prop)) continue;
    const v = el.style.getPropertyValue(prop);
    if (/url\(|expression|javascript:/i.test(v)) continue;
    out.push(`${prop}:${v}`);
  }
  if (out.length) el.setAttribute('style', out.join(';'));
  else el.removeAttribute('style');
}

function cleanAttrs(el) {
  const tag = el.tagName;
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    let keep = false;
    if (name === 'style') keep = true;
    else if (tag === 'A' && name === 'href') keep = isSafeUrl(attr.value);
    else if (tag === 'IMG' && name === 'src') keep = isSafeUrl(attr.value, true);
    else if (tag === 'IMG' && name === 'alt') keep = true;
    else if (tag === 'FONT' && ['size', 'face', 'color'].includes(name)) keep = true;
    if (!keep) el.removeAttribute(attr.name);
  }
  if (el.hasAttribute('style')) cleanStyle(el);
  if (tag === 'A') {
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  }
}

function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) {
        child.remove();
        return;
      }
      if (DROP_TAGS.has(child.tagName)) {
        child.remove();
        return;
      }
      if (!ALLOWED_TAGS.has(child.tagName)) {
        walk(child);
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }
      cleanAttrs(child);
      walk(child);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

const LOGO = 'https://static.shoeprize.com/flatten/logo-flatten-g.svg';
const NAV = [
  ['Why FLATTEN', 'index.html#page-2'],
  ['Our Solutions', '../pages/oursolutions.html'],
  ['All Campaigns', 'index.html#page-4'],
  ['Newsroom', 'index.html#page-5'],
  ['Contact Us', '#'],
  ['Notice', 'notice-board/notice.html'],
];

const bannerHtml = () => `
  <div class="top-banner" id="top-banner">
    <div class="top-banner__items"></div>
    <button type="button" class="top-banner__close" id="top-banner-close" aria-label="배너 닫기">${ICONS.close}</button>
  </div>`;

const headerHtml = () => `
  <header class="site-header">
    <a class="site-header__logo" href="../index.html" aria-label="FLATTEN 홈">
      <img src="${LOGO}" alt="FLATTEN" />
    </a>
    <nav aria-label="메인 네비게이션">
      <ul class="site-header__nav">
        ${NAV.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}
      </ul>
    </nav>
  </header>`;

const footerHtml = () => `
  <footer class="site-footer">
    <div class="site-footer__left">
      <a href="index.html" aria-label="FLATTEN"><img src="${LOGO}" alt="FLATTEN" /></a>
      <ul class="site-footer__nav">
      ${NAV.slice(0, 4).map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}
      <li><a href="#" target="_blank" rel="noopener">Careers &#8599;</a></li>
      <li><a href="#">Contact Us</a></li>
      <li><a href="../notice-board/notice.html">Notice</a></li>
    </ul>
    </div>
    <span class="site-footer__bar"></span>
      <div class="site-footer__info">
        <p>FLATTEN Co., Ltd.</p>
        <p>
          CEO: Lee Sang In<span class="sep">|</span>Address: L117, L1 Floor, 15, Nonhyeon-ro 152-gil, Gangnam-gu, Seoul, Republic of Korea<span class="sep">|</span>Business Registration No: 637-87-01821
        </p>
      </div>
  </footer>`;

async function initBanner() {
  const el = document.getElementById('top-banner');
  try {
    const latest = await noticeService.getLatest(3);
    if (!latest.length) {
      el.hidden = true;
      return;
    }
    const items = el.querySelector('.top-banner__items');
    items.innerHTML = latest
      .map(
        (n) =>
          `<a class="top-banner__item" href="notice-detail.html?id=${encodeURIComponent(n.id)}">${ICONS.megaphone}<span>${escapeHtml(n.title)}</span></a>`,
      )
      .join('');

    const itemEls = [...items.children];
    let idx = 0;
    let timer = null;
    const show = (i) => {
      idx = i;
      itemEls.forEach((it, n) => it.classList.toggle('is-active', n === i));
    };
    const start = () => {
      if (latest.length < 2) return;
      clearInterval(timer);
      timer = setInterval(() => show((idx + 1) % latest.length), 4000);
    };
    show(0);
    start();

    const closeBtn = document.getElementById('top-banner-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearInterval(timer);
        el.hidden = true;
      });
    }
  } catch (err) {
    console.error('Failed to load banner', err);
    el.hidden = true;
  }
}

function mountLayout() {
  const main = document.querySelector('main');
  main.insertAdjacentHTML('beforebegin', bannerHtml() + headerHtml());
  main.insertAdjacentHTML('afterend', footerHtml());
  initBanner();
}

/* ======================================================================
 * 5. RICH EDITOR
 * ====================================================================== */
const FONTS = [
  ['Pretendard', 'Pretendard'],
  ['명조체', "'Noto Serif KR', serif"],
  ['고정폭', 'monospace'],
];
const SIZES = [
  ['작게', '2'],
  ['보통', '3'],
  ['크게', '4'],
  ['더 크게', '5'],
  ['매우 크게', '6'],
];

const btn = (attrs, html, label) =>
  `<button type="button" class="editor__btn" ${attrs} aria-label="${label}" title="${label}">${html}</button>`;

function createRichEditor(root, { placeholder = '', uploadImage, onError = () => {} }) {
  root.classList.add('editor');
  root.innerHTML = `
    <div class="editor__toolbar" role="toolbar" aria-label="서식 도구">
      ${btn('data-cmd="bold" data-state', '<b>B</b>', '굵게')}
      ${btn('data-cmd="italic" data-state', '<i>I</i>', '기울임')}
      ${btn('data-cmd="underline" data-state', '<u>U</u>', '밑줄')}
      <span class="editor__sep"></span>
      ${btn('data-cmd="justifyLeft"', ICONS.alignLeft, '왼쪽 정렬')}
      ${btn('data-cmd="justifyCenter"', ICONS.alignCenter, '가운데 정렬')}
      ${btn('data-cmd="justifyRight"', ICONS.alignRight, '오른쪽 정렬')}
      ${btn('data-cmd="justifyFull"', ICONS.alignJustify, '양쪽 정렬')}
      <span class="editor__sep"></span>
      ${btn('data-action="link"', ICONS.link, '링크')}
      ${btn('data-action="image"', ICONS.image, '이미지')}
      <span class="editor__more">
        ${btn('data-action="more" aria-haspopup="true"', ICONS.more, '더보기')}
        <div class="editor__more-menu" hidden>
          <button type="button" data-cmd="insertUnorderedList">글머리 기호 목록</button>
          <button type="button" data-cmd="insertOrderedList">번호 목록</button>
          <button type="button" data-cmd="removeFormat">서식 지우기</button>
        </div>
      </span>
      <span class="editor__spacer"></span>
      <select class="editor__select" data-select="fontName" aria-label="글꼴">
        <option value="" selected disabled>글꼴</option>
        ${FONTS.map(([l, v]) => `<option value="${escapeHtml(v)}">${l}</option>`).join('')}
      </select>
      <select class="editor__select" data-select="fontSize" aria-label="크기">
        <option value="" selected disabled>크기</option>
        ${SIZES.map(([l, v]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>
    <div class="editor__body notice-content is-empty" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="${escapeHtml(placeholder)}"></div>
    <input type="file" accept="image/png,image/jpeg" hidden />
  `;

  const toolbar = root.querySelector('.editor__toolbar');
  const body = root.querySelector('.editor__body');
  const fileInput = root.querySelector('input[type="file"]');
  const moreMenu = root.querySelector('.editor__more-menu');

  try {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  } catch {
    /* noop */
  }

  let saved = null;
  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && body.contains(sel.anchorNode)) saved = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    if (!saved) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(saved);
  };

  const toggleEmpty = () => {
    const empty = !body.textContent.trim() && !body.querySelector('img');
    body.classList.toggle('is-empty', empty);
  };

  const updateState = () => {
    saveRange();
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !body.contains(sel.anchorNode)) return;
    toolbar.querySelectorAll('[data-state]').forEach((b) => {
      let on = false;
      try {
        on = document.queryCommandState(b.dataset.cmd);
      } catch {
        on = false;
      }
      b.classList.toggle('is-active', on);
    });
  };
  document.addEventListener('selectionchange', updateState);

  const exec = (cmd, value = null) => {
    body.focus();
    restoreRange();
    const useCss = cmd === 'fontName' || cmd === 'fontSize' || cmd.startsWith('justify');
    try {
      document.execCommand('styleWithCSS', false, useCss);
    } catch {
      /* noop */
    }
    document.execCommand(cmd, false, value);
    saveRange();
    toggleEmpty();
  };

  const insertLink = () => {
    const collapsed = !saved || saved.collapsed;
    let url = window.prompt('링크 URL을 입력하세요.', 'https://');
    if (!url) return;
    url = url.trim();
    if (!url) return;
    if (/^(javascript|data|vbscript):/i.test(url)) {
      onError('사용할 수 없는 링크입니다.');
      return;
    }
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `https://${url}`;
    if (collapsed) exec('insertHTML', `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`);
    else exec('createLink', url);
  };

  toolbar.addEventListener('mousedown', (e) => {
    if (e.target.closest('select')) return;
    e.preventDefault();
  });

  toolbar.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target || !toolbar.contains(target)) return;
    const { cmd, action } = target.dataset;
    if (action === 'more') {
      moreMenu.hidden = !moreMenu.hidden;
      return;
    }
    moreMenu.hidden = true;
    if (action === 'link') insertLink();
    else if (action === 'image') {
      saveRange();
      fileInput.click();
    } else if (cmd) exec(cmd);
  });

  toolbar.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', () => {
      if (sel.value) exec(sel.dataset.select, sel.value);
      sel.selectedIndex = 0;
    });
  });

  document.addEventListener('click', (e) => {
    if (!root.querySelector('.editor__more').contains(e.target)) moreMenu.hidden = true;
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      onError('jpg, png 이미지만 삽입할 수 있습니다.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onError('이미지는 10MB 이하만 삽입할 수 있습니다.');
      return;
    }
    root.classList.add('is-uploading');
    try {
      const url = await uploadImage(file);
      exec('insertImage', url);
    } catch (err) {
      onError(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      root.classList.remove('is-uploading');
    }
  });

  body.addEventListener('paste', (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const clean = html ? sanitizeHtml(html) : escapeHtml(text).replace(/\r?\n/g, '<br>');
    document.execCommand('insertHTML', false, clean);
    toggleEmpty();
  });

  body.addEventListener('input', toggleEmpty);
  body.addEventListener('keyup', saveRange);
  body.addEventListener('mouseup', saveRange);

  return {
    getHtml: () => sanitizeHtml(body.innerHTML),
    setHtml: (html) => {
      body.innerHTML = sanitizeHtml(html);
      toggleEmpty();
    },
    isEmpty: () => !body.textContent.trim() && !body.querySelector('img'),
    focus: () => body.focus(),
  };
}

/* ======================================================================
 * 6. PAGES
 * ====================================================================== */
function initListPage() {
  mountLayout();

  const params = new URLSearchParams(location.search);
  const q = (params.get('q') || '').trim();
  const category = NOTICE_CATEGORIES.includes(params.get('category')) ? params.get('category') : '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const rowsEl = document.getElementById('rows');
  const totalEl = document.getElementById('total');
  const pagerEl = document.getElementById('pagination');
  const form = document.getElementById('search-form');

  form.elements.q.value = q;
  form.elements.category.value = category;

  const pageUrl = (p) => {
    const sp = new URLSearchParams();
    if (category) sp.set('category', category);
    if (q) sp.set('q', q);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return `notice.html${s ? `?${s}` : ''}`;
  };

  const renderRows = (items) => {
    if (!items.length) {
      rowsEl.innerHTML = `<p class="notice-empty">${q || category ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.'}</p>`;
      return;
    }
    rowsEl.innerHTML = items
      .map(
        (n) => `
        <a class="notice-row" href="notice-detail.html?id=${encodeURIComponent(n.id)}">
          <span class="col-no">${n.no}</span>
          <span class="col-title"><span class="title-text">${escapeHtml(n.title)}</span>${isNew(n.createdAt) ? '<span class="badge-new">NEW</span>' : ''}</span>
          <span class="col-date">${formatDate(n.createdAt)}</span>
          <span class="col-views">${Number(n.views).toLocaleString()}</span>
        </a>`,
      )
      .join('');
  };

  const renderPager = (total, current) => {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    const nums = [];
    for (let i = start; i <= end; i += 1) {
      nums.push(
        i === current
          ? `<span class="pager__num is-current" aria-current="page">${i}</span>`
          : `<a class="pager__num" href="${pageUrl(i)}">${i}</a>`,
      );
    }
    const prev =
      current > 1
        ? `<a class="pager__arrow" href="${pageUrl(current - 1)}" aria-label="이전 페이지">&#8249;</a>`
        : '<span class="pager__arrow is-disabled" aria-hidden="true">&#8249;</span>';
    const next =
      current < totalPages
        ? `<a class="pager__arrow" href="${pageUrl(current + 1)}" aria-label="다음 페이지">&#8250;</a>`
        : '<span class="pager__arrow is-disabled" aria-hidden="true">&#8250;</span>';
    pagerEl.innerHTML = prev + nums.join('') + next;
  };

  (async () => {
    rowsEl.innerHTML = '<p class="notice-empty">로딩 중...</p>';
    try {
      const { items, total } = await noticeService.list({
        page,
        pageSize: PAGE_SIZE,
        category,
        keyword: q,
      });
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPages) {
        location.replace(pageUrl(totalPages));
        return;
      }
      totalEl.textContent = total;
      renderRows(items);
      renderPager(total, page);
    } catch (err) {
      console.error('Failed to load notices', err);
      rowsEl.innerHTML = '<p class="notice-empty">목록을 불러오지 못했습니다.</p>';
    }
  })();
}

function initDetailPage() {
  mountLayout();

  const app = document.getElementById('notice-app');
  const id = getParam('id');

  const notFound = (msg = '게시글을 찾을 수 없습니다.') => {
    app.innerHTML = `
      <p class="notice-empty">${escapeHtml(msg)}</p>
      <div class="detail-actions"><a class="btn-outline" href="notice.html">${ICONS.list}목록으로</a></div>`;
  };

  const attachmentsHtml = (list) => {
    if (!list || !list.length) return '';
    const items = list
      .map((a) => {
        const label = `${ICONS.paperclip}<span>${escapeHtml(a.name)}</span><em>${formatBytes(a.size)}</em>`;
        return a.url
          ? `<li><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener" download>${label}</a></li>`
          : `<li><span class="attach-item">${label}</span></li>`;
      })
      .join('');
    return `<div class="detail-attach"><strong>첨부파일</strong><ul>${items}</ul></div>`;
  };

  const navItem = (item, dir) => {
    if (!item) return `<span class="nav-item nav-item--${dir} is-empty">${dir === 'prev' ? '이전글이 없습니다.' : '다음글이 없습니다.'}</span>`;
    const href = `notice-detail.html?id=${encodeURIComponent(item.id)}`;
    return dir === 'prev'
      ? `<a class="nav-item nav-item--prev" href="${href}">${ICONS.chevronLeft}<strong>이전글</strong><span class="nav-bar"></span><span class="nav-title">${escapeHtml(item.title)}</span></a>`
      : `<a class="nav-item nav-item--next" href="${href}"><strong>다음글</strong><span class="nav-bar"></span><span class="nav-title">${escapeHtml(item.title)}</span>${ICONS.chevronRight}</a>`;
  };

  const render = (n, adj) => {
    document.title = `${n.title} | FLATTEN`;
    app.innerHTML = `
      <a class="back-link" href="notice.html">${ICONS.chevronLeft}목록으로 돌아가기</a>
      <div class="detail-head">
        <h2 class="detail-title">${escapeHtml(n.title)}${isNew(n.createdAt) ? '<span class="badge-new">NEW</span>' : ''}</h2>
        <div class="detail-meta">
          <span>${ICONS.calendar}${formatDate(n.createdAt)}</span>
          <span>${ICONS.eye}${Number(n.views).toLocaleString()}</span>
          <button type="button" id="share-btn">${ICONS.share}공유하기</button>
        </div>
      </div>
      <div class="detail-body notice-content">${sanitizeHtml(n.content)}</div>
      ${attachmentsHtml(n.attachments)}
      <nav class="detail-nav" aria-label="이전글 다음글">
        ${navItem(adj.prev, 'prev')}
        ${navItem(adj.next, 'next')}
      </nav>
      <div class="detail-actions">
        <a class="btn-outline" href="notice.html">${ICONS.list}목록으로</a>
        <div class="detail-actions__admin">
          <a class="btn-outline btn-sm" href="notice-edit.html?id=${encodeURIComponent(n.id)}">수정</a>
          <button type="button" class="btn-outline btn-sm btn-danger" id="delete-btn">삭제</button>
        </div>
      </div>`;

    document.getElementById('share-btn').addEventListener('click', async () => {
      const ok = await copyText(location.href);
      showToast(ok ? '링크가 복사되었습니다.' : '링크 복사에 실패했습니다.');
    });

    document.getElementById('delete-btn').addEventListener('click', async (e) => {
      if (!window.confirm('이 게시글을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
      e.currentTarget.disabled = true;
      try {
        await noticeService.delete(n.id);
        await Promise.allSettled((n.attachments || []).map((a) => fileStorageService.remove(a)));
        location.href = 'notice.html';
      } catch (err) {
        console.error(err);
        showToast(err.message || '삭제에 실패했습니다.');
        e.currentTarget.disabled = false;
      }
    });
  };

  (async () => {
    if (!id) return notFound();
    app.innerHTML = '<p class="notice-empty">로딩 중...</p>';
    try {
      let notice = await noticeService.getById(id);
      if (!notice) return notFound();
      if (viewGuard.markIfFirst(id)) notice = await noticeService.increaseViews(id);
      const adj = await noticeService.getAdjacent(id);
      render(notice, adj);
    } catch (err) {
      console.error('Failed to load notice', err);
      notFound('게시글을 불러오지 못했습니다.');
    }
  })();
}

function initFormPage() {
  mountLayout();

  const isEdit = document.body.dataset.mode === 'edit';
  const app = document.getElementById('notice-app');
  const id = getParam('id');

  const notFound = () => {
    app.innerHTML = `
      <p class="notice-empty">게시글을 찾을 수 없습니다.</p>
      <div class="detail-actions"><a class="btn-outline" href="notice.html">${ICONS.list}목록으로</a></div>`;
  };

  function renderForm(notice) {
    const backHref = isEdit ? `notice-detail.html?id=${encodeURIComponent(id)}` : 'notice.html';
    app.innerHTML = `
      <a class="back-link" href="notice.html">${ICONS.chevronLeft}목록으로 돌아가기</a>
      <h2 class="form-heading">${isEdit ? '글수정' : '글쓰기'}</h2>
      <form class="notice-form" id="notice-form" novalidate>
        <div class="form-row">
          <label class="form-label" for="f-title">제목 *</label>
          <div class="form-field">
            <input id="f-title" class="input" type="text" maxlength="100" placeholder="제목을 입력하세요." autocomplete="off" />
            <p class="field-error" id="err-title" role="alert" hidden></p>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label" for="f-category">분류</label>
          <div class="form-field">
            <div class="select-wrap select-wrap--form">
              <select id="f-category" class="select">
                ${NOTICE_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="form-row form-row--top">
          <span class="form-label">내용 *</span>
          <div class="form-field">
            <div id="f-editor"></div>
            <p class="field-error" id="err-content" role="alert" hidden></p>
          </div>
        </div>
        <div class="form-row">
          <span class="form-label">첨부파일</span>
          <div class="form-field">
            <div class="attach-row">
              <label class="btn-file">
                <input type="file" id="f-file" multiple accept=".jpg,.jpeg,.png,.pdf" hidden />
                ${ICONS.paperclip}파일 선택
              </label>
              <span class="attach-status" id="file-status">선택된 파일이 없습니다.</span>
              <span class="attach-hint">※ 최대 10MB 이하의 파일만 첨부 가능합니다. (jpg, png, pdf 등)</span>
            </div>
            <ul class="attach-edit-list" id="file-list"></ul>
            <p class="field-error" id="err-file" role="alert" hidden></p>
          </div>
        </div>
        <div class="form-actions">
          <a class="btn-outline" href="${backHref}">취소</a>
          <button type="submit" class="btn-primary" id="submit-btn">${isEdit ? '수정하기' : '등록하기'}</button>
        </div>
      </form>`;

    const form = document.getElementById('notice-form');
    const titleEl = document.getElementById('f-title');
    const catEl = document.getElementById('f-category');
    const fileInput = document.getElementById('f-file');
    const fileList = document.getElementById('file-list');
    const fileStatus = document.getElementById('file-status');
    const submitBtn = document.getElementById('submit-btn');

    const setError = (key, msg) => {
      const el = document.getElementById(`err-${key}`);
      el.textContent = msg || '';
      el.hidden = !msg;
    };

    const editor = createRichEditor(document.getElementById('f-editor'), {
      placeholder: '내용을 입력하세요.',
      uploadImage: (file) => fileStorageService.uploadImage(file),
      onError: (msg) => setError('content', msg),
    });

    let existing = notice ? [...(notice.attachments || [])] : [];
    const removedExisting = [];
    let newFiles = [];

    const renderFiles = () => {
      const count = existing.length + newFiles.length;
      fileStatus.textContent = count ? `${count}개 파일 선택됨` : '선택된 파일이 없습니다.';
      const li = (name, size, kind, i) =>
        `<li><span>${escapeHtml(name)} <em>(${formatBytes(size)})</em></span><button type="button" data-kind="${kind}" data-i="${i}" aria-label="${escapeHtml(name)} 삭제">${ICONS.close}</button></li>`;
      fileList.innerHTML =
        existing.map((a, i) => li(a.name, a.size, 'existing', i)).join('') +
        newFiles.map((f, i) => li(f.name, f.size, 'new', i)).join('');
    };

    fileList.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-kind]');
      if (!b) return;
      const i = Number(b.dataset.i);
      if (b.dataset.kind === 'existing') removedExisting.push(...existing.splice(i, 1));
      else newFiles.splice(i, 1);
      renderFiles();
    });

    fileInput.addEventListener('change', () => {
      setError('file', '');
      const errors = [];
      Array.from(fileInput.files).forEach((f) => {
        const err = validateAttachment(f);
        if (err) errors.push(err);
        else if (!newFiles.some((n) => n.name === f.name && n.size === f.size)) newFiles.push(f);
      });
      fileInput.value = '';
      if (errors.length) setError('file', errors.join(' / '));
      renderFiles();
    });

    if (notice) {
      titleEl.value = notice.title;
      catEl.value = notice.category;
      editor.setHtml(notice.content);
    }
    renderFiles();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setError('title', '');
      setError('content', '');
      const title = titleEl.value.trim();
      let firstInvalid = null;
      if (!title) {
        setError('title', '제목을 입력해주세요.');
        firstInvalid = titleEl;
      }
      if (editor.isEmpty()) {
        setError('content', '내용을 입력해주세요.');
        firstInvalid = firstInvalid || { focus: () => editor.focus() };
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '저장 중...';
      try {
        const uploaded = await Promise.all(newFiles.map((f) => fileStorageService.uploadFile(f)));
        const dto = {
          title,
          category: catEl.value,
          content: editor.getHtml(),
          attachments: [...existing, ...uploaded],
        };
        const saved = isEdit ? await noticeService.update(id, dto) : await noticeService.create(dto);
        if (isEdit) await Promise.allSettled(removedExisting.map((a) => fileStorageService.remove(a)));
        location.href = `notice-detail.html?id=${encodeURIComponent(saved.id)}`;
      } catch (err) {
        console.error('Failed to save notice', err);
        showToast(err.message || '저장에 실패했습니다.');
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? '수정하기' : '등록하기';
      }
    });
  }

  (async () => {
    if (!isEdit) return renderForm(null);
    if (!id) return notFound();
    app.innerHTML = '<p class="notice-empty">로딩 중...</p>';
    try {
      const notice = await noticeService.getById(id);
      if (!notice) return notFound();
      renderForm(notice);
    } catch (err) {
      console.error('Failed to load notice', err);
      notFound();
    }
  })();
}

  const pageType = document.body.dataset.page;
  if (pageType === 'list') initListPage();
  else if (pageType === 'detail') initDetailPage();
  else if (pageType === 'form') initFormPage();
})();