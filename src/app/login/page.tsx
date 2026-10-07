// 기록을 등록/수정/삭제하기 전에 거치는 간단한 비밀번호 로그인 화면
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '로그인에 실패했습니다.');
        return;
      }

      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-stone-800">로그인</h1>

        <label className="flex flex-col gap-1 text-sm text-stone-600">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            required
            autoFocus
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </main>
  );
}
