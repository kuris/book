/* ============================================================
   광고 조건부 로딩 (cg-ads.js)

   광고 제거 대상(관리자 / 광고 제거 / 프리미엄 / ad_free 권한)에게는
   AdSense 스크립트를 아예 넣지 않습니다.

   ※ CSS 로 광고를 가리지 않습니다. 가리는 방식은 AdSense 정책 위반 위험이 있습니다.
   ※ 판정은 localStorage 캐시로 "동기" 처리해 광고 노출이 늦어지지 않게 합니다.
      (로그인하지 않은 대다수 사용자는 즉시 원래대로 로드됩니다)
   ============================================================ */

(function () {
  'use strict';

  var me = document.currentScript ||
           document.querySelector('script[src*="cg-ads.js"]');
  var client = (me && me.getAttribute('data-client')) || '';
  if (!client) return;

  // 광고 제거 대상인지 동기 판정 (네트워크 대기 없음)
  var adFree = false;
  try { adFree = localStorage.getItem('cg_adfree') === '1'; } catch (e) {}
  if (adFree) return;

  var s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
  (document.head || document.documentElement).appendChild(s);
})();
