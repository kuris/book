# 📚 독서야 놀자! - 책 읽고 기록하는 어린이 독서장

## 서비스 소개

"독서야 놀자!"는 사용자가 자신의 독서 기록을 작성, 조회, 수정, 삭제할 수 있는 웹 기반 독서 기록 앱입니다. 읽은 책에 대한 한 줄 느낌, 줄거리 요약, 기억에 남는 문장, 느낀 점 등 다양한 요소를 기록하며 자신만의 독서 습관을 만들어갈 수 있습니다. 특히 초등학생부터 성인까지 누구나 쉽게 사용할 수 있는 깔끔하고 따뜻한 디자인을 지향합니다.

**중요: 이 서비스에는 AI 기능이 없습니다.**
여기서 말하는 "프롬프트"는 AI 프롬프트가 아니라 사용자가 독서 기록을 더 쉽게 작성하도록 돕는 "작성 질문", "가이드 문구", "독서 템플릿"을 의미합니다.

## 주요 기능

- **독서 기록 작성:** 책 제목 (필수), 저자, 출판사, ISBN, 카테고리, 독서 상태, 시작일/완료일, 별점, 한 줄 느낌, 상세 내용 (줄거리, 느낀 점, 배운 점 등)을 기록합니다.
- **작성 가이드/템플릿:** AI가 아닌 정적인 질문 가이드와 템플릿을 제공하여 기록 작성을 돕습니다.
- **내 독서 기록:** 상태별 필터 (읽고 싶은 책, 읽는 중, 다 읽음, 잠시 멈춤), 공개 여부 필터, 검색, 정렬 기능이 있는 나만의 독서 기록 목록을 제공합니다.
- **독서 기록 상세 보기:** 개별 독서 기록의 상세 내용을 확인하고, 작성자 본인에 한해 수정 및 삭제가 가능합니다.
- **독서 통계:** 전체 기록 수, 독서 상태별 통계, 카테고리별 분포, 평균 별점 등 개인의 독서 패턴을 시각적으로 보여줍니다 (초기에는 간단한 카드/막대 그래프 형태).
- **로그인/계정 관리:** Google 로그인을 통해 간편하게 서비스를 이용할 수 있으며, 모든 기록은 사용자 계정에 안전하게 저장됩니다.
- **공개/비공개 설정:** 독서 기록의 공개 여부를 설정하여 다른 사용자와 공유하거나 자신만의 기록으로 보관할 수 있습니다.

## 프로젝트 구조

```
book/
├── css/
│   ├── style.css             # 서비스 고유 스타일
│   └── cg-auth.css           # 공통 인증 UI 스타일 (복사본)
├── js/
│   ├── cg-auth.js            # 공통 인증 모듈 (복사본)
│   ├── nav.js                # 메인 내비게이션 로직
│   ├── main.js               # index.html 메인 로직, 최근 공개 기록 로딩
│   ├── book-data.js          # 독서 상태, 카테고리 등 정적 데이터
│   ├── prompts.js            # 독서 기록 작성 가이드 질문/템플릿
│   ├── records.js            # records.html (내 기록 목록) 로직
│   ├── write.js              # write.html (기록 작성/수정) 로직
│   ├── view.js               # view.html (기록 상세 보기) 로직
│   └── stats.js              # stats.html (독서 통계) 로직
├── docs/
│   ├── supabase-book-setup.md  # Supabase 스키마 및 RLS 설정 문서
│   └── google-login-setup.md   # Google 로그인 설정 가이드 문서
├── supabase/
│   └── migrations/
│       └── 001_book_schema.sql # book 스키마 및 records 테이블 생성 SQL
├── index.html                # 메인 페이지
├── records.html              # 내 독서 기록 목록
├── write.html                # 독서 기록 작성/수정
├── view.html                 # 독서 기록 상세 보기
├── stats.html                # 독서 통계
├── login.html                # 로그인 페이지
├── admin.html                # 관리자 페이지 (최소 기능)
├── README.md                 # 프로젝트 설명
└── ads.txt                   # 광고 관련 파일
```

