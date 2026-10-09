# 게임 기록 웹 — 학습 기록장

이 문서는 "왜 이 기술을 썼는지", "각 폴더/파일이 무슨 역할을 하는지"를 나중에 다시 봐도 이해할 수 있게 정리한 학습용 기록입니다. 매일 작업 내용을 적는 `note/` 폴더의 일지와는 다른, 프로젝트 구조 자체에 대한 레퍼런스 문서입니다.

---

## 1. 이 프로젝트는 뭔가

직접 플레이했거나 플레이하고 싶은 게임을 기록하는 웹앱입니다. 게임 제목만 넣으면 RAWG/Steam API가 커버 이미지, 장르, 플랫폼, 출시일, 평점, 가격, 소개글, 트레일러까지 자동으로 채워주고, 나머지(내가 언제 시작했는지, 몇 시간 했는지, 내 평점)는 직접 입력합니다. 전체 화면이 비밀번호 로그인 뒤에 있어서, 나만 보고 쓰는 개인용 기록장입니다.

---

## 2. 기술 스택 — 뭘 썼고 왜 썼는지

### Next.js (프레임워크)

React만으로 웹앱을 만들면 라우팅(주소별로 다른 화면 보여주기), 서버/클라이언트 코드 분리, 번들러 설정을 전부 직접 해야 합니다. Next.js는 이걸 전부 대신 해주는 **React 프레임워크**입니다.

- **파일 기반 라우팅(App Router)**: `src/app/games/new/page.tsx` 파일을 만들면 그 자체로 `/games/new` 주소가 생깁니다. 폴더 이름이 그대로 주소가 됩니다. `[id]`처럼 대괄호가 붙은 폴더는 "여기엔 아무 값이나 들어올 수 있다"는 뜻(동적 라우팅)이라, `src/app/games/[id]/page.tsx`는 `/games/아무id` 전부를 처리합니다.
- **서버 컴포넌트**: `page.tsx` 파일들은 기본적으로 **서버에서만 실행**됩니다. 그래서 `async function HomePage()`처럼 함수에 `async`를 붙이고 그 안에서 바로 `await clientPromise`로 MongoDB에 접근할 수 있습니다. 이 코드는 브라우저로 내려가지 않고 서버에서 실행된 **결과 HTML만** 브라우저로 전달되기 때문에, DB 접속 정보나 쿼리 로직이 브라우저에 노출되지 않습니다.
- **API 라우트**: `src/app/api/.../route.ts` 파일들이 바로 백엔드 API입니다. Express 같은 별도 백엔드 서버를 안 만들어도, 같은 Next.js 프로젝트 안에서 `GET`/`POST`/`PUT`/`DELETE`/`PATCH` 함수를 내보내는(export) 것만으로 `/api/games` 같은 엔드포인트가 생깁니다.
- **Middleware**: `src/middleware.ts`는 모든 요청이 실제 페이지/API에 도달하기 **전에** 먼저 실행되는 코드입니다. 로그인 여부를 한 곳에서 검사하기 딱 좋은 위치입니다. (처음엔 "쓰기 API만" 막다가, 나중에 "전체 화면"을 막는 구조로 바뀌었습니다 — 아래 4-1절 참고.)
- **`router.push` vs `router.replace`**: 둘 다 다른 페이지로 이동시키지만, `push`는 브라우저 히스토리에 **새 기록을 쌓고**, `replace`는 **현재 기록을 덮어씁니다**. 폼을 제출해서 성공한 뒤에는 `replace`를 써야, 뒤로가기를 눌렀을 때 이미 제출 끝난 폼 화면으로 돌아가지 않습니다. 반대로 "폼 취소하고 원래 보던 화면으로" 같은 경우엔 `router.back()`(브라우저 뒤로가기와 동일)을 써서, 목록의 필터/정렬 상태 같은 게 그대로 유지되게 합니다.

### React (UI 라이브러리)

화면을 "컴포넌트"라는 작은 조각으로 나눠서 만들고, 데이터(state)가 바뀌면 화면이 자동으로 다시 그려지는 라이브러리입니다. Next.js는 내부적으로 React를 사용합니다.

- **`'use client'`**: 파일 맨 위에 이 문자열이 있으면 그 컴포넌트는 **브라우저에서** 동작합니다 (클릭, 입력 같은 상호작용이 필요하니까). `GameForm.tsx`, `GameFilterForm.tsx`, `GameConsoleCard.tsx`, `GameSummary.tsx`, `HlsVideo.tsx`, `ScreenshotPanel.tsx`, `GameCard.tsx`, `LogoutButton.tsx`, `BackButton.tsx`, `DeleteGameButton.tsx`, `src/app/login/page.tsx`가 여기 해당합니다. 반대로 이게 없는 `page.tsx`들은 서버 컴포넌트입니다.
- **`useState`**: 컴포넌트 안에서 "지금 입력창에 뭐가 들어있는지", "지금 업로드 중인지", "지금 트레일러 보기/소개글 보기 중 뭘 보고 있는지" 같은 **값이 바뀌면 화면도 같이 바뀌어야 하는 데이터**를 다룰 때 씁니다.
- **`useRef`**: `useState`와 다르게, 값이 바뀌어도 **화면을 다시 안 그려도 되는 데이터**를 담아둘 때 씁니다 (`GameForm.tsx`의 `pendingFiles`처럼, 아직 안 올린 파일 목록을 기억만 해두면 되는 경우. `HlsVideo.tsx`의 `videoRef`처럼, DOM 엘리먼트 자체를 직접 붙잡아야 하는 경우도 `useRef`를 씀).
- **`useEffect`**: 화면이 그려진 *뒤에* 한 번 실행해야 하는 부수효과(side effect)를 담당합니다. `ScreenshotPanel.tsx`에서 사진이 세로인지 가로인지 `new Image()`로 미리 로드해서 확인하는 것, `HlsVideo.tsx`에서 `<video>` 엘리먼트에 HLS 플레이어를 연결하는 것이 여기 해당합니다.

