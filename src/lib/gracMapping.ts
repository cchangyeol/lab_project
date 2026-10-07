// 게임물관리위원회 API에서 받은 장르·플랫폼 값을 우리 프로젝트 옵션으로 바꿔주는 파일
import { GENRE_OPTIONS } from '@/types/game';

// GRAC 장르 이름 -> 우리 장르 옵션 이름
const GENRE_MAP: Record<string, string> = {
  '롤플레잉': 'RPG',
  'MMORPG': 'RPG',
  '액션': '액션',
  '어드벤처': '어드벤처',
  '시뮬레이션': '시뮬레이션',
  '전략시뮬레이션': '전략',
  '스포츠': '스포츠',
  '퍼즐': '퍼즐',
  'FPS/TPS': '액션',
  '비행슈팅': '액션',
  '격투게임': '액션',
  '레이싱': '스포츠',
};

// GRAC 플랫폼 이름 -> 우리 플랫폼 옵션 이름
const PLATFORM_MAP: Record<string, string> = {
  'PC/온라인 게임': 'PC',
  '모바일': 'Mobile',
};

// 매칭되는 게 없으면 전부 '기타'로 처리
export function mapGracGenre(gracGenre: string): string {
  const mapped = GENRE_MAP[gracGenre];
  return mapped && GENRE_OPTIONS.includes(mapped) ? mapped :  '기타';
}

export function mapGracPlatform(gracPlatform: string): string {
  return PLATFORM_MAP[gracPlatform] ?? '기타';
}

// GRAC 검색 결과 한 건의 모양
export interface GracItem {
  rateno?: string;
  rateddate?: string;
  gametitle: string;
  entname?: string;
  summary?: string;
  givenrate?: string;
  genre?: string;
  platform?: string;
  descriptors?: string;
  cancelstatus?: boolean | string;
  canceleddate?: string;
}
