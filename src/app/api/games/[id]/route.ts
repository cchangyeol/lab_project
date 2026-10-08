// 게임 기록 하나를 id로 찾아 수정/삭제하는 API
import { ObjectId } from 'mongodb' // 문자열 id를 MongoDB가 쓰는 id 형태로 바꿔주는 도구
import { del } from '@vercel/blob'
import { NextResponse } from 'next/server' // API 응답을 만들 때 쓰는 도구
import clientPromise from '@/lib/mongodb' // MongoDB 연결
import { sanitizeGameInput } from '@/lib/validateGame';

// 스크린샷 목록(문자열 배열이던 옛 형태까지 포함)에서 Blob 주소만 뽑아냄
function extractScreenshotUrls(screenshots: unknown): string[] {
  if (!Array.isArray(screenshots)) return [];
  return screenshots
    .map((s) => (typeof s === 'string' ? s : (s as { url?: string })?.url))
    .filter((url): url is string => Boolean(url));
}

// DELETE 요청이 /api/games/어떤id 형식으로 오면 이 함수가 실행
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: '잘못된 id입니다.' }, { status: 400 });
  }

  const client = await clientPromise; // 연결이 끝날 때 까지 기다림
  const db = client.db('game-log'); // game-log 데이터베이스 연결

  const game = await db.collection('games').findOne({ _id: new ObjectId(params.id) });
  await db.collection('games').deleteOne({ _id: new ObjectId(params.id) }); // 해당 id의 문서 하나 삭제

  // 기록을 지웠으면 거기 달려있던 스크린샷 파일도 Vercel Blob에서 같이 지움 (안 지우면 파일만 계속 쌓임)
  const urls = extractScreenshotUrls(game?.screenshots);
  if (urls.length > 0) {
    await del(urls).catch(() => {}); // 파일 삭제가 실패해도 기록 삭제 자체는 이미 끝났으니 무시
  }

  return NextResponse.json({ ok: true }); // 삭제됐다고 응답
}

// PUT 요청이 /api/games/어떤id 형식으로 오면 이 함수가 실행
export async function PUT(request: Request, { params }: { params: { id: string }}) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: '잘못된 id입니다.' }, { status: 400 });
  }

  const body = await request.json(); // 폼에서 수정한 값을 꺼냄
  const input = sanitizeGameInput(body);
  if (!input) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('game-log');

  const existing = await db.collection('games').findOne({ _id: new ObjectId(params.id) });

  await db.collection('games').updateOne(
    { _id: new ObjectId(params.id) }, // 어떤 문서를 바꿀지
    { $set: input }, // 검증된 필드만 새 값으로 덮어씀
  );

  // 수정하면서 빠진 스크린샷은 Blob에서도 같이 지움
  const oldUrls = new Set(extractScreenshotUrls(existing?.screenshots));
  const newUrls = new Set(extractScreenshotUrls(input.screenshots));
  const removedUrls = Array.from(oldUrls).filter((url) => !newUrls.has(url));
  if (removedUrls.length > 0) {
    await del(removedUrls).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
