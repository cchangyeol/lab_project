// 저장된 게임 기록을 카드 목록으로 보여주는 화면
import Link from 'next/link'; // 카드를 누르면 다른 페이지로 이동시키는 링크 컴포넌트
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import { normalizeGame } from '@/lib/normalizeGame';
import GameCard from '@/components/GameCard'; // 게임 기록 카드 컴포넌트
import LogoutButton from '@/components/LogoutButton';
import GameFilterForm from '@/components/GameFilterForm';


// 검색어에 정규식 특수문자(., *, (, ? 등)가 들어있으면 그대로 문자로 취급하게 함
// (안 하면 "잘못된 정규식"으로 $regex 조회 자체가 에러를 던짐)
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const COLS_OPTIONS = [2, 3, 4, 5, 6] as const;
const DEFAULT_COLS = 3;

// Tailwind가 클래스를 인식하려면 이름이 코드에 그대로 있어야 해서, 숫자로 동적 조합하지 않고 고정 매핑을 씀
const COLS_CLASS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
};

// 현재 검색/필터 조건은 그대로 두고 cols 값만 바꾼 주소를 만듦
function buildHrefWithCols(params: SearchParams, cols: number): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status);
  if (params.platform) sp.set('platform', params.platform);
  if (params.sort) sp.set('sort', params.sort);
  const genres = Array.isArray(params.genre) ? params.genre : params.genre? [params.genre] : [];
  genres.forEach((g) => sp.append('genre', g));
  sp.set('cols', String(cols));
  return `/?${sp.toString()}`;
}

type SearchParams = {
  q?: string;
  status?: string;
  platform?: string;
  genre?: string | string[];
  sort?: string;
  cols?: string;
}

// 서버에서 실행되는 함수라 DB에 바로 접근 가능 (API를 안 거쳐도 됨)
// 검색어/필터/정렬 조건에 맞는 게임 기록을 DB에서 가져온다
async function getGames(params: SearchParams): Promise<Game[]> {
  const client = await clientPromise;
  const db = client.db('game-log');

  // 값이 있는 조건만 필터에 추가 (없으면 그 조건은 무시)
  const filter: Record<string, unknown> = {};
  if (params.q) filter.title = { $regex: escapeRegExp(params.q), $options: 'i' };
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

  return games.map(normalizeGame); // 옛 데이터(문자열 스크린샷, genre 하나뿐 등)도 같은 방식으로 변환
}

// 필터 드롭다운에 쓸 플랫폼/장르 목록을 DB에 실제로 저장된 값들에서 뽑아온다
async function getFilterOptions(){
  const client = await clientPromise;
  const db = client.db('game-log');

  const platforms = await db.collection('games').distinct('platform') // 중복 없이 값만 가져옴

  return { platforms };
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  // 목록 데이터와 필터 옵션을 동시에 가져옴 (서로 가져올 필요 없이 같이 처리
  const [games, { platforms }] = await Promise.all([
    getGames(searchParams),
    getFilterOptions(),
   ]);

   const requestedCols = Number(searchParams.cols);
   const cols = (COLS_OPTIONS as readonly number[]).includes(requestedCols)? requestedCols : DEFAULT_COLS;

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
        <div className="flex items-center gap-4">
          <LogoutButton />
          <Link
            href="/games/new"
            className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-5 py-2.5 text-sm font-semibold transition"
          >
            + 새 기록
          </Link>
        </div>
      </div>

      <GameFilterForm
       q={searchParams.q ?? ''}
       sort={searchParams.sort ?? ''}
       status={searchParams.status ?? ''}
       platform={searchParams.platform ?? ''}
       platforms={platforms}
       selectedGenres={selectedGenres}
       cols={cols}
       />

      <div className="flex items-center justify-end gap-1 mb-3">
        <span className="text-xs text-stone-400 mr-1">한 줄에 보기</span>
        {COLS_OPTIONS.map((n) => (
          <Link
            key={n}
            href={buildHrefWithCols(searchParams, n)}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-xs border transition ${
              cols === n
                ? 'bg-sky-200 border-sky-300 text-sky-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
          >
            {n}
          </Link>
        ))}
      </div>

      {games.length === 0 ? (
        <p className="text-stone-500">조건에 맞는 기록이 없습니다.</p>
      ) : (
        <div className={`grid grid-cols-2 ${COLS_CLASS[cols]} gap-x-4 gap-y-8"`}>
          {games.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
