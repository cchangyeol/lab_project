// 기록을 바꾸는 요청(등록/수정/삭제/업로드)은 로그인한 사람만 할 수 있게 막는 미들웨어
// GET 요청(목록/상세 보기)은 막지 않음 — 그건 누구나 볼 수 있어도 되는 내용임
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// 로그인 자체와 로그인/로그아웃 API는 로그인 여부와 상관없이 항상 통과
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/aouth/logout']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = await
  verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // API 요청: 기존처럼 '쓰기' 요청일 때만 막음
  if (pathname.startsWith('/api/')) {
    if (WRITE_METHODS.has(request.method) && !isLoggedIn) {
      return NextResponse.json({ error: '로그인이 필요합니다.'}, { status: 401 });
    }
    return NextResponse.next();
  }

  // 그 외(화면)는 로그인 안 했으면 로그인 화면으로 보냄
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
