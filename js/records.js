/* ============================================================
   독서야 놀자 (book) - 내 기록 목록 (records.js)
   - 로그인 필요
   - 내 활성 기록을 불러와 상태/공개 여부 필터 · 제목/저자/한 줄 검색 · 정렬
   - 삭제는 confirm 후 soft delete
   의존성: BookData · BookSync · CGAuth
   ============================================================ */
(function () {
  'use strict';

  var esc = BookData.escapeHtml;
  var cache = [];
  var list = [];
  var state = { status: 'all', visibility: 'all', q: '', sort: 'created_at_desc' };

  var gridEl, emptyEl, countEl, gate;

  async function load() {
    if (!BookSync.isLoggedIn()) return;
    var res = await BookSync.listMine({ limit: 500 });
    cache = res.data || [];
    render();
  }

  function matches(r) {
    if (state.status !== 'all' && r.reading_status !== state.status) return false;
    if (state.visibility !== 'all' && r.visibility !== state.visibility) return false;
    if (state.q) {
      var q = state.q.toLowerCase();
      var hay = String(r.title || '').toLowerCase() + ' ' +
                String(r.author || '').toLowerCase() + ' ' +
                String(r.one_line_review || '').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sorted() {
    var s = BookData.sorts.filter(function (x) { return x.value === state.sort; })[0] ||
            BookData.sorts[0];
    return list.slice().sort(function (a, b) {
      var av = a[s.column], bv = b[s.column];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;  // null 은 뒤로
      if (bv == null) return -1;
      if (av < bv) return s.ascending ? -1 : 1;
      if (av > bv) return s.ascending ? 1 : -1;
      return 0;
    });
  }

  function cardHtml(r) {
    var st = BookData.statusOf(r.reading_status);
    var chips = [];
    if (r.visibility === 'public') chips.push('<span class="chip chip--public">🌍 공개</span>');
    else chips.push('<span class="chip chip--private">🔒 비공개</span>');
    var date = BookData.dateOf(r.reading_date || r.finished_at || r.created_at);
    return (
      '<article class="record-card">' +
        '<span class="rc-status">' + st.emoji + ' ' + esc(st.label) + '</span>' +
        '<h3><a href="view.html?id=' + esc(r.id) + '">' + esc(r.title) + '</a></h3>' +
        '<div class="rc-meta">' + esc(r.author || '저자 미상') + (r.category ? ' · ' + esc(r.category) : '') + '</div>' +
        (r.one_line_review ? '<div class="rc-one">”' + esc(r.one_line_review) + '”</div>' : '') +
        '<div class="rc-foot">' +
          '<span>' + chips.join(' ') + '</span>' +
          '<span>' + BookData.stars(r.rating) + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;">' +
          '<a class="btn btn-sm btn-outline" style="flex:1" href="write.html?id=' + esc(r.id) + '">수정</a>' +
          '<button class="btn btn-sm btn-danger" style="flex:1" data-del="' + esc(r.id) + '" data-title="' + esc(r.title) + '">삭제</button>' +
        '</div>' +
      '</article>'
    );
  }

  function render() {
    gridEl.innerHTML = '';
    var filtered = cache.filter(matches);
    list = filtered;
    var rows = sorted();

    emptyEl.style.display = rows.length ? 'none' : '';
    countEl.textContent = cache.length ? ('총 ' + cache.length + '권 · 표시 ' + rows.length + '권') : '';

    gridEl.innerHTML = rows.map(cardHtml).join('');
  }

  function bind() {
    // 상태 필터 칩
    document.querySelectorAll('[data-status]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.status = chip.getAttribute('data-status');
        document.querySelectorAll('[data-status]').forEach(function (c) {
          c.classList.toggle('active', c === chip);
        });
        render();
      });
    });
    document.getElementById('visibility-filter').addEventListener('change', function (e) {
      state.visibility = e.target.value; render();
    });
    document.getElementById('sort-by').addEventListener('change', function (e) {
      state.sort = e.target.value; render();
    });
    var inp = document.getElementById('search-input');
    inp.addEventListener('input', function () { state.q = inp.value.trim(); render(); });
    var btn = document.getElementById('search-btn');
    if (btn) btn.addEventListener('click', function () { state.q = inp.value.trim(); render(); });

    gridEl.addEventListener('click', async function (ev) {
      var del = ev.target.closest('[data-del]');
      if (!del) return;
      if (!confirm('“' + del.getAttribute('data-title') + '” 기록을 삭제할까요? (되돌릴 수 없어요)')) return;
      var res = await BookSync.remove(del.getAttribute('data-del'));
      if (res.error) { alert('삭제에 실패했어요.'); return; }
      load();
    });

    document.getElementById('add-record-btn').addEventListener('click', function () {
      location.href = 'write.html';
    });
  }

  function applyAuth(loggedIn) {
    gate.style.display = loggedIn ? 'none' : '';
    gridEl.closest('.records-area').style.display = loggedIn ? '' : 'none';
    if (loggedIn) load();
  }

  function start() {
    gridEl = document.getElementById('record-grid');
    emptyEl = document.getElementById('empty-state');
    countEl = document.getElementById('record-count');
    gate = document.getElementById('auth-required');
    if (!gridEl) return;
    bind();

    BookSync.ready().then(function () {
      applyAuth(BookSync.isLoggedIn());
      if (BookSync.isLoggedIn()) BookSync.ensureMembership();
    });
    BookSync.onChange(function (s) {
      applyAuth(s.isLoggedIn);
      if (s.isLoggedIn) BookSync.ensureMembership();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();