## 실행 방법

이 프로젝트는 정적 HTML/CSS/JS 파일로 구성되어 있으며, 별도의 빌드 과정 없이 웹 서버에 배포하여 바로 실행할 수 있습니다.

1.  **파일 복사:** `book` 폴더 전체를 웹 서버 (예: Nginx, Apache)의 문서 루트 또는 서브 디렉토리에 복사합니다.
2.  **Supabase 설정:** 아래 "Supabase 설정 방법"을 참고하여 Supabase 프로젝트를 설정합니다.
3.  **브라우저 접속:** 웹 서버를 통해 `index.html`에 접속합니다.

## Supabase 설정 방법

"독서야 놀자!" 서비스는 기존 chatgpts.kr 프로젝트의 Supabase 인스턴스를 공유하며, `book` 스키마를 사용하여 데이터가 분리됩니다. `auth.users` 테이블은 공통으로 사용합니다.

### 1. `book` 스키마 생성 및 테이블 설정

`book/supabase/migrations/001_book_schema.sql` 파일을 사용하여 Supabase 데이터베이스에 `book` 스키마와 `records` 테이블을 생성하고 RLS 정책을 설정합니다. Supabase CLI를 사용하여 마이그레이션을 적용하는 것을 권장합니다.

```bash
supabase db diff --schema book > supabase/migrations/001_book_schema.sql
supabase migration up
```

또는 Supabase Studio SQL 편집기에서 `001_book_schema.sql` 내용을 직접 실행합니다.

**필수 작업:**

- `book` 스키마 생성
- `book.records` 테이블 생성 및 필드 정의
- `book.records` 테이블에 RLS (Row Level Security) 활성화
- `auth.users` 테이블과 `user_id` 외래키 연결 (`ON DELETE CASCADE`)
- 본인 데이터만 `INSERT`/`UPDATE`/`DELETE` 가능한 정책 정의
- `private` 기록은 작성자만, `public` 기록은 누구나 `SELECT` 가능한 정책 정의
- `public.service_members` 테이블에 `service='book'` 가입 처리 로직 (필요시 SQL 추가)
- `updated_at` 필드 자동 갱신 트리거/함수 (`handle_updated_at` 등 기존 프로젝트에서 재사용)

### 2. Google 로그인 Redirect URL 설정

Supabase 프로젝트 설정에서 Authentication -> URL Configuration 에 다음 Redirect URL을 추가해야 합니다.

- `https://book.chatgpts.kr/`
- `https://book.chatgpts.kr/login.html`

로컬 개발 환경에서는 `http://localhost:5500/book/` (또는 개발 서버 포트)도 추가할 수 있습니다.

### 3. Supabase API Exposed schemas 설정

Supabase 프로젝트 설정 -> API -> API Settings -> Exposed schemas에 `book`을 추가하여 `book` 스키마의 테이블에 Supabase 클라이언트를 통해 접근할 수 있도록 허용해야 합니다.

### 4. `CGAuth` 모듈 설정

`book/js/cg-auth.js`는 `_shared/cg-auth.js`의 복사본이며, `data-service="book"` 속성을 통해 "독서야 놀자!" 서비스임을 명시합니다. 이 모듈은 Supabase 클라이언트 초기화 및 인증 처리를 담당합니다.

## 배포 도메인

이 서비스는 `book.chatgpts.kr` 도메인으로 배포될 예정입니다.

## 광고 관련

`ads.txt` 파일은 웹 사이트의 광고 수익화를 위해 사용될 수 있습니다. 필요에 따라 내용을 업데이트할 수 있습니다.

## 향후 계획

- `admin.html` 기능 확장
- 더 다양한 통계 및 시각화 기능 추가
- 독서 커뮤니티 기능 (예: 팔로우, 댓글) 고려
