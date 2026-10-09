// 제목으로 Steam 상점을 검색하는 API
import { NextResponse } from "next/server";
import { searchSteamStore } from "@/lib/steam";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) return NextResponse.json({ results: [] });

  try {
    const results = await searchSteamStore(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
