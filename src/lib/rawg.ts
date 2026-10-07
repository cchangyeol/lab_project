// RAWG 게임 데이터베이스 API를 호출하는 서버 전용 함수들
// https://rawg.io/apidocs

const RAWG_BASE_URL = 'https://api.rawg.io/api';

function getApiKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error('RAWG_API_KEY가 설정되지 않았습니다.');
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
  released: string | null;
  backgroundImage: string | null;
  platforms: string[];
}

// 제목으로 게임을 검색해서 후보 목록을 돌려줌 (사용자가 그 중 하나를 고름)
export async function searchRawgGames(query: string): Promise<RawgSearchResult[]> {
  const key = getApiKey();
  const url = `${RAWG_BASE_URL}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=8`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('RAWG 검색에 실패했습니다.');
  const data = (await res.json()) as RawgApiSearchResponse;

  return (data.results ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    released: g.released ?? null,
    backgroundImage: g.background_image ?? null,
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
}

interface RawgApiScreenshot {
  image?: string;
}

interface RawgApiScreenshotsResponse {
  results?: RawgApiScreenshot[];
}

export interface RawgGameDetail {
  title: string;
  released: string | null;
  coverImage: string | null;
  summary: string;
  metacritic: number | null;
  platforms: string[];
  genreTerms: string[]; // genres + tags를 합쳐서 돌려줌 (장르 매칭에 같이 씀)
  developers: string[];
  publishers: string[];
  screenshots: string[];
}

// 고른 게임의 자세한 정보(장르, 평점, 개발사 등)와 스크린샷을 가져옴
export async function getRawgGameDetail(id: number): Promise<RawgGameDetail> {
  const key = getApiKey();

  const [detailRes, screenshotsRes] = await Promise.all([
    fetch(`${RAWG_BASE_URL}/games/${id}?key=${key}`),
    fetch(`${RAWG_BASE_URL}/games/${id}/screenshots?key=${key}`),
  ]);

  if (!detailRes.ok) throw new Error('RAWG 상세 정보를 가져오지 못했습니다.');
  const detail = (await detailRes.json()) as RawgApiGameDetail;
  const screenshotsData = screenshotsRes.ok ? ((await screenshotsRes.json()) as RawgApiScreenshotsResponse) : { results: [] };

  const genreNames = (detail.genres ?? []).map((g) => g.name).filter((n): n is string => Boolean(n));
  const tagNames = (detail.tags ?? []).map((t) => t.name).filter((n): n is string => Boolean(n));

  return {
    title: detail.name,
    released: detail.released ?? null,
    coverImage: detail.background_image ?? null,
    summary: (detail.description_raw ?? '').slice(0, 500), // 너무 길면 자름
    metacritic: detail.metacritic ?? null,
    platforms: (detail.platforms ?? []).map((p) => p.platform?.name).filter((n): n is string => Boolean(n)),
    genreTerms: [...genreNames, ...tagNames],
    developers: (detail.developers ?? []).map((d) => d.name).filter((n): n is string => Boolean(n)),
    publishers: (detail.publishers ?? []).map((p) => p.name).filter((n): n is string => Boolean(n)),
    screenshots: (screenshotsData.results ?? []).map((s) => s.image).filter((n): n is string => Boolean(n)).slice(0, 12),
  };
}
