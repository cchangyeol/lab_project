// 스크린샷 목록을 보여주는 부품 (왼쪽/오른쪽 어디든 재사용)

'use client';

import { useState } from 'react';

const PER_PAGE = 10;

export default function ScreenshotPanel({ screenshots }: { screenshots: string[] }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(screenshots.length / PER_PAGE)); // 최소 1페이지
  const start = page * PER_PAGE;
  const current = screenshots.slice(start, start + PER_PAGE); // 현재 페이지에 보여줄 6장

  function handleNext() {
    setPage((p) => (p + 1) % totalPages); // 마지막 페이지 다음엔 다시 처음 페이지
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

      {totalPages > 1 && (
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleNext}
            className="2-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-ceter justify-center text-sky-600 hover:bg-sky-50"
            >
              →
            </button>
        </div>
      )}
    </div>
  );
}
