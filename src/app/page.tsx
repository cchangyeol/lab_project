// 저장된 게임 기록을 카드 목록으로 보여주는 화면
import Link from 'next/link'; // 카드를 누르면 다른 페이지로 이동시키는 링크 컴포넌트
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game, GameStatus } from '@/types/game'; // 게임 기록 타입


type SearchParams = {
  q?: string;
  status?: string;
  platform?: string;
  genre?: string;
  sort?: string;
}

// 서버에서 실행되는 함수라 DB에 바로 접근 가능 (API를 안 거쳐도 됨)
// 검색어/필터/정렬 조건에 맞는 게임 기록을 DB에서 가져온다
async function getGames(params: SearchParams): Promise<Game[]> {
  const client = await clientPromise;
  const db = client.db('game-log');

  // 값이 있는 조건만 필터에 추가 (없으면 그 조건은 무시)
  const filter: Record<string, unknown> = {};
  if (params.q) filter.title = { $regex: params.q, $options: 'i' };
  if (params.status) filter.status = params.status
  if (params.platform) filter.platform = params.platform;
  if (params.genre) filter.genre = params.genre;

  // 정렬 기준 고르기 (아무것도 안 고르면 정렬 안 함)
  let sort: Record<string, 1 | -1> = {};
  if (params.sort === 'rating') sort = { rating: -1 };  // 평점 높은 순
  else if (params.sort === 'title') sort = { title: 1 }; // 이름 가나다순
  else if (params.sort === 'recent') sort = { endDate: -1 }; // 최근에 플레이한 순

  const games = await db.collection('games').find(filter).sort(sort).toArray();

  return games.map((game) => ({
    ...game,
    _id: game._id.toString(),
  })) as Game[];
}

// 필터 드롭다운에 쓸 플랫폼/장르 목록을 DB에 실제로 저장된 값들에서 뽑아온다
async function getFilterOptions(){
  const client = await clientPromise;
  const db = client.db('game-log');

  const platforms = await db.collection('games').distinct('platform') // 중복 없이 값만 가져옴
  const genres = await db.collection('games').distinct('genre');

  return { platforms, genres };
}
const STATUS_OPTIONS: GameStatus[] = ['하고싶음', '하는중', '클리어', '중단'];

// 상태별 배지 색깔 - 파스텔 톤으로 하나씩 지정
const STATUS_STYLES: Record<GameStatus, string> = {
  하고싶음: 'bg-sky-100 text-sky-700',
  하는중: 'bg-amber-100 text-amber-700',
  클리어: 'bg-emerald-100 text-emerald-700',
  중단: 'bg-rose-100 text-rose-700',
};

// 페이지 컴포넌트도 async로 만들면 그 안에서 await로 데이터를 먼저 가져올 수 있음
// searchParams는 주소창의 ?q=값 부분을 Next.js가 자동으로 이 함수에 넘겨줌
export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {

  // 목록 데이터와 필터 옵션을 동시에 가져옴 (서로 가져올 필요 없이 같이 처리
  const [games, { platforms, genres }] = await Promise.all([
    getGames(searchParams),
    getFilterOptions(),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">게임 기록</h1>
        <Link
          href="/games/new"
          className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-3xl px-4 py-2 text-sm font-medium transition ">
          + 새 기록
        </Link>
      </div>

      <form method="get" className="mb-8 flex flex-wrap gap-2 items-center bg-white border border-stone-200 rounded-2xl p-3">
        <input
          type="text"
          name="q"
          placeholder="게임명으로 검색"
          defaultValue={searchParams.q ?? ''}
          className="border border-stone-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
        />

        <select name="status" defaultValue={searchParams.status ?? ''}
        className="border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-600">
          <option value="">상태 전체</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select name="platform" defaultValue={searchParams.platform ?? ''}
        className="border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-600">
          <option value="">플랫폼 전체</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select name="genre" defaultValue={searchParams.genre ?? ''}
        className="border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-600">
          <option value="">장르 전체</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select name="sort" defaultValue={searchParams.sort ?? ''}
        className="border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-600">
          <option value="">정렬: 기본</option>
          <option value="rating">평점 높은 순</option>
          <option value="title">이름 가나다순</option>
          <option value="recent">최근 플레이한 순</option>
        </select>

        <button type="submit"
        className="ml-auto bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-1.5 text-sm font-medium transition">적용</button>
      </form>

      {games.length === 0 ? (
        <p className="text-stone-500">조건에 맞는 기록이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
          {games.map((game) => (
            <Link
              key={game._id}
              href={`/games/${game._id}`}
              className="group relative bg-white rounded-2xl border border-stone-200 shadow-sm p-5 pt-7 flex flex-col gap-2 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 rounded-b-md bg-stone-200 group-hover:bg-sky-200 transition" />

              <span className="font-bold text-stone-800">{game.title}</span>
              <span className="text-sm text-stone-500">{game.platform} · {game.genre}</span>
              <span className={`self-start text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[game.status]}`}>{game.status}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
