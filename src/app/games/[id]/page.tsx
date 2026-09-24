// 게임 기록 하나의 자세한 정보를 보여주는 상세 화면
import { ObjectId } from 'mongodb'; // MongoDB에서 문서를 id로 찾을 때 쓰는 특수 id 타입
import { notFound } from 'next/navigation'; // id에 해당하는 기록이 없을 때 404 화면 보여주기
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game, GameStatus } from '@/types/game'; // 게임 기록 타입
import DeleteGameButton from '@/components/DeleteGameButton'; // 삭제 버튼
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import ScreenshotPanel from '@/components/ScreenshotPanel';
import GameConsoleCard from '@/components/GameConsoleCard';


// 목록 화면과 같은 상태 배지 색 (파일이 달라서 똑같이 한 번 더 정의)
const STATUS_STYLES: Record<GameStatus, string> = {
  하고싶음: 'bg-sky-100 text-sky-700',
  하는중: 'bg-amber-100 text-amber-700',
  클리어: 'bg-emerald-100 text-emerald-700',
  중단: 'bg-rose-100 text-rose-700',
};

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

// 주소가 /games/abc123 이면 params.id 자리에 "abc123"이 들어옴
export default async function GameDetailPage({ params }: { params: { id: string }}) {
  const game = await getGame(params.id);

  if (!game) {
    notFound(); // 못 찾으면 Next.js 기본 404 화면을 보여준다
  }

  const trailerIds = (game.trailerUrls ?? [])
    .filter((url): url is string => Boolean(url))
    .map((url) => getYoutubeId(url))
    .filter((id): id is string => Boolean(id));

  // 스크린샷을 왼쪽/오른쪽에 번갈아 배치
  const screenshots = game.screenshots ?? [];

      return (
    <main className="min-h-screen bg-stone-50 p-8">
      <BackButton />

      {/* 사진첩을 펼쳐놓은 것처럼 왼쪽 정보 / 오른쪽 사진 2단 구성 */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-md md:flex overflow-hidden">
        <div className="p-6 md:w-1/2">
          <GameConsoleCard game={game} trailerIds={trailerIds} />

          <div className="flex gap-2 mt-4">
            <Link
              href={`/games/${game._id}/edit`}
              className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-2 text-sm font-medium transition"
            >
              수정
            </Link>
            <DeleteGameButton gameId={game._id!} />
          </div>
        </div>

        {/* 책등처럼 보이는 가운데 구분선 (좁은 화면에서는 안 보임) */}
        <div className="hidden md:block w-px bg-stone-200" />

        <div className="p-6 md:w-1/2 bg-stone-50">
          <ScreenshotPanel screenshots={screenshots} />
        </div>
      </div>
    </main>
  );
}
