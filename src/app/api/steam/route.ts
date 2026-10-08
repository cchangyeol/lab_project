// 제목으로 Steam 상점에서 가격·트레일러를 가져오는 API
import { NextResponse } from "next/server";
import { findSteamInfo } from "@/lib/steam";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim();

  if (!title) {
    return NextResponse.json({ result: null });
  }

  const result = await findSteamInfo(title);
  return NextResponse.json({ result });
}
