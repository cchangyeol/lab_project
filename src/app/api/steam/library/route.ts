// 내 Steam 라이브러리 전체 목록을 가져오는 API
import { NextResponse } from 'next/server';
import { getOwnedGamesList } from '@/lib/steam';

export async function GET() {
  try {
    const games = await getOwnedGamesList();
    return NextResponse.json({ games });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
