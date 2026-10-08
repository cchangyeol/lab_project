// 게임 기록을 수정하는 화면. DB에서 기존 값을 가져와 GameForm에 미리 채워둠
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import type { Game } from '@/types/game';
import { normalizeGame } from '@/lib/normalizeGame';
import GameForm from '@/components/GameForm';

// 상세 페이지의 getGame과 같은 방식 (서버에서 직접 DB 조회)
async function getGame(id: string): Promise<Game | null> {
  if (!ObjectId.isValid(id)) return null;

  const client = await clientPromise;
  const db = client.db('game-log');

  const game = await db.collection('games').findOne({ _id: new ObjectId(id) });
  if (!game) return null;

  return normalizeGame(game);
}

export default async function EditGamePage({ params }: { params: { id: string }}) {
  const game = await getGame(params.id);

  if (!game) {
    notFound();
  }

  return <GameForm game={game} />; // 가져온 기존 값을 폼에 넘겨줌
}
