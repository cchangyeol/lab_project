// RAWG에서 고른 게임 하나의 상세 정보 + 스크린샷을 가져오는 API
import { NextResponse } from "next/server";
import { getRawgGameDetail } from '@/lib/rawg';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: '잘못된 id입니다.'}, { status: 400 });
  }

  try {
    const detail = await getRawgGameDetail(id);
    return NextResponse.json(detail);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500});
  }
}
