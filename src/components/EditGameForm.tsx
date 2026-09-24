// 기존 게임 기록을 수정할 수 있는 폼
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, GameStatus } from '@/types/game';
import BackButton from '@/components/BackButton';

// 입력칸에 공통으로 쓰는 스타일 (반복되는 클래스라 변수로 빼둠)
const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200disables:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed';
const PLATFORM_OPTIONS = ['PC', 'PS5', 'Switch', "Mobile"];

// 부모(수정 페이지)가 DB에서 가져온 기존 기록을 game이라는 prop으로 넘겨줌
export default function EditGameForm({ game }: { game: Game }) {
    const router = useRouter();

    // 빈 값이 아닌 기존 game 값으로 state를 초기화
    const [title, setTitle] = useState(game.title);
    const [platform, setPlatform] = useState(game.platform);
    const [genre, setGenre] = useState(game.genre); // 장르
    const [startDate, setStartDate] = useState(game.startDate);
    const [endDate, setEndDate] = useState(game.endDate ?? '');
    const [playTime, setPlayTime] = useState(String(game.playTime));
    const [rating, setRating] = useState(game.rating);
    const [status, setStatus] = useState<GameStatus>(game.status);
    const [trailerUrls, setTrailerUrls] = useState<string[]>(
      game.trailerUrls && game.trailerUrls.length > 0 ? game.trailerUrls : ['']
    ); // 게임 트레일러 URLㄷ,ㄹ
    const [screenshots, setScreenshot] = useState<string[]>(game.screenshots ?? []); // 업로드된 스크린샷 주소
    const [uploading, setUploading] = useState(false);

    // 파일을 고르면 하나씩 /api/upload로 올리고, 돌아온 주소를 screenshot에 쌓음
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = 40 - screenshots.length;
      if (remaining <= 0) {
        alert('스크린샷 한도 도달');
        e.target.value = '';
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
        if (files.length > remaining) {
          alert(`스크린샷은 최대 40개까지라 ${remaining}개만 업로드합니다.`);
        }

      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const data = await res.json();
        uploadedUrls.push(data.url);
      }

      setScreenshot((prev) => [...prev, ...uploadedUrls]);
      setUploading(false);
      e.target.value = '';
    }

    function handleRemoveScreenshot(url: string) {
      setScreenshot((prev) => prev.filter((u) => u !== url));
    }

    function handleTrailerChange(index: number, value: string) {
      setTrailerUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
    }

    function handleAddTrailer() {
      if (trailerUrls.length >= 3) {
        alert('트레일러는 최대 3개까지 등록할 수 있습니다.');
        return;
      }
      setTrailerUrls((prev) => [...prev, '']);
    }

    function handleRemoveTrailer(index: number) {
      setTrailerUrls((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();

      // 마지막 플레이한 날이 시작일보다 빠르면 저장하지 않고 알림만 띄움
      if (endDate && endDate < startDate) {
        alert('적절한 날짜를 선택해주세요.');
        return;
      }

      // 플레이 시간이나 평점이 숫자가 아니면 저장하지 않고 알림만 띄움
      const playTimeNum = playTime === '' ? 0 : Math.max(0, Number(playTime));
      if (Number.isNaN(playTime) || Number.isNaN(rating)) {
        alert('숫자 외엔 입력할 수 없습니다.');
        return;
      }

      const res = await fetch(`/api/games/${game._id}`, {
        method: 'PUT', // 새로 만드는 게 아닌 기존 문서를 바꾸는거라 POST 대신 PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          platform,
          genre,
          startDate,
          endDate,
          playTime:playTimeNum,
          rating,
          status,
          trailerUrls: trailerUrls.filter((u) => u.trim() !== ''),
          screenshots }),
      });

      if (res.ok) {
        router.refresh(); // 상세 화면 캐시를 비워서 수정한 값이 새로고침 없이 바로 보이게 함
        router.push(`/games/${game._id}`); // 수정 성공하면 상세 화면으로 이동
      } else {
        console.error('수정에 실패했습니다.');
      }
    }

    return (
      <main className="min-h-screen bg-stone-50 p-8 flex justify-center">
        <form onSubmit={handleSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className="w-full max-w-md flex flex-col gap-4">
          <BackButton />

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-4">
            <h1 className="text-xl font-bold text-stone-800">게임 기록 수정</h1>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              게임명
              <input
                type="text"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              플랫폼
              <select
                className={inputClass}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required>
                <option value="">선택하세요</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              장르
              <input
                type="text"
                className={inputClass}
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              시작일
              {status === '하고싶음' ? (
                <input type="text"
                  className={inputClass}
                  value="출시예정"
                  disabled />
              ) : (
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required />
                )}
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              마지막으로 플레이한 날 (선택)
              <input
                type="date"
                className={inputClass}
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={status === '하고싶음'} />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              플레이 시간 (시간 단위)
              <input
                type="number"
                min={0}
                className={inputClass}
                value={playTime}
                onChange={(e) => setPlayTime(e.target.value)}
                disabled={status === '하고싶음'}
                required={status !== '하고싶음'} />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              평점 (1점 ~ 5점)
              <input
                type="number"
                min={1}
                max={5}
                className={inputClass}
                value={rating === 0 ? '' : rating}
                onChange={(e) => {
                  const value = e.target.value;
                  setRating(value === '' ? 0 : Math.min(5, Math.max(1, Number(value))));
                }}
                disabled={status === '하고싶음'}
                required={status !== '하고싶음'} />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              상태
              <select
                className={inputClass}
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as GameStatus;
                  setStatus(newStatus);
                  if (newStatus === '하고싶음') {
                    setStartDate('');
                    setEndDate('');
                    setPlayTime('');
                    setRating(0);
                  }
                }}>
                <option value="하고싶음">하고싶음</option>
                <option value="하는중">하는중</option>
                <option value="클리어">클리어</option>
                <option value="중단">중단</option>
              </select>
            </label>

            <div className="flex flex-col gap-2 text-sm text-stone-600">
              트레일러 유튜브 링크 (최대 3개)
              {trailerUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    className={`${inputClass} flex-1`}
                    value={url}
                    onChange={(e) => handleTrailerChange(i, e.target.value)} />
                    {trailerUrls.length > 1 && (
                      <button type="button" onClick={() => handleRemoveTrailer(i)}
                      className="text-rose-600 text-sm px-2">삭제</button>
                    )}
                </div>
              ))}
              {trailerUrls.length < 3 && (
                <button type="button" onClick={handleAddTrailer}
                className="self-start text-sky-600 text-sm underline">+ 트레일러 추가</button>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              게임 스크린샷 (선택, 최대 40장 — {screenshots.length}/40)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className={inputClass}
                disabled={screenshots.length >= 40} />
            </label>
            {uploading && <p className="text-xs text-stone-400"> 업로드 중...</p>}
            {screenshots.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {screenshots.map((url) => (
                  <div key={url} className="relative">
                    <img key={url} src={url} alt="스크린샷 미리보기" className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-200 text-rose-900 text-xs leading-none flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-2 text-sm font-medium transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? '업로드 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </main>
    );
}
