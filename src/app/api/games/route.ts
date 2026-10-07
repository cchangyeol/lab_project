// 게임 기록을 저장하는 API(프론트엔드가 fetch로 호출하는 백엔드 API)
import { NextResponse } from 'next/server'; // API 응답을 만들 때 쓰는 도구
import clientPromise from '@/lib/mongodb'; // 아까 만든 MongoDB 연결
import type { Game } from '@/types/game'; // 게임 기록 타입
import { sanitizeGameInput } from '@/lib/validateGame';

// POST 요청이 /api/games로 오면 이 함수 실행
export async function POST(request: Request) {
  const body = await request.json(); // 브라우저가 보낸 JSON을 꺼낸다

  const input = sanitizeGameInput(body); // 허용한 필드/형식인지 확인
  if (!input) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 });
  }

  const client = await clientPromise; // MongoDB 연결을 가져온다
  const db = client.db('game-log'); // game-log라는 데이터베이스를 선택
  const collection = db.collection<Game>('games'); // games라는 컬렉션을 씀

  const result = await collection.insertOne(input as Game); // 검증된 데이터만 저장한다.

  // 저장된 기록의 id를 응답으로 돌려준다
  return NextResponse.json({ id: result.insertedId }, { status: 201 }); // 201 Created 상태 코드와 함께 JSON 응답
}
