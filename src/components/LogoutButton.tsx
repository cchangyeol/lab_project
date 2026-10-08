// 목록 화면 상단에 있는 로그아웃 버튼
'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm text-stone-400 hover:text-stone-600 underline transition">
      로그아웃
    </button>
  );
}
