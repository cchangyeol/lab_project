// 상세 화면에 들어가는 삭제 버튼. 누르면 확인 후 삭제하고 목록으로 이동

'use client'; // 클릭 이벤트와 페이지 이동을 쓰려면 클라이언트 컴포넌트여야 함

import { useRouter } from 'next/navigation'; // 삭제 후 목록으로 이동시키는 기능


export default function DeleteGameButton({ gameId }: { gameId: string }) {
  const router = useRouter();

  async function handleDelete() {
    const ok = confirm('정말 삭제하시겠습니까?');
    if (!ok) return; // 취소를 누르면 아무일도 일어나지 않음

    const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' }); // 삭제 API 호출

    if (res.ok) {
      router.push('/'); // 삭제 성공 시 목록 화면으로 이동
    } else {
      console.error('삭제에 실패했습니다.');
    }
  }

  return (
    <button onClick={handleDelete} className="text-red-600 underline mt-4">
      삭제
    </button>
  );
}
