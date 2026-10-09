// Steam 상점 API를 호출하는 서버 전용 함수들 (가격, 트레일러만)

const STEAM_SEARCH_URL = 'https://store.steampowered.com/api/storesearch';
const STEAM_DETAILS_URL = 'https://store.steampowered.com/api/appdetails';

import { containsHangul, translateToEnglish } from './translate';

interface SteamSearchItem {
  id: number;
}

interface SteamSearchResponse {
  items?: SteamSearchItem[];
}

interface SteamMovie {
  mp4?: { max?: string };
  webm?: { max?: string};
  hls_h264?: string; // steam에서 주는 필드 명
}

interface SteamPriceOverview {
  final_formatted?: string;
}

interface SteamAppData {
  name?: string;
  is_free?: boolean;
  price_overview?: SteamPriceOverview;
  movies?: SteamMovie[];
  header_image?: string;
  short_description?: string;
  genres?: { description?: string }[];
  developers?: string[];
  publishers?: string[];
  metacritic?: { score?: number };
  release_date?: { date?: string };
  screenshots?: { path_full?: string }[];
}

type SteamAppDetailResponse = Record<string, { success: boolean; data?: SteamAppData }>;

export interface SteamInfo {
  price: string | null;
  trailerUrl: string | null;
  playTimeHours: number | null;
}

interface SteamOwnedGame {
  appid: number;
  playtime_forever: number; // 분 단위
}

interface SteamOwnedGamesResponse{
  response?: { game?: SteamOwnedGame[] };
}

async function getSteamPlaytimeHours(appid: number): Promise<number | null> {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;
  if (!apiKey || ! steamId) return null; // 키가 없으면 그냥 건너뜀

  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=0&include_played_free_games=1&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as SteamOwnedGamesResponse;
  const game = data.response?.game?.find((g) => g.appid === appid);
  if (!game) return null;

  return Math.round(game.playtime_forever / 60); // 분 -> 시간
}