### TypeScript (타입이 있는 JavaScript)

JavaScript에 "타입"이라는 규칙을 추가한 언어입니다. 코드를 실행하기 **전에** "이 자리엔 숫자가 와야 하는데 문자열이 들어왔네?" 같은 실수를 미리 잡아줍니다(`npx tsc --noEmit`으로 확인).

- `interface Game { ... }`(`src/types/game.ts`)처럼 "게임 기록 데이터는 반드시 이런 모양이다"를 한 곳에 선언해두면, 그 타입을 쓰는 모든 파일(폼, API, 화면)에서 똑같은 모양을 강제할 수 있습니다.
- `status: GameStatus`처럼 아예 "'하고싶음' | '하는중' | '클리어' | '중단' 중 하나만 가능"으로 못박아두면, 오타("하는즁" 같은)가 아예 컴파일이 안 되어 잡힙니다.
- **타입은 "빌드가 되는지"만 보장하지, "로직이 맞는지"까지 보장해주진 않습니다.** 예를 들어 `page.tsx`에서 `Game` 타입을 쓰면서 import를 빠뜨리면 `tsc`가 바로 잡아주지만, `<input type="data">`처럼 문자열 자체가 틀린 실수(의도한 "date"가 아니라 "data")는 타입 체크를 통과해버립니다 — 둘 다 타입스크립트가 전부 막아주는 게 아니라는 걸 몸으로 겪은 사례입니다. 그래서 `npx tsc --noEmit`과 실제 화면 확인(또는 코드 리뷰)을 같이 해야 합니다.

### Tailwind CSS (스타일링)

보통은 CSS 파일을 따로 만들고 클래스 이름(`.card`, `.button-primary` 등)을 짓고 그 안에 스타일을 적는데, Tailwind는 **미리 정의된 유틸리티 클래스를 HTML(JSX)에 바로 붙여서** 스타일을 완성하는 방식입니다.

```tsx
className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-2 text-sm font-medium"
```

- `tailwind.config.ts`의 `content` 배열에 적힌 경로들만 뒤져서, 그 안에서 실제로 글자로 등장하는 클래스 이름만 최종 CSS로 만들어 냅니다(안 쓰는 클래스까지 다 만들면 CSS 용량이 커지니까요).
- **직접 겪은 버그**: `STATUS_STYLES`(상태별 배지 색)를 `src/types/game.ts`에 데이터 형태로 선언해두고, 컴포넌트에서는 `STATUS_STYLES[game.status]`처럼 **변수로** 꺼내 썼습니다. 그런데 `tailwind.config.ts`의 `content`에는 `pages`/`components`/`app` 폴더만 적혀 있고 `types` 폴더가 빠져 있었습니다. `bg-sky-100`, `text-sky-700` 같은 글자 자체가 스캔 대상 파일 어디에도 "문자 그대로" 존재하지 않으니, Tailwind가 이 클래스들을 아예 CSS로 만들어주지 않았고, 그 결과 상태 배지의 배경/글자색이 통째로 빠져서 거의 안 보이게 됐습니다. **교훈**: Tailwind 클래스 문자열을 컴포넌트가 아닌 다른 폴더(`types`, `lib` 등)에 두면, 그 폴더도 `content`에 넣어줘야 합니다. (지금은 `content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]`처럼 `src` 전체를 보게 해서 이 문제가 다시 생기지 않게 해뒀습니다.)
- 동적으로 클래스 이름을 문자열 조합(`` `bg-${color}-100` ``)해서 만들면 같은 이유로 Tailwind가 못 찾습니다. 그래서 `page.tsx`의 `COLS_CLASS`(목록 한 줄에 몇 개 보여줄지)처럼, 가능한 값마다 **완성된 클래스 문자열을 미리 다 적어둔 매핑 객체**를 쓰는 패턴을 반복해서 쓰고 있습니다.

### MongoDB Atlas (데이터베이스)

MySQL 같은 "관계형 DB"는 미리 테이블과 칼럼을 딱 정해놓고 써야 합니다. MongoDB는 "문서형(NoSQL)" DB라서, JSON과 비슷하게 자유로운 모양의 데이터를 그냥 저장합니다.

- 왜 이 프로젝트에 맞는가: 이 프로젝트는 만들면서 계속 데이터 모양이 바뀌었습니다 — 장르가 하나(`genre`)였다가 여러 개(`genres`)로, 스크린샷이 문자열 배열이었다가 `{url, note}` 객체 배열로, RAWG 필드(`coverImage`, `releaseDate` 등)와 `sourceUrl`(소개글 원본 링크)이 나중에 추가됐습니다. 관계형 DB였으면 매번 "마이그레이션"을 해야 하는데, MongoDB는 새 필드를 그냥 추가해서 저장하면 끝입니다.
- 단점도 있습니다: 예전에 저장된 문서엔 새 필드가 아예 없을 수 있어서, 코드가 "이 필드가 없으면 기본값을 쓴다" 같은 방어 로직을 직접 짜야 합니다 — 그게 `src/lib/normalizeGame.ts`가 하는 일입니다.
- **Atlas**는 MongoDB를 내 컴퓨터/서버에 직접 설치하지 않고 클라우드에서 관리해주는 서비스입니다. `MONGODB_URI` 환경변수 하나로 접속합니다.

