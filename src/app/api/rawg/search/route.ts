// 제목으로 RAWG에서 게임을 검색하는 API (/api/rawg/search?q=제목)
import { NextResponse } from 'next/server';
import { searchRawgGames } from '@/lib/rawg';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchRawgGames(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
