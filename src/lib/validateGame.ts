// 클라이언트가 보낸 값 중 우리가 허용하는 필드/형식만 골라서 돌려줌
// (검사 없이 그대로 DB에 저장하면 엉뚱한 필드나 잘못된 값이 들어갈 수 있어서 저장 전 안전장치로 씀)
import type { Game, GameStatus, Screenshot } from '@/types/game';

const VALID_STATUSES: GameStatus[] = ['하고싶음', '하는중', '클리어', '중단'];

export function sanitizeGameInput(body: unknown): Omit<Game, '_id'> | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.title !== 'string' || b.title.trim() === '') return null;
  if (typeof b.platform !== 'string' || b.platform.trim() === '') return null;
  if (!Array.isArray(b.genres) || b.genres.length === 0) return null;
  if (typeof b.startDate !== 'string') return null;
  if (typeof b.playTime !== 'number' || Number.isNaN(b.playTime)) return null;
  if (typeof b.rating !== 'number' || Number.isNaN(b.rating) || b.rating < 0 || b.rating > 5) return null;
  if (!VALID_STATUSES.includes(b.status as GameStatus)) return null;

  const screenshots: Screenshot[] = Array.isArray(b.screenshots)
    ? b.screenshots
        .filter((s): s is { url: string; note?: unknown } => Boolean(s) && typeof s.url === 'string')
        .map((s) => ({ url: s.url, note: typeof s.note === 'string' ? s.note : undefined }))
    : [];

  return {
    title: b.title,
    platform: b.platform,
    genres: b.genres.filter((g): g is string => typeof g === 'string'),
    startDate: b.startDate,
    endDate: typeof b.endDate === 'string' ? b.endDate : undefined,
    playTime: b.playTime,
    rating: b.rating,
    status: b.status as GameStatus,
    trailerUrls: Array.isArray(b.trailerUrls) ? b.trailerUrls.filter((u): u is string => typeof u === 'string') : [],
    screenshots,
    coverImage: typeof b.coverImage === 'string' ? b.coverImage : undefined,
    summary: typeof b.summary === 'string' ? b.summary : undefined,
    metacritic: typeof b.metacritic === 'number' && !Number.isNaN(b.metacritic) ? b.metacritic : undefined,
    developers: Array.isArray(b.developers) ? b.developers.filter((d): d is string => typeof d === 'string') : undefined,
    publishers: Array.isArray(b.publishers) ? b.publishers.filter((p): p is string => typeof p === 'string') : undefined,
    price: typeof b.price === 'string' ? b.price : undefined,
  };
}
