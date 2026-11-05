# LocalStorage 기반 Mock DB & Firebase 마이그레이션 개발 지침서

> **목적**: 백엔드나 외부 DB 없이 프론트엔드 환경에서 `localStorage`를 Mock DB 삼아 초고속 개발을 진행하고, 이후 UI 컴포넌트 코드 수정 없이 **Firebase Firestore**로 100% 매끄럽게 교체할 수 있도록 아키텍처 규칙을 정의합니다.

---

## 1. 핵심 아키텍처 원칙 (Core Principles)

1. **컴포넌트 내 직접 접근 절대 금지 (Strict Decoupling)**
   - UI 컴포넌트(`*.tsx`, `*.jsx`, `*.vue` 등) 내부에서 `localStorage.getItem()`, `localStorage.setItem()`을 직접 호출하지 마십시오.
   - 모든 데이터 접근은 반드시 **Service 계층(또는 Repository 계층)**을 통해서만 수행합니다.

2. **모든 인터페이스는 비동기(`async/Promise`)로 선언**
   - `localStorage`는 동기식 API이지만, 추후 연동할 Firebase Firestore는 비동기 네트워크 통신입니다.
   - 따라서 모든 Mock CRUD 함수는 반드시 `async` 키워드를 붙여 Promise를 반환하도록 작성합니다.
   - 컴포넌트는 항상 `loading` 상태와 `try/catch` 에러 핸들링을 염두에 두고 작성되어야 합니다.

3. **NoSQL(Firestore) 친화적 JSON 데이터 모델링**
   - RDBMS 스타일의 정규화(복잡한 외래키 조인)를 지양합니다.
   - 화면 뷰(View)에 필요한 연관 데이터는 문서(Document) 내에 임베딩(비정규화)하거나 단순 배열 형태로 보관합니다.
   - 모든 엔티티는 문자열 기반의 고유 식별자(`id: string`)와 타임스탬프(`createdAt`, `updatedAt`)를 갖습니다.

---

## 2. 권장 디렉토리 구조

Service 레이어를 명확히 분리하여 데이터 소스 구현체만 갈아 끼울 수 있도록 설계합니다.

```text
src/
├── types/
│   └── post.ts              # 데이터 모델 타입 정의
├── services/
│   ├── postService.ts       # 활성화된 서비스 export (진입점)
│   ├── mock/
│   │   ├── storageHelper.ts # localStorage 유틸 (지연 시뮬레이션 등)
│   │   └── postMockService.ts # LocalStorage 기반 구현체
│   └── firebase/
│       ├── firebaseConfig.ts# Firebase 초기화 설정
│       └── postFirebaseService.ts # Firestore 기반 구현체
└── components/
    └── PostList.tsx         # postService만 import해서 사용하는 UI 컴포넌트
```

---

## 3. 표준 인터페이스 및 Mock 구현 규칙

### 3.1. 데이터 모델 정의 예시 (`types/post.ts`)

```typescript
export interface Post {
  id: string; // crypto.randomUUID() 또는 Firestore doc.id
  title: string;
  content: string;
  author: {
    id: string;
    name: string; // 비정규화: 닉네임 등을 임베딩
  };
  tags: string[];
  createdAt: string; // ISO 8601 문자열 ("2026-11-04T12:00:00.000Z")
  updatedAt: string;
}

export type CreatePostDto = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePostDto = Partial<CreatePostDto>;
```

### 3.2. LocalStorage 도우미 (`services/mock/storageHelper.ts`)

실제 네트워크 환경과 유사하게 반응하도록 100~300ms 수준의 인위적 지연을 추가하면 컴포넌트의 스켈레톤/로딩 UI 검증에 유용합니다.

```typescript
export const storageHelper = {
  get: async <T>(key: string, defaultValue: T): Promise<T> => {
    await delay(150); // 네트워크 레이턴시 시뮬레이션
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    await delay(150);
    localStorage.setItem(key, JSON.stringify(value));
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 3.3. Mock 서비스 구현 (`services/mock/postMockService.ts`)

```typescript
import { storageHelper } from './storageHelper';
import { Post, CreatePostDto, UpdatePostDto } from '../../types/post';

