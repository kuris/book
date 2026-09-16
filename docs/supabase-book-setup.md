# 독서야 놀자(book) Supabase 설정

독서야 놀자는 기존 chatgpts.kr 계열(한자/단어/역사/운세/마인드/직장인/돈/문서/말씀/마음)과 **같은 Supabase 프로젝트**를 공유합니다.

- 프로젝트: `ybhiznlelnpwaicyoifa`
- 데이터: `public.book_records` (전용 스키마를 만들지 않습니다)
- 계정: `auth.users` (공통)

> 왜 전용 스키마(`book.*`)를 안 쓰나요?
> 공통 로그인 모듈 `cg-auth.js` 의 기록 헬퍼(`saveRecord/listRecords/...`)가 `public` 스키마를
> 기본으로 합니다. 전용 스키마를 만들면 별도 Supabase 클라이언트가 필요해지고, 같은 storageKey 로
> 두 클라이언트를 만들면 토큰 갱신이 충돌합니다. 그래서 최신 형제 서비스(성경아 놀자 등)처럼
> **public + 서비스 접두사 테이블**을 씁니다. 아무 설정도 필요 없습니다.

---

## 1. SQL 실행 (Supabase > SQL Editor)

다음을 **번호 순서대로** 실행합니다. (중복 실행 안전)

| 순서 | 파일 | 내용 |
|---|---|---|
| 1 | `play_project/_shared/sql/01-profiles.sql` | 공통 `public.profiles` · 관리자 지정 · 가입 트리거 |
| 2 | `_shared/sql/02-entitlements.sql` | `user_entitlements` · `cg_is_admin()` 등 |
| 3 | `_shared/sql/03-records.sql` | 다른 서비스 기록 테이블 (책은 아님) |
| 4 | `_shared/sql/04-rls.sql` | 공통 RLS · 권한 상승 차단 |
| 5 | `_shared/sql/05-recent.sql` | `cg_recent` · 최근 이력 |
| 6 | `_shared/sql/06-service-extras.sql` | `cg_touch_updated_at()` 등 (책이 재사용) |
| 7 | `_shared/sql/08-book.sql` | **`public.book_records` 생성 · RLS · 권한** |

`08-book.sql` 사본이 `book/supabase/migrations/001_book_schema.sql` 에 있습니다 (원본은 `_shared/sql/08-book.sql`).
`07-bible.sql` 은 성경아 놀자 전용이라 책 서비스에는 필요 없습니다.

---

## 2. `08-book.sql` 이 생성하는 것

### 테이블 `public.book_records`

제약:
- `title` 은 **빈 문자열 불가**
- `rating` 은 1~5 또는 null
- `reading_status` ∈ `want | reading | done | paused`
- `visibility` ∈ `private | public`
- `deleted_at` 이 null 이 아닌 행은 **목록 조회에서 제외** (soft delete)

인덱스: `user_id+created_at`, 공개 최신순, 상태, 읽은 날짜, 카테고리.

### RLS 정책

| 정책 | 대상 | 동작 |
|---|---|---|
| `cg_book_records_public` | select (anon, authenticated) | `visibility='public'` and `deleted_at is null` → 누구나 |
| `cg_book_records_own` | all (authenticated) | `auth.uid() = user_id` → **작성자만 전권** |
| `cg_book_records_select_admin` | select | `public.cg_is_admin()` → 관리자 전체 조회 |
| `cg_book_records_update_admin` | update | 관리자만 **비공개 전환 / soft delete** 가능 |

### 그 외

- `updated_at` 자동 갱신 트리거 `book_records_touch` (06 의 `cg_touch_updated_at()` 재사용)
- 권한: `anon`=select, `authenticated`=select/insert/update/delete, `service_role`=all

---

## 3. 서비스 가입 (`public.service_members`)

`public.service_members` 는 이미 존재하는 공통 테이블(migration-service-members.sql)입니다.
책 서비스도 **첫 이용 시** 클라이언트(`js/book-sync.js` 의 `ensureMembership`)가 upsert 합니다.

```sql
insert into public.service_members (user_id, service, last_seen_at)
values (auth.uid(), 'book', now())
on conflict (user_id, service) do update set last_seen_at = now(), updated_at = now();
```

- RLS(`members_join_own`)가 `auth.uid() = user_id` 인 행만 허용하므로 위조가 불가능합니다.
- 기존 이용자 소급 등록(운영용, service_role)이 필요하면:
  ```sql
  insert into public.service_members (user_id, service)
  select distinct user_id, 'book' from public.book_records
  on conflict (user_id, service) do nothing;
  ```

---

## 4. API Exposed schemas

`public.book_records` 는 **public 스키마**에 있으므로 추가 설정이 필요 없습니다.
(만약 전용 스키마를 썼다면 Settings > API > Exposed schemas 에 추가해야 하지만, 이 프로젝트는 쓰지 않습니다.)

---

## 5. 실행 후 확인

```sql
select count(*) from public.book_records;
select visibility, count(*) from public.book_records group by 1;
select service, count(*) from public.page_views group by 1 order by 1;
select service, count(*) from public.service_members group by 1 order by 1;
```

로그인 후 확인:
```sql
select public.cg_is_admin();   -- 관리자 계정으로 로그인 상태에서 true
```

---

## 6. 관리자 지정

관리자 판정은 `public.profiles.role = 'admin'` (폴백 이메일 `phiskim@gmail.com`).

```sql
update public.profiles set role = 'admin', updated_at = now()
 where email = '관리자이메일@example.com';
```

관리자 페이지(`admin.html`)의 **독서기록 관리** 탭에서 전체 건수, 최근 기록, 공개→비공개 전환, soft delete 작업이 가능합니다.

---

## 7. 배포 시 확인 사항

- 도메인 `book.chatgpts.kr` → 정적 호스팅 루트 `book/`
- Redirect URL: `https://book.chatgpts.kr/**`, `https://book.chatgpts.kr/login.html`
- 로그인은 공통 `cg-auth.js`(`data-service="book"`) 가 그대로 동작합니다.