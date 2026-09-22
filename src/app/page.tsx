// 저장된 게임 기록을 카드 목록으로 보여주는 화면
import Link from 'next/link'; // 카드를 누르면 다른 페이지로 이동시키는 링크 컴포넌트
import clientPromise from '@/lib/mongodb'; // MongoDB 연결
import type { Game } from '@/types/game'; // 게임 기록 타입


// 서버에서 실행되는 함수라 DB에 바로 접근 가능 (API를 안 거쳐도 됨)
async function getGames(): Promise<Game[]> {
  const client = await clientPromise; // MongoDB 연결 가져오기
  const db = client.db('game-log'); // game-log라는 데이터베이스 선택
  const games = await db.collection('games').find().toArray(); // games 컬렉션의 모든 문서를 배열로 가져옴

  // MongoDB에서 가져온 데이터는 _id가 ObjectId 타입이라서, 문자열로 변환해주어야 함
  return games.map((game) => ({
    ...game,
    _id: game._id.toString(),
  })) as Game[]; // Game 타입으로 변환
}

// 페이지 컴포넌트도 async로 만들면 그 안에서 await로 데이터를 먼저 가져올 수 있음
export default async function HomePage() {
  const games = await getGames(); // 화면을 그리기 전에 목록부터 가져온다.

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">게임 기록</h1>
        <Link href="/games/new" className="underline bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          새 게임 추가
        </Link>
      </div>

      {games.length === 0 ? (
        <p>아직 등록된 기록이 없습니다.</p>
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
