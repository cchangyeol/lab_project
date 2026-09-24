// 스크린샷 목록을 보여주는 부품 (왼쪽/오른쪽 어디든 재사용)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PER_PAGE = 10;

export default function ScreenshotPanel({ gameId, screenshots }: { gameId: string; screenshots: string[] }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(screenshots.length / PER_PAGE)); // 최소 1페이지
  const start = page * PER_PAGE;
  const current = screenshots.slice(start, start + PER_PAGE); // 현재 페이지에 보여줄 6장

  function handleNext() {
    setPage((p) => (p + 1) % totalPages); // 마지막 페이지 다음엔 다시 처음 페이지
  }

  // 파일을 올리고, 기존 목록에 합쳐서 서버에 저장
  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] =[];

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      uploadedUrls.push(data.url);
    }

    await fetch(`/api/games/${gameId}/screenshots`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screenshots: [...screenshots, ...uploadedUrls]
      }),
    });

    setUploading(false);
    e.target.value = '';
    router.refresh(); // 새로 올린 사진이 바로 보이게 함
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-3 flex-1">
        {current.length > 0 ? (
          current.map((url) => (
            <img key={url} src={url} alt="게임 스크린샷" className="w-full h-auto rounded-xl border border-stone-200 shadow-sm" />
          ))
        ) : (
          <p className="col-span-2 tet-sm text-stone-400 self-center text-center">등록된 스크린샷이 없습니다.</p>
        )}
      </div>

      <div className="flex justify-between items-center mt-3">
        <label className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50 cursor-pointer">
          +
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddPhotos}
            className="hidden" />
        </label>


        {totalPages > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50"
          >
              →
          </button>
        )}
      </div>
      {uploading && <p className="text-xs text-stone-400 mt-2">업로드 중...</p>}
    </div>
  );
}
