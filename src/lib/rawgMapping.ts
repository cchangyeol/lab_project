// RAWG에서 온 영문 장르/태그/플랫폼 이름을 우리 폼에서 쓰는 한글 옵션으로 바꿔주는 함수들
import { GENRE_OPTIONS } from '@/types/game';

// RAWG의 genres/tags 이름에 이 키워드가 들어있으면 해당 한글 장르로 매칭
const GENRE_KEYWORDS: Record<string, string> = {
  'role-playing': 'RPG',
  rpg: 'RPG',
  action: '액션',
  adventure: '어드벤처',
  simulation: '시뮬레이션',
  strategy: '전략',
  sports: '스포츠',
  rhythm: '리듬',
  music: '리듬',
  puzzle: '퍼즐',
  roguelike: '로그라이크',
  'rogue-lite': '로그라이크',
  'souls-like': '소울',
  'open-world': '오픈월드',
  'open world': '오픈월드',
};

export function matchRawgGenres(terms: string[]): string[] {
  const lower = terms.map((t) => t.toLowerCase());
  const matched = new Set<string>();

  for (const term of lower) {
    for (const [keyword, genre] of Object.entries(GENRE_KEYWORDS)) {
      if (GENRE_OPTIONS.includes(genre) && term.includes(keyword)) {
        matched.add(genre);
      }
    }
  }

  return Array.from(matched);
}

// 우리 폼의 플랫폼 옵션(PC, PS5, Switch, Mobile, 기타) 중 하나로 매칭
export function matchRawgPlatform(platforms: string[]): string {
  const lower = platforms.map((p) => p.toLowerCase());
  if (lower.some((p) => p.includes('switch'))) return 'Switch';
  if (lower.some((p) => p.includes('playstation'))) return 'PS5';
  if (lower.some((p) => p.includes('ios') || p.includes('android'))) return 'Mobile';
  if (lower.some((p) => p.includes('pc'))) return 'PC';
  return '';
}
