// 게임 기록 하나를 id로 찾아 삭제하는 API
import { ObjectId } from 'mongodb' // 문자열 id를 MongoDB가 쓰는 id 형태로 바꿔주는 도구
import { NextResponse } from 'next/server' // API 응답을 만들 때 쓰는 도구
import clientPromise from '@/lib/mongodb' // MongoDB 연결

// DELETE 요청이 /api/games/어떤id 로 오면 이 함수가 실행
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const client = await clientPromise; // 연결이 끝날 때 까지 기다림
  const db = client.db('game-log'); // game-log 데이터베이스 연결

  await db.collection('games').deleteOne({ _id: new ObjectId(params.id) }); // 해당 id의 문서 하나 삭제

  return NextResponse.json({ ok: true }); // 삭제됐다고 응답
}
