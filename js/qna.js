(function () {
  'use strict';

  const TYPES = ['배송문의', '계정문의', '교환/환불', '시스템오류', '기타'];
  const page = document.body.dataset.qnaPage;
  const app = document.getElementById('qna-app');
  const auth = window.__authService;
  const getFirebase = window.__getFirebase;

  if (!page || !app || !auth || !getFirebase) return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '');
  };
  const formatContent = (value) => escapeHtml(value).replace(/\n/g, '<br>');
  const getId = () => new URLSearchParams(location.search).get('id');
  const loginPage = '../notice-board/login.html';
  const currentPageRef = () => `${location.pathname}${location.search}`;
  const showMessage = (message) => {
    app.innerHTML = `<p class="notice-empty">${escapeHtml(message)}</p><div class="detail-actions"><a class="btn-outline" href="qna.html">목록으로</a></div>`;
  };
  const getUser = () => auth.getUser();
  const isAdmin = () => auth.isAdmin();

  const getAnswers = async (fs, db, id) => {
    const snapshot = await fs.getDocs(fs.query(fs.collection(db, 'qna', id, 'answers'), fs.orderBy('createdAt', 'asc')));
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  };

  const getVisibleQuestions = async (fs, db, user) => {
    const col = fs.collection(db, 'qna');
    if (user && user.role === 'admin') {
      const snapshot = await fs.getDocs(fs.query(col, fs.orderBy('createdAt', 'desc')));
      return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    }

    const queries = [fs.getDocs(fs.query(col, fs.where('isPrivate', '==', false), fs.orderBy('createdAt', 'desc')))];
    if (user) queries.push(fs.getDocs(fs.query(col, fs.where('authorId', '==', user.uid), fs.orderBy('createdAt', 'desc'))));
    const snapshots = await Promise.all(queries);
    const map = new Map();
    snapshots.forEach((snapshot) => snapshot.docs.forEach((doc) => map.set(doc.id, { ...doc.data(), id: doc.id })));
    return [...map.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  };

  async function renderList() {
    app.innerHTML = '<p class="notice-empty">로딩 중...</p>';
    const user = await auth.ready();
    try {
      const { fs, db } = await getFirebase();
      const questions = await getVisibleQuestions(fs, db, user);
      const withAnswers = await Promise.all(questions.map(async (question) => ({
        ...question,
        answers: await getAnswers(fs, db, question.id),
      })));
      app.innerHTML = `
        <div class="qna-toolbar">
          <p class="list-total">Total <strong>${withAnswers.length}</strong></p>
          <a href="qna-write.html" class="btn-primary btn-sm">질문하기</a>
        </div>
        <div class="qna-table" role="table" aria-label="묻고답하기 목록">
          <div class="qna-table__head" role="row"><span>상태</span><span>질문</span><span>유형</span><span>작성자</span><span>등록일</span></div>
          ${withAnswers.length ? withAnswers.map((question) => {
            const privateLabel = question.isPrivate ? '<span class="qna-private">비공개</span>' : '';
            const status = question.answers.length ? '<span class="qna-status qna-status--done">답변완료</span>' : '<span class="qna-status">답변대기</span>';
            return `<a class="qna-row" href="qna-detail.html?id=${encodeURIComponent(question.id)}" role="row"><span>${status}</span><span class="qna-row__title">${escapeHtml(question.title)}${privateLabel}</span><span>${escapeHtml(question.type)}</span><span>${escapeHtml(question.authorName || '회원')}</span><span>${formatDate(question.createdAt)}</span></a>`;
          }).join('') : '<p class="notice-empty">등록된 질문이 없습니다.</p>'}
        </div>`;
    } catch (error) {
      console.error('Failed to load Q&A list', error);
      showMessage('질문 목록을 불러오지 못했습니다.');
    }
  }

  async function renderDetail() {
    const id = getId();
    if (!id) return showMessage('질문을 찾을 수 없습니다.');
    app.innerHTML = '<p class="notice-empty">로딩 중...</p>';
    const user = await auth.ready();
    try {
      const { fs, db } = await getFirebase();
      const snapshot = await fs.getDoc(fs.doc(db, 'qna', id));
      if (!snapshot.exists()) return showMessage('질문을 찾을 수 없습니다.');
      const question = { ...snapshot.data(), id: snapshot.id };
      const answers = await getAnswers(fs, db, id);
      const owner = !!user && user.uid === question.authorId;
      const privateLabel = question.isPrivate ? '<span class="qna-private">비공개</span>' : '';
      app.innerHTML = `
        <article class="qna-detail">
          <div class="detail-head"><div><span class="qna-type">${escapeHtml(question.type)}</span>${privateLabel}</div><h2 class="detail-title">${escapeHtml(question.title)}</h2><div class="detail-meta"><span>${escapeHtml(question.authorName || '회원')}</span><time>${formatDate(question.createdAt)}</time></div></div>
          <div class="detail-body qna-content">${formatContent(question.content)}</div>
          <section class="qna-answers" aria-labelledby="qna-answer-heading"><h3 id="qna-answer-heading">답변 ${answers.length ? `<span>${answers.length}</span>` : ''}</h3>${answers.length ? answers.map((answer) => `<article class="qna-answer"><div class="qna-answer__meta"><strong>관리자 답변</strong><time>${formatDate(answer.createdAt)}</time></div><div>${formatContent(answer.content)}</div></article>`).join('') : '<p class="qna-answer--empty">아직 답변이 등록되지 않았습니다.</p>'}</section>
          ${isAdmin() ? `<form class="qna-answer-form" id="qna-answer-form"><label for="qna-answer-content">답변 작성</label><textarea id="qna-answer-content" class="input" rows="5" maxlength="5000" placeholder="답변 내용을 입력하세요."></textarea><p class="field-error" id="qna-answer-error" hidden></p><button type="submit" class="btn-primary">답변 등록</button></form>` : ''}
          <div class="detail-actions"><a class="btn-outline" href="qna.html">목록으로</a>${owner ? `<div class="detail-actions__admin"><a class="btn-outline btn-sm" href="qna-edit.html?id=${encodeURIComponent(id)}">수정</a><button type="button" class="btn-outline btn-sm btn-danger" id="qna-delete">삭제</button></div>` : ''}</div>
        </article>`;

      const deleteButton = document.getElementById('qna-delete');
      if (deleteButton) deleteButton.addEventListener('click', async () => {
        if (!window.confirm('질문을 삭제하시겠습니까?')) return;
        deleteButton.disabled = true;
        try {
          await fs.deleteDoc(fs.doc(db, 'qna', id));
          location.href = 'qna.html';
        } catch (error) {
          console.error(error);
          deleteButton.disabled = false;
          alert(error.code === 'permission-denied' ? '본인의 질문만 삭제할 수 있습니다.' : '삭제에 실패했습니다.');
        }
      });

      const answerForm = document.getElementById('qna-answer-form');
      if (answerForm) answerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const content = document.getElementById('qna-answer-content').value.trim();
        const errorEl = document.getElementById('qna-answer-error');
        errorEl.hidden = true;
        if (!content) { errorEl.textContent = '답변 내용을 입력해주세요.'; errorEl.hidden = false; return; }
        const now = new Date().toISOString();
        try {
          await fs.addDoc(fs.collection(db, 'qna', id, 'answers'), { content, authorId: user.uid, authorName: user.name, createdAt: now, updatedAt: now });
          await renderDetail();
        } catch (error) {
          console.error(error);
          errorEl.textContent = '관리자만 답변을 등록할 수 있습니다.';
          errorEl.hidden = false;
        }
      });
    } catch (error) {
      console.error('Failed to load Q&A detail', error);
      showMessage(error.code === 'permission-denied' ? '비공개 질문은 작성자와 관리자만 볼 수 있습니다.' : '질문을 불러오지 못했습니다.');
    }
  }

  async function renderForm() {
    const id = getId();
    const user = await auth.ready();
    if (!user) {
      location.href = `${loginPage}?redirect=${encodeURIComponent(currentPageRef())}`;
      return;
    }
    let question = null;
    if (id) {
      try {
        const { fs, db } = await getFirebase();
        const snapshot = await fs.getDoc(fs.doc(db, 'qna', id));
        if (!snapshot.exists() || snapshot.data().authorId !== user.uid) return showMessage('본인의 질문만 수정할 수 있습니다.');
        question = { ...snapshot.data(), id };
      } catch (error) {
        return showMessage('질문을 불러오지 못했습니다.');
      }
    }
    app.innerHTML = `<form class="qna-form" id="qna-form"><div class="form-row"><label class="form-label" for="qna-title">제목 *</label><div class="form-field"><input id="qna-title" class="input" maxlength="120" value="${escapeHtml(question?.title || '')}" required /><p class="field-error" id="qna-title-error" hidden></p></div></div><div class="form-row"><label class="form-label" for="qna-type">질문 유형 *</label><div class="form-field"><select id="qna-type" class="select">${TYPES.map((type) => `<option value="${type}" ${question?.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div></div><div class="form-row form-row--top"><label class="form-label" for="qna-content">내용 *</label><div class="form-field"><textarea id="qna-content" class="input qna-textarea" rows="12" maxlength="10000" required>${escapeHtml(question?.content || '')}</textarea><p class="field-error" id="qna-content-error" hidden></p></div></div><div class="qna-private-check"><label><input id="qna-private" type="checkbox" ${question?.isPrivate ? 'checked' : ''} /> 비공개 질문</label><span>비공개 질문은 작성자와 관리자만 볼 수 있습니다.</span></div><div class="form-actions"><a class="btn-outline" href="${id ? `qna-detail.html?id=${encodeURIComponent(id)}` : 'qna.html'}">취소</a><button type="submit" class="btn-primary">${id ? '수정하기' : '질문 등록'}</button></div></form>`;
    document.getElementById('qna-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('qna-title').value.trim();
      const content = document.getElementById('qna-content').value.trim();
      const titleError = document.getElementById('qna-title-error');
      const contentError = document.getElementById('qna-content-error');
      titleError.hidden = !!title; contentError.hidden = !!content;
      if (!title || !content) { if (!title) titleError.textContent = '제목을 입력해주세요.'; if (!content) contentError.textContent = '내용을 입력해주세요.'; return; }
      const { fs, db } = await getFirebase();
      const now = new Date().toISOString();
      const data = { title, type: document.getElementById('qna-type').value, content, isPrivate: document.getElementById('qna-private').checked, authorId: user.uid, authorName: user.name, authorUsername: user.username, updatedAt: now };
      try {
        const saved = id ? (await fs.updateDoc(fs.doc(db, 'qna', id), data), { id }) : (() => { const ref = fs.doc(fs.collection(db, 'qna')); return fs.setDoc(ref, { ...data, createdAt: now }).then(() => ({ id: ref.id })); })();
        const result = await saved;
        location.href = `qna-detail.html?id=${encodeURIComponent(result.id)}`;
      } catch (error) {
        console.error(error);
        if (error.code === 'permission-denied') {
          alert('질문을 저장할 권한이 없습니다. 로그인 상태와 Firebase Firestore Rules 배포 여부를 확인해주세요.');
        } else if (error.code === 'unauthenticated') {
          alert('로그인 후 질문을 등록할 수 있습니다.');
          location.href = `${loginPage}?redirect=${encodeURIComponent(currentPageRef())}`;
        } else {
          alert('질문 저장 중 오류가 발생했습니다.');
        }
      }
    });
  }

  if (page === 'list') renderList();
  else if (page === 'detail') renderDetail();
  else if (page === 'form') renderForm();
})();
