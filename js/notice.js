/**
 * FLATTEN 공지사항 게시판 (단일 파일 번들)
 *
 * 구성 (위에서 아래 순서)
 *   1. 모델/상수            2. [DATA] Mock 서비스 (localStorage)   3. 서비스 진입점 ← Firebase 전환 시 교체
 *   4. 공통 유틸/레이아웃   5. 리치 에디터                          6. 페이지 로직 (목록/상세/글쓰기·수정)
 *
 * UI(4~6)는 noticeService / fileStorageService 인터페이스만 사용하며 localStorage를 직접 호출하지 않는다.
 * (sessionStorage는 조회수 중복 방지용 viewGuard에서만 사용)
 */
(function () {
  'use strict';

/* ======================================================================
 * 1. MODEL / CONSTANTS
 * ====================================================================== */
/**
 * 데이터 모델 및 공통 상수 (Firestore 친화적 단일 문서 구조)
 *
 * @typedef {Object} Attachment            첨부파일 메타데이터 (파일 본문은 저장하지 않음)
 * @property {string} name
 * @property {number} size                 bytes
 * @property {string} type                 MIME type
 * @property {string} [url]                Firebase Storage 전환 시 downloadURL 저장
 * @property {string} [path]               Firebase Storage 전환 시 storage 경로(삭제용)
 *
 * @typedef {Object} Notice
 * @property {string} id                   crypto.randomUUID() / Firestore doc.id
 * @property {number} no                   화면 표시용 게시글 번호
 * @property {string} title
 * @property {string} category
 * @property {string} content              HTML (sanitize 완료본)
 * @property {Attachment[]} attachments
 * @property {number} views
 * @property {string} createdAt            ISO 8601
 * @property {string} updatedAt            ISO 8601
 *
 * @typedef {Object} CreateNoticeDto
 * @property {string} title
 * @property {string} category
 * @property {string} content
 * @property {Attachment[]} attachments
 *
 * @typedef {Partial<CreateNoticeDto>} UpdateNoticeDto
 *
 * @typedef {Object} ListQuery
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {string} [category]           빈 문자열 = 전체
 * @property {string} [keyword]            제목 검색어
 *
 * @typedef {Object} ListResult
 * @property {Notice[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 *
 * ─────────────────────────────────────────────
 * NoticeService 인터페이스 (Mock / Firebase 구현체가 동일하게 따른다)
 *   getAll(): Promise<Notice[]>
 *   getById(id): Promise<Notice | null>
 *   list(query): Promise<ListResult>
 *   getLatest(n): Promise<Notice[]>
 *   getAdjacent(id): Promise<{ prev: {id,title}|null, next: {id,title}|null }>   // prev=더 오래된 글, next=더 최신 글
 *   create(dto): Promise<Notice>
 *   update(id, dto): Promise<Notice>
 *   increaseViews(id): Promise<Notice>
 *   delete(id): Promise<void>
 *
 * FileStorageService 인터페이스
 *   uploadFile(file): Promise<Attachment>       // 첨부파일 → 메타데이터 반환
 *   uploadImage(file): Promise<string>          // 에디터 이미지 → URL 반환
 *   remove(attachment): Promise<void>
 */

const NOTICE_CATEGORIES = ['공지사항'];
const PAGE_SIZE = 10;
const NEW_BADGE_DAYS = 7;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'pdf'];

/* ======================================================================
 * 2. DATA LAYER — LocalStorage Mock (Firebase 전환 시 이 구간을 Firebase 구현체로 대체)
 * ====================================================================== */
const LATENCY = 150; // 네트워크 레이턴시 시뮬레이션 (ms)

const delay = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));

