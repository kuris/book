/* ============================================================
   독서야 놀자 (book) - 독서 상태 · 카테고리 · 별점 등 정적 데이터 (book-data.js)
   의존성: 없음 (전역 window.BookData)
   ============================================================ */
(function (global) {
  'use strict';

  var BookData = {
    service: 'book',

    // 독서 상태
    statuses: [
      { value: 'want',    label: '읽고 싶은 책', emoji: '📌' },
      { value: 'reading', label: '읽는 중',     emoji: '📖' },
      { value: 'done',    label: '다 읽음',     emoji: '✅' },
      { value: 'paused',  label: '잠시 멈춤',   emoji: '⏸️' }
    ],

    // 공개 여부
    visibilities: [
      { value: 'private', label: '비공개 · 나만 보기', emoji: '🔒' },
      { value: 'public',  label: '공개 · 누구나 보기',  emoji: '🌍' }
    ],

    // 카테고리 (draw 아래에서 정적 select 로 사용)
    categories: [
      '그림책', '동화', '문학', '역사', '과학', '인물', '자기계발', '경제', '기타'
    ],

    // 별점
    ratings: [
      { value: 5, label: '⭐⭐⭐⭐⭐' },
      { value: 4, label: '⭐⭐⭐⭐' },
      { value: 3, label: '⭐⭐⭐' },
      { value: 2, label: '⭐⭐' },
      { value: 1, label: '⭐' }
    ],

    // 정렬 옵션 (기록 목록)
    sorts: [
      { value: 'created_at_desc',   label: '최신순',     column: 'created_at',   ascending: false },
      { value: 'reading_date_desc', label: '읽은 날짜순', column: 'reading_date', ascending: false },
      { value: 'rating_desc',       label: '별점 높은순', column: 'rating',       ascending: false },
      { value: 'rating_asc',        label: '별점 낮은순', column: 'rating',       ascending: true },
      { value: 'title_asc',         label: '제목순',      column: 'title',       ascending: true }
    ],

    // 상태별 목록 구성 (필터 생성용)
    statusFilters: function () {
      return [{ value: 'all', label: '전체', emoji: '🗂️' }].concat(this.statuses);
    },

    // ---------- 도우미 ----------
    escapeHtml: function (str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    statusOf: function (value) {
      var s = this.statuses.filter(function (x) { return x.value === value; })[0];
      return s || { value: value, label: value, emoji: '❔' };
    },
    visibilityOf: function (value) {
      var v = this.visibilities.filter(function (x) { return x.value === value; })[0];
      return v || { value: value, label: value, emoji: '' };
    },
    stars: function (r) {
      r = Number(r) || 0;
      if (r < 1 || r > 5) return '';
      return '⭐'.repeat(r);
    },
    dateOf: function (dateStr) {
      if (!dateStr) return '';
      return String(dateStr).slice(0, 10);
    },

    // Supabase 필터용 (deleted_at 이 null 인 활성 기록만)
    activeFilter: function (q) {
      return q.is('deleted_at', null);
    }
  };

  global.BookData = BookData;
})(typeof window !== 'undefined' ? window : this);