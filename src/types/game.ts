// 게임 기록 하나에 들어가는 데이터 모양을 정의하는 파일

// 게임 상태 네 가지 값
export type GameStatus = '하고싶음' | '하는중' | '클리어' | '중단';

// 게임 기록 하나의 데이터 모양
export interface Game {
  _id?: string; // MongoDB에서 자동으로 생성되는 고유 ID
  title: string; // 게임 제목
  platform: string; // 게임 플랫폼(PC, PS5, 닌텐도 Switch 등)
  genre: string; // 장르 (예: RPG, rougelike, AOS, FPS 등)
  startDate: string; // 시작일(YYYY-MM-DD 형식)
  endDate?: string; // 종료일(YYYY-MM-DD 형식)
  playTime: number; // 총 플레이 시간(시간 단위)
  rating: number; // 게임 평점(1~5 사이의 값)
  status: GameStatus; // 게임 상태
  trailerUrls?: string[]; // 게임 트레일러 URL
  screenshots?: string[]; // 업로드한 스크린샷 이미지 주소들
}


