// MongoDB에서 가져온 원본 문서를 Game 타입으로 안전하게 바꿔주는 함수
// 옛 데이터 형태(장르가 genre 하나뿐이거나, 스크린샷이 문자열 배열인 경우)까지 다 처리해서
// 목록/상세/수정 화면이 모두 똑같은 방식으로 변환하도록 공유해서 씀
import type { Document, WithId } from 'mongodb';
import type { Game } from '@/types/game';

export function normalizeGame(doc: WithId<Document>): Game {
  const screenshots = ((doc.screenshots as unknown[]) ?? []).map((s) =>
    typeof s === 'string' ? { url: s } : s
  );

  const genres = Array.isArray(doc.genres) ? doc.genres : doc.genre ? [doc.genre] : [];

  return { ...doc, _id: doc._id.toString(), screenshots, genres } as Game;
}
