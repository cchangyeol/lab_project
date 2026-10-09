// RAWG/Steam에서 온 장르/태그/플랫폼 이름을 우리 폼에서 쓰는 한글 옵션으로 매핑해주는 함수들
import { GENRE_OPTIONS } from "@/types/game";

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

// Steam appdetails를 l=korean으로 호출하면 genres.description이 이미 한글로 와서,
// RAWG처럼 영문 키워드가 아니라 한글 키워드로 매칭함 (Steam의 공식 장르 분류는 RAWG 태그보다 훨씬 적음)
const STEAM_GENRE_KEYWORDS: Record<string, string> = {
  '액션': '액션',
  '어드벤처': '어드벤처',
  '롤플레잉': 'RPG',
  'rpg': 'RPG',
  '시뮬레이션': '시뮬레이션',
  '전략': '전략',
  '스포츠': '스포츠',
  '레이싱': '스포츠',
  '캐주얼': '기타',
  '인디': '기타',
};

export function matchSteamGenres(terms: string[]): string[] {
  const normalized = terms.map((t) => t.toLowerCase().replace(/\s/g, ''));
  const matched = new Set<string>();

  for (const term of normalized) {
    for (const [keyword, genre] of Object.entries(STEAM_GENRE_KEYWORDS)) {
      if (GENRE_OPTIONS.includes(genre) && term.includes(keyword.replace(/\s/g, ''))) {
        matched.add(genre);
      }
    }
  }

  return Array.from(matched);
}

  // 기존 플렛폼 옵션(PC, PS5, Switch, Mobile, 기타) 중 하나로 매칭
  export function matchRawgPlatforms(platforms: string[]): string[] {
    const lower = platforms.map((p) => p.toLowerCase());
    const matched: string[] = [];
    if (lower.some((p) => p.includes('switch'))) matched.push('Switch');
    if (lower.some((p) => p.includes('playstation'))) matched.push('PS5');
    if (lower.some((p) => p.includes('ios') || p.includes('android'))) matched.push('Mobile');
    if (lower.some((p) => p.includes('pc'))) matched.push('PC');
    return matched;
}
