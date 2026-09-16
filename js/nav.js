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

  // 자기(book)를 제외한 형제 서비스 (다른 놀자 드롭다운용)
  var FAMILY = [
    { emoji: '📖', label: '한자야 놀자',  url: 'https://hanja.chatgpts.kr' },
    { emoji: '⚡', label: '단어야 놀자',  url: 'https://voca.chatgpts.kr' },
    { emoji: '📜', label: '역사야 놀자',  url: 'https://history.chatgpts.kr' },
    { emoji: '🔮', label: '운세야 놀자',  url: 'https://fortune.chatgpts.kr' },
    { emoji: '🧠', label: '마인드테스트', url: 'https://mind.chatgpts.kr' },
    { emoji: '💼', label: '워크야 놀자',  url: 'https://work.chatgpts.kr' },
    { emoji: '💰', label: '머니야 놀자',  url: 'https://money.chatgpts.kr' },
    { emoji: '🛠️', label: '문서야 놀자',  url: 'https://tools.chatgpts.kr' },
    { emoji: '✝️', label: '성경아 놀자',  url: 'https://bible.chatgpts.kr' },
    { emoji: '🪷', label: '마음아 놀자',  url: 'https://maum.chatgpts.kr' },
    { emoji: '🏠', label: 'chatgpts.kr',  url: 'https://chatgpts.kr' }
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

  // 헤더 우측 "다른 놀자 서비스" 드롭다운
  function renderFamily() {
    var host = document.querySelector('.header-right');
    if (!host || document.getElementById('family-nav')) return;
    var wrap = document.createElement('div');
    wrap.id = 'family-nav';
    var links = FAMILY.map(function (s) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener"><span>' + s.emoji + '</span> <span>' + s.label + '</span></a>';
    }).join('');
    wrap.innerHTML =
      '<button type="button" id="family-btn" aria-expanded="false">🎡 다른 놀자 ▾</button>' +
      '<div class="family-dropdown">' + links + '</div>';
    host.appendChild(wrap);

    var btn = wrap.querySelector('#family-btn');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { render(); renderFamily(); }, { once: true });
  } else {
    render();
    renderFamily();
  }
})();