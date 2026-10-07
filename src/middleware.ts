// 기록을 바꾸는 요청(등록/수정/삭제/업로드)은 로그인한 사람만 할 수 있게 막는 미들웨어
// GET 요청(목록/상세 보기)은 막지 않음 — 그건 누구나 볼 수 있어도 되는 내용임
import { NextResponse, type NextRequest } from 'next/server';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(request: NextRequest) {
  if (!WRITE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/games/:path*', '/api/upload'],
};