// 제목으로 Steam 상점에서 가장 비슷한 게임을 찾아 가격 + 트레일러를 가져옴
export async function findSteamInfo(title: string): Promise<SteamInfo | null> {
 const searchUrl = `${STEAM_SEARCH_URL}?term=${encodeURIComponent(title)}&l=korean&cc=kr`;
 const searchRes = await fetch(searchUrl);
 if (!searchRes.ok) {
   console.error('Steam search 실패', searchRes.status);
   return null;
 }

 const searchData = (await searchRes.json()) as SteamSearchResponse;
 const match = searchData.items?.[0]; // 검색 결과 중 가장 위에 뜨는 게임을 씀
 if (!match) {
   console.error('Steam 검색 결과 없음', title, searchData); // 실제로 뭐가 왔는지 확인
   return null;
 }

 const detailsUrl = `${STEAM_DETAILS_URL}?appids=${match.id}&l=korean&cc=kr`;
 const detailsRes = await fetch(detailsUrl);
 if (!detailsRes.ok) return { price: null, trailerUrl: null, playTimeHours: null };

 const detailsData = (await detailsRes.json()) as SteamAppDetailResponse;
 const appData = detailsData[String(match.id)]?.data;
 if (!appData) return { price: null, trailerUrl: null, playTimeHours: null };

 const price = appData.is_free ? '무료' :
 appData.price_overview?.final_formatted ?? null;

 // movies 중 첫번째 트레일러의 영상 주소를 가져옴
 const firstMovie = appData.movies?.[0];
 const rawTrailerUrl = firstMovie?.mp4?.max ?? firstMovie?.webm?.max ?? firstMovie?.hls_h264 ?? null;
 const trailerUrl = rawTrailerUrl ? rawTrailerUrl.replace(/^http:\/\//, 'https://') : null;

 const playTimeHours = await getSteamPlaytimeHours(match.id);

 return { price, trailerUrl, playTimeHours };
}

export interface SteamLibraryGame {
  appid: number;
  name: string;
  playTimeHours: number;
  iconUrl: string | null;
  lastPlayedAt: string | null;
}

interface SteamOwnedGameFull {
  appid: number;
  name?: string;
  playtime_forever: number;
  img_icon_url?: string;
  rtime_last_played?: number;
}

// 내가 스팀에 보유한 게임 전체 목록 (플레이 시간 많은 순)
export async function getOwnedGamesList(): Promise<SteamLibraryGame[]> {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;
  if (!apiKey || ! steamId) return [];

  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as { response?: { games?: SteamOwnedGameFull[] } };
    const games = data.response?.games ?? [];

    return games
    .map((g) => ({
      appid: g.appid,
      name: g.name ?? `App ${g.appid}`,
      playTimeHours: Math.round(g.playtime_forever / 60),
      iconUrl: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : null,
      lastPlayedAt: g.rtime_last_played && g.rtime_last_played > 0 ? new Date(g.rtime_last_played * 1000).toISOString().slice(0, 10) : null,
    }))
    .sort((a, b) => b.playTimeHours - a.playTimeHours);
  }

  export interface SteamSearchResult {
    appid: number;
    name: string;
    image: string | null;
  }

  // 제목으로 Steam 상점 검색 결과 전체 목록을 돌려줌 (RAWG search와 같은 용도)
export async function searchSteamStore(query: string): Promise<SteamSearchResult[]> {
  const searchQuery = containsHangul (query) ? await translateToEnglish(query) : query;
  const url = `${STEAM_SEARCH_URL}?term=${encodeURIComponent(searchQuery)}&l=korean&cc=kr`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as { items?: { id: number; name: string; tiny_image?: string }[] };
  return (data.items ?? []).map((item) => ({
    appid: item.id,
    name: item.name,
    image: item.tiny_image ?? null,
  }));
}

// "2024년 3월 5일" / "5 Mar, 2024" 같은 Steam 출시일 문자열을 YYYY-MM-DD로 변환
function parseSteamReleaseDate(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export interface SteamGameDetail {
  title: string;
  coverImage: string | null;
  summary: string;
  genreTerms: string[];
  developers: string[];
  publishers: string[];
  metacritic: number | null;
  releaseDate: string | null;
  screenshots: string[];
  price: string | null;
  trailerUrl: string | null;
  sourceUrl: string;
}

// 고른 Steam 게임의 자세한 정보 (RAWG 없이 Steam만으로 폼을 채우는 용도)
export async function getSteamGameDetail(appid: number): Promise<SteamGameDetail | null> {
  const detailsUrl = `${STEAM_DETAILS_URL}?appids=${appid}&l=korean&cc=kr`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) return null;

  const detailsData = (await detailsRes.json()) as SteamAppDetailResponse;
  const appData = detailsData[String(appid)]?.data;
  if (!appData) return null;

  const price = appData.is_free ? '무료' : appData.price_overview?.final_formatted ?? null;

  const firstMovie = appData.movies?.[0];
  const rawTrailerUrl = firstMovie?.mp4?.max ?? firstMovie?.webm?.max ?? firstMovie?.hls_h264 ?? null;
  const trailerUrl = rawTrailerUrl ? rawTrailerUrl.replace(/^http:\/\//, 'https://') : null;

  return {
    title: appData.name ?? '',
    coverImage: appData.header_image ?? null,
    summary: appData.short_description ?? '',
    genreTerms: (appData.genres ?? []).map((g) => g.description).filter((n): n is string => Boolean(n)),
    developers: appData.developers ?? [],
    publishers: appData.publishers ?? [],
    metacritic: appData.metacritic?.score ?? null,
    releaseDate: parseSteamReleaseDate(appData.release_date?.date),
    screenshots: (appData.screenshots ?? []).map((s) => s.path_full).filter((n): n is string => Boolean(n)).slice(0, 12),
    price,
    trailerUrl,
    sourceUrl: `https://store.steampowered.com/app/${appid}`,
  };
}
