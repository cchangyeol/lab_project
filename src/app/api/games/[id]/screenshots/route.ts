// 게임 기록의 스크린샷 목록만 업데이트하는 API
import { ObjectId } from 'mongodb';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

function extractUrls(screenshots: unknown): string[] {
  if (!Array.isArray(screenshots)) return [];
  return screenshots
    .map((s) => (typeof s === 'string' ? s : (s as { url?: string })?.url))
    .filter((url): url is string => Boolean(url));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: '잘못된 id입니다.' }, { status: 400 });
  }

  const body = await request.json();
  if (!Array.isArray(body?.screenshots)) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 });
  }

  const screenshots = (body.screenshots as unknown[]).filter(
    (s): s is { url: string; note?: string } => Boolean(s) && typeof (s as { url?: unknown }).url === 'string'
  );

  const client = await clientPromise;
  const db = client.db('game-log');

  const existing = await db.collection('games').findOne({ _id: new ObjectId(params.id) });

  await db.collection('games').updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { screenshots } }
  );

  // 목록에서 빠진 사진은 Blob에서도 같이 지움 (안 지우면 파일만 계속 쌓임)
  const oldUrls = new Set(extractUrls(existing?.screenshots));
  const newUrls = new Set(extractUrls(screenshots));
  const removedUrls = Array.from(oldUrls).filter((url) => !newUrls.has(url));
  if (removedUrls.length > 0) {
    await del(removedUrls).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
