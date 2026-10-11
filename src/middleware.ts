// 로그인하지 않은 요청을 막는 미들웨어
// - 화면: /login 으로 보냄
// - API: 읽기(GET)/쓰기 구분 없이 401 JSON 으로 거절
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// 로그인 화면과 로그인/로그아웃 API는 로그인 여부와 상관없이 항상 통과
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/auth/logout']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  // API 요청: 로그인하지 않았으면 메서드와 상관없이 401
  if (pathname.startsWith('/api/')) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 그 외(화면): 로그인하지 않았으면 로그인 화면으로
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
