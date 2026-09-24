// 스크린샷 목록을 보여주는 부품 (왼쪽/오른쪽 어디든 재사용)

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Screenshot } from '@/types/game';

const PER_PAGE = 6;

export default function ScreenshotPanel({ gameId, screenshots }: { gameId: string; screenshots: Screenshot[] }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // 이미 올린 파일을 기억해서 중복 업로드를 막음
  const uploadedNamesRef = useRef<Set<string>>(new Set());

  const totalPages = Math.max(2, Math.ceil(screenshots.length / PER_PAGE)); // 최소 1페이지
  const start = page * PER_PAGE;
  const current = screenshots.slice(start, start + PER_PAGE); // 현재 페이지에 보여줄 6장

  function handleNext() {
    setPage((p) => (p + 1) % totalPages); // 마지막 페이지 다음엔 다시 처음 페이지
  }

  function handlePrev() {
    setPage((p) => (p - 1 + totalPages) % totalPages); // 첫 페이지에서 누르면 마지막 페이지로 이동
  }

  // 서버에 스크린샷 목록을 새로 저장하는 공통 함수
  async function saveScreenshots(next: Screenshot[]) {
    await fetch(`/api/games/${gameId}/screenshots`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenshots: next }),
    });
    router.refresh();
  }

  // 파일을 올리고, 기존 목록에 합쳐서 서버에 저장
  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 이름 + 용량이 같은 파일은 걸러냄
    const newFiles = Array.from(files).filter((file) => {
      const key = `${file.name}_${file.size}`;
      if (uploadedNamesRef.current.has(key)) return false;
      uploadedNamesRef.current.add(key);
      return true;
    });

    if (newFiles.length === 0) {
      alert('이미 추가한 사진입니다.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const uploadedShots: Screenshot[] =[];

    for (const file of newFiles) {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      uploadedShots.push({ url: data.url });
    }

    await saveScreenshots([...screenshots, ...uploadedShots]);
    setUploading(false);
    e.target.value = '';
  }

  async function handleDeleteScreenshot(url: string) {
    await saveScreenshots(screenshots.filter((s) => s.url !== url));
  }

  function openNote(shot: Screenshot) {
    setSelectedUrl(shot.url);
    setNoteDraft(shot.note ?? '');
  }

  async function handleSaveNote() {
    const updated = screenshots.map((s) => (s.url === selectedUrl ? { ...s, note: noteDraft } : s));
    await saveScreenshots(updated);
    setSelectedUrl(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-3 flex-1">
        {current.length > 0 ? (
          [current.slice(0, Math.ceil(current.length / 2)),
            current.slice(Math.ceil(current.length / 2))].map(
              (column, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-3 flex-1">
                  {column.map((shot) =>(
                    <div key={shot.url} className="relative group mb-3 break-inside-avoid">
                      <img
                        src={shot.url}
                        alt="게임 스크린샷"
                        onClick={() => openNote(shot)}
                        className="w-full rounded-xl border border-stone-200 shadow-sm cursor-pointer" />

                        <button
                          type="button"
                          onClick={() => handleDeleteScreenshot(shot.url)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          x
                        </button>
                    </div>
                  ))}
                </div>
              )
            )
        ) : (
          <p className="text-sm text-stone-400 text-center">등록된 스크린샷이 없습니다.</p>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 mt-3">
        <button
          type="button"
          onClick={handlePrev}
          className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50">
            ←
        </button>

        <label className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50 cursor-pointer">
          +
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddPhotos}
            className="hidden" />
        </label>

          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50"
          >
              →
          </button>
      </div>

      {uploading && <p className="text-xs text-stone-400 mt-2">업로드 중...</p>}

      {selectedUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUrl(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-sm w-full flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedUrl}
                alt={"선택한 스크린샷"}
                className="w-full rounded-xl" />

                <textarea
                  className="border border-stone-200 rounded-lg p-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="기록을 적어보세요."
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUrl(null)}
                    className="text-sm text-stone-500 px-3 py-1.5">
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-1.5 text-sm font-medium"
                    >
                      저장
                    </button>
                </div>
          </div>
        </div>
      )}
    </div>
  );
}