### Vercel Blob (이미지 저장소)

업로드한 스크린샷/커버 이미지를 저장하는 곳입니다. 파일 자체는 Blob에 올라가고, MongoDB엔 그 파일의 **URL 주소만** 저장합니다.

- 왜 서버를 거치지 않고 브라우저에서 직접 올리는가(`@vercel/blob/client`의 `upload()`): Vercel의 서버리스 함수(API 라우트)는 요청 본문 크기가 **4.5MB로 제한**되어 있습니다. 그래서 서버(`/api/upload`)는 "업로드해도 된다는 허가 토큰"만 내려주고, 실제 파일은 브라우저가 Blob 저장소에 직접 보냅니다.

### RAWG API

전 세계 게임 정보를 모아둔 무료 데이터베이스입니다. 커버 이미지, 스크린샷, 장르, 플랫폼, 출시일, 메타크리틱 점수, 줄거리(`description_raw`), 개발사/퍼블리셔, 그리고 일부 게임엔 짧은 플레이 영상(`clip`)까지 제공합니다.

- 영문 DB라서 한글 검색어는 먼저 영어로 번역한 다음 RAWG에 검색을 넣고, 반대로 RAWG가 돌려준 영문 소개글은 다시 한국어로 번역해서 보여줍니다 (둘 다 MyMemory 번역 API 사용).
- `description_raw`는 번역 API 한 번에 보낼 수 있는 글자 수 제한 때문에 450자까지만 잘라서 번역합니다. 그래서 화면에 보여주는 소개글은 "번역된 일부"이고, 전체 원문이 궁금하면 RAWG 페이지 링크(`sourceUrl`, `https://rawg.io/games/<slug>`)로 보내서 원문을 보게 합니다.
- `clip` 필드는 Steam에 없는 게임(콘솔 독점작 등)의 트레일러 보조 소스로 씁니다.

### Steam 상점 API (비공식)

처음엔 RAWG에는 없는 **가격**과 **트레일러 영상**을 보완하는 용도로만 썼는데, 지금은 RAWG와 별개로 **제목으로 직접 검색하고(`/api/steam/search`) 상세 정보로 폼 전체를 채우는(`/api/steam/[appid]`) 용도**로도 씁니다 — PC 게임은 Steam 쪽 정보가 더 정확한 경우가 많아서, 검색창 하나로 RAWG/Steam 결과를 같이 보여주고 고른 출처에 맞게 적용하는 구조로 바뀌었습니다. 로그인된 내 Steam 라이브러리 목록(`/api/steam/library`)에서 바로 골라 채우는 것도 가능합니다. 공식 문서는 없지만 Steam 상점 웹페이지가 내부적으로 쓰는, 널리 알려진 엔드포인트입니다.

- **직접 겪은 일**: Steam이 트레일러 영상 주소를 주는 형식을 바꿨습니다. 예전엔 `movies[0].mp4.max` / `webm.max`로 직접 재생 가능한 mp4/webm 링크를 줬는데, 지금은 `hls_h264`(HLS 스트리밍, `.m3u8`) 위주로 줍니다. `.m3u8`은 `<video src=...>` 태그로 바로 재생이 안 되고(사파리는 네이티브로 되지만 크롬/파이어폭스는 안 됨), 그래서 `hls.js` 라이브러리로 재생하는 `HlsVideo.tsx` 컴포넌트를 추가했습니다. **교훈**: 공식 문서가 없는 비공식 API는 사전 통보 없이 응답 형식이 바뀔 수 있다는 걸 실제로 겪었습니다. 터미널 로그에 실제 응답을 찍어보는(`console.error`) 방식으로 원인을 찾았습니다.
- **트레일러를 찾는 순서**: ① Steam의 mp4/webm(있으면) → ② Steam의 `hls_h264` → ③ RAWG의 `clip`. 셋 다 없으면(대부분 콘솔 독점작) 트레일러 없이 저장됩니다. Steam 자체에 게임이 없는 경우(검색 결과 0건)는 버그가 아니라 정상 동작입니다 — 예를 들어 닌텐도 스위치 독점작은 애초에 Steam 상점에 없습니다.
- **검색어에 한글이 섞여 있으면**(예: "테라리아") RAWG와 마찬가지로 먼저 영어로 번역한 뒤(`lib/translate.ts`) Steam에 검색을 보냅니다. Steam storesearch API는 영문 게임명에 한글 검색어를 매칭해주지 않아서, 번역 없이 그대로 보내면 결과가 0건으로 조용히 비어버립니다 (자세한 건 6절 트러블슈팅 참고).
- **장르도 RAWG랑 Steam이 서로 다른 모양으로 옴**: Steam appdetails를 `l=korean`으로 호출하면 장르 이름이 이미 한글("액션", "어드벤처" 등)로 와서, RAWG용 영문 키워드 매핑과는 별개의 매핑 함수(`matchSteamGenres`)가 필요합니다 (6절 트러블슈팅 참고).

### MyMemory 번역 API

