// 저장된 게임 기록을 카드 목록으로 보여주는 화면
import Link from 'next/link'; // 카드를 누르면 다른 페이지로 이동시키는 링크 컴포넌트
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game, GameStatus } from '@/types/game'; // 게임 기록 타입
import { GENRE_OPTIONS } from '@/types/game';
import GameCard from '@/components/GameCard'; // 게임 기록 카드 컴포넌트


type SearchParams = {
  q?: string;
  status?: string;
  platform?: string;
  genre?: string | string[];
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

  // 고른 장르 중 하나라도 겹치면 걸리게 함
  const selectedGenres = Array.isArray(params.genre) ? params.genre : params.genre ? [params.genre] : [];
if (selectedGenres.length > 0 ) filter.genres = { $in: selectedGenres };

  // 정렬 기준 고르기 (아무것도 안 고르면 정렬 안 함)
  let sort: Record<string, 1 | -1> = {};
  if (params.sort === 'rating') sort = { rating: -1 };  // 평점 높은 순
  else if (params.sort === 'title') sort = { title: 1 }; // 이름 가나다순
  else if (params.sort === 'recent') sort = { endDate: -1 }; // 최근에 플레이한 순

  const games = await db.collection('games').find(filter).sort(sort).toArray();

  return games.map((game) => ({
    ...game,
    _id: game._id.toString(),
    genres: Array.isArray(game.genres) ? game.genres : game.genre ? [game.genre] : [],
  })) as Game[];
}

// 필터 드롭다운에 쓸 플랫폼/장르 목록을 DB에 실제로 저장된 값들에서 뽑아온다
async function getFilterOptions(){
  const client = await clientPromise;
  const db = client.db('game-log');

  const platforms = await db.collection('games').distinct('platform') // 중복 없이 값만 가져옴

  return { platforms };
}
const STATUS_OPTIONS: GameStatus[] = ['하고싶음', '하는중', '클리어', '중단'];

// select 박스 공통 스타일
const selectClass = 'appearance-none bg-stone-50 border border-stone-200 rounded-xl pl-3 pr-7 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focusborder-sky-300 transition cursor-pointer';

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  // 목록 데이터와 필터 옵션을 동시에 가져옴 (서로 가져올 필요 없이 같이 처리
  const [games, { platforms }] = await Promise.all([
    getGames(searchParams),
    getFilterOptions(),
   ]);

   // 새로고침해도 체크박스 상태가 유지되도록 현재 선택된 장르를 미리 계산
  const selectedGenres = Array.isArray(searchParams.genre)
    ? searchParams.genre
    : searchParams.genre
    ? [searchParams.genre]
    : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">게임 기록</h1>
        <Link
          href="/games/new"
          className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-5 py-2.5 text-sm font-semibold transition"
        >
          + 새 기록
        </Link>
      </div>

      <form method="get" className="mb-8 bg-white border border-stone-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        {/* 1줄: 검색어 + 정렬 + 적용 */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            name="q"
            placeholder="게임명으로 검색"
            defaultValue={searchParams.q ?? ''}
            className="flex-1 min-w-[160px] bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition"
          />

          <div className="relative">
            <select name="sort" defaultValue={searchParams.sort ?? ''} className={selectClass}>
              <option value="">정렬: 기본</option>
              <option value="rating">평점 높은 순</option>
              <option value="title">이름 가나다순</option>
              <option value="recent">최근 플레이한 순</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
          </div>

          <button
            type="submit"
            className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-xl px-5 py-2 text-sm font-semibold transition"
          >
            적용
          </button>
        </div>

        {/* 2줄: 상태 / 플랫폼 / 장르 - 구분선으로 분리 */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
          <div className="relative">
            <select name="status" defaultValue={searchParams.status ?? ''} className={selectClass}>
              <option value="">상태 전체</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
          </div>

          <div className="relative">
            <select name="platform" defaultValue={searchParams.platform ?? ''} className={selectClass}>
              <option value="">플랫폼 전체</option>
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
          </div>

          <div className="w-px h-6 bg-stone-200 mx-1" />

          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map((g) => (
              <label
                key={g}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 text-stone-600 has-[:checked]:bg-sky-200 has-[:checked]:border-sky-300 has-[:checked]:text-sky-900 cursor-pointer transition"
              >
                <input type="checkbox" name="genre" value={g} defaultChecked={selectedGenres.includes(g)} className="hidden" />
                {g}
              </label>
            ))}
          </div>
        </div>
      </form>

      {games.length === 0 ? (
        <p className="text-stone-500">조건에 맞는 기록이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
          {games.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
