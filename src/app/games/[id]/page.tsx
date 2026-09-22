// 게임 기록 하나의 자세한 정보를 보여주는 상세 화면
import { ObjectId } from 'mongodb'; // MongoDB에서 문서를 id로 찾을 때 쓰는 특수 id 타입
import { notFound } from 'next/navigation'; // id에 해당하는 기록이 없을 때 404 화면 보여주기
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game } from '@/types/game'; // 게임 기록 타입

// 트레일러 링크에서 유튜브 영상 id만 뽑아내는 함수
function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url); // 주소를 분석하기 쉬운 형태로 바꾼다
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1); // youtu.be/영상id 형태에서 맨 앞 슬래시(/)만 뗀다.
    }
    return parsed.searchParams.get('v'); // watch?v=영상id 형태에서 v 파라미터를 가져온다.
  } catch {
    return null; // 주소가 이상하면 링크가 없는 걸로 처리
  }
}

// 서버에서 실행되는 함수라 DB에 바로 접근 가능
async function getGame(id: string): Promise<Game | null> {
  const client = await clientPromise;
  const db = client.db('game-log');

  const game = await db.collection('games').findOne({ _id: new ObjectId(id) });
  // id로 문서 하나 찾기
  if (!game) return null;

  return { ...game, _id: game._id.toString() } as Game;
}

// 주소가 /games/abc123 이면 params.id 자리에 "abc123"이 들어온다
export default async function GameDetailPage({ params }: { params: { id: string }}) {
  const game = await getGame(params.id);

  if (!game) {
    notFound(); // 못 찾으면 Next.js 기본 404 화면을 보여준다
  }

  const youtubeId = game.trailerUrl ?getYoutubeId(game.trailerUrl) : null;

  return (
    <main className="p-8 max-w-md flex flex-col gap-2">
      <h1 className="text-xl font-bold">{game.title}</h1>
      <p>플랫폼: {game.platform}</p>
      <p>상태: {game.status}</p>
      <p>시작일: {game.startDate}</p>
      {game.endDate && <p>마지막 플레이: {game.endDate}</p>}
      <p>플레이 시간: {game.playTime}시간</p>
      <p>평점: {game.rating} / 5</p>

      {youtubeId && (
        <iframe
          className="mt-4 w-full aspect-video"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="트레일러"
          allowFullScreen
        />
      )}
    </main>
  );
}
