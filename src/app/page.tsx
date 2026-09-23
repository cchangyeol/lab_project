// 저장된 게임 기록을 카드 목록으로 보여주는 화면
import Link from 'next/link'; // 카드를 누르면 다른 페이지로 이동시키는 링크 컴포넌트
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game } from '@/types/game'; // 게임 기록 타입


// 서버에서 실행되는 함수라 DB에 바로 접근 가능 (API를 안 거쳐도 됨)
// q(검색어)가 있으면 게임명에 그 글자가 들어간 것만, 없으면 전체를 가져옴
async function getGames(q?: string): Promise<Game[]> {
  const client = await clientPromise;
  const db = client.db('game-log');

  // $regex: 게임명에 검색어가 포함되어 있는지 찾는다. $options: 'i'는 대소문자 구분 안 함
  const filter = q ? { title: { $regex: q, $options: 'i' } } : {};

  const games = await db.collection('games').find(filter).toArray();

  return games.map((game) => ({
    ...game,
    _id: game._id.toString(),
  })) as Game[];
}

// 페이지 컴포넌트도 async로 만들면 그 안에서 await로 데이터를 먼저 가져올 수 있음
// searchParams는 주소창의 ?q=값 부분을 Next.js가 자동으로 이 함수에 넘겨줌
export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const games = await getGames(searchParams.q);

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">게임 기록</h1>
        <Link href="/games/new" className="underline bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          새 게임 추가
        </Link>
      </div>

      <form method="get" className="mb-6">
        <input
          type="text"
          name="q" // 이 이름이 그대로 주소의 ?q값 에서 키(q)가 됨
          placeholder="게임명으로 검색"
          defaultValue={searchParams.q ?? ''} // 검색한 뒤에도 입력했던 검색어가 그대로 남아있음

          className="border px-2 py-1"
        />
        <button type="submit" className="ml-2 underline">검색</button>
      </form>

      {games.length === 0 ? (
        <p>{searchParams.q ? '검색 결과가 없습니다.' : '아직 등록된 기록이 없습니다.'}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {games.map((game) => (
            <Link
              key={game._id}
              href={`/games/${game._id}`} // 게임 상세 페이지로 이동하는 링크
              className="border p-4 rounded flex flex-col gap-1 hover:shadow-lg transition"
            >
              <span className="font-bold">{game.title}</span>
              <span className="text-sm text-gray-500">{game.platform}</span>
              <span className="text-xs">{game.status}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
