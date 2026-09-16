/* ============================================================
   독서야 놀자 (book) - 로그인 / 내 정보 (login.js)
   · 새 로그인 시스템을 만들지 않습니다. 공통 cg-auth(Google) 를 그대로 사용합니다.
   · 로그인하면 간단한 내 독서 통계/최근 기록을 보여 줍니다.
   의존성: BookData · BookSync · CGAuth
   ============================================================ */
(function () {
  'use strict';

  var esc = BookData.escapeHtml;
  var authView, dashView;

  async function renderDash() {
    var name = (window.CGAuth && CGAuth.displayName()) || '반가워요';
    document.getElementById('dash-greeting').textContent = name + '님, 오늘도 좋은 책 읽으세요! 📚';

    var res = await BookSync.listMine({ limit: 5 });
    var rows = res.data || [];
    document.getElementById('dash-count').textContent = rows.length ? '최근 ' + rows.length + '권의 기록이 있어요.' : '아직 기록이 없어요. 첫 기록을 남겨보세요!';
    var list = document.getElementById('dash-recent');
    list.innerHTML = rows.length
      ? '<div class="cg-rec-list">' + rows.map(function (r) {
          return '<a class="cg-rec-row" href="view.html?id=' + esc(r.id) + '">' +
            '<span class="cg-rec-title">' + esc(r.title) + '</span>' +
            (r.author ? '<span class="cg-rec-sub">' + esc(r.author) + '</span>' : '') +
            '<span class="cg-rec-when">' + BookData.stars(r.rating) + '</span>' +
          '</a>';
        }).join('') + '</div>'
      : '<div class="empty">아직 기록이 없어요.</div>';
  }

  function applyAuth(loggedIn) {
    authView.style.display = loggedIn ? 'none' : '';
    dashView.style.display = loggedIn ? '' : 'none';
    if (loggedIn) { BookSync.ensureMembership(); renderDash(); }
  }

  function start() {
    authView = document.getElementById('auth-view');
    dashView = document.getElementById('dash-view');
    if (!authView) return;
    BookSync.ready().then(function () { applyAuth(BookSync.isLoggedIn()); });
    BookSync.onChange(function (s) { applyAuth(s.isLoggedIn); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();