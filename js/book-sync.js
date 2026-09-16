/* ============================================================
   독서야 놀자 (book) - 기록 저장/조회 공통 계층 (book-sync.js)

   [원칙]
     · 로그인 계정(auth.users.id) 기준으로 public.book_records 에 저장합니다.
     · 공통 로그인 모듈(cg-auth.js)이 만든 public 스키마 클라이언트를 그대로 씁니다.
       (별도 Supabase 클라이언트를 만들지 않아 토큰 갱신 충돌이 없습니다)
     · 삭제는 실제 delete 가 아니라 deleted_at = now() 로 하는 soft delete 입니다.
     · 데이터 보호는 Supabase RLS 가 담당하고, 이 파일은 편의 함수만 제공합니다.

   의존성: cg-auth.js (window.CGAuth) · book-data.js (BookData)
   ============================================================ */
(function (global) {
  'use strict';

  var TABLE = 'book_records';
  var ORDER_NORMAL = { column: 'created_at', ascending: false };

  function CG() { return global.CGAuth || null; }
  function warn(m, e) { try { console.warn('[독서기록] ' + m, e && (e.message || e)); } catch (_) {} }

  // public 스키마 클라이언트 + 테이블
  function db() {
    var c = CG();
    if (!c || !c.getPublicDb) return null;
    return c.getPublicDb();
  }
  function table() {
    var d = db();
    return d ? d.from(TABLE) : null;
  }
  function uid() {
    var c = CG();
    return c ? c.getUserId() : null;
  }
  function isLoggedIn() {
    return !!(CG() && CG().isLoggedIn());
  }
  function ready() {
    return CG() ? CG().ready() : Promise.resolve(false);
  }
  function onChange(cb) {
    return CG() ? CG().onChange(cb) : function () {};
  }
  function getUser() {
    return CG() ? CG().getUser() : null;
  }

  // ---------- 조회 ----------
  // 내 활성 기록 전체 (정렬·제한만, 검색/필터는 페이지에서 추가)
  async function listMine(o) {
    o = o || {};
    var q = table();
    if (!q) return { data: [], error: null };
    var b = q.select(o.select || '*')
      .eq('user_id', uid())
      .is('deleted_at', null);
    var col = (o.orderBy && { column: o.orderBy }) || ORDER_NORMAL;
    b = b.order(col.column, { ascending: !!o.ascending, nullsFirst: false });
    if (o.limit) b = b.limit(o.limit);
    var r = await b;
    if (r.error) { warn('내 기록 조회 실패', r.error); return { data: [], error: r.error }; }
    return { data: r.data || [], error: null };
  }

  // 공개 활성 기록 최신순 (비로그인 포함 조회 가능)
  async function listPublic(o) {
    o = o || {};
    var q = table();
    if (!q) return { data: [], error: null };
    var b = q.select(o.select || '*')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order(o.orderBy || 'created_at', { ascending: !!o.ascending });
    if (o.limit) b = b.limit(o.limit);
    var r = await b;
    if (r.error) { warn('공개 기록 조회 실패', r.error); return { data: [], error: r.error }; }
    return { data: r.data || [], error: null };
  }

  // 단건 조회 (공개=아무나 / private=작성자만, RLS 가 강제)
  async function get(id) {
    var q = table();
    if (!q || !id) return { data: null, error: null };
    var r = await q.select('*').eq('id', id).maybeSingle();
    if (r.error) { warn('기록 조회 실패', r.error); return { data: null, error: r.error }; }
    return { data: r.data || null, error: null };
  }

  // ---------- 쓰기 ----------
  async function create(payload) {
    var q = table();
    if (!q) return { error: { message: '로그인 필요' } };
    var r = await q.insert(Object.assign({}, payload, { user_id: uid() }))
      .select('id').maybeSingle();
    if (r.error) { warn('기록 저장 실패', r.error); return { error: r.error }; }
    return { data: r.data, error: null };
  }

  async function update(id, patch) {
    var q = table();
    if (!q) return { error: { message: '로그인 필요' } };
    var r = await q.update(patch).eq('id', id).eq('user_id', uid()).select('id').maybeSingle();
    if (r.error) { warn('기록 수정 실패', r.error); return { error: r.error }; }
    return { data: r.data, error: null };
  }

  // soft delete
  async function remove(id) {
    var q = table();
    if (!q) return { error: { message: '로그인 필요' } };
    var r = await q.update({ deleted_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', uid());
    if (r.error) { warn('기록 삭제 실패', r.error); return { error: r.error }; }
    return { data: true, error: null };
  }

  // ---------- 서비스 가입 (첫 이용 시) ----------
  async function ensureMembership() {
    var c = CG();
    if (!c || !uid()) return;
    try {
      var d = c.getPublicDb();
      if (!d) return;
      await d.from('service_members')
        .insert({ user_id: uid(), service: 'book', last_seen_at: new Date().toISOString() })
        .onConflict('user_id,service')
        .ignore();
    } catch (e) { warn('서비스 가입 처리 실패', e); }
  }

  // ---------- 임시저장 (localStorage 초안) ----------
  var DRAFT_KEY = 'book_draft_v1';
  function saveDraft(obj) {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(obj)); return true; } catch (e) { return false; }
  }
  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return d && typeof d === 'object' ? d : null;
    } catch (e) { return null; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  global.BookSync = {
    db: db,
    table: table,
    uid: uid,
    isLoggedIn: isLoggedIn,
    ready: ready,
    onChange: onChange,
    getUser: getUser,
    listMine: listMine,
    listPublic: listPublic,
    get: get,
    create: create,
    update: update,
    remove: remove,
    ensureMembership: ensureMembership,
    saveDraft: saveDraft,
    loadDraft: loadDraft,
    clearDraft: clearDraft
  };
})(typeof window !== 'undefined' ? window : this);