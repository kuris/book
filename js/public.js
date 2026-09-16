/* ============================================================
   독서야 놀자 (book) - 공개 기록 목록 (public.js)
   - visibility='public' 이고 deleted_at 이 null 인 기록을 최신순으로 표시
   - 비로그인 사용자도 조회 가능 (RLS)
   의존성: BookData · BookSync
   ============================================================ */
(function () {
  'use strict';

  var esc = BookData.escapeHtml;
  var PER = 18;
  var offset = { v: 0 };
  var gridEl, moreBtn, emptyEl;

  async function loadMore(reset) {
    if (reset) offset.v = 0;
    var res = await BookSync.listPublic({
      limit: PER + 1,
      offset: offset.v
    });
    if (res.error) {
      emptyEl.innerHTML = '<div class="empty">기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>';
      moreBtn.style.display = 'none';
      return;
    }
    var rows = res.data || [];
    var hasMore = rows.length > PER;
    var slice = rows.slice(0, PER);
    if (reset) gridEl.innerHTML = '';
    gridEl.innerHTML += slice.map(cardHtml).join('');
    offset.v += slice.length;
    moreBtn.style.display = hasMore ? '' : 'none';
    if (offset.v === 0) emptyEl.style.display = '';
    else emptyEl.style.display = 'none';
  }

  function cardHtml(r) {
    var st = BookData.statusOf(r.reading_status);
    return (
      '<a class="record-card" href="view.html?id=' + esc(r.id) + '" style="text-decoration:none;color:inherit;">' +
        '<span class="rc-status">' + st.emoji + ' ' + esc(st.label) + '</span>' +
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

  function start() {
    gridEl = document.getElementById('public-grid');
    moreBtn = document.getElementById('load-more');
    emptyEl = document.getElementById('empty-state');
    if (!gridEl) return;
    if (moreBtn) moreBtn.addEventListener('click', function () { loadMore(false); });
    BookSync.ready().then(function () { loadMore(true); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();