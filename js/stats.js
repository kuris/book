/* ============================================================
   독서야 놀자 (book) - 독서 통계 (stats.js)
   - 로그인 필요
   - 복잡한 차트 라이브러리 없이 CSS 카드/막대그래프로 표시
   의존성: BookData · BookSync · CGAuth
   ============================================================ */
(function () {
  'use strict';

  var esc = BookData.escapeHtml;
  var statsEl, gate;

  function countByStatus(rows) {
    var out = {};
    BookData.statuses.forEach(function (s) { out[s.value] = 0; });
    rows.forEach(function (r) { out[r.reading_status] = (out[r.reading_status] || 0) + 1; });
    return out;
  }

  function countByCategory(rows) {
    var out = {};
    rows.forEach(function (r) {
      var c = r.category || '기타';
      out[c] = (out[c] || 0) + 1;
    });
    return out;
  }

  function avgRating(rows) {
    var rated = rows.filter(function (r) { return r.rating; });
    if (!rated.length) return null;
    var sum = rated.reduce(function (a, r) { return a + Number(r.rating); }, 0);
    return (sum / rated.length).toFixed(1);
  }

  function monthKey(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  }

  function barRow(label, n, max, cls) {
    var pct = max ? Math.round((n / max) * 100) : 0;
    return (
      '<div class="bar-row">' +
        '<div class="bar-label">' + esc(label) + '</div>' +
        '<div class="bar-track"><div class="bar-fill' + (cls || '') + '" style="width:' + pct + '%"></div></div>' +
        '<div class="bar-num">' + n + '</div>' +
      '</div>'
    );
  }

  function render(rows) {
    var total = rows.length;
    var byStatus = countByStatus(rows);
    var byCat = countByCategory(rows);
    var avg = avgRating(rows);
    var nowK = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 7);
    var thisMonth = rows.filter(function (r) { return monthKey(r.created_at) === nowK; }).length;

    // 요약 카드
    var statRow = document.getElementById('stat-row');
    var stats = [
      ['전체 기록', total, '권'],
      ['다 읽음', byStatus.done, '권'],
      ['읽는 중', byStatus.reading, '권'],
      ['읽고 싶은 책', byStatus.want, '권'],
      ['이번 달 기록', thisMonth, '권'],
      ['평균 별점', avg == null ? '—' : avg + ' / 5', '⭐']
    ];
    statRow.innerHTML = stats.map(function (s) {
      return '<div class="stat-card"><div class="num">' + esc(s[1]) + '</div><div class="label">' + esc(s[0]) + ' <span style="color:var(--muted);font-size:12px;">' + esc(s[2]) + '</span></div></div>';
    }).join('');

    // 독서 상태별
    document.getElementById('stats-status').innerHTML =
      '<h2 class="sec-title" style="margin-top:0;">독서 상태별</h2>' +
      BookData.statuses.map(function (s) {
        return barRow(s.label + ' ' + s.emoji, byStatus[s.value] || 0, total, ' bar-fill--key');
      }).join('') +
      (total === 0 ? '<div class="empty">아직 기록이 없어요.</div>' : '');

    // 카테고리별
    var catMax = Math.max.apply(null, Object.keys(byCat).map(function (k) { return byCat[k]; }).concat([1]));
    document.getElementById('stats-category').innerHTML =
      '<h2 class="sec-title" style="margin-top:0;">카테고리별</h2>' +
      Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).map(function (k) {
        return barRow(k, byCat[k], catMax, ' bar-fill--accent');
      }).join('') +
      (Object.keys(byCat).length === 0 ? '<div class="empty">카테고리 정보가 아직 없어요.</div>' : '');

    // 최근 기록
    var recent = rows.slice(0).sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; }).slice(0, 6);
    document.getElementById('stats-recent').innerHTML =
      '<h2 class="sec-title" style="margin-top:0;">최근 기록</h2>' +
      (recent.length
        ? '<div class="cg-rec-list">' + recent.map(function (r) {
            return '<a class="cg-rec-row" href="view.html?id=' + esc(r.id) + '">' +
              '<span class="cg-rec-title">' + esc(r.title) + '</span>' +
              (r.author ? '<span class="cg-rec-sub">' + esc(r.author) + '</span>' : '') +
              '<span class="cg-rec-when">' + BookData.stars(r.rating) + '</span>' +
            '</a>';
          }).join('') + '</div>'
        : '<div class="empty">아직 기록이 없어요.</div>');
  }

  async function load() {
    if (!BookSync.isLoggedIn()) return;
    var res = await BookSync.listMine({ limit: 500 });
    render(res.data || []);
  }

  function applyAuth(loggedIn) {
    gate.style.display = loggedIn ? 'none' : '';
    statsEl.style.display = loggedIn ? '' : 'none';
    if (loggedIn) load();
  }

  function start() {
    gate = document.getElementById('auth-required');
    statsEl = document.getElementById('stats-area');
    if (!statsEl) return;
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