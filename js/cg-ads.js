/* ============================================================
   광고 조건부 로딩 (cg-ads.js) — 독서야 놀자(book)

   · 광고 제거 대상(관리자 / 광고 제거 / 프리미엄 / ad_free 권한)에게는
     AdSense 스크립트를 아예 넣지 않습니다.
   · 이 사이트는 어린이 대상(한자야 놀자와 동일)이므로
     - 스크립트 주소에 tfat=1 을 붙여 모든 광고 요청을 아동 대상으로 처리하고
     - requestNonPersonalizedAds=1 로 개인 맞춤 광고를 차단합니다.

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

  // 어린이 대상: 개인 맞춤 광고 차단 (playhanja 와 동일한 방식)
  try {
    (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
  } catch (e) {}

  var s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
          encodeURIComponent(client) + '&tfat=1';
  (document.head || document.documentElement).appendChild(s);
})();
