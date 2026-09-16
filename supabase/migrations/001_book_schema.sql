-- ============================================================
-- 독서야 놀자 (book) 기록 테이블 — _shared/sql/08-book.sql 의 복사본
-- 직접 수정하지 말고 <play_project>/_shared/sql/08-book.sql 에서 고친 뒤 복사하세요.
-- 실행: Supabase > SQL Editor (01~06 먼저 실행 필요)
-- ============================================================
-- ============================================================
-- [08] 독서야 놀자 (book) 기록 테이블
--
--  실행 대상 : Supabase 대시보드 > SQL Editor
--  ※ 01~06 을 먼저 실행하세요.
--     (06 에서 만든 public.cg_touch_updated_at() 와 02 의 public.cg_is_admin() 재사용)
--  ※ drop table / truncate / delete 가 하나도 없습니다.
--    기존 정책도 삭제하지 않고 'cg_' 접두사 정책만 새로 만듭니다.
--    여러 번 실행해도 안전합니다.
--
--  [스키마를 따로 만들지 않은 이유]
--    이 프로젝트의 최신 서비스(bible 등)는 전용 스키마 대신
--    "public 스키마 + 서비스 접두사 테이블" 을 씁니다.
--    공통 모듈(cg-auth.js)의 기록 헬퍼(saveRecord/listRecords/deleteRecord)가
--    public 스키마를 기본으로 하기 때문에, 전용 스키마를 만들면 별도 클라이언트가
--    필요해지고 같은 storageKey 로 두 클라이언트를 만들면 토큰 갱신이 충돌합니다.
--
--  [추가 SQL 이 필요 없는 것들]
--    · 로그인/프로필 → public.profiles          (01 에서 생성 완료)
--    · 구독/광고제거 → public.user_entitlements (02 에서 생성 완료)
--    · 최근 본 기록   → public.cg_recent        (05, service='book')
--    · 방문 통계      → public.page_views       (기존 테이블, service='book')
--    · 서비스 가입    → public.service_members  (기존 테이블, service='book') — 첫 이용 시 클라이언트에서 upsert
-- ============================================================

-- ---------- 1) 테이블 생성 ----------
create table if not exists public.book_records (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  title                  text not null,
  author                 text,
  publisher              text,
  isbn                   text,
  category               text,
  reading_status         text not null default 'done',   -- want | reading | done | paused
  started_at             date,
  finished_at            date,
  reading_date           date,
  rating                 int,                            -- 1~5 또는 null
  one_line_review        text,
  summary                text,
  memorable_sentence     text,
  feeling                text,
  learned                text,
  action_plan            text,
  favorite_character     text,
  question_after_reading text,
  visibility             text not null default 'private',-- private | public
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz                     -- soft delete (null = 삭제 안 됨)
);

-- ---------- 2) 제약 (기존에 이미 만들어진 경우에도 안전하게 추가) ----------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'book_records_title_not_blank') then
    alter table public.book_records
      add constraint book_records_title_not_blank check (length(btrim(title)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'book_records_rating_range') then
    alter table public.book_records
      add constraint book_records_rating_range check (rating is null or (rating between 1 and 5));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'book_records_reading_status_check') then
    alter table public.book_records
      add constraint book_records_reading_status_check
        check (reading_status in ('want', 'reading', 'done', 'paused'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'book_records_visibility_check') then
    alter table public.book_records
      add constraint book_records_visibility_check
        check (visibility in ('private', 'public'));
  end if;
end $$;

-- ---------- 3) 인덱스 ----------
create index if not exists book_records_user_idx
  on public.book_records (user_id, created_at desc) where deleted_at is null;
create index if not exists book_records_public_idx
  on public.book_records (created_at desc) where visibility = 'public' and deleted_at is null;
create index if not exists book_records_status_idx
  on public.book_records (user_id, reading_status) where deleted_at is null;
create index if not exists book_records_reading_date_idx
  on public.book_records (user_id, reading_date desc nulls last) where deleted_at is null;
create index if not exists book_records_category_idx
  on public.book_records (user_id, category);

-- ---------- 4) 설명 ----------
comment on table  public.book_records is '독서야 놀자 독서 기록';
comment on column public.book_records.reading_status is 'want | reading | done | paused';
comment on column public.book_records.visibility      is 'private(나만) | public(공개)';
comment on column public.book_records.deleted_at      is 'soft delete — null 이 아닌 행은 기본 목록에서 제외';

-- ---------- 5) RLS ----------
alter table public.book_records enable row level security;

-- ① 공개 기록은 누구나(비로그인 포함) 조회
drop policy if exists cg_book_records_public on public.book_records;
create policy cg_book_records_public on public.book_records
  for select to anon, authenticated
  using (visibility = 'public' and deleted_at is null);

-- ② 본인 기록은 전권 (작성 / 수정 / soft delete)
drop policy if exists cg_book_records_own on public.book_records;
create policy cg_book_records_own on public.book_records
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ③ 관리자는 전체 조회
drop policy if exists cg_book_records_select_admin on public.book_records;
create policy cg_book_records_select_admin on public.book_records
  for select using (public.cg_is_admin());

-- ④ 관리자는 부적절한 공개 기록을 비공개로 전환 가능 (운영 조치)
drop policy if exists cg_book_records_update_admin on public.book_records;
create policy cg_book_records_update_admin on public.book_records
  for update using (public.cg_is_admin()) with check (public.cg_is_admin());

-- ---------- 6) updated_at 자동 갱신 (06 에서 만든 공용 함수 재사용) ----------
drop trigger if exists book_records_touch on public.book_records;
create trigger book_records_touch
  before update on public.book_records
  for each row execute function public.cg_touch_updated_at();

-- ---------- 7) 권한 ----------
grant usage on schema public to anon, authenticated, service_role;
grant select on table public.book_records to anon;
grant select, insert, update, delete on table public.book_records to authenticated;
grant all    on table public.book_records to service_role;

-- ---------- 8) 서비스 가입(service_members) ----------
--    public.service_members 는 이미 존재하는 공통 테이블입니다 (migration-service-members.sql).
--    계정이 만들어졌다고 모든 서비스에 자동 가입되면 안 되므로,
--    book 서비스도 "첫 이용 시" 클라이언트에서 아래 형태로 upsert 합니다.
--      insert into public.service_members (user_id, service)
--      values (auth.uid(), 'book')
--      on conflict (user_id, service) do update set last_seen_at = now(), updated_at = now();
--    (RLS: members_join_own 정책이 auth.uid() = user_id 인 행만 허용)
--
-- 기존 이용자를 한 번에 소급 가입하려면 (운영용, service_role):
--    insert into public.service_members (user_id, service)
--    select distinct user_id, 'book' from public.book_records
--    on conflict (user_id, service) do nothing;

-- ---------- 9) 확인용 ----------
--  select count(*) from public.book_records;
--  select count(*) from public.book_records where visibility = 'public' and deleted_at is null;
--  select service, count(*) from public.page_views group by 1 order by 2 desc;
--  select service, count(*) from public.service_members group by 1 order by 1;