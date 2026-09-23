// 항상 메인 목록 화면으로 돌아가는 동작을 하는 컴포넌트
'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/')} // 메인 화면 이동
      className="self-start mb-4 text-sm text-sky-600 hover:text-sky-800 underline transition" // self-start: 부모의 flex-col 정렬을 무시
    >
      ←
    </button>
  );
}
