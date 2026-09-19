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

  // 14종 패밀리는 cg-family.js 공유 모듈이 렌더 (data-cg-family 컨테이너)

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

  // 헤더 우측 "다른 놀자 서비스" 드롭다운 (cg-family.js 공유 모듈)
  function renderFamily() {
    var host = document.querySelector('.header-right');
    if (!host || host.querySelector('[data-cg-family]')) return;
    var box = document.createElement('div');
    box.setAttribute('data-cg-family', '');
    box.setAttribute('data-current', 'book');
    // flex order로 로그인 위젯(CGAuth append)과 순서 고정: 패밀리가 항상 마지막
    box.style.order = '99';
    host.appendChild(box);
    if (window.CGFamily) window.CGFamily.renderInto(box, { current: 'book' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { render(); renderFamily(); }, { once: true });
  } else {
    render();
    renderFamily();
  }
})();