const STORAGE_KEY = 'mock_posts';

export const postMockService = {
  getAll: async (): Promise<Post[]> => {
    return storageHelper.get<Post[]>(STORAGE_KEY, []);
  },

  getById: async (id: string): Promise<Post | null> => {
    const list = await storageHelper.get<Post[]>(STORAGE_KEY, []);
    return list.find((item) => item.id === id) || null;
  },

  create: async (dto: CreatePostDto): Promise<Post> => {
    const list = await storageHelper.get<Post[]>(STORAGE_KEY, []);
    const newPost: Post = {
      ...dto,
      id: crypto.randomUUID(), // Firestore의 고유 ID처럼 영숫자 고유 식별자 사용
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newPost);
    await storageHelper.set(STORAGE_KEY, list);
    return newPost;
  },

  update: async (id: string, dto: UpdatePostDto): Promise<Post> => {
    const list = await storageHelper.get<Post[]>(STORAGE_KEY, []);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Post ${id} not found`);

    const updated: Post = {
      ...list[index],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    await storageHelper.set(STORAGE_KEY, list);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const list = await storageHelper.get<Post[]>(STORAGE_KEY, []);
    const filtered = list.filter((item) => item.id !== id);
    await storageHelper.set(STORAGE_KEY, filtered);
  },
};
```

---

## 4. UI 컴포넌트 사용 가이드

컴포넌트는 오직 통일된 서비스 인터페이스만 주입받아 소비합니다.

```tsx
// src/components/PostList.tsx
import { useEffect, useState } from 'react';
import { postService } from '../services/postService';
import { Post } from '../types/post';

export const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await postService.getAll();
        setPosts(data);
      } catch (err) {
        console.error('Failed to load posts', err);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
};
```

---

## 5. Firebase Firestore 마이그레이션 절차

개발이 완료되어 Firebase로 전환할 때는 컴포넌트 수정 없이 아래 3단계만 진행합니다.

### 1단계: Firebase SDK 구현체 작성 (`services/firebase/postFirebaseService.ts`)

```typescript
import { 
  collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Post, CreatePostDto, UpdatePostDto } from '../../types/post';

const COLLECTION_NAME = 'posts';

export const postFirebaseService = {
  getAll: async (): Promise<Post[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
  },

  getById: async (id: string): Promise<Post | null> => {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Post) : null;
  },

  create: async (dto: CreatePostDto): Promise<Post> => {
    const nowIso = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...dto,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    return { id: docRef.id, ...dto, createdAt: nowIso, updatedAt: nowIso };
  },

  update: async (id: string, dto: UpdatePostDto): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },
};
```

### 2단계: 엔트리포인트 전환 (`services/postService.ts`)

기존 Mock 서비스를 주석 처리하고 Firebase 서비스로 교체(또는 환경변수에 따라 분기)합니다.

```typescript
// [기존 LocalStorage 모드]
// export { postMockService as postService } from './mock/postMockService';

// [Firebase Firestore 전환]
export { postFirebaseService as postService } from './firebase/postFirebaseService';

// (참고: 환경변수 플래그 방식 활용 가능)
// export const postService = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
//   ? postMockService 
//   : postFirebaseService;
```

---

## 6. 바이브 코딩 시 주의할 체크리스트 (Prompting Checklist)

AI에게 기능 추가 및 수정을 요청할 때 아래 규칙을 반드시 준수하도록 지시합니다:

- [ ] **ID 생성 규칙**: 임의의 숫자 증가값(`1, 2, 3...`)을 쓰지 말고, 반드시 `crypto.randomUUID()`를 사용하도록 지시할 것.
- [ ] **날짜 데이터**: 객체(`new Date()`) 대신 항상 직렬화 가능한 `ISO 8601 문자열`로 저장할 것.
- [ ] **에러 시뮬레이션**: 데이터가 없을 경우 예외 처리(`throw new Error`)나 null 반환을 일관되게 유지할 것.
- [ ] **조인 연산 배제**: 두 개 이상의 컬렉션을 억지로 묶어 복잡한 관계 쿼리를 만들지 말고, 화면 단위로 필요한 정보를 통째로 들고 다니도록 유도할 것.