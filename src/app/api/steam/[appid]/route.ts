// 고른 Steam 게임 하나의 상세 정보를 가져오는 API
import { NextResponse } from 'next/server';
import { getSteamGameDetail } from '@/lib/steam';

export async function GET(_request: Request, { params }: { params: { appid: string } }) {
  const appid = Number(params.appid);
  if (!Number.isInteger(appid)) {
    return NextResponse.json({ error: '잘못된 id입니다.' }, { status: 400 });
  }

  const detail = await getSteamGameDetail(appid);
  if (!detail) {
    return NextResponse.json({ error: 'Steam 상세 정보를 가져오지 못했습니다.' }, { status: 500 });
  }
  return NextResponse.json(detail);
}