키 발급 없이 쓸 수 있는 무료 번역 API입니다. 한글 검색어 → 영어(RAWG/Steam 검색용), 영문 소개글 → 한국어(화면 표시용) 양방향으로 씁니다. 번역 관련 함수(`containsHangul`, `translateText`, `translateToEnglish`, `translateToKorean`)는 원래 `lib/rawg.ts` 안에만 있었는데, Steam 검색에도 똑같이 필요해져서 공용 파일 `lib/translate.ts`로 빼서 두 파일이 같이 씁니다.

---

## 3. 전체 폴더 구조

```
lab_project/
├─ .env.example                 # 필요한 환경변수 목록 예시
├─ .eslintrc.json               # 코드 스타일/실수 검사 규칙
├─ .gitignore                   # git이 추적하지 않을 파일 목록
├─ next.config.mjs              # Next.js 설정
├─ package.json                 # 의존성 목록 (hls.js 포함), 실행 스크립트
├─ postcss.config.mjs           # Tailwind가 쓰는 CSS 처리 도구 설정
├─ tailwind.config.ts           # Tailwind 설정 — content가 src 전체를 보도록 수정됨
├─ tsconfig.json                # TypeScript 설정
├─ README.md                    # 프로젝트 소개 문서
├─ STUDY.md                     # 이 문서 (구조/기술 학습 기록)
├─ note/                        # 하루 작업 일지 (NoteMMDD.md)
└─ src/
   ├─ middleware.ts             # 모든 요청보다 먼저 실행되는 로그인 검사 (전체 화면 보호)
   ├─ types/
   │  └─ game.ts                # Game 타입, 옵션 상수들, 상태별 배지 색
   ├─ lib/                      # 순수 로직/유틸 함수 (화면 없음)
   │  ├─ mongodb.ts
   │  ├─ normalizeGame.ts
   │  ├─ validateGame.ts
   │  ├─ session.ts
   │  ├─ uploadImage.ts
   │  ├─ translate.ts           # 한글 감지 + 번역 (RAWG/Steam 검색 공용)
   │  ├─ rawg.ts                # 검색 + 상세(clip, sourceUrl 포함)
   │  ├─ genreMapping.ts        # RAWG/Steam 장르 매칭 + 플랫폼 매칭 (플랫폼은 여러 개 매칭 가능)
   │  └─ steam.ts               # 검색 + 상세 + 라이브러리 + 가격/트레일러(mp4/webm/hls_h264)
   ├─ components/               # 재사용 가능한 화면 부품
   │  ├─ GameForm.tsx
   │  ├─ GameFilterForm.tsx     # 메인 목록의 검색/필터 폼 (page.tsx에서 분리됨)
   │  ├─ GameCard.tsx
   │  ├─ GameConsoleCard.tsx    # 트레일러/소개글을 탭으로 전환해서 보여줌
   │  ├─ GameSummary.tsx        # 소개글 미리보기 + 펼치기 + 원본 링크
   │  ├─ HlsVideo.tsx           # HLS(.m3u8) 트레일러 재생
   │  ├─ ScreenshotPanel.tsx
   │  ├─ BackButton.tsx         # router.back()으로 이전 화면(필터 상태 유지)으로 이동
   │  ├─ DeleteGameButton.tsx
   │  └─ LogoutButton.tsx
   └─ app/                      # 실제 페이지 + API (파일 경로 = 주소)
      ├─ layout.tsx             # 모든 페이지를 감싸는 공통 틀
      ├─ page.tsx               # "/" 목록 화면
      ├─ globals.css            # 전역 CSS (Tailwind 불러오기 등)
      ├─ login/page.tsx         # "/login" 로그인 화면
      ├─ games/
      │  ├─ new/page.tsx        # "/games/new" 등록 화면
      │  └─ [id]/
      │     ├─ page.tsx         # "/games/아이디" 상세 화면
      │     └─ edit/page.tsx    # "/games/아이디/edit" 수정 화면
      └─ api/
         ├─ auth/
         │  ├─ login/route.ts
         │  └─ logout/route.ts
         ├─ games/
         │  ├─ route.ts                    # POST(등록)
         │  └─ [id]/
         │     ├─ route.ts                 # PUT(수정)/DELETE(삭제)
         │     └─ screenshots/route.ts     # PATCH(스크린샷만 갱신)
         ├─ upload/route.ts                # 업로드 허가 토큰 발급
         ├─ rawg/
         │  ├─ search/route.ts
         │  └─ [id]/route.ts
         └─ steam/
            ├─ route.ts                    # 제목 기준 가격/트레일러 (RAWG 보완용)
            ├─ search/route.ts             # Steam 검색
            ├─ [appid]/route.ts            # Steam 상세
            └─ library/route.ts            # 내 Steam 보유 게임 목록
```

---

## 4. 폴더/파일별 상세 설명

### 4-1. 로그인 구조 — "쓰기만 보호"에서 "전체 화면 보호"로

처음엔 "누구나 목록/상세를 볼 수 있고, 등록/수정/삭제/업로드 같은 **쓰기 요청만** 비밀번호로 막는" 구조였습니다. 이후 "아예 전체를 비밀번호 뒤에 숨기고 싶다"는 쪽으로 요구사항이 바뀌어서, 지금은 `src/middleware.ts`가 다음처럼 동작합니다.

```ts
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/auth/logout']);
```

