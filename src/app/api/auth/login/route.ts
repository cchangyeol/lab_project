// 비밀번호를 확인하고 맞으면 로그인 쿠키를 심어주는 API
import { createHash, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';

// 두 값을 같은 길이(SHA-256)로 만든 뒤 고정 시간으로 비교
// (!==는 다른 글자를 만나는 순간 멈춰서 응답 시간 차이로 비밀번호를 한 글자씩 추측할 수 있음)
function safeEqual(a: string, b: string): boolean {
  const sha = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(sha(a), sha(b));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!adminPassword || !sessionSecret) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD 또는 SESSION_SECRET이 설정되지 않았습니다.' }, { status: 500 });
  }

  if (!safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(sessionSecret), {
    httpOnly: true, // 자바스크립트로는 못 읽게 해서 XSS로 토큰이 새는 걸 막음
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return res;
}