/** crypto.randomUUID() 우선 사용 (file:// 등 비보안 컨텍스트 대비 폴백 포함) */
const newId = () => {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`;
};

const storageHelper = {
  async get(key, defaultValue) {
    await delay();
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    try {
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  },

  async set(key, value) {
    await delay();
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new Error('저장 공간이 부족합니다. 이미지 용량을 줄여 다시 시도해주세요.');
    }
  },
};

const p = (...lines) => `<p>${lines.join('<br>')}</p>`;
const kst = (ymd) => new Date(`${ymd.replace(/\./g, '-')}T10:00:00+09:00`).toISOString();

const SEED = [
  [1, '개인정보처리방침 개정 안내', '2026.10.14', 472,
    p('안녕하세요, FLATTEN입니다.', '개인정보처리방침이 일부 개정되어 안내드립니다.') +
      p('자세한 변경 사항은 개정된 방침을 통해 확인하실 수 있습니다.', '감사합니다.')],
  [2, '고객센터 운영시간 변경 안내', '2026.10.17', 521,
    p('안녕하세요, FLATTEN입니다.', '고객센터 운영시간이 아래와 같이 변경됩니다.') +
      p('평일 10:00 ~ 18:00 (점심시간 12:30 ~ 13:30)', '주말 및 공휴일은 휴무입니다.')],
  [3, 'FLATTEN 뉴스룸이 새롭게 개편되었습니다.', '2026.10.20', 789,
    p('안녕하세요, FLATTEN입니다.', 'FLATTEN 뉴스룸이 새로운 모습으로 개편되었습니다.') +
      p('브랜드 소식과 캠페인 성공 사례를 더욱 편리하게 만나보세요.')],
  [4, '서비스 점검 안내 (10/25)', '2026.10.24', 613,
    p('안녕하세요, FLATTEN입니다.', '안정적인 서비스 제공을 위해 아래 일정으로 시스템 점검을 진행합니다.') +
      p('점검 일시: 2026.10.25(토) 02:00 ~ 05:00', '점검 시간 동안에는 일부 서비스 이용이 제한될 수 있습니다.')],
  [5, '가을 시즌 특별 프로모션을 만나보세요.', '2026.10.28', 724,
    p('안녕하세요, FLATTEN입니다.', '가을 시즌을 맞아 다양한 혜택이 준비된 특별 프로모션을 진행합니다.') +
      p('많은 관심과 참여 부탁드립니다.')],
  [6, '신규 브랜드 스토어가 오픈했습니다.', '2026.10.30', 892,
    p('안녕하세요, FLATTEN입니다.', '신규 브랜드 스토어가 오픈했습니다.') +
      p('오픈 기념 이벤트도 함께 진행되오니 많은 방문 부탁드립니다.')],
  [7, 'FLATTEN 2026 F/W Campaign이 시작되었습니다.', '2026.11.03', 1245,
    '<p><img src="images/flatten-7.webp" alt="FLATTEN"></p>' +
      p('안녕하세요, <b>FLATTEN</b>입니다.', '2026 F/W 시즌을 맞아, 새로운 캠페인이 시작되었습니다.') +
      p('이번 캠페인은 일상 속에서 더욱 가까워진 <b>FLATTEN</b>의 무드를 담아,', '지금 이 순간을 특별하게 만드는 다양한 콘텐츠를 선보입니다.') +
      p('앞으로도 FLATTEN은 더 나은 경험과 가치를 전달하기 위해 노력하겠습니다.', '많은 관심과 참여 부탁드립니다.')],
];

/** 최초 접속 시 localStorage에 주입되는 시드 데이터 7건 */
function buildSeed() {
  return SEED.map(([no, title, date, views, content]) => {
    const iso = kst(date);
    return {
      id: newId(),
      no,
      title,
      category: '공지사항',
      content,
      attachments: [],
      views,
      createdAt: iso,
      updatedAt: iso,
    };
  });
}

const STORAGE_KEY = 'mock_notices';

const sortDesc = (list) =>
  [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.no - a.no);

/** 저장소가 비어 있으면(최초 접속) 시드 주입 */
async function load() {
  let list = await storageHelper.get(STORAGE_KEY, null);
  if (!list) {
    list = buildSeed();
    await storageHelper.set(STORAGE_KEY, list);
  }
  return list;
}

const noticeMockService = {
  getAll: async () => sortDesc(await load()),

  getById: async (id) => {
    const list = await load();
    return list.find((item) => item.id === id) || null;
  },

  /** 분류 필터 + 제목 검색 + 최신순 + 페이지네이션 */
  list: async ({ page = 1, pageSize = 5, category = '', keyword = '' } = {}) => {
    let list = sortDesc(await load());
    if (category) list = list.filter((n) => n.category === category);
    const kw = keyword.trim().toLowerCase();
    if (kw) list = list.filter((n) => n.title.toLowerCase().includes(kw));
    const total = list.length;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total, page, pageSize };
  },

  getLatest: async (n = 3) => sortDesc(await load()).slice(0, n),

  /** prev = 한 칸 더 오래된 글, next = 한 칸 더 최신 글 */
  getAdjacent: async (id) => {
    const list = sortDesc(await load());
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return { prev: null, next: null };
    const pick = (n) => (n ? { id: n.id, title: n.title } : null);
    return { prev: pick(list[idx + 1]), next: pick(list[idx - 1]) };
  },

  create: async (dto) => {
    const list = await load();
    const now = new Date().toISOString();
    const notice = {
      ...dto,
      id: newId(),
      no: list.reduce((max, n) => Math.max(max, n.no), 0) + 1,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(notice);
    await storageHelper.set(STORAGE_KEY, list);
    return notice;
  },

  update: async (id, dto) => {
    const list = await load();
    const index = list.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Notice ${id} not found`);
    const updated = { ...list[index], ...dto, updatedAt: new Date().toISOString() };
    list[index] = updated;
    await storageHelper.set(STORAGE_KEY, list);
    return updated;
  },

  increaseViews: async (id) => {
    const list = await load();
    const index = list.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Notice ${id} not found`);
    list[index] = { ...list[index], views: list[index].views + 1 };
    await storageHelper.set(STORAGE_KEY, list);
    return list[index];
  },

  delete: async (id) => {
    const list = await load();
    await storageHelper.set(
      STORAGE_KEY,
      list.filter((n) => n.id !== id),
    );
  },
};

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    img.src = src;
  });

const MAX_IMAGE_WIDTH = 1200;

/**
 * Mock 파일 저장소
 *  - 첨부파일: 메타데이터(name/size/type)만 반환 (실제 파일은 저장하지 않음)
 *  - 에디터 이미지: localStorage 용량 한계를 고려해 리사이즈/압축한 data URL 반환
 *    → Firebase 전환 시 Storage 업로드 후 downloadURL을 반환하도록 교체
 */
const fileStorageMock = {
  uploadFile: async (file) => {
    await delay();
    return { name: file.name, size: file.size, type: file.type };
  },

  uploadImage: async (file) => {
    await delay();
    const img = await loadImage(await readAsDataUrl(file));
    const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  },

  remove: async () => {
    await delay();
  },
};

// 조회수 중복 증가 방지 (새로고침/재진입 시 같은 세션에서 1회만 카운트)
// DB가 아닌 "브라우저 세션 상태"이므로 Firebase 전환 후에도 그대로 사용한다.
const KEY = 'notice_viewed_ids';

const viewGuard = {
  /** 이 세션에서 처음 보는 글이면 true (그리고 기록) */
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
 * 2-B. DATA LAYER — Firebase (Firestore + Storage)
 *  - 번들러 없이 동작하도록 Firebase 모듈 SDK를 CDN(gstatic)에서 동적 import 한다.
 *  - 컬렉션: notices / 게시글 번호 카운터: meta/noticeCounter
 *  - createdAt/updatedAt은 기존 모델과 동일하게 ISO 문자열로 저장 (UI 변경 없음)
 * ====================================================================== */
const FIREBASE_VERSION = '10.14.1';
const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

const firebaseConfig = {
  apiKey: 'AIzaSyCsS5dW0CrHb5yHPZ9v9lk-xuZSE1RYhF8',
  authDomain: 'vibe-project-ujoo.firebaseapp.com',
  projectId: 'vibe-project-ujoo',
  storageBucket: 'vibe-project-ujoo.firebasestorage.app',
  messagingSenderId: '626569777591',
  appId: '1:626569777591:web:0a36dd2d2aa911c99f9832',
};

const NOTICES_COL = 'notices';
const COUNTER_PATH = ['meta', 'noticeCounter'];

let firebasePromise = null;
/** Firebase SDK를 최초 1회만 로드/초기화 (실패 시 다음 호출에서 재시도) */
const getFirebase = () => {
  if (!firebasePromise) {
    firebasePromise = (async () => {
      const [appMod, fs, st, au] = await Promise.all([
        import(`${FIREBASE_CDN}/firebase-app.js`),
        import(`${FIREBASE_CDN}/firebase-firestore.js`),
        import(`${FIREBASE_CDN}/firebase-storage.js`),
        import(`${FIREBASE_CDN}/firebase-auth.js`),
      ]);
      const app = appMod.initializeApp(firebaseConfig);
      return { fs, st, au, db: fs.getFirestore(app), storage: st.getStorage(app), auth: au.getAuth(app) };
    })();
    firebasePromise.catch(() => {
      firebasePromise = null;
    });
  }
  return firebasePromise;
};

// Q&A 게시판 등 공통 Firebase 기능에서 동일한 초기화를 재사용합니다.
window.__getFirebase = getFirebase;

const fromSnap = (snap) => ({ ...snap.data(), id: snap.id });

/** Firestore는 undefined 값을 허용하지 않으므로 제거 */
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/** Firebase 오류를 화면에서 이해할 수 있는 메시지로 변환 */
const mapFirestoreError = (err) => {
  if (!err) return new Error('요청을 처리하지 못했습니다.');
  if (err.code === 'permission-denied' || err.code === 'firestore/permission-denied') {
    return fail(
      '관리자 권한이 확인되지 않아 저장할 수 없습니다. Firebase Firestore 규칙에서 로그인한 사용자의 users 문서 role이 admin인지 확인해주세요.',
      null,
      err.code,
    );
  }
  if (err.code === 'unauthenticated' || err.code === 'firestore/unauthenticated') {
    return fail('로그인 상태가 만료되었습니다. 다시 로그인해주세요.', null, err.code);
  }
  return err;
};

const noticeFirebaseService = {
  getAll: async () => {
    const { fs, db } = await getFirebase();
    const snap = await fs.getDocs(fs.query(fs.collection(db, NOTICES_COL), fs.orderBy('createdAt', 'desc')));
    return sortDesc(snap.docs.map(fromSnap));
  },

  getById: async (id) => {
    const { fs, db } = await getFirebase();
    const snap = await fs.getDoc(fs.doc(db, NOTICES_COL, id));
    return snap.exists() ? fromSnap(snap) : null;
  },

  /**
   * 분류 필터 + 제목 검색 + 최신순 + 페이지네이션
   * Firestore는 부분 문자열 검색을 지원하지 않으므로 전체를 가져와 클라이언트에서 필터링한다.
   * (공지 게시판 규모 기준. 수천 건 이상이 되면 검색 서비스/서버 페이지네이션 도입 필요)
   */
  list: async ({ page = 1, pageSize = 5, category = '', keyword = '' } = {}) => {
    let list = await noticeFirebaseService.getAll();
    if (category) list = list.filter((n) => n.category === category);
    const kw = keyword.trim().toLowerCase();
    if (kw) list = list.filter((n) => n.title.toLowerCase().includes(kw));
    const total = list.length;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total, page, pageSize };
  },

  getLatest: async (n = 3) => {
    const { fs, db } = await getFirebase();
    const snap = await fs.getDocs(
      fs.query(fs.collection(db, NOTICES_COL), fs.orderBy('createdAt', 'desc'), fs.limit(n)),
    );
    return sortDesc(snap.docs.map(fromSnap)).slice(0, n);
  },

  /** prev = 한 칸 더 오래된 글, next = 한 칸 더 최신 글 */
  getAdjacent: async (id) => {
    const list = await noticeFirebaseService.getAll();
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return { prev: null, next: null };
    const pick = (n) => (n ? { id: n.id, title: n.title } : null);
    return { prev: pick(list[idx + 1]), next: pick(list[idx - 1]) };
  },

  /** 게시글 번호(no)는 meta/noticeCounter를 트랜잭션으로 증가시켜 중복 없이 부여 */
  create: async (dto) => {
    try {
      const { fs, db, auth } = await getFirebase();
      if (!auth.currentUser) throw fail('로그인 후 등록할 수 있습니다.', null, 'unauthenticated');
      const col = fs.collection(db, NOTICES_COL);
      const counterRef = fs.doc(db, ...COUNTER_PATH);
      const newRef = fs.doc(col);

    // 카운터 문서가 아직 없으면 기존 최대 번호에서 이어서 시작
      let base = 0;
      const counterSnap = await fs.getDoc(counterRef);
      if (!counterSnap.exists()) {
        const top = await fs.getDocs(fs.query(col, fs.orderBy('no', 'desc'), fs.limit(1)));
        base = top.empty ? 0 : top.docs[0].data().no || 0;
      }

      const now = new Date().toISOString();
      const { id: _ignore, ...rest } = dto;
      const data = stripUndefined({ ...rest, views: 0, createdAt: now, updatedAt: now });

      const no = await fs.runTransaction(db, async (tx) => {
        const c = await tx.get(counterRef);
        const next = (c.exists() ? c.data().last : base) + 1;
        tx.set(counterRef, { last: next });
        tx.set(newRef, { ...data, no: next });
        return next;
      });
      return { ...data, no, id: newRef.id };
    } catch (err) {
      throw mapFirestoreError(err);
    }
  },

  update: async (id, dto) => {
    try {
      const { fs, db, auth } = await getFirebase();
      if (!auth.currentUser) throw fail('로그인 후 수정할 수 있습니다.', null, 'unauthenticated');
      const ref = fs.doc(db, NOTICES_COL, id);
      const snap = await fs.getDoc(ref);
      if (!snap.exists()) throw new Error(`Notice ${id} not found`);
      const { id: _ignore, no: _no, views: _views, createdAt: _created, ...rest } = dto;
      await fs.updateDoc(ref, stripUndefined({ ...rest, updatedAt: new Date().toISOString() }));
      return fromSnap(await fs.getDoc(ref));
    } catch (err) {
      throw mapFirestoreError(err);
    }
  },

  increaseViews: async (id) => {
    const { fs, db } = await getFirebase();
    const ref = fs.doc(db, NOTICES_COL, id);
    await fs.updateDoc(ref, { views: fs.increment(1) });
    const snap = await fs.getDoc(ref);
    if (!snap.exists()) throw new Error(`Notice ${id} not found`);
    return fromSnap(snap);
  },

  delete: async (id) => {
    try {
      const { fs, db, auth } = await getFirebase();
      if (!auth.currentUser) throw fail('로그인 후 삭제할 수 있습니다.', null, 'unauthenticated');
      await fs.deleteDoc(fs.doc(db, NOTICES_COL, id));
    } catch (err) {
      throw mapFirestoreError(err);
    }
  },

  /**
   * 초기 시드 7건을 Firestore에 1회 주입 (브라우저 콘솔에서 __seedNotices() 실행)
   * 컬렉션에 문서가 이미 있으면 중단 (force=true 로 강제 가능)
   */
  seed: async (force = false) => {
    const { fs, db } = await getFirebase();
    const col = fs.collection(db, NOTICES_COL);
    const existing = await fs.getDocs(fs.query(col, fs.limit(1)));
    if (!existing.empty && !force) {
      console.warn('[seed] notices 컬렉션에 이미 데이터가 있어 중단했습니다. __seedNotices(true)로 강제 실행할 수 있습니다.');
      return 0;
    }
    const items = buildSeed();
    const batch = fs.writeBatch(db);
    items.forEach(({ id: _ignore, ...data }) => batch.set(fs.doc(col), data));
    batch.set(fs.doc(db, ...COUNTER_PATH), { last: Math.max(...items.map((n) => n.no)) });
    await batch.commit();
    console.info(`[seed] ${items.length}건 등록 완료`);
    return items.length;
  },
};

/** 업로드 전 이미지를 최대 폭으로 리사이즈 → JPEG Blob */
const imageToJpegBlob = async (file) => {
  const img = await loadImage(await readAsDataUrl(file));
  const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 변환할 수 없습니다.'))), 'image/jpeg', 0.85),
  );
};

const fileStorageFirebase = {
  /** 첨부파일 → Storage 업로드 후 메타데이터(url/path 포함) 반환 */
  uploadFile: async (file) => {
    const { st, storage } = await getFirebase();
    const safeName = file.name.replace(/[\\/]/g, '_');
    const path = `notices/attachments/${newId()}-${safeName}`;
    const ref = st.ref(storage, path);
    await st.uploadBytes(ref, file, { contentType: file.type || undefined });
    const url = await st.getDownloadURL(ref);
    return { name: file.name, size: file.size, type: file.type || '', url, path };
  },

  /** 에디터 이미지 → 리사이즈 후 Storage 업로드, downloadURL 반환 */
  uploadImage: async (file) => {
    const { st, storage } = await getFirebase();
    const blob = await imageToJpegBlob(file);
    const ref = st.ref(storage, `notices/images/${newId()}.jpg`);
    await st.uploadBytes(ref, blob, { contentType: 'image/jpeg' });
    return st.getDownloadURL(ref);
  },

  /** 첨부파일 삭제 (path가 없는 레거시 항목은 무시) */
  remove: async (attachment) => {
    if (!attachment || !attachment.path) return;
    const { st, storage } = await getFirebase();
    try {
      await st.deleteObject(st.ref(storage, attachment.path));
    } catch (err) {
      if (err && err.code === 'storage/object-not-found') return;
      throw err;
    }
  },
};

// 콘솔에서 1회 실행해 시드 데이터를 넣을 수 있도록 노출 (필요 없으면 이 줄 삭제)
window.__seedNotices = (force) => noticeFirebaseService.seed(force);

/* ======================================================================
 * 2-C. AUTH — Firebase Authentication + Firestore 회원 정보
 *  - Firebase Auth는 이메일/비밀번호 방식이므로 "아이디"를 가상 이메일(아이디@auth.flatten.app)로 변환해 사용한다.
 *    (실제 이메일은 회원 정보(users)에만 저장)
 *  - Firebase 비밀번호 최소 길이(6자) 제한을 피하기 위해 비밀번호는 SHA-256으로 변환해 전달한다.
 *  - Firestore 컬렉션
 *      users/{uid}        : 이름·아이디·이메일·권한(role)
 *      usernames/{아이디}  : 아이디 중복 방지용 (문서 ID가 곧 아이디)
 *      emails/{이메일키}   : 이메일 중복 방지용
 *  - 관리자 여부(role === 'admin')는 UI 표시용이며, 실제 쓰기 권한은 firestore.rules / storage.rules가 강제한다.
 * ====================================================================== */
const AUTH_EMAIL_DOMAIN = 'auth.flatten.app';
const RESERVED_USERNAMES = ['admin', 'administrator', 'root'];
const USERNAME_RE = /^[a-z0-9]{4,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_MIN = 4;
const PW_MAX = 30;

const ADMIN_ACCOUNT = {
  name: '관리자',
  username: 'admin',
  password: '1111',
  email: 'admin.com.@company.co.kr',
};

const validateName = (v) => (!v ? '이름을 입력해주세요.' : v.length < 2 || v.length > 20 ? '이름은 2~20자로 입력해주세요.' : '');
const validateUsername = (v) => (!v ? '아이디를 입력해주세요.' : !USERNAME_RE.test(v) ? '아이디는 영문 소문자·숫자 4~20자로 입력해주세요.' : '');
const validateEmail = (v) => (!v ? '이메일을 입력해주세요.' : !EMAIL_RE.test(v) ? '올바른 이메일 형식이 아닙니다.' : '');
const validatePassword = (v) => (!v ? '비밀번호를 입력해주세요.' : v.length < PW_MIN || v.length > PW_MAX ? `비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력해주세요.` : '');

const toAuthEmail = (username) => `${username}@${AUTH_EMAIL_DOMAIN}`;
const emailKey = (email) => encodeURIComponent(email.trim().toLowerCase());
const isAdminUser = (user) => !!user && user.role === 'admin';

const fail = (message, field = null, code = undefined) => Object.assign(new Error(message), { field, code });

async function derivePassword(username, password) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw fail('https 또는 localhost 환경에서만 로그인할 수 있습니다. (file:// 로 열었다면 로컬 서버로 실행해주세요)');
  }
  const bytes = new TextEncoder().encode(`flatten-notice:${username}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function mapAuthError(err) {
  if (!err) return fail('알 수 없는 오류가 발생했습니다.');
  if (!err.code) return err;
  switch (err.code) {
    case 'auth/email-already-in-use':
      return fail('이미 사용 중인 아이디입니다.', 'username', err.code);
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return fail('아이디 또는 비밀번호가 올바르지 않습니다.', null, err.code);
    case 'auth/too-many-requests':
      return fail('시도 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.', null, err.code);
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return fail('Firebase 콘솔에서 이메일/비밀번호 로그인 방식을 활성화해주세요.', null, err.code);
    case 'auth/network-request-failed':
      return fail('네트워크 오류가 발생했습니다. 연결을 확인해주세요.', null, err.code);
    case 'permission-denied':
      return fail('권한이 없습니다. Firebase 보안 규칙(firestore.rules)이 적용되었는지 확인해주세요.', null, err.code);
    default:
      console.error(err);
      return fail(err.message || '요청을 처리하지 못했습니다.', null, err.code);
  }
}

const authService = (() => {
  let current = null;
  let suppress = false; // 가입/로그인 처리 중에는 상태 변경 이벤트를 무시하고 마지막에 한 번만 반영
  let started = false;
  let readyResolve;
  const readyPromise = new Promise((resolve) => {
    readyResolve = resolve;
  });
  const listeners = new Set();

  const loadProfile = async (fbUser) => {
    if (!fbUser) return null;
    const { fs, db } = await getFirebase();
    const snap = await fs.getDoc(fs.doc(db, 'users', fbUser.uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { uid: fbUser.uid, name: d.name, username: d.username, email: d.email, role: d.role || 'user' };
  };

  const apply = async (fbUser) => {
    try {
      current = await loadProfile(fbUser);
    } catch (err) {
      console.error('Failed to load profile', err);
      current = null;
    }
    readyResolve(current);
    listeners.forEach((cb) => cb(current));
  };

  const start = () => {
    if (started) return;
    started = true;
    getFirebase()
      .then(({ au, auth }) =>
        au.onAuthStateChanged(auth, (u) => {
          if (!suppress) apply(u);
        }),
      )
      .catch((err) => {
        console.error('Failed to init auth', err);
        readyResolve(null);
      });
  };

  const isUsernameAvailable = async (raw) => {
    const username = String(raw || '').trim().toLowerCase();
    const msg = validateUsername(username);
    if (msg) throw fail(msg, 'username');
    if (RESERVED_USERNAMES.includes(username)) return false;
    const { fs, db } = await getFirebase();
    try {
      return !(await fs.getDoc(fs.doc(db, 'usernames', username))).exists();
    } catch (err) {
      throw mapAuthError(err);
    }
  };

  const isEmailAvailable = async (raw) => {
    const email = String(raw || '').trim();
    const msg = validateEmail(email);
    if (msg) throw fail(msg, 'email');
    const { fs, db } = await getFirebase();
    try {
      return !(await fs.getDoc(fs.doc(db, 'emails', emailKey(email)))).exists();
    } catch (err) {
      throw mapAuthError(err);
    }
  };

  /** 가입 처리 (성공 시 로그아웃 상태로 종료 → 로그인 화면에서 직접 로그인) */
  const register = async ({ name, username, password, email }, { asAdmin = false } = {}) => {
    const n = String(name || '').trim();
    const u = String(username || '').trim().toLowerCase();
    const e = String(email || '').trim();
    const checks = [
      ['name', validateName(n)],
      ['username', validateUsername(u)],
      ['email', validateEmail(e)],
      ['password', validatePassword(password || '')],
    ];
    const bad = checks.find(([, m]) => m);
    if (bad) throw fail(bad[1], bad[0]);

    if (!asAdmin) {
      if (RESERVED_USERNAMES.includes(u)) throw fail('사용할 수 없는 아이디입니다.', 'username');
      if (!(await isUsernameAvailable(u))) throw fail('이미 사용 중인 아이디입니다.', 'username');
      if (!(await isEmailAvailable(e))) throw fail('이미 가입된 이메일입니다.', 'email');
    }

    const { fs, au, db, auth } = await getFirebase();
    suppress = true;
    let cred = null;
    try {
      cred = await au.createUserWithEmailAndPassword(auth, toAuthEmail(u), await derivePassword(u, password));
      const uid = cred.user.uid;
      const now = new Date().toISOString();
      // 세 문서를 한 번에 생성 (이미 존재하는 아이디/이메일이면 규칙에 의해 전체 실패 → 중복 가입 방지)
      const batch = fs.writeBatch(db);
      batch.set(fs.doc(db, 'usernames', u), { uid, createdAt: now });
      batch.set(fs.doc(db, 'emails', emailKey(e)), { uid, createdAt: now });
      batch.set(fs.doc(db, 'users', uid), {
        name: n,
        username: u,
        email: e,
        role: asAdmin ? 'admin' : 'user',
        createdAt: now,
      });
      await batch.commit();
      await au.signOut(auth);
    } catch (err) {
      if (cred) {
        try {
          await au.deleteUser(cred.user); // 프로필 저장에 실패하면 생성된 인증 계정도 되돌린다
        } catch {
          /* noop */
        }
        try {
          await au.signOut(auth);
        } catch {
          /* noop */
        }
      }
      throw mapAuthError(err);
    } finally {
      suppress = false;
      await apply(auth.currentUser);
    }
  };

  const login = async (username, password) => {
    const u = String(username || '').trim().toLowerCase();
    if (!u || !password) throw fail('아이디와 비밀번호를 입력해주세요.');
    const { au, auth } = await getFirebase();
    suppress = true;
    try {
      const cred = await au.signInWithEmailAndPassword(auth, toAuthEmail(u), await derivePassword(u, password));
      const profile = await loadProfile(cred.user);
      if (!profile) {
        await au.signOut(auth);
        throw fail('회원 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.');
      }
      return profile;
    } catch (err) {
      throw mapAuthError(err);
    } finally {
      suppress = false;
      await apply(auth.currentUser);
    }
  };

  const logout = async () => {
    const { au, auth } = await getFirebase();
    await au.signOut(auth);
  };

  /** 관리자 계정이 인증만 있고 프로필 문서가 빠진 경우를 복구 */
  const ensureAdminDocs = async () => {
    const { fs, au, db, auth } = await getFirebase();
    const { username, password, name, email } = ADMIN_ACCOUNT;
    suppress = true;
    try {
      const cred = await au.signInWithEmailAndPassword(auth, toAuthEmail(username), await derivePassword(username, password));
      const uid = cred.user.uid;
      const now = new Date().toISOString();
      const docs = [
        [fs.doc(db, 'users', uid), { name, username, email, role: 'admin', createdAt: now }],
        [fs.doc(db, 'usernames', username), { uid, createdAt: now }],
        [fs.doc(db, 'emails', emailKey(email)), { uid, createdAt: now }],
      ];
      for (const [ref, data] of docs) {
        if (!(await fs.getDoc(ref)).exists()) await fs.setDoc(ref, data);
      }
      await au.signOut(auth);
    } finally {
      suppress = false;
      await apply(auth.currentUser);
    }
  };

  /** 관리자 계정 수동 등록 (브라우저 콘솔에서 __createAdmin() 1회 실행) */
  const seedAdmin = async () => {
    try {
      await register(ADMIN_ACCOUNT, { asAdmin: true });
      return '관리자 계정을 생성했습니다. (아이디: admin)';
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        await ensureAdminDocs();
        return '관리자 인증 계정이 이미 있어 프로필 정보를 확인/보완했습니다.';
      }
      throw err;
    }
  };

  return {
    ready: () => {
      start();
      return readyPromise;
    },
    getUser: () => current,
    isAdmin: () => isAdminUser(current),
    onChange: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    isUsernameAvailable,
    isEmailAvailable,
    signUp: (data) => register(data),
    login,
    logout,
    seedAdmin,
  };
})();

window.__createAdmin = () =>
  authService
    .seedAdmin()
    .then((msg) => console.info(`[admin] ${msg}`))
    .catch((err) => console.error('[admin] 실패:', err.message || err));

/* ======================================================================
 * 3. SERVICE ENTRY POINTS  (Mock으로 되돌리려면 아래 두 줄의 주석을 교체)
 * ====================================================================== */
const noticeService = noticeFirebaseService;    // ← noticeMockService
const fileStorageService = fileStorageFirebase; // ← fileStorageMock

window.__getNoticePreviews = () => noticeService.getLatest(3);
window.__authService = authService;
window.dispatchEvent(new Event('notice-service-ready'));
window.dispatchEvent(new Event('auth-service-ready'));

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

/** ISO → YYYY.MM.DD */
const formatDate = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

/** 등록 후 7일 이내 여부 */
const isNew = (iso) => Date.now() - new Date(iso).getTime() < NEW_BADGE_DAYS * 86400000;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

/** 첨부파일 검증: 에러 메시지 또는 null */
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

/* ───────── HTML sanitizer (허용 태그/속성 화이트리스트) ───────── */
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
  return !/^[a-z][a-z0-9+.-]*:/i.test(v); // 스킴 없는 상대경로
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

// 공통 헤더·모바일 메뉴·푸터는 js/layout.js에서 관리합니다.

/** 로그인 후 돌아갈 주소: 같은 폴더의 *.html(?쿼리)만 허용 */
const safeRedirect = (value) =>
  value && /^(?:\/|\.\.\/|\.\/)?[A-Za-z0-9_./-]+\.html(\?[A-Za-z0-9_\-=&%.]*)?$/.test(value) ? value : 'notice.html';

const currentPageRef = () => `${location.pathname}${location.search}`;

function renderAccessDenied(app, user) {
  const loginHref = `login.html?redirect=${encodeURIComponent(currentPageRef())}`;
  app.innerHTML = `
    <p class="notice-empty">${user ? '관리자만 접근할 수 있는 페이지입니다.' : '로그인이 필요한 페이지입니다.'}</p>
    <div class="detail-actions">
      <a class="btn-outline" href="notice.html">${ICONS.list}목록으로</a>
      ${user ? '' : `<a class="btn-primary btn-sm" href="${escapeHtml(loginHref)}">로그인</a>`}
    </div>`;
}

/** 공지 배너 + 헤더(GNB) + 푸터를 <main> 앞/뒤에 삽입 */

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

/**
 * 리치 에디터 (contenteditable + execCommand)
 * - 굵게/기울임/밑줄/정렬/링크/이미지, 더보기(목록·서식 지우기), 글꼴/크기
 * - 이미지는 uploadImage(file) → URL 인터페이스로 저장소와 분리
 */
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

  /* 선택 영역 보존 (select/prompt 등으로 포커스를 잃어도 복원) */
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
    if (e.target.closest('select')) return; // select는 기본 동작 유지
    e.preventDefault(); // 버튼 클릭 시 에디터 포커스/선택 유지
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

  /* 붙여넣기는 sanitize 후 삽입 */
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

  // 글쓰기 버튼은 관리자에게만 노출
  const writeBtn = form.querySelector('a[href="notice-write.html"]');
  if (writeBtn) {
    writeBtn.style.display = 'none';
    authService.ready().then((user) => {
      writeBtn.style.display = isAdminUser(user) ? '' : 'none';
    });
  }

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
        ${
          authService.isAdmin()
            ? `<div class="detail-actions__admin">
          <a class="btn-outline btn-sm" href="notice-edit.html?id=${encodeURIComponent(n.id)}">수정</a>
          <button type="button" class="btn-outline btn-sm btn-danger" id="delete-btn">삭제</button>
        </div>`
            : ''
        }
      </div>`;

    document.getElementById('share-btn').addEventListener('click', async () => {
      const ok = await copyText(location.href);
      showToast(ok ? '링크가 복사되었습니다.' : '링크 복사에 실패했습니다.');
    });

    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', async (e) => {
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
    await authService.ready(); // 관리자 버튼 노출 여부를 알아야 렌더링 가능
    try {
      let notice = await noticeService.getById(id);
      if (!notice) return notFound();
      // 진입 시 조회수 +1 (같은 세션의 새로고침/재진입은 중복 집계하지 않음)
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

    /* 첨부파일 상태: 기존(메타데이터) / 신규(File) */
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
    app.innerHTML = '<p class="notice-empty">로딩 중...</p>';
    const user = await authService.ready();
    if (!isAdminUser(user)) return renderAccessDenied(app, user); // 글쓰기/수정은 관리자 전용
    if (!isEdit) return renderForm(null);
    if (!id) return notFound();
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


/** 로그인 페이지 (하단에 회원가입 폼 배치) */
function initLoginPage() {

  const app = document.getElementById('notice-app');
  const redirect = safeRedirect(getParam('redirect'));
  const redirectQs = getParam('redirect') ? `&redirect=${encodeURIComponent(redirect)}` : '';

  app.innerHTML = `
    <div class="auth-wrap">

      <div class="auth-tabs" role="tablist" aria-label="로그인 / 회원가입">
        <button type="button" class="auth-tab" role="tab" id="tab-login" data-tab="login" aria-selected="true" aria-controls="panel-login">로그인</button>
        <button type="button" class="auth-tab" role="tab" id="tab-signup" data-tab="signup" aria-selected="false" aria-controls="panel-signup">회원가입</button>
      </div>

      <section class="auth-card" id="panel-login" role="tabpanel" aria-labelledby="tab-login">
        <p class="auth-banner" id="signup-done" hidden>회원가입이 완료되었습니다. 로그인해주세요.</p>
        <form id="login-form" novalidate>
          <div class="auth-field">
            <label for="l-username">아이디</label>
            <input id="l-username" class="input" type="text" autocomplete="username" autocapitalize="none" placeholder="아이디를 입력하세요." />
          </div>
          <div class="auth-field">
            <label for="l-password">비밀번호</label>
            <input id="l-password" class="input" type="password" autocomplete="current-password" placeholder="비밀번호를 입력하세요." />
          </div>
          <p class="field-error" id="err-login" role="alert" hidden></p>
          <button type="submit" class="btn-primary auth-submit" id="login-btn">로그인</button>
        </form>
      </section>

      <section class="auth-card" id="panel-signup" role="tabpanel" aria-labelledby="tab-signup" hidden>
        <p class="auth-sub">아래 정보를 입력해 가입해주세요.</p>
        <form id="signup-form" novalidate>
          <div class="auth-field">
            <label for="s-name">이름</label>
            <input id="s-name" class="input" type="text" maxlength="20" autocomplete="name" placeholder="이름을 입력하세요." />
            <p id="msg-name" role="alert" hidden></p>
          </div>
          <div class="auth-field">
            <label for="s-username">아이디</label>
            <div class="auth-inline">
              <input id="s-username" class="input" type="text" maxlength="20" autocomplete="off" autocapitalize="none" placeholder="영문 소문자·숫자 4~20자" />
              <button type="button" class="btn-outline btn-sm" id="check-username">중복확인</button>
            </div>
            <p id="msg-username" role="alert" hidden></p>
          </div>
          <div class="auth-field">
            <label for="s-email">이메일</label>
            <div class="auth-inline">
              <input id="s-email" class="input" type="text" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="example@email.com" />
              <button type="button" class="btn-outline btn-sm" id="check-email">중복확인</button>
            </div>
            <p id="msg-email" role="alert" hidden></p>
          </div>
          <div class="auth-field">
            <label for="s-password">비밀번호</label>
            <input id="s-password" class="input" type="password" maxlength="${PW_MAX}" autocomplete="new-password" placeholder="${PW_MIN}~${PW_MAX}자" />
            <p id="msg-password" role="alert" hidden></p>
          </div>
          <div class="auth-field">
            <label for="s-password2">비밀번호 확인</label>
            <input id="s-password2" class="input" type="password" maxlength="${PW_MAX}" autocomplete="new-password" placeholder="비밀번호를 한 번 더 입력하세요." />
            <p id="msg-password2" role="alert" hidden></p>
          </div>
          <p class="field-error" id="msg-signup" role="alert" hidden></p>
          <button type="submit" class="btn-primary auth-submit" id="signup-btn">가입하기</button>
        </form>
      </section>
    </div>`;

  if (getParam('signup') === '1') document.getElementById('signup-done').hidden = false;

  /* ── 탭: 로그인(기본) / 회원가입 ── */
  const tabs = [...app.querySelectorAll('.auth-tab')];
  const selectTab = (name) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      document.getElementById(`panel-${t.dataset.tab}`).hidden = !on;
    });
  };
  tabs.forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.tab)));
  if (location.hash === '#signup') selectTab('signup');

  const setMsg = (key, text, ok = false) => {
    const el = document.getElementById(`msg-${key}`);
    if (!el) return;
    el.textContent = text || '';
    el.className = ok ? 'field-ok' : 'field-error';
    el.hidden = !text;
  };

  /* ── 로그인 ── */
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const errLogin = document.getElementById('err-login');
  const setLoginError = (msg) => {
    errLogin.textContent = msg || '';
    errLogin.hidden = !msg;
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoginError('');
    const username = document.getElementById('l-username').value.trim();
    const password = document.getElementById('l-password').value;
    if (!username || !password) {
      setLoginError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';
    try {
      await authService.login(username, password);
      location.href = redirect;
    } catch (err) {
      setLoginError(err.message || '로그인에 실패했습니다.');
      loginBtn.disabled = false;
      loginBtn.textContent = '로그인';
    }
  });

  /* ── 회원가입 ── */
  const signupForm = document.getElementById('signup-form');
  const signupBtn = document.getElementById('signup-btn');
  const nameEl = document.getElementById('s-name');
  const usernameEl = document.getElementById('s-username');
  const emailEl = document.getElementById('s-email');
  const pwEl = document.getElementById('s-password');
  const pw2El = document.getElementById('s-password2');

  // 값이 바뀌면 이전 확인/오류 메시지 제거
  [
    [nameEl, 'name'],
    [usernameEl, 'username'],
    [emailEl, 'email'],
    [pwEl, 'password'],
    [pw2El, 'password2'],
  ].forEach(([el, key]) => el.addEventListener('input', () => setMsg(key, '')));

  const runCheck = async (key, el, validate, check, okText, takenText) => {
    const value = key === 'username' ? el.value.trim().toLowerCase() : el.value.trim();
    const msg = validate(value);
    if (msg) {
      setMsg(key, msg);
      return;
    }
    try {
      const available = await check(value);
      setMsg(key, available ? okText : takenText, available);
    } catch (err) {
      setMsg(key, err.message || '확인에 실패했습니다.');
    }
  };

  document.getElementById('check-username').addEventListener('click', () =>
    runCheck('username', usernameEl, validateUsername, authService.isUsernameAvailable, '사용 가능한 아이디입니다.', '이미 사용 중인 아이디입니다.'),
  );
  document.getElementById('check-email').addEventListener('click', () =>
    runCheck('email', emailEl, validateEmail, authService.isEmailAvailable, '사용 가능한 이메일입니다.', '이미 가입된 이메일입니다.'),
  );

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('signup', '');
    const name = nameEl.value.trim();
    const username = usernameEl.value.trim().toLowerCase();
    const email = emailEl.value.trim();
    const password = pwEl.value;
    const password2 = pw2El.value;

    const pwMsg = validatePassword(password);
    const errors = [
      ['name', nameEl, validateName(name)],
      ['username', usernameEl, validateUsername(username) || (RESERVED_USERNAMES.includes(username) ? '사용할 수 없는 아이디입니다.' : '')],
      ['email', emailEl, validateEmail(email)],
      ['password', pwEl, pwMsg],
      ['password2', pw2El, !pwMsg && password !== password2 ? '비밀번호가 일치하지 않습니다.' : !password2 ? '비밀번호를 한 번 더 입력해주세요.' : ''],
    ];
    errors.forEach(([key, , msg]) => setMsg(key, msg));
    const firstBad = errors.find(([, , msg]) => msg);
    if (firstBad) {
      firstBad[1].focus();
      return;
    }

    signupBtn.disabled = true;
    signupBtn.textContent = '가입 중...';
    try {
      await authService.signUp({ name, username, password, email });
      location.href = `login.html?signup=1${redirectQs}`;
    } catch (err) {
      setMsg(err.field && document.getElementById(`msg-${err.field}`) ? err.field : 'signup', err.message || '회원가입에 실패했습니다.');
      signupBtn.disabled = false;
      signupBtn.textContent = '가입하기';
    }
  });

  // 이미 로그인된 상태라면 로그인 페이지에 머무를 필요가 없으므로 이동
  authService.ready().then((user) => {
    if (user) location.replace(redirect);
  });
}

  /* ── bootstrap: <body data-page="list|detail|form|login"> ── */
  const pageType = document.body.dataset.page;
  if (pageType === 'list') initListPage();
  else if (pageType === 'detail') initDetailPage();
  else if (pageType === 'form') initFormPage();
  else if (pageType === 'login') initLoginPage();
})();






