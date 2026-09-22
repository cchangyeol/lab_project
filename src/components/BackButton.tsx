// 브라우저 뒤로가기와 같은 동작을 하는 컴포넌트
'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()} // 이전 화면 이동
      className="self-start mb-4 text-sm underline" // self-start: 부모의 flex-col 정렬을 무시
    >
      ←
    </button>
  );
}
