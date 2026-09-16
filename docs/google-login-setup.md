# 구글 로그인 연동 설정 가이드 (독서야 놀자)

독서야 놀자(book)는 **Google 로그인 하나만** 사용합니다. 코드는 이미 준비되어 있어
아래 설정만 마치면 헤더에 Google 로그인 버튼이 자동으로 나타납니다.

- 로그인 기능 위치: 공통 모듈 `js/cg-auth.js` (원본 `_shared/cg-auth.js`, **직접 수정 금지**)
- 로그인 버튼이 붙는 곳: 각 HTML 의 `.header-right` (`data-mount=".header-right"`)

> ⚠ 이 서비스는 같은 Supabase 계정을 쓰는 **기존 도메인들과 다른 도메인**(`book.chatgpts.kr`)이므로,
> Supabase 의 허용 리디렉션 주소에 book 주소를 **추가**해야 합니다. 추가하지 않으면 로그인 후 사이트로 돌아오지 못합니다.

## 준비물

| 항목 | 값 |
|---|---|
| Supabase 프로젝트 URL | `https://ybhiznlelnpwaicyoifa.supabase.co` |
| Supabase 콜백 URL | `https://ybhiznlelnpwaicyoifa.supabase.co/auth/v1/callback` |
| 서비스 주소(운영) | `https://book.chatgpts.kr` |
| 서비스 주소(로컬 테스트) | `http://localhost:8070` (쓰는 포트로 변경) |

> **Supabase 콜백 URL**을 구글에 등록해야 합니다. 우리 사이트 주소가 아닙니다.
> 구글 → Supabase → 우리 사이트 순서로 되돌아오는 구조이기 때문입니다.

---

## 1단계. 구글 클라우드 콘솔에서 OAuth 클라이언트 만들기

1. [Google Cloud Console](https://console.cloud.google.com/) 접속 → 프로젝트 선택(또는 새로 만들기)
2. **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부(External)**
   - 앱 이름: `독서야 놀자!` · 지원 이메일/개발자 연락처: 본인 이메일
   - 승인된 도메인: `chatgpts.kr`, `supabase.co`
   - 범위: 기본(`email`, `profile`, `openid`)
   - **테스트 모드**면 테스트 사용자(지메일)를 추가해 두세요. 상용 오픈 시 **게시(Publish)** 하면 됩니다.
3. **API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID** (유형: 웹 애플리케이션)
   - 승인된 JavaScript 원본:
     ```
     https://book.chatgpts.kr
     http://localhost:8070
     ```
   - 승인된 리디렉션 URI — ⭐ 가장 중요:
     ```
     https://ybhiznlelnpwaicyoifa.supabase.co/auth/v1/callback
     ```
4. 생성 후 **Client ID / Client Secret** 복사 → **절대 코드·저장소에 넣지 마세요.**

---

## 2단계. Supabase 에 Google provider 등록

1. [Supabase 대시보드](https://supabase.com/dashboard) → `ybhiznlelnpwaicyoifa`
2. **Authentication → Sign In / Providers → Google → Enable**
3. 1단계의 Client ID / Client Secret 를 입력하고 저장

### Redirect URL 등록 (중요)

**Authentication → URL Configuration**

| 항목 | 값 |
|---|---|
| Site URL | `https://book.chatgpts.kr` |
| Redirect URLs | `https://book.chatgpts.kr/**`<br>`https://book.chatgpts.kr/login.html`<br>`http://localhost:*/**` |

필요하면 기존 형제 서비스(`hanja.*` 등) 주소도 그대로 남겨 두세요. 각자 자기 페이지로 돌아옵니다.

---

## 3단계. 동작 확인

1. `https://book.chatgpts.kr/` 접속 → 헤더 오른쪽에 **Google로 로그인** 버튼이 보이는지 확인
2. 클릭 → 구글 계정 선택 → 사이트로 되돌아와 로그인 완료
3. 헤더에 닉네임/아바타가 표시되면 성공
4. 기록 쓰기(`write.html`)에서 내 기록 저장이 계정(`book_records`)에 되는지 확인

provider 가 실제로 켜졌는지 터미널로 확인:
```bash
curl -s https://ybhiznlelnpwaicyoifa.supabase.co/auth/v1/settings \
  -H "apikey: sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1" \
  | python3 -c "import json,sys; print('google:', json.load(sys.stdin)['external']['google'])"
```
`google: True` 가 나오면 준비 완료입니다.

---

## 자주 만나는 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| `redirect_uri_mismatch` | 구글 등록 리디렉션 URI 가 다름 | 끝에 `/auth/v1/callback` 이 정확한지 |
| 로그인 후 빈 화면/홈으로 이동 | Supabase Redirect URLs 에 `book.chatgpts.kr/**` 미등록 | 2단계 Redirect URLs 확인 |
| `Unsupported provider ...` | Supabase 에서 Google 꺼짐 | Enable 후 저장 |
| `403 access_denied` | 앱 테스트 모드인데 테스트 사용자 미등록 | 계정 추가 또는 앱 게시 |
| 닉네임이 이메일 앞부분으로 표시 | 구글 메타데이터 키 차이 | `public.profiles.nickname` 직접 수정 가능 |

## 참고

- 같은 이메일이면 Supabase 가 **같은 사용자**로 연결됩니다. 다른 놀자 서비스 기록과 별도로, book 기록은 `public.book_records` 에 `auth.users.id` 기준으로 저장됩니다.
- 세션 키는 `sb-book-auth-token` 로 분리되어 있어, 형제 서비스 세션과 충돌하지 않습니다(같은 브라우저에서 각자 로그인 가능).