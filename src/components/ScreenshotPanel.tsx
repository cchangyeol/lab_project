// 스크린샷 목록을 보여주는 부품 (왼쪽/오른쪽 어디든 재사용)

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Screenshot } from '@/types/game';
import { checkImage, uploadImage } from '@/lib/uploadImage';

const PAGE_WEIGHT = 6;
const TALL_WEIGHT = 3;
const WIDE_WEIGHT = 1;

type Orientation = 'tall' | 'wide'

export default function ScreenshotPanel({ gameId, screenshots }: { gameId: string; screenshots: Screenshot[] }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false); // 삭제/순서변경/메모저장 요청이 진행 중인지
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [orientations, setOrientations] = useState<Record<string, Orientation>>({});

  // 이미 업로드에 성공한 파일(이름+용량 → 결과 url)을 기억해서 같은 파일의 중복 업로드를 막음
  const uploadedFilesRef = useRef<Map<string, string>>(new Map());

  // 사진마다 세로로 긴 사진인지 미리 확인해서 orientation에 저장
  useEffect(() => {
    screenshots.forEach((shot) => {
      if (orientations[shot.url]) return; // 이미 확인된 사진은 다시 안 함
      const img = new Image();
      img.onload = () => {
        setOrientations((prev) => ({
          ...prev,
          [shot.url]: img.naturalHeight > img.naturalWidth ? 'tall' : 'wide',
        }));
      };
      img.src = shot.url;
    });
  }, [screenshots]);

  function weightOf(shot: Screenshot) {
    return orientations[shot.url] === 'tall' ? TALL_WEIGHT : WIDE_WEIGHT;
  }

  // 사진들의 무게가 6이 안 넘게 페이지로 나눔 (세로 사진은 3칸으로 침)
  const pages: Screenshot[][] = [];
  let bucket: Screenshot[] = [];
  let bucketWeight = 0;
  for (const shot of screenshots) {
    const w = weightOf(shot);
    if (bucketWeight + w > PAGE_WEIGHT && bucket.length > 0) {
      pages.push(bucket);
      bucket = [];
      bucketWeight = 0;
    }
    bucket.push(shot);
    bucketWeight += w;
  }
  if (bucket.length > 0) pages.push(bucket);

  const totalPages = Math.max(1, pages.length);
  const safePage = Math.min(page, totalPages - 1); // 사진이 줄어서 페이지 수가 줄면 마지막 페이지로 보정
  const current = pages[safePage] ?? []; // 현재 페이지에 보여줄 6장

  // 현재 페이지 안에서 왼쪽 칸(무게 3) / 오른쪽 칸 (무게 3)으로 나눔
  const left: Screenshot[] = [];
  const right: Screenshot[] = [];
  let leftWeight = 0;
  for (const shot of current) {
    if (leftWeight < TALL_WEIGHT) {
      left.push(shot);
      leftWeight += weightOf(shot);
    } else {
      right.push(shot);
    }
  }

  function handleNext() {
    setPage((safePage + 1) % totalPages); // 마지막 페이지 다음엔 다시 처음 페이지
  }

  function handlePrev() {
    setPage((safePage - 1 + totalPages) % totalPages); // 첫 페이지에서 누르면 마지막 페이지로 이동
  }

  // 서버에 스크린샷 목록을 새로 저장하는 공통 함수
  // saving 중에는 같은 목록을 두 번 겹쳐 보내지 않도록 호출하는 쪽에서 버튼을 막아둠
  async function saveScreenshots(next: Screenshot[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${gameId}/screenshots`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshots: next }),
      });

      if (!res.ok) {
        alert('저장에 실패했습니다.');
        return;
      }

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // 파일을 올리고, 기존 목록에 합쳐서 서버에 저장
  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 이름 + 용량이 같은 파일(이미 올린 적 있는 파일)은 걸러냄
    const newFiles = Array.from(files).filter((file) => {
      const key = `${file.name}_${file.size}`;
      return !uploadedFilesRef.current.has(key);
    });

    if (newFiles.length === 0) {
      alert('이미 추가한 사진입니다.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const uploadedShots: Screenshot[] = [];

      for (const file of newFiles) {
        const problem = checkImage(file);
        if (problem) {
          alert(problem);
          continue;
        }

        let url: string;
        try {
          url = await uploadImage(file);
        } catch (error) {
          alert(`업로드에 실패했습니다: ${(error as Error).message}`);
          continue; // 실패한 파일은 건너뛰고 나머지는 계속 올림
        }

        uploadedShots.push({ url });
        uploadedFilesRef.current.set(`${file.name}_${file.size}`, url); // 성공한 파일만 중복 체크 목록에 기록
      }

      if (uploadedShots.length > 0) {
        await saveScreenshots([...screenshots, ...uploadedShots]);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteScreenshot(shot: Screenshot) {
    // 지운 사진은 같은 파일을 다시 올릴 수 있게 중복 체크 목록에서도 빼줌
    uploadedFilesRef.current.forEach((url, key) => {
      if (url === shot.url) uploadedFilesRef.current.delete(key);
    });
    await saveScreenshots(screenshots.filter((s) => s.url !== shot.url));
  }

  // 사진을 전체 목록 안에서 앞/뒤로 한 칸 옮김
  function handleMove(url: string, direction: 'prev' | 'next') {
    const idx = screenshots.findIndex((s) => s.url === url);
    const swapIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= screenshots.length) return;
    const next = [...screenshots];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    saveScreenshots(next);
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

  function renderShot(shot: Screenshot) {
    const weight = weightOf(shot);
    return (
      <div key={shot.url} className="relative group min-h-0" style={{ flexGrow: weight, flexBasis: 0 }}>
        <img
          src={shot.url}
          alt="게임 스크린샷"
          onClick={() => openNote(shot)}
          className="w-full h-full object-cover rounded-xl border border-stone-200 shadow-sm cursor-pointer"
        />
        <button
          type="button"
          onClick={() => handleDeleteScreenshot(shot)}
          disabled={saving}
          aria-label="스크린샷 삭제"
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition disabled:opacity-50"
        >
          x
        </button>
        {/* 순서 바꾸기 버튼 (마우스 올리거나 키보드로 포커스하면 나타남) */}
        <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
          <button
            type="button"
            onClick={() => handleMove(shot.url, 'prev')}
            disabled={saving}
            aria-label="앞으로 이동"
            className="w-6 h-6 rounded-full bg-white/90 border border-stone-200 text-stone-600 text-xs flex items-center justify-center disabled:opacity-50"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => handleMove(shot.url, 'next')}
            disabled={saving}
            aria-label="뒤로 이동"
            className="w-6 h-6 rounded-full bg-white/90 border border-stone-200 text-stone-600 text-xs flex items-center justify-center disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-3 flex-1">
        {current.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 flex-1 min-h-0">{left.map(renderShot)}</div>
            <div className="flex flex-col gap-3 flex-1 min-h-0">{right.map(renderShot)}</div>
          </>
        ) : (
          <p className="text-sm text-stone-400 text-center flex-1">등록된 스크린샷이 없습니다.</p>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 mt-3">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="이전 페이지"
          className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50"
        >
          ←
        </button>

        <label className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50 cursor-pointer">
          <span aria-hidden="true">+</span>
          <span className="sr-only">스크린샷 추가</span>
          <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="sr-only" />
        </label>

        <button
          type="button"
          onClick={handleNext}
          aria-label="다음 페이지"
          className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-sky-600 hover:bg-sky-50"
        >
          →
        </button>
      </div>

      {uploading && <p className="text-xs text-stone-400 mt-2 text-center">업로드 중...</p>}

      {selectedUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUrl(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={selectedUrl} alt="선택한 스크린샷" className="w-full rounded-xl" />
            <textarea
              className="border border-stone-200 rounded-lg p-2 text-sm text-stone-900 h-24 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="기록을 적어보세요."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setSelectedUrl(null)} className="text-sm text-stone-500 px-3 py-1.5">
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving}
                className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-50"
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
