// Steam 상점 API를 호출하는 서버 전용 함수들 (가격, 트레일러만)

const STEAM_SEARCH_URL = 'https://store.steampowered.com/api/storesearch';
const STEAM_DETAILS_URL = 'https://store.steampowered.com/api/appdetails';

interface SteamSearchItem {
  id: number;
}

interface SteamSearchResponse {
  items?: SteamSearchItem[];
}

interface SteamMovie {
  mp4?: { max?: string };
  webm?: { max?: string};
}

interface SteamPriceOverview {
  final_formatted?: string;
}

interface SteamAppData {
  is_free?: boolean;
  price_overview?: SteamPriceOverview;
  movies?: SteamMovie[];
}

type SteamAppDetailResponse = Record<string, { success: boolean; data?: SteamAppData }>;

export interface SteamInfo {
  price: string | null;
  trailerUrl: string | null;
}

// 제목으로 Steam 상점에서 가장 비슷한 게임을 찾아 가격 + 트레일러를 가져옴
export async function findSteamInfo(title: string): Promise<SteamInfo | null> {
 const searchUrl = `${STEAM_SEARCH_URL}? term=${encodeURIComponent(title)}&l=korean&cc=kr`;
 const searchRes = await fetch(searchUrl);
 if (!searchRes.ok) return null;

 const searchData = (await searchRes.json()) as SteamSearchResponse;
 const match = searchData.items?.[0]; // 검색 결과 중 가장 위에 뜨는 게임을 씀
 if (!match) return null;

 const detailsUrl = `${STEAM_DETAILS_URL}?appids=${match.id}&l=korean&cc=kr`;
 const detailsRes = await fetch(detailsUrl);
 if (!detailsRes.ok) return { price: null, trailerUrl: null };

 const detailsData = (await detailsRes.json()) as SteamAppDetailResponse;
 const appData = detailsData[String(match.id)]?.data;
 if (!appData) return { price: null, trailerUrl: null };

 const price = appData.is_free ? '무료' :
 appData.price_overview?.final_formatted ?? null;

 // movies 중 첫번째 트레일러의 영상 주소를 가져옴
 const firstMovie = appData.movies?.[0];
 const rawTrailerUrl = firstMovie?.mp4?.max ?? firstMovie?.webm?.max ?? null;
 const trailerUrl = rawTrailerUrl ? rawTrailerUrl.replace(/^http:\/\//, 'https://') : null;

 return { price, trailerUrl };
}
