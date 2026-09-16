/* ============================================================
   독서야 놀자 (book) - 공통 상단 내비게이션 (nav.js)
   - 메뉴를 한 곳에서 관리하므로 각 HTML 에는
     <nav class="nav-scroll" id="book-nav"></nav> 한 줄만 넣습니다.
   - 현재 페이지를 자동으로 active 처리를 합니다.
   ============================================================ */
(function () {
  'use strict';

  var MENU = [
    { label: '홈', href: 'index.html', emoji: '🏠' },
    { label: '기록 쓰기', href: 'write.html', emoji: '✍️' },
    { label: '내 기록', href: 'records.html', emoji: '📂' },
    { label: '통계', href: 'stats.html', emoji: '📊' },
    { label: '공개 기록', href: 'public.html', emoji: '🌍' },
    { label: '내 정보', href: 'login.html', emoji: '👤' }
  ];

  function currentFile() {
    var f = location.pathname.split('/').pop() || 'index.html';
    return (f === '' ? 'index.html' : f).toLowerCase();
  }

  function render() {
    var host = document.getElementById('book-nav');
    if (!host) return;
    var here = currentFile();
    host.innerHTML = MENU.map(function (m) {
      var active = (m.href === here) ? ' active' : '';
      // index.html 을 다른 파일처럼 취급 (호스트 루트가 '/' 인 경우)
      if (!active && m.href === 'index.html' && (here === '' || here === 'index')) active = ' active';
      return '<a href="' + m.href + '" class="nav-chip' + active + '">' + m.emoji + ' ' + m.label + '</a>';
    }).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
})();