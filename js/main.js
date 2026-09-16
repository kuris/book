/* ============================================================
   독서야 놀자 (book) - 홈 화면 (main.js)
   - 최근 공개 독서기록 카드 목록
   - 로그인 사용자에게는 "내 최근 기록" 패널
   의존성: BookData · BookSync · CGAuth
   ============================================================ */
(function () {
  'use strict';

  async function loadPublic() {
    var host = document.getElementById('home-public');
    if (!host) return;
    host.innerHTML = '<div class="loading">최근 공개 기록을 불러오는 중…</div>';

    var res = await BookSync.listPublic({ limit: 6 });
    if (res.error) {
      host.innerHTML = '<div class="empty">기록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</div>';
      return;
    }
    if (!res.data.length) {
      host.innerHTML = '<div class="empty">아직 공개된 기록이 없어요. 첫 기록을 남겨보세요! 🚀</div>';
      return;
    }
    host.innerHTML = res.data.map(cardHtml).join('');
  }

  function cardHtml(r) {
    var esc = BookData.escapeHtml;
    var status = BookData.statusOf(r.reading_status);
    return (
      '<a class="record-card" href="view.html?id=' + esc(r.id) + '" style="text-decoration:none;color:inherit;">' +
        '<span class="rc-status">' + status.emoji + ' ' + esc(status.label) + '</span>' +
        '<h3>' + esc(r.title) + '</h3>' +
        '<div class="rc-meta">' + esc(r.author || '저자 미상') + (r.category ? ' · ' + esc(r.category) : '') + '</div>' +
        (r.one_line_review ? '<div class="rc-one">”' + esc(r.one_line_review) + '”</div>' : '') +
        '<div class="rc-foot">' +
          '<span>' + BookData.stars(r.rating) + '</span>' +
          '<span>' + esc(BookData.dateOf(r.created_at)) + '</span>' +
        '</div>' +
      '</a>'
    );
  }

  function mountRecentPanel() {
    var host = document.getElementById('book-recent');
    if (!host || !window.CGAuth || !CGAuth.mountRecentPanel) return;
    CGAuth.mountRecentPanel(host, {
      title: '📂 내 최근 기록',
      moreUrl: 'records.html',
      guestText: 'Google 로그인하면 내 독서기록이 계정에 저장돼, 휴대폰에서 쓴 기록을 PC에서도 이어서 볼 수 있어요.',
      emptyText: '아직 기록이 없어요. 기록 쓰기에서 오늘 읽은 책을 적어 보세요.',
      limit: 6,
      loader: async function () {
        var res = await BookSync.listMine({ limit: 6 });
        return (res.data || []).map(function (r) {
          return {
            title: r.title,
            subtitle: r.author || '',
            url: 'view.html?id=' + r.id,
            updated_at: r.updated_at
          };
        });
      }
    });
  }

  function start() {
    BookSync.ready().then(function () {
      loadPublic();
      mountRecentPanel();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();