1. `/login`과 로그인/로그아웃 API는 로그인 여부와 상관없이 항상 통과.
2. 그 외 `/api/...` 요청은 **예전 로직 그대로** — `POST`/`PUT`/`PATCH`/`DELETE`(쓰기)일 때만 로그인 쿠키를 검사.
3. 그 외 **화면(페이지)**은 로그인 안 되어 있으면 `/login`으로 리다이렉트.

즉 API 보호 로직은 그대로 두고, "화면 자체도 로그인해야 보인다"는 레이어를 하나 더 얹은 구조입니다. 한 곳(`middleware.ts`)에서만 검사하기 때문에, 새 페이지를 추가해도 로그인 체크를 따로 안 넣어도 자동으로 보호됩니다.

### `src/types/game.ts` — 데이터 모양 정의

- `GameStatus` 타입: `'하고싶음' | '하는중' | '클리어' | '중단'` 네 가지 값만 허용.
- `Screenshot` 인터페이스: 스크린샷 하나는 `{url, note?}` 모양.
- `GENRE_OPTIONS`, `PLATFORM_OPTIONS`: 폼의 드롭다운/체크박스에 쓰이는 고정 옵션 목록.
- `STATUS_STYLES`: 상태별 배지 색을 `GameCard`, `GameConsoleCard`가 공유해서 씀.
- `Game` 인터페이스: 직접 입력하는 필드(`title`, `platform`, `startDate`, `rating` 등)와 RAWG/Steam이 자동으로 채우는 선택 필드(`coverImage`, `releaseDate`, `metacritic`, `price`, `sourceUrl` 등)로 나뉨.

### `src/lib/` — 화면 없는 순수 로직

- **`mongodb.ts`**: MongoDB에 한 번 연결해두고 그 연결을 재사용하게 해주는 파일.
- **`normalizeGame.ts`**: MongoDB에서 막 꺼낸 날것의 문서를 `Game` 타입으로 안전하게 바꿔주는 함수. 옛날 데이터까지 전부 같은 모양으로 변환.
- **`validateGame.ts`**: 브라우저가 등록/수정 API로 보낸 JSON을 검사하고, 맞으면 깨끗한 객체(`sourceUrl` 포함)로, 틀리면 `null`을 돌려주는 함수.
- **`session.ts`**: 로그인 쿠키에 들어갈 서명된 토큰을 만들고 검증. HMAC + Web Crypto API(`crypto.subtle`) 사용 — middleware(Edge 환경)와 API(Node 환경) 양쪽에서 똑같이 동작해야 해서.
- **`uploadImage.ts`**: 브라우저에서 Blob으로 이미지를 올리는 공통 함수(`uploadImage`)와 사전 검증 함수(`checkImage`).
- **`translate.ts`**: 한글 포함 여부 판별(`containsHangul`)과 MyMemory 번역 호출(`translateText`/`translateToEnglish`/`translateToKorean`). 원래 `rawg.ts` 전용이었다가, Steam 검색도 한글 번역이 필요해져서 공용으로 뺌.
- **`rawg.ts`**: `searchRawgGames`(제목 검색, 한글이면 `translate.ts`로 영어 번역)와 `getRawgGameDetail`(상세 정보 + 스크린샷 + 한국어로 번역된 소개글 + `clip` 트레일러 + `sourceUrl`).
- **`genreMapping.ts`**: RAWG/Steam 장르 이름을 한글 옵션으로 매핑하는 `matchRawgGenres`(RAWG는 영문 키워드)와 `matchSteamGenres`(Steam은 `l=korean`이라 이미 한글로 오므로 한글 키워드), 그리고 `matchRawgPlatforms`(플랫폼 매핑)까지 셋을 모아둔 파일. 원래 이름은 `rawgMapping.ts`였는데, RAWG 전용이 아니게 되면서 이름을 바꿈. `matchRawgPlatforms`는 **여러 플랫폼이 동시에 매칭될 수 있어서** 배열을 돌려주고, 하나만 매칭되면 폼이 자동으로 선택하고 여러 개면 사용자가 버튼으로 직접 고르게 함.
- **`steam.ts`**: `findSteamInfo`(제목으로 가격/트레일러/플레이시간 조회, RAWG 선택 경로의 보완용), `searchSteamStore`(제목 검색 — 한글이면 `translate.ts`로 번역 후 검색), `getSteamGameDetail`(appid로 상세 정보 전체 조회), `getOwnedGamesList`(내 Steam 라이브러리 전체 목록). 검색 실패/매칭 없음을 `console.error`로 남겨서 서버 로그에서 바로 원인을 확인할 수 있게 함.

### `src/components/` — 재사용 화면 부품

