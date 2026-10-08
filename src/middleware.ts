// 기록을 바꾸는 요청(등록/수정/삭제/업로드)은 로그인한 사람만 할 수 있게 막는 미들웨어
// GET 요청(목록/상세 보기)은 막지 않음 — 그건 누구나 볼 수 있어도 되는 내용임
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function middleware(request: NextRequest) {
  if (!WRITE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/games/:path*', '/api/upload'],
};
