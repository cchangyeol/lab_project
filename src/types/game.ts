// 게임 기록 하나에 들어가는 데이터 모양을 정의하는 파일

// 게임 상태 네 가지 값
export type GameStatus = '하고싶음' | '하는중' | '클리어' | '중단';

// 스크린샷 하나 (사진 주소 + 그날 적은 메모)
export interface Screenshot {
  url: string;
  note?: string;
}

export const GENRE_OPTIONS = [
  'RPG', '액션', '어드벤처', '시뮬레이션', '전략', '스포츠', '리듬', '퍼즐', '로그라이크', '소울', '오픈월드', '기타'
]

export const PLATFORM_OPTIONS = ['PC', 'PS5', 'Switch', 'Mobile', '기타'];

// 목록/상세/카드에서 공통으로 쓰는 상태별 배지 색
export const STATUS_STYLES: Record<GameStatus, string> = {
  하고싶음: 'bg-sky-100 text-sky-700',
  하는중: 'bg-amber-100 text-amber-700',
  클리어: 'bg-emerald-100 text-emerald-700',
  중단: 'bg-rose-100 text-rose-700',
};

// 게임 기록 하나의 데이터 모양
export interface Game {
  _id?: string; // MongoDB에서 자동으로 생성되는 고유 ID
  title: string; // 게임 제목
  platform: string; // 게임 플랫폼(PC, PS5, 닌텐도 Switch 등)
  genres: string[]; // 장르 (예: RPG, rougelike, AOS, FPS 등)
  releaseDate?: string;
  startDate: string; // 시작일(YYYY-MM-DD 형식)
  endDate?: string; // 종료일(YYYY-MM-DD 형식)
  playTime: number; // 총 플레이 시간(시간 단위)
  rating: number; // 게임 평점(1~5 사이의 값)
  status: GameStatus; // 게임 상태
  trailerUrls?: string[]; // 게임 트레일러 URL
  screenshots?: Screenshot[]; // 업로드한 스크린샷 이미지 주소들

  // RAWG&STEAM에서 가져오는 정보들
  coverImage?: string; // RAWG 커버 이미지 주소
  summary?: string; // RAWG 게임 소개글
  sourceUrl?: string;
  metacritic?: number; // RAWG 메타크리틱 점수 (0~100)
  developers?: string[]; // 개발사
  publishers?: string[]; // 퍼블리셔
  price?: string; // Steam 판매 가격
}