- **`GameForm.tsx`**: 등록/수정 공용 폼. 등록 모드에서는 RAWG/Steam 검색창이 하나로 합쳐져 있어서, 검색하면 두 API를 동시에 조회해 결과를 한 목록에 섞어 보여줌(Steam 결과가 먼저). 고른 결과의 출처(RAWG/Steam)에 맞는 함수가 자동으로 호출되어 폼을 채움 — RAWG를 고르면 `/api/rawg/[id]`(상세)와 `/api/steam`(가격/트레일러 보완)을 같이, Steam을 고르면 `/api/steam/[appid]`(상세) 하나로 끝남. "내 Steam 라이브러리에서 고르기" 버튼으로 `/api/steam/library`에서 바로 골라 채우는 것도 가능. 새 게임을 고를 때마다 이전 선택으로 채워졌던 트레일러/스크린샷/소개글 등은 먼저 비운 뒤 채움. 트레일러는 Steam → RAWG `clip` 순서로 폴백. 플랫폼이 여러 개 매칭되면 후보 버튼을 보여줌.
- **`GameFilterForm.tsx`**: 메인 목록의 검색/정렬/상태/플랫폼/장르 필터 폼. 원래 `page.tsx` 안에 있었는데 분리됨. select/checkbox는 바뀌면 바로 제출(`submitOnChange`), 검색어는 Enter로 제출.
- **`GameCard.tsx`**: 메인 목록 카드. 클릭하면 CD 회전 애니메이션 후 상세 화면으로 이동.
- **`GameConsoleCard.tsx`**: 상세 화면 왼쪽 "콘솔 화면" 카드. 커버 이미지, 배지, 날짜/플레이 정보에 더해 **트레일러/소개글을 ◀▶ 버튼으로 전환**하는 탭 뷰를 보여줌. 트레일러가 있으면 기본으로 트레일러 탭이 먼저 보임.
- **`GameSummary.tsx`**: 소개글이 길면(120자 넘으면) 잘라서 보여주고 "본문 보러가기"로 로컬에서 펼침. 펼친 상태에서 `sourceUrl`(RAWG 원본 페이지)이 있으면 "원본에서 보기" 링크도 같이 보여줌.
- **`HlsVideo.tsx`**: `.m3u8` 트레일러 재생 전용 컴포넌트. 사파리는 `<video>`가 네이티브로 재생, 그 외 브라우저는 `hls.js`로 재생.
- **`ScreenshotPanel.tsx`**: 상세 화면 오른쪽 사진첩. 사진마다 세로/가로 비율을 미리 로드해서 판별하고(`naturalHeight > naturalWidth`), 세로 사진은 가로 사진보다 3배 넓은 공간(`flexGrow`)을 차지하도록 배치. 추가/삭제/순서 변경/메모 작성을 전부 처리.
- **`BackButton.tsx`**: `router.back()`으로 바로 직전 화면(브라우저 히스토리)으로 이동 — 목록에서 필터를 걸어놓고 들어왔으면 그 필터 상태 그대로 돌아감.
- **`DeleteGameButton.tsx`**: 삭제 확인 후 `DELETE` 호출, 성공하면 `router.replace('/')`로 이동(삭제한 상세 화면이 히스토리에 안 남게).
- **`LogoutButton.tsx`**: 로그아웃 버튼.

### `src/app/` — 실제 페이지와 API

- **`page.tsx`**("/"): 게임 목록 화면. 검색/필터는 `GameFilterForm`에 위임하고, 이 파일은 DB 조회(`getGames`, `getFilterOptions`)와 "한 줄에 몇 개 보기"(`cols`) 상태, 카드 그리드 렌더링만 담당.
- **`login/page.tsx`**: 비밀번호 입력 → `/api/auth/login` 호출 → 성공하면 메인으로 이동.
- **`games/new/page.tsx`** / **`games/[id]/edit/page.tsx`**: `<GameForm />`만 렌더링하는 얇은 페이지.
- **`games/[id]/page.tsx`**: 상세 화면. `GameConsoleCard`/`ScreenshotPanel`에 데이터 전달.

#### `src/app/api/` — 백엔드 API

- **`auth/login`, `auth/logout`**: 로그인/로그아웃.
- **`games`, `games/[id]`, `games/[id]/screenshots`**: 등록/수정/삭제, 스크린샷만 갱신.
- **`upload`**: 업로드 허가 토큰 발급.
- **`rawg/search`, `rawg/[id]`**: RAWG 검색/상세.
- **`steam`**: 제목으로 가격/트레일러 조회 (RAWG 선택 경로의 보완용).
- **`steam/search`, `steam/[appid]`, `steam/library`**: Steam 검색/상세/내 라이브러리 — 통합 검색창에서 Steam 쪽을 담당.

> `middleware.ts`가 먼저 로그인 검사를 전부 처리하기 때문에, 각 API 라우트 코드 자체에는 로그인 체크 로직이 없습니다.

### `note/`

매일 작업한 내용을 간단히 기록하는 일지(`NoteMMDD.md`). 이 학습 기록장과 달리, "무엇을 했는지" 위주로 짧게 적는 용도입니다.

---

## 5. 데이터가 흘러가는 전체 흐름 (등록 예시)

1. 로그인 안 되어 있으면 `/games/new` 접근 시 `middleware.ts`가 `/login`으로 보냄.
2. `/games/new`에서 `GameForm`이 렌더링됨.
3. (선택) 검색창에 제목 입력 → `/api/rawg/search` + `/api/steam/search`를 동시에 호출해 결과를 한 목록에 섞어 보여줌(또는 "내 Steam 라이브러리에서 고르기"로 바로 고름) → 후보 선택.
   - RAWG를 고르면 `/api/rawg/[id]`(상세) + `/api/steam`(가격/트레일러 보완)을 동시 호출, Steam을 고르면 `/api/steam/[appid]`(상세) 하나로 끝남.
   - 제목, 장르, 플랫폼(여러 개면 후보로), 출시일, 커버, 소개글(RAWG는 한국어 번역), 메타크리틱, 개발사/퍼블리셔, 스크린샷, 가격, `sourceUrl`을 자동으로 채움.
   - 트레일러는 Steam(mp4/webm → hls_h264) → RAWG `clip` 순으로 하나만 채움.
