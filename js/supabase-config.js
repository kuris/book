/* ============================================================
   독서야 놀자 (book) - Supabase 접속 상수 (supabase-config.js)

   - 값은 형제 서비스(한자/단어/역사/운세/마인드테스트/직장인/돈공부/문서/말씀)와
     완전히 동일합니다. 새로 발급한 키가 아닙니다.
   - publishable(anon) 키는 브라우저에 공개되어도 되는 키이며,
     실제 데이터 보호는 Supabase RLS 가 담당합니다.
   - storageKey 를 'sb-book-auth-token' 로 분리해 형제 서비스 세션과
     겹치지 않게 합니다. (같은 storageKey 로 두 클라이언트를 만들면 토큰 갱신 충돌)

   ※ 이 파일은 상수만 선언합니다.
      Supabase 클라이언트 생성은 공통 모듈(cg-auth.js)이 담당합니다.
   ============================================================ */

(function () {
  if (typeof window === 'undefined') return;
  window.SUPABASE_URL = 'https://ybhiznlelnpwaicyoifa.supabase.co';
  window.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1';
  window.SUPABASE_AUTH_STORAGE_KEY = 'sb-book-auth-token';
})();