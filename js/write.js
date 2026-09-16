/* ============================================================
   독서야 놀자 (book) - 기록 작성/수정 (write.js)
   - 로그인 필요 (비로그인은 Google 로그인 안내만)
   - 입력값 trim + 필수(제목) 검증 + 별점 1~5 검증
   - 임시저장(localStorage 초안) 지원
   - XSS 방지: 출력 화면(view)에서 escape 처리 (이 파일은 저장만 담당)
   의존성: BookData · BookPrompts · BookSync · CGAuth
   ============================================================ */
(function () {
  'use strict';

  var form, gate, editTitle;
  var isEdit = false;
  var editId = null;

  // ---------- 필드 → valueSetter/getter 매핑 ----------
  var FIELD_PICKERS = {
    title: '#title', author: '#author', publisher: '#publisher', isbn: '#isbn',
    category: '#category', reading_status: '#reading-status',
    started_at: '#started-at', finished_at: '#finished-at', reading_date: '#reading-date',
    one_line_review: '#one-line-review', summary: '#summary',
    memorable_sentence: '#memorable-sentence', feeling: '#feeling', learned: '#learned',
    action_plan: '#action-plan', favorite_character: '#favorite-character',
    question_after_reading: '#question-after-reading', visibility: '#visibility'
  };

  function field(name, el) {
    return el || document.querySelector(FIELD_PICKERS[name]);
  }
  function val(name, v) {
    var el = field(name);
    if (v === undefined) return el ? el.value : '';
    if (el) el.value = v === null || v === undefined ? '' : v;
  }

  // ---------- 옵션/질문 채우기 ----------
  function fillOptions() {
    var statusSel = field('reading_status');
    BookData.statuses.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.value; o.textContent = s.label + ' ' + s.emoji;
      statusSel.appendChild(o);
    });
    var catSel = field('category');
    BookData.categories.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      catSel.appendChild(o);
    });
    var starRow = document.getElementById('rating-row');
    BookData.ratings.forEach(function (r) {
      var lab = document.createElement('label');
      var inp = document.createElement('input');
      inp.type = 'radio'; inp.name = 'rating'; inp.value = String(r.value);
      lab.appendChild(inp); lab.appendChild(document.createTextNode(r.label));
      starRow.appendChild(lab);
    });
    // "없음" 기본
    var none = document.createElement('label');
    var noneInp = document.createElement('input');
    noneInp.type = 'radio'; noneInp.name = 'rating'; noneInp.value = '';
    noneInp.checked = true;
    none.appendChild(noneInp); none.appendChild(document.createTextNode('없음'));
    starRow.appendChild(none);
  }

  function fillPrompts() {
    // 필드별 매핑 (질문 클릭 시 해당 textarea 에 텍스트 추가)
    var map = [
      ['one_line_review', '#one-line-review'],
      ['summary', '#summary'],
      ['memorable_sentence', '#memorable-sentence'],
      ['feeling', '#feeling'],
      ['learned', '#learned'],
      ['action_plan', '#action-plan'],
      ['favorite_character', '#favorite-character'],
      ['question_after_reading', '#question-after-reading']
    ];
    map.forEach(function (pair) {
      var key = pair[0], sel = pair[1];
      var ul = document.getElementById('prompt-' + key);
      var ta = document.querySelector(sel);
      if (!ul || !ta) return;
      (BookPrompts.fields[key] || []).forEach(function (q) {
        var li = document.createElement('li');
        li.textContent = q;
        li.addEventListener('click', function () {
          ta.value += (ta.value ? '\n\n' : '') + q;
          ta.focus();
        });
        ul.appendChild(li);
      });
    });

    // 독후감 템플릿 → 요약(summary) 영역에서 쓰도록 버튼
    var tpl = document.getElementById('templates');
    if (tpl) {
      (BookPrompts.templates || []).forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line;
        li.addEventListener('click', function () {
          var ta = document.querySelector('#summary');
          ta.value += (ta.value ? '\n' : '') + line;
          ta.focus();
        });
        tpl.appendChild(li);
      });
    }
  }

  // ---------- 데이터 조립 ----------
  function readPayload() {
    var star = document.querySelector('input[name="rating"]:checked');
    var rating = star ? star.value : '';
    var blank = function (s) { return s.trim() === '' ? null : s.trim(); };
    var dateBlank = function (s) { return s ? s : null; };
    return {
      title: blank(val('title')),
      author: blank(val('author')),
      publisher: blank(val('publisher')),
      isbn: blank(val('isbn')),
      category: blank(val('category')),
      reading_status: val('reading_status') || 'done',
      started_at: dateBlank(val('started_at')),
      finished_at: dateBlank(val('finished_at')),
      reading_date: dateBlank(val('reading_date')),
      rating: rating === '' ? null : Math.min(5, Math.max(1, parseInt(rating, 10) || 0)) || null,
      one_line_review: blank(val('one_line_review')),
      summary: blank(val('summary')),
      memorable_sentence: blank(val('memorable_sentence')),
      feeling: blank(val('feeling')),
      learned: blank(val('learned')),
      action_plan: blank(val('action_plan')),
      favorite_character: blank(val('favorite_character')),
      question_after_reading: blank(val('question_after_reading')),
      visibility: val('visibility') || 'private'
    };
  }

  function applyPayload(p) {
    val('title', p.title); val('author', p.author); val('publisher', p.publisher);
    val('isbn', p.isbn); val('category', p.category); val('reading_status', p.reading_status);
    val('started_at', p.started_at); val('finished_at', p.finished_at); val('reading_date', p.reading_date);
    val('one_line_review', p.one_line_review); val('summary', p.summary);
    val('memorable_sentence', p.memorable_sentence); val('feeling', p.feeling);
    val('learned', p.learned); val('action_plan', p.action_plan);
    val('favorite_character', p.favorite_character); val('question_after_reading', p.question_after_reading);
    val('visibility', p.visibility || 'private');
    if (p.rating) {
      var inp = document.querySelector('input[name="rating"][value="' + p.rating + '"]');
      if (inp) inp.checked = true;
    }
  }

  // ---------- 폼 저장 ----------
  async function onSubmit(e) {
    e.preventDefault();
    if (!BookSync.isLoggedIn()) { alert('로그인 후 기록을 저장할 수 있어요.'); return; }

    var payload = readPayload();
    if (!payload.title) { alert('책 제목은 꼭 적어주세요.'); field('title').focus(); return; }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    var res;
    if (isEdit) res = await BookSync.update(editId, payload);
    else res = await BookSync.create(payload);

    btn.disabled = false;
    if (res.error) {
      alert('저장에 실패했어요: ' + ((res.error && res.error.message) || '알 수 없는 오류'));
      return;
    }
    BookSync.clearDraft();
    window.location.href = 'view.html?id=' + (isEdit ? editId : res.data.id);
  }

  function onTempSave() {
    var payload = readPayload();
    if (!payload.title) { alert('책 제목을 적어야 임시 저장할 수 있어요.'); return; }
    BookSync.saveDraft(payload);
    alert('이 화면에서 내용을 임시 저장했어요. 브라우저를 닫아도 이어서 쓸 수 있어요.');
  }

  function restoreDraft() {
    if (isEdit) return;
    var d = BookSync.loadDraft();
    if (!d) return;
    if (!confirm('이전에 임시 저장한 내용이 있어요. 이어서 작성할까요?')) { BookSync.clearDraft(); return; }
    applyPayload(d);
    BookSync.clearDraft();
  }

  // ---------- 수정 모드 로딩 ----------
  var href = new URLSearchParams(window.location.search).get('id');
  async function loadForEdit() {
    isEdit = true; editId = href;
    if (editTitle) editTitle.textContent = '독서기록 수정';
    document.title = '독서기록 수정 - 독서야 놀자!';
    var res = await BookSync.get(editId);
    if (res.error && res.error.code === 'PGRST116') { alert('기록을 찾을 수 없거나 권한이 없어요.'); location.href = 'records.html'; return; }
    if (!res.data) { alert('기록을 불러오지 못했어요.'); location.href = 'records.html'; return; }
    if (res.data.user_id !== BookSync.uid()) { alert('이 기록을 수정할 권한이 없어요.'); location.href = 'records.html'; return; }
    applyPayload(res.data);
  }

  // ---------- 로그인 게이트 ----------
  var inited = false;
  function applyAuth(loggedIn) {
    if (!form) return;
    form.style.display = loggedIn ? '' : 'none';
    gate.style.display = loggedIn ? 'none' : '';
  }

  async function start() {
    form = document.getElementById('record-form');
    gate = document.getElementById('auth-required');
    editTitle = document.getElementById('page-title');
    if (!form) return;

    fillOptions();
    fillPrompts();
    form.addEventListener('submit', onSubmit);
    var tempBtn = document.getElementById('temp-save-btn');
    if (tempBtn) tempBtn.addEventListener('click', onTempSave);
    var cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        if (confirm('작성을 취소하고 돌아갈까요? 임시 저장한 내용은 남아 있어요.')) {
          location.href = isEdit ? 'view.html?id=' + editId : 'records.html';
        }
      });
    }

    await BookSync.ready();
    applyAuth(BookSync.isLoggedIn());
    if (BookSync.isLoggedIn()) {
      BookSync.ensureMembership();
      if (href) { await loadForEdit(); }
      else { restoreDraft(); }
    }
    BookSync.onChange(function (s) {
      applyAuth(s.isLoggedIn);
      if (s.isLoggedIn && !inited && href) loadForEdit();
      if (s.isLoggedIn) BookSync.ensureMembership();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();