# 게임 기록 (Game Log)

직접 플레이했거나 플레이하고 싶은 게임을 기록하고 관리하는 웹 애플리케이션입니다. 학교 과제로 진행한 Next.js + MongoDB Atlas 기반 프로젝트입니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: MongoDB Atlas
- **이미지 저장소**: Vercel Blob
- **배포**: Vercel

## 주요 기능

### 기록 관리
- 게임 기록 등록 / 목록 조회 / 상세 보기 / 수정 / 삭제
- 상태(하고싶음 · 하는중 · 클리어 · 중단)에 따라 입력 항목이 자동으로 활성화/비활성화됨

### 검색 · 필터 · 정렬
- 게임명 검색
- 상태 / 플랫폼(PC, PS5, Switch, Mobile, 기타) 필터
- 장르 다중 선택 필터 (RPG, 액션, 어드벤처, 시뮬레이션, 전략, 스포츠, 리듬, 퍼즐, 로그라이크, 오픈월드, 기타)
- 평점순 / 이름순 / 최근 플레이순 정렬

### 미디어
- 유튜브 트레일러 링크 등록 (최대 3개, 상세 화면에 바로 임베드)
- 스크린샷 업로드 (최대 24장), 순서 변경, 페이지별 보기
- 스크린샷마다 그날의 기록을 남기는 메모 기능
- 세로로 긴 스크린샷은 더 큰 비중으로 배치되는 자동 레이아웃

### 디자인
- 메인 목록은 게임팩(CD 케이스) 컨셉의 카드로, 클릭하면 CD가 회전하며 열리는 애니메이션과 함께 상세 화면으로 이동
- 상세 화면은 콘솔 화면 + 사진첩을 펼친 듯한 2단 레이아웃
- 파스텔 톤의 일관된 디자인 시스템

## 데이터 모델

```ts
interface Game {
  _id?: string;
  title: string;
  platform: string;
  genres: string[];
  startDate: string;
  endDate?: string;
  playTime: number;
  rating: number;
  status: '하고싶음' | '하는중' | '클리어' | '중단';
  trailerUrls?: string[];
  screenshots?: { url: string; note?: string }[];
}
```

## 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx, page.tsx, globals.css
│  ├─ login/page.tsx                          # 로그인 화면
│  ├─ api/
│  │  ├─ auth/login/route.ts, auth/logout/route.ts  # 로그인/로그아웃 (POST)
│  │  ├─ games/route.ts                       # 등록 (POST)
│  │  ├─ games/[id]/route.ts                  # 수정·삭제 (PUT/DELETE)
│  │  ├─ games/[id]/screenshots/route.ts      # 스크린샷만 갱신 (PATCH)
│  │  └─ upload/route.ts                      # 이미지 업로드 (POST)
│  └─ games/
│     ├─ new/page.tsx                         # 등록 화면 (GameForm 사용)
│     └─ [id]/page.tsx, [id]/edit/page.tsx    # 상세 화면 · 수정 화면 (GameForm 사용)
├─ components/                                # GameForm, GameCard, ScreenshotPanel 등 재사용 UI
├─ lib/
│  ├─ mongodb.ts                              # DB 연결
│  ├─ normalizeGame.ts                        # DB 문서 → Game 타입 변환 (옛 데이터 호환)
│  └─ validateGame.ts                         # 등록/수정 요청 입력값 검증
├─ middleware.ts                              # 기록을 바꾸는 요청에 로그인 여부 확인
└─ types/game.ts                              # 타입 정의
```

## 시작하기

### 1. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채워주세요. (`.env.example` 참고)

```
MONGODB_URI=여기에_MongoDB_Atlas_연결_문자열
BLOB_READ_WRITE_TOKEN=여기에_Vercel_Blob_토큰
ADMIN_PASSWORD=기록을_등록·수정·삭제할_때_쓸_비밀번호
SESSION_SECRET=로그인_쿠키_서명용_임의_문자열(openssl rand -hex 32 로 생성)
```

### 2. 설치 및 실행

Node.js 20.19 이상이 필요합니다 (mongodb 드라이버 7.x 요구사항).

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 확인할 수 있고, `/login`에서 `ADMIN_PASSWORD`로 로그인해야 기록을 등록·수정·삭제할 수 있습니다.

## 진행 단계

이 프로젝트는 아래 단계를 거쳐 만들어졌습니다.

1. **1단계**: 등록 / 목록 / 상세 보기
2. **2단계**: 수정 / 삭제 / 검색
3. **3단계**: 필터, 정렬, 트레일러·스크린샷, 디자인 개선
4. **4단계**: 비밀번호 로그인, 입력값 검증 등 보안·안정성 보완

## 참고 사항

- 회원가입이나 다중 사용자 권한 구분은 없고, 쓰기 작업 전체를 비밀번호 하나로만 보호합니다.
- 외부 API를 통한 자동 데이터 수집 없이, 사용자가 직접 입력한 정보만 다룹니다.
