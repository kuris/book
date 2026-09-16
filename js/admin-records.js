/* ============================================================
   독서야 놀자 (book) - 관리자 전용 「독서기록 관리」 탭 (admin-records.js)
   - 공용 admin.js 에 별도 탭으로 붙는 부가 모듈입니다.
   - 관리자(profiles.role='admin')만 RLS 를 통해 접근/수정 가능합니다.
   - 동작: 전체/공개/비공개/삭제 건수 · 최근 기록 · 부적절한 공개 기록 비공개 전환 ·
           soft delete
   의존성: admin.html 의 window.sbAdmin (supabase-admin-client.js)
   ============================================================ */
(function () {
  'use strict';

  var sb = function () { return window.sbAdmin || null; };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function ago(iso) {
    if (!iso) return '—';
    var t = new Date(iso).getTime();
    if (!t) return '—';
    var d = Math.floor((Date.now() - t) / 1000);
    if (d < 60) return '방금';
    if (d < 3600) return Math.floor(d / 60) + '분 전';
    if (d < 86400) return Math.floor(d / 3600) + '시간 전';
    if (d < 604800) return Math.floor(d / 86400) + '일 전';
    return String(iso).slice(0, 10);
  }

  var STATUS = {
    want: '📌 읽고 싶은 책', reading: '📖 읽는 중', done: '✅ 다 읽음', paused: '⏸️ 멈춤'
  };
  function statusLabel(s) { return STATUS[s] || s || '—'; }

  async function headCount() {
    var q = sb();
    if (!q) return 0;
    var r = await q.from('book_records').select('id', { count: 'exact', head: true });
    return (r.count) || 0;
  }
  async function headCountWhere(whereFn) {
    var q = sb();
    if (!q) return 0;
    var b = q.from('book_records').select('id', { count: 'exact', head: true });
    whereFn(b);
    var r = await b;
    return (r.count) || 0;
  }

  async function load() {
    var host = document.getElementById('ar-content');
    if (!host) return;
    host.innerHTML = '<div class="loading">독서기록을 불러오는 중…</div>';

    var total = 0, pub = 0, pri = 0, del = 0;
    try {
      total = await headCount();
      pub = await headCountWhere(function (b) { b.eq('visibility', 'public').is('deleted_at', null); });
      pri = await headCountWhere(function (b) { b.eq('visibility', 'private').is('deleted_at', null); });
      del = await headCountWhere(function (b) { b.not('deleted_at', 'is', null); });
    } catch (e) { /* 건수 실패해도 목록은 시도 */ }

    var cards = [
      ['전체 기록', total, '권'],
      ['공개 기록', pub, '권'],
      ['비공개 기록', pri, '권'],
      ['삭제됨', del, '건']
    ];
    host.innerHTML =
      '<div class="admin-stat-grid" style="margin-bottom:16px;">' +
        cards.map(function (c) {
          return '<div class="admin-stat-card"><div class="admin-stat-head"><span>' + c[0] + '</span>' +
            '<span class="admin-stat-icon" style="background:#e0f2fe;color:#0284c7;"><i class="fa-solid fa-book"></i></span></div>' +
            '<div class="admin-stat-num">' + esc(c[1]) + '<span style="font-size:13px;color:#94a3b8;"> ' + esc(c[2]) + '</span></div>' +
            '</div>';
        }).join('') +
      '</div>' +
      '<div class="admin-panel"><div class="admin-panel-head">' +
        '<h3 class="admin-panel-title"><i class="fa-solid fa-list-check" style="color:#2563eb;"></i> 최근 독서기록 (최신 100건)</h3>' +
        '<span class="admin-panel-note">공개 기록은 비공개로 전환하거나 soft delete 할 수 있어요.</span>' +
      '</div><div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>제목</th><th>작성자</th><th>상태</th><th>공개</th><th>작성일</th><th>관리</th>' +
      '</tr></thead><tbody id="ar-tbody"><tr><td colspan="6" style="text-align:center;padding:20px;">불러오는 중…</td></tr></tbody></table></div></div>' +
      '<div class="admin-msg" id="ar-msg"></div>';

    var res = await sb().from('book_records')
      .select('*').order('created_at', { ascending: false }).limit(100);
    var rows = res.data || [];
    var tb = document.getElementById('ar-tbody');
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">아직 기록이 없어요.</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(function (r) {
      var vis = r.visibility === 'public'
        ? '<span class="admin-badge admin-badge-warning">공개</span>'
        : '<span class="admin-badge admin-badge-info">비공개</span>';
      var del = r.deleted_at
        ? '<span class="admin-badge admin-badge-danger">삭제됨</span>'
        : '<span class="admin-badge admin-badge-success">활성</span>';
      var btns =
        (r.deleted_at ? '' : r.visibility === 'public'
          ? '<button class="admin-btn-submit admin-btn-sm" data-act="private" data-id="' + esc(r.id) + '">비공개로</button> '
          : '') +
        (r.deleted_at ? '' : '<button class="admin-btn-submit admin-btn-sm" style="background:#dc2626;" data-act="del" data-id="' + esc(r.id) + '">삭제</button>');
      return '<tr>' +
        '<td><strong>' + esc(r.title) + '</strong> <div style="color:#94a3b8;font-size:12px;">' + esc(r.one_line_review || '') + '</div></td>' +
        '<td>' + esc(r.author || '—') + '<div style="color:#94a3b8;font-size:11px;">' + esc((r.user_id || '').slice(0, 8)) + '</div></td>' +
        '<td>' + esc(statusLabel(r.reading_status)) + '</td>' +
        '<td>' + vis + ' ' + del + '</td>' +
        '<td>' + esc(ago(r.created_at)) + '</td>' +
        '<td>' + btns + '</td>' +
      '</tr>';
    }).join('');

    // 이벤트는 매번 다시 걸지 않도록 위임
    host.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () { action(btn); });
    });
  }

  async function action(btn) {
    var id = btn.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    if (act === 'private') {
      if (!confirm('이 기록을 비공개로 전환할까요? (공개 목록에서 사라져요)')) return;
      var r = await sb().from('book_records').update({ visibility: 'private' }).eq('id', id);
      if (r.error) { msg('전환 실패: ' + (r.error.message || '오류')); return; }
      msg('비공개로 전환했습니다.');
    } else if (act === 'del') {
      if (!confirm('이 기록을 soft delete 할까요? (목록에서 사라지고 작성자도 볼 수 없어요)')) return;
      var r2 = await sb().from('book_records').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (r2.error) { msg('삭제 실패: ' + (r2.error.message || '오류')); return; }
      msg('기록을 soft delete 했습니다.');
    }
    load();
  }

  function msg(t) {
    var el = document.getElementById('ar-msg');
    if (el) el.innerHTML = '' + esc(t);
  }

  function start() {
    // 공용 admin.js 의 탭 전환과 상호작용: records 탭을 열 때마다 새로고침
    var btn = document.querySelector('[data-tab="records"]');
    if (btn) btn.addEventListener('click', function () { setTimeout(load, 50); });
    // 이미 열려 있으면 한 번 로드
    if (btn && btn.classList.contains('active')) load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();