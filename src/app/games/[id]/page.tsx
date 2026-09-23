// 게임 기록 하나의 자세한 정보를 보여주는 상세 화면
import { ObjectId } from 'mongodb'; // MongoDB에서 문서를 id로 찾을 때 쓰는 특수 id 타입
import { notFound } from 'next/navigation'; // id에 해당하는 기록이 없을 때 404 화면 보여주기
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game } from '@/types/game'; // 게임 기록 타입
import DeleteGameButton from '@/components/DeleteGameButton'; // 삭제 버튼
import Link from 'next/link';
import BackButton from '@/components/BackButton';

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

  const youtubeId = game.trailerUrl ? getYoutubeId(game.trailerUrl) : null;

  // 스크린샷을 왼쪽/오른쪽에 번갈아 배치
  const screenshots = game.screenshots ?? [];
  const leftShots = screenshots.filter((_, i) => i % 2 === 0);
  const rightShots = screenshots.filter((_, i) => i % 2 === 1);

  return (
    <main className="min-h-screen bg-stone-50 p-8 flex justify-center">
      <div className="w-full max-w-md">
        <BackButton />

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-6 items-start">
          <div className="flex md:flex-col gap-3 order-2 md:order-1">
            {leftShots.map((url) => (
              <img key={url} src={url} alt="게임 스크린샷" className="rounded-xl border border-stone-200 shadow-sm w-full object-cover" />
            ))}
          </div>
        </div>

        {/* 콘솔 몸체: 두꺼운 테두리 + 안쪽에 밝은 화면부 (검정 대신 하늘색으로) */}
        <div className="rounded-3xl border-4 border-stone-200 bg-white p-1.5 shadow-md">
          <div className="rounded-2xl bg-sky-50 p-6 flex flex-col gap-3">
            {/* 전원 표시등 - 카트리지가 꽂혀서 켜졌다는 느낌 */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-stone-400 tracking-wide">POWER ON</span>
            </div>

            <h1 className="text-xl font-bold text-stone-800">{game.title}</h1>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">{game.platform}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">{game.genre}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[game.status]}`}>{game.status}</span>
            </div>

            <dl className="text-sm text-stone-600 flex flex-col gap-1 mt-1">
              <div className="flex justify-between">
                <dt>시작일</dt>
                <dd>{game.startDate}</dd>
              </div>
              {game.endDate && (
                <div className="flex justify-between">
                  <dt>마지막 플레이</dt>
                  <dd>{game.endDate}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>플레이 시간</dt>
                <dd>{game.playTime}시간</dd>
              </div>
              <div className="flex justify-between">
                <dt>평점</dt>
                <dd>{game.rating} / 5</dd>
              </div>
            </dl>

            {youtubeId && (
              <iframe
                className="mt-2 w-full aspect-video rounded-xl"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="트레일러"
                allowFullScreen
              />
            )}
          </div>
        </div>

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
    </main>
  );
}
