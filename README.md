# 📚 독서야 놀자! (book.chatgpts.kr)

책 읽고 기록하는 어린이 독서장. 로그인한 사용자가 자신의 독서기록을 작성·조회·수정·삭제하고, 나만의 독서 통계를 볼 수 있는 정적 웹앱입니다.

> **AI 기능이 없습니다.** 여기서 말하는 "프롬프트/작성 가이드" 는 AI 가 아니라
> 기록을 쉽게 쓰도록 돕는 **정적 질문과 독서 템플릿**입니다. 어떤 작성 내용도 네트워크로 전송되지 않습니다.

## 주요 기능

- **독서기록 작성** — 책 제목(필수)·저자·출판사·ISBN·카테고리·독서 상태·날짜·별점(1~5)·한 줄 느낌·줄거리·기억에 남는 문장·느낀 점·배운 점·나에게 적용할 점·좋아하는 인물·읽고 난 뒤 질문
- **작성 가이드(비-AI)** — `js/prompts.js` 의 정적 질문/독후감 템플릿, 클릭 한 번으로 인용 삽입
- **내 기록** — 상태·공개 여부 필터, 제목/저자/한 줄 검색, 정렬, 수정·삭제
- **상세 보기 / 권한** — public 은 누구나, private 는 작성자만 (RLS 가 강제)
- **공개 기록** — 비로그인 포함 누구나 최신 공개 기록 탐색
- **통계** — 카테고리/상태 막대, 평균 별점, 최근 기록 (CSS 카드/바 차트, 차트 라이브러리 없음)
- **Google 로그인** — 공통 `cg-auth.js` 재사용 (이메일/비밀번호 등 없음)

## 프로젝트 구조

```
book/
├── index.html · public.html · records.html · write.html
├── view.html · stats.html · login.html · admin.html
├── css/  style.css · cg-auth.css(복사본) · admin.css(복사본)
├── js/
│   ├── supabase-config.js      상수 (url/key/storageKey)
│   ├── cg-auth.js              공통 로그인 모듈 (복사본, 직접 수정 금지)
│   ├── book-data.js            상태/카테고리/별점/정렬 정적 데이터
│   ├── book-sync.js            기록 CRUD 공통 계층 (public.book_records)
│   ├── prompts.js              정적 작성 가이드(비-AI)
│   ├── nav.js · main.js · records.js · write.js · view.js
│   ├── stats.js · public.js · login.js
│   ├── cg-ads.js · track.js    광고 조건부 로딩 · 화면 조회 로그
│   ├── supabase-admin-client.js · admin.js(공용 템플릿) · admin-records.js
├── docs/  supabase-book-setup.md · google-login-setup.md
├── supabase/migrations/001_book_schema.sql   (= _shared/sql/08-book.sql 복사본)
└── vercel.json · robots.txt · sitemap.xml · ads.txt
```

## 실행 방법

정적 HTML/CSS/JS 단독 배포라 빌드 과정이 없습니다. 로컬에서 그냥 띄우면 됩니다.

```bash
cd book
python3 -m http.server 8070      # http://localhost:8070
# 또는 npx serve . / Vercel 등 원하는 정적 서버
```

> ⚠ `file://` 로 열지 마세요. Supabase/Google OAuth 리다이렉트가 동작하지 않아 로그인이 안 됩니다.

## Supabase 설정

같은 Supabase 프로젝트(`ybhiznlelnpwaicyoifa`)를 공유하고, 데이터는 `public.book_records` 테이블 하나에 담습니다.

Supabase 대시보드 > SQL Editor 에서 아래를 **순서대로** 실행합니다.

1. `play_project/_shared/sql/` **01~06** (이미 다른 놀자 서비스용으로 실행됐다면 건너뜀)
2. `book/supabase/migrations/001_book_schema.sql` (원본 `_shared/sql/08-book.sql`)

`001_book_schema.sql` 이 하는 일:
- `public.book_records` 테이블 + 제약(빈 제목 금지, 별점 1~5, 상태/공개 enum) + 인덱스
- RLS 활성화 + 4개 `cg_` 정책(공개 조회 / 본인 전권 / 관리자 조회 / 관리자 비공개 전환)
- `updated_at` 자동 갱신 트리거(공용 `cg_touch_updated_at()` 재사용)
- 권한 부여(anon=select, authenticated=전체, service_role=전체)

### Google 로그인 Redirect URL (Supabase → Authentication → URL Configuration)

```
https://book.chatgpts.kr/**
https://book.chatgpts.kr/login.html
http://localhost:*/**
```

Google Cloud OAuth 클라이언트의 **승인된 리디렉션 URI**는 사이트가 아니라
`https://ybhiznlelnpwaicyoifa.supabase.co/auth/v1/callback` 하나입니다 (자세한 건 docs/google-login-setup.md).

## 데이터 모델 · RLS

`public.book_records`

| 필드 | 설명 |
|---|---|
| `title` (필수) | 책 제목 |
| `author` · `publisher` · `isbn` · `category` | 도서 정보 |
| `reading_status` | `want`(읽고 싶은 책) / `reading` / `done` / `paused` |
| `started_at` · `finished_at` · `reading_date` | 날짜 (date) |
| `rating` | 1~5 또는 null |
| `one_line_review` · `summary` · `memorable_sentence` · `feeling` · `learned` · `action_plan` · `favorite_character` · `question_after_reading` | 본문 |
| `visibility` | `private`(기본) / `public` |
| `deleted_at` | soft delete — null 이 아닌 행은 목록에서 제외 |

RLS 요약:
- `public` 기록은 **누구나** select (anon 포함)
- `private` 기록은 **작성자만**
- insert/update/delete 는 `auth.uid() = user_id` 인 행만
- 관리자(`profiles.role='admin'`, 폴백 `phiskim@gmail.com`)는 전체 조회 + 비공개 전환/soft delete
- 삭제는 실제 delete 가 아니라 `deleted_at = now()`

## 보안

- 데이터 보호는 **프론트 코드가 아니라 Supabase RLS**가 담당합니다.
- 뷰 시간에 모든 사용자 입력을 **HTML escape** 하여 XSS 를 방지합니다.
- query string `id` 는 검증 없이 그대로 조회하되, 비공개 기록은 RLS 로 차단됩니다.
- 별점은 1~5 로, 빈 제목은 DB 제약으로 거부합니다.

## 배포 (book.chatgpts.kr)

- 정적 호스팅 루트 = `book/` 폴더 (Vercel 등)
- `vercel.json` 에 cleanUrls(위생 URL), `/admin` → `admin.html`, 보안 헤더, 정적 자산 캐시가 이미 정의돼 있습니다.
- 도메인 `book.chatgpts.kr` 을 호스팅에 연결한 뒤, Supabase Redirect URL 과 Google OAuth JavaScript origin 에 `https://book.chatgpts.kr` 을 추가하세요.
- `ads.txt` 는 형제 서비스와 동일한 AdSense 계정입니다.

## 관리자 (admin.html)

- 판정: `public.profiles.role = 'admin'` (폴백 `phiskim@gmail.com`)
- 탭: 화면 조회수 · **독서기록 관리** · 회원 · 화면별 통계 · 콘텐츠 · 시스템/SQL
- **독서기록 관리**: 전체/공개/비공개/삭제 건수, 최근 100건, 부적절한 공개 기록을 비공개 전환 또는 soft delete

## 향후 작업

- 부모/교사용 독서 지도 공간
- 좋아요/조회수 등 커뮤니티 요소
- 공유 카드(OGP) 이미지 생성