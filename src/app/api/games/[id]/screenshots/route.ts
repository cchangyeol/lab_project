// 게임 기록의 스크린샷 목록만 업데이트하는 API
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body: { screenshots: string[] }= await request.json();

  const client = await clientPromise;
  const db = client.db('game-log');

  await db.collection('games').updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { screenshots: body.screenshots } }
  );

  return NextResponse.json({ ok: true });
}
