// 게임물관리위원회(GRAC) 공식 게임 등급 정보를 게임명으로 검색하는 API
// 사용자가 등록 화면에서 "검색" 버튼을 눌렀을 때만 호출됨
import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import type { GracItem } from '@/lib/gracMapping';

interface GracXmlResult {
  result?: {
    item?: GracItem | GracItem[];
  };
  error?: {
    message: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gametitle = searchParams.get('title')?.trim() ?? '';

  if (!gametitle) {
    return NextResponse.json({ items: [] });
  }

  const gracUrl = `https://www.grac.or.kr/WebService/GameSearchSvc.asmx/game?gametitle=${encodeURIComponent(gametitle)}&display=10&pageno=1`;

  const res = await fetch(gracUrl);
  const xmlText = await res.text();

  const parser = new XMLParser();
  let parsed: GracXmlResult;
  try {
    parsed = parser.parse(xmlText) as GracXmlResult;
  } catch {
    return NextResponse.json({ items: [], error: 'API 응답을 해석하지 못했습니다.' });
  }

  // 요청이 잘못됐을 때 GRAC가 error 형식으로 돌려줌
  if (parsed.error) {
    return NextResponse.json({ items: [], error: parsed.error.message as string});
  }

  const rawItems = parsed.result?.item ?? [];

  // 검색 결과가 1건이면 배열이 아니라 객체 하나로 오기 떄문에 배열로 맞춰줌
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return NextResponse.json({ items });
}