4. 스크린샷 선택 → 미리보기만 생성(아직 업로드 안 함).
5. "등록 완료" 클릭 → `uploadPending()`이 그제서야 Blob에 실제 업로드 → `/api/games`에 `POST`.
6. `middleware.ts`가 쓰기 요청이라 로그인 쿠키 확인 → 통과.
7. `validateGame.ts`가 입력값 검사 → MongoDB에 저장.
8. `router.replace('/')`로 목록 화면 이동(등록 폼이 히스토리에 안 남음) → `normalizeGame.ts`를 거쳐 다시 화면에 표시.

---

## 6. 트러블슈팅 기록 — 겪었던 버그와 배운 점

실제로 막혔다가 고친 것들을 "왜 이렇게 됐는지"까지 남겨둡니다. 나중에 비슷한 증상을 만나면 여기부터 의심하면 됩니다.

### 1) Steam 상점 API가 응답 형식을 바꿈 (트레일러가 안 나오던 문제)

- **증상**: Steam에 분명히 있는 게임(엘든 링 등)인데도 트레일러가 저장이 안 됨.
- **원인 추적**: `findSteamInfo`에 `console.error`로 검색 결과/appdetails 응답을 직접 찍어서 확인. 검색은 정상 매칭됐는데, `movies` 배열 안에 예전 코드가 찾던 `mp4`/`webm` 필드가 없고 `dash_av1`/`dash_h264`/`hls_h264`만 있었음.
- **원인**: 비공식 API라 사전 공지 없이 Steam이 트레일러 제공 방식을 스트리밍 포맷(HLS/DASH) 위주로 바꿈.
- **해결**: `hls_h264`(`.m3u8`)를 보조 소스로 추가하고, 이걸 재생할 수 있는 `HlsVideo.tsx`(`hls.js` 기반) 컴포넌트를 새로 만듦.
- **배운 점**: 비공식/문서 없는 API를 쓸 때는 "필드가 갑자기 바뀔 수 있다"를 전제하고, 실패 지점에 로그를 심어서 실제 응답을 바로 확인할 수 있게 해두는 게 디버깅 속도를 크게 줄여줌.

### 2) Tailwind가 특정 클래스만 쏙 빼고 만들어줌 (상태 배지 색이 안 보이던 문제)

- **증상**: 상태 배지(하고싶음/하는중/클리어/중단)의 배경색과 글자색이 전부 안 보임. 다크모드나 브라우저 설정 문제가 아니었음(확인함).
- **원인**: 배지 색 클래스 문자열(`STATUS_STYLES`)이 `tailwind.config.ts`의 `content` 스캔 범위에 없는 `src/types/game.ts`에 있었음. 실제 컴포넌트에서는 `STATUS_STYLES[game.status]`처럼 변수로만 꺼내 써서, "bg-sky-100" 같은 글자 자체가 스캔되는 파일 어디에도 존재하지 않았음 → Tailwind가 해당 클래스를 CSS에 아예 안 만듦.
- **해결**: `content`를 `src` 전체로 넓힘.
- **배운 점**: Tailwind 클래스는 "변수에 들어있는 완성된 문자열"이어도 상관없지만, 그 문자열이 **스캔 대상 파일 안에 글자 그대로 존재**해야 함. 컴포넌트가 아닌 데이터/상수 파일에 스타일 매핑을 둘 땐 항상 content 설정을 같이 확인.

### 3) `router.push`로 인한 "제출 끝난 폼으로 되돌아가기" 문제

- **증상**: 수정 폼 저장 성공 후 뒤로가기를 누르면, 저장이 안 된 것처럼 수정 폼이 다시 나타남.
- **원인**: 저장 성공 후 `router.push(...)`를 써서 히스토리에 **새 기록을 쌓기만** 하고, 수정 폼 자체는 히스토리에 그대로 남아있었음.
- **해결**: 폼 제출 성공처럼 "이 페이지로 다시 돌아올 필요가 없는" 이동은 `router.replace(...)`로 바꿔서 현재 기록을 덮어씀. 반대로 "취소하고 원래 보던 곳으로"는 `router.back()`을 써서 필터 상태 등을 유지.
- **배운 점**: `push`(쌓기)와 `replace`(덮어쓰기)를 상황에 맞게 구분해서 써야, 뒤로가기 버튼이 사용자가 기대하는 대로 동작함.

### 4) 리뷰에서 찾은, 아직 고치는 중인 것들

- `src/app/page.tsx`에서 `Game` 타입을 쓰면서 import를 빠뜨려서 `tsc` 빌드 에러가 났던 적이 있음 — 리팩터링(필터 폼 분리) 하다가 import 정리를 하면서 실수로 같이 지워진 경우. **교훈**: 컴포넌트를 쪼개거나 옮길 때는 꼭 `npx tsc --noEmit`으로 한 번 전체를 확인.
- `<input type="data">`처럼 의도한 값("date")과 다른 문자열 오타는 타입 체크를 통과해버리니, 폼 필드처럼 눈으로 확인 가능한 부분은 실제 화면에서 눌러보는 과정이 꼭 필요함.

### 5) Steam 검색이 한글 제목으로는 결과가 0건 (RAWG는 되는데 Steam만 안 되던 문제)

