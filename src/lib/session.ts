// 로그인 쿠키에 넣을 토큰을 만들고 검사하는 함수
// 쿠키에 비밀번호를 그대로 넣으면 쿠키가 새는 순간 비밀번호도 새므로, SESSION_SECRET으로 서명한 토큰을 대신 넣음
// 토큰 모양: "만료시각.서명" — 비밀키 없이는 만들 수 없고, 만료시각을 바꾸면 서명이 안 맞음
// middleware(Edge)와 API(Node) 양쪽에서 돌아야 해서 Web Crypto만 씀
export const SESSION_COOKIE = 'admin_token';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일(초)

const encoder = new TextEncoder();

function getKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  const sig = await crypto.subtle.sign('HMAC', await getKey(secret), encoder.encode(exp));
  return `${exp}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return false;

  const [exp, sigHex] = token.split('.');
  if (!/^\d+$/.test(exp ?? '') || !/^[0-9a-f]{64}$/.test(sigHex ?? '')) return false;
  if (Number(exp) < Date.now() / 1000) return false; // 만료된 토큰

  const sig = new Uint8Array(sigHex.match(/../g)!.map((h) => parseInt(h, 16)));
  // subtle.verify는 비교를 고정 시간으로 해서 응답 시간 차이로 서명을 알아내는 공격을 막음
  return crypto.subtle.verify('HMAC', await getKey(secret), sig, encoder.encode(exp));
}
