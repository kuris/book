/* ============================================================
   독서야 놀자 (book) - 기록 상세 보기 (view.js)
   - URL ?id= 로 단건 조회 (공개=아무나 / private=작성자만, RLS 가 강제)
   - 작성자 본인만 수정/삭제 버튼 표시
   - 삭제는 confirm 후 soft delete(deleted_at)
   - 출력 시 HTML escape 처리 (XSS 방지)
   의존성: BookData · BookSync · CGAuth
   ============================================================ */
(function () {
  'use strict';

  var PAGE = 'view.html';
  var id = new URLSearchParams(window.location.search).get('id');
  var esc = BookData.escapeHtml;

  var SECTION_KEYS = [
    ['summary', '줄거리 요약'],
    ['memorable_sentence', '기억에 남는 문장'],
    ['feeling', '느낀 점'],
    ['learned', '배운 점'],
    ['action_plan', '나에게 적용할 점'],
    ['favorite_character', '좋아하는 인물'],
    ['question_after_reading', '읽고 난 뒤 생긴 질문']
  ];

  function statusLabel(r) { return BookData.statusOf(r.reading_status); }

  function render(r) {
    document.title = r.title + ' - 독서야 놀자!';
    document.getElementById('v-title').textContent = r.title;

    var meta = [];
    if (r.author) meta.push('<span class="kv">✍️ ' + esc(r.author) + '</span>');
    if (r.publisher) meta.push('<span class="kv">🏢 ' + esc(r.publisher) + '</span>');
    if (r.category) meta.push('<span class="kv">🏷️ ' + esc(r.category) + '</span>');
    if (r.reading_status) meta.push('<span class="kv">' + statusLabel(r).emoji + ' ' + esc(statusLabel(r).label) + '</span>');
    if (r.rating) meta.push('<span class="kv">⭐ ' + esc(r.rating) + '</span>');
    var d = BookData.dateOf(r.reading_date || r.finished_at || r.created_at);
    if (d) meta.push('<span class="kv">📅 ' + esc(d) + '</span>');
    if (r.visibility === 'public') meta.push('<span class="chip chip--public">🌍 공개</span>');
    else meta.push('<span class="chip chip--private">🔒 비공개</span>');
    document.getElementById('v-meta').innerHTML = meta.join(' ');

    var one = document.getElementById('v-one');
    if (r.one_line_review) {
      one.style.display = '';
      one.textContent = '”' + r.one_line_review + '”';
    } else { one.style.display = 'none'; }

    SECTION_KEYS.forEach(function (pair) {
      var key = pair[0], label = pair[1];
      var box = document.getElementById('v-section-' + key);
      var body = box.querySelector('.body');
      if (r[key]) {
        box.style.display = '';
        body.innerHTML = esc(r[key]).replace(/\n/g, '<br>');
      } else {
        box.style.display = 'none';
      }
      box.querySelector('.sec-label').textContent = label;
    });

    // 작성자 본인만 수정/삭제
    var mine = BookSync.isLoggedIn() && r.user_id === BookSync.uid();
    document.getElementById('v-edit').style.display = mine ? '' : 'none';
    document.getElementById('v-delete').style.display = mine ? '' : 'none';
    document.getElementById('record-detail').style.display = '';
  }

  function showGate() {
    document.getElementById('auth-required').style.display = '';
  }

  async function load() {
    if (!id) { showGate(); return; }

    // 최근 기록으로 알려두기 (로그인 사용자, 실패해도 무해)
    try {
      var t = await BookSync.get(id);
      if (t.data && window.CGAuth && CGAuth.touchRecent) {
        CGAuth.touchRecent({ kind: 'item', id: t.data.id, title: t.data.title, url: PAGE + '?id=' + id });
      }
    } catch (e) {}

    var res = await BookSync.get(id);
    if (res.error && res.error.code === 'PGRST116') { showGate(); return; }
    if (!res.data) { showGate(); return; }
    render(res.data);
  }

  function bindActions() {
    document.getElementById('v-edit').addEventListener('click', function () {
      location.href = 'write.html?id=' + id;
    });
    document.getElementById('v-delete').addEventListener('click', async function () {
      if (!confirm('이 기록을 삭제할까요? 삭제된 기록은 목록에서 사라져요. (되돌릴 수 없어요)')) return;
      var res = await BookSync.remove(id);
      if (res.error) { alert('삭제에 실패했어요: ' + (res.error.message || '오류')); return; }
      alert('기록을 삭제했어요.');
      location.href = 'records.html';
    });
  }

  function start() {
    bindActions();
    BookSync.ready().then(function () { load(); });
    BookSync.onChange(function (s) {
      if (s.isLoggedIn) load();   // 로그인하면 권한이 생길 수 있어 다시 조회
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();