- **증상**: 검색창에 "테라리아"를 치면 RAWG 결과는 뜨는데 Steam 결과만 항상 빔. 영문으로 치면("terraria") 둘 다 정상.
- **원인 추적**: `/api/steam/search?q=테라리아`를 직접 호출해서 `{"results":[]}`가 돌아오는 걸 확인 → `lib/rawg.ts`의 `searchRawgGames`는 한글이 섞이면 먼저 영어로 번역하고 검색하는데, `lib/steam.ts`의 `searchSteamStore`는 이 단계가 아예 없이 한글 검색어를 그대로 Steam에 보내고 있었음.
- **원인**: Steam storesearch API가 영문으로 인덱싱된 게임명에 한글 검색어를 매칭해주지 않음(비공식 API라 다국어 매칭을 보장 안 함).
- **해결**: `rawg.ts`에 있던 `containsHangul`/`translateText`/`translateToEnglish`/`translateToKorean`을 공용 `lib/translate.ts`로 빼고, `searchSteamStore`에서도 검색 전에 한글이면 영어로 번역하도록 함.
- **배운 점**: 비슷한 두 API 연동 코드를 복붙 없이 따로 짜다 보면, 한쪽에만 있던 보정 로직(여기선 번역)이 다른 쪽엔 누락되기 쉬움. "왜 저쪽은 되는데 이쪽은 안 되지?"라는 질문이 들면 두 코드를 나란히 놓고 비교하는 게 제일 빠름.

### 6) 라우트 정리하다가 실수로 지운 파일 때문에, RAWG로 고른 게임만 Steam 정보가 조용히 비던 문제

- **증상**: Steam 검색/라이브러리로 고른 게임은 가격·트레일러가 잘 채워지는데, **RAWG 검색으로 고른 게임만** 가격이 항상 비어있고 트레일러도 RAWG `clip`만 들어감(Steam 쪽 트레일러가 더 있을 법한 게임인데도).
- **원인 추적**: 레포 전체에서 "안 쓰는 코드 있는지" 점검하다가 반대 상황을 발견함 — `GameForm.tsx`의 `applyRawgItem`이 `/api/steam?title=...`을 호출하고 있는데, 그 라우트 파일(`src/app/api/steam/route.ts`) 자체가 develop 브랜치에 없었음.
- **원인**: Steam 검색/상세/라이브러리 라우트(`search/`, `[appid]/`, `library/`)를 새로 추가하면서 "이제 새 라우트들이 있으니 안 써도 되겠지" 하고 예전 `route.ts`를 실수로 같이 지움. 근데 `applyRawgItem`은 여전히 이 라우트(제목 기준 조회)에 의존하고 있었음 — `/api/steam/[appid]`는 appid가 있어야 호출 가능한데, RAWG 결과는 appid를 모르니까 제목으로만 찾는 이 라우트가 따로 필요했던 것.
- **왜 아무 에러도 안 났는가**: `applyRawgItem`이 Steam 쪽 fetch를 `steamRes.ok ? await steamRes.json() : { result: null }`로 처리해서, 404가 나도 그냥 "Steam 정보 없음"으로 조용히 넘어감. RAWG 정보 자체는 정상적으로 채워지니 폼이 깨진 것처럼 안 보여서 한참 몰랐음.
- **해결**: 삭제됐던 `src/app/api/steam/route.ts`를 원래 내용 그대로 복구.
- **배운 점**: API 라우트를 "새 걸로 대체됐다"고 판단하기 전에, 그 라우트를 부르는 **모든** 호출부를 먼저 확인해야 함. 여기선 Steam 상세 조회 경로가 두 가지(appid 기준, 제목 기준)로 나뉘어 있었는데 한쪽만 보고 "이제 필요 없다"고 착각함. 또한 실패를 조용히 삼키는 fallback(`steamRes.ok ? ... : null`)은 UX 입장에서는 안전하지만, 이런 종류의 "라우트가 통째로 사라진" 버그를 한동안 숨기는 부작용도 있다는 걸 체감함.

### 7) Steam으로 고른 게임만 장르가 항상 비던 문제

- **증상**: RAWG 검색으로 고른 게임은 장르 체크박스가 자동으로 선택되는데, Steam 검색/라이브러리로 고른 게임은 장르가 거의 항상 하나도 안 선택됨.
- **원인 추적**: `GameForm.tsx`의 `applySteamDetail`이 RAWG용 매핑 함수(`matchRawgGenres`)를 그대로 재사용하고 있었음. 그런데 `lib/steam.ts`의 `getSteamGameDetail`은 Steam API를 `l=korean`으로 호출해서 `genres`가 **이미 한글**("액션", "어드벤처" 등)로 옴. `matchRawgGenres`의 키워드 테이블은 전부 **영문**(`action`, `adventure`...)이라서, 소문자로 바꾼 한글 문자열 안에서 영문 키워드를 찾으니 `rpg`처럼 Steam이 영문 그대로 두는 극히 일부만 우연히 걸리고 나머지는 전부 매칭 실패.
- **해결**: `genreMapping.ts`(당시 이름 `rawgMapping.ts`)에 한글 키워드 기반 `matchSteamGenres`를 새로 추가하고, `applySteamDetail`에서 이걸 쓰도록 변경. 겸사겸사 RAWG 전용이 아니게 된 파일 이름도 `genreMapping.ts`로 바꿈.
- **배운 점**: 같은 역할(장르 매핑)을 하는 함수라도, 소스마다 **입력 언어/형식이 다르면 그대로 재사용하면 안 됨**. "되는 것처럼 보이는데 결과가 비어있다"는 증상은 로직이 아예 안 도는 게 아니라, 매칭 조건이 안 맞아서 매번 0건으로 끝나는 경우가 많다는 걸 다시 확인함.
</content>
