// RAWG 게임 데이터베이스 API를 호출하는 서버 전용 함수들
// https:rawg.io/apidocs

const RAWG_BASE_URL = 'https://api.rawg.io/api';

function getApiKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error('RAWG_API_KEY 환경변수가 설정되지 않았습니다.');
  return key;
}

interface RawgApiPlatformWrapper {
  platform?: { name?: string };
}

interface RawgApiGameSummary {
  id: number;
  name: string;
  released?: string | null;
  background_image?: string | null;
  platforms?: RawgApiPlatformWrapper[];
}

interface RawgApiSearchResponse {
  results?: RawgApiGameSummary[];
}

export interface RawgSearchResult {
  id: number;
  name: string;
  released?: string | null;
  backgroundImage?: string | null;
  platforms: string[];
}

// 한글이 섞여 있으면 번역
function containsHangul(text: string): boolean {
  return /[\uac00-\ud7a3]/.test(text);
}

// 키 없이 쓸 수 있는 무료 번역 API
async function translateText(text: string, langpair: string): Promise<string> {
  if(!text.trim()) return text;
  try{
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
    if(!res.ok) return text;
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text; // 번역 API가 죽어도 검색 자체는 계속됨
  }
}

function translateToEnglish(text: string): Promise<string> {
  return translateText(text, 'ko|en');
}

function translateToKorean(text: string): Promise<string> {
  return translateText(text, 'en|ko');
}

// 제목으로 게임을 검색해서 후보 목록을 돌려줌
export async function searchRawgGames(query: string): Promise<RawgSearchResult[]> {
  const key = getApiKey();
  const searchQuery = containsHangul(query) ? await translateToEnglish(query) : query;
  const url = `${RAWG_BASE_URL}/games?key=${key}&search=${encodeURIComponent(searchQuery)}&page_size=10`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG API 호출 실패: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as RawgApiSearchResponse;

  return (data.results ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    released: g.released,
    backgroundImage: g.background_image,
    platforms: (g.platforms ?? []).map((p) => p.platform?.name).filter((n): n is string => Boolean(n)),
  }));
}

interface RawgApiNamed {
  name?: string;
}

interface RawgApiGameDetail {
  name: string;
  released?: string | null;
  background_image?: string | null;
  description_raw?: string;
  metacritic?: number | null;
  platforms?: RawgApiPlatformWrapper[];
  genres?: RawgApiNamed[];
  tags?: RawgApiNamed[];
  developers?: RawgApiNamed[];
  publishers?: RawgApiNamed[];
  clip?: RawgApiClip | null;
  slug?: string;
}

interface RawgApiScreenshot {
  image?: string;
}

interface RawgApiScreenshotsResponse {
  results?: RawgApiScreenshot[];
}

interface RawgApiClip {
  clip?: string;
  video?: string;
}

export interface RawgGameDetail {
  title: string;
  released: string | null;
  coverImage: string | null;
  summary: string;
  metacritic: number | null;
  platforms: string[];
  genreTerms: string[]; // 장르와 태그를 합쳐서 돌려줌
  developers: string[];
  publishers: string[];
  screenshots: string[];
  trailerUrl: string | null;
  sourceUrl: string | null;
}

// 고른 게임의 자세한 정보(장르, 평점, 개발사 등)와 스크린샷을 가져옴
export async function getRawgGameDetail(id: number): Promise<RawgGameDetail> {
  const key = getApiKey();

  const [detailRes, screenshotsRes] = await Promise.all([
    fetch(`${RAWG_BASE_URL}/games/${id}?key=${key}`),
    fetch(`${RAWG_BASE_URL}/games/${id}/screenshots?key=${key}`),
  ]);

  if (!detailRes.ok) throw new Error('RAWG API 게임 상세 호출 실패.');
  const detail = (await detailRes.json()) as RawgApiGameDetail;
  const screenshotsData = screenshotsRes.ok ? ((await screenshotsRes.json()) as RawgApiScreenshotsResponse) : { results: [] };

  const genreNames = (detail.genres ?? []).map((g) => g.name).filter((n): n is string => Boolean(n));
  const tagNames = (detail.tags ?? []).map((t) => t.name).filter((n): n is string => Boolean(n));

  // MyMemory 무료 티어는 한 번에 보낼 수 있는 글자 수 제한이 있어서, 번역 전에 먼저 적당히 자름
  const summaryEn = (detail.description_raw ?? '').slice(0, 450);
  const summary = await translateToKorean(summaryEn);

  return {
    title: detail.name,
    released: detail.released ?? null,
    coverImage: detail.background_image ?? null,
    summary,
    metacritic: detail.metacritic ?? null,
    platforms: (detail.platforms ?? []).map((p) => p.platform?.name).filter((n): n is string => Boolean(n)),
    genreTerms: [...genreNames, ...tagNames],
    developers: (detail.developers ?? []).map((d) => d.name).filter((n): n is string => Boolean(n)),
    publishers: (detail.publishers ?? []).map((p) => p.name).filter((n): n is string => Boolean(n)),
    screenshots: (screenshotsData.results ?? []).map((s) => s.image).filter((n): n is string => Boolean(n)).slice(0, 12),
    trailerUrl: detail.clip?.clip ?? detail.clip?.video ?? null,
    sourceUrl: detail.slug ? `https://rawg.io/games/${detail.slug}` : null,
  };
}
