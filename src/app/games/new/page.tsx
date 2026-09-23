// 게임 기록을 입력하는 등록 폼 화면 (아직 저장 기능은 없음, 입력값만 확인)

'use client'; // 클라이언트 컴포넌트로 만들어서 브라우저에서 동작하게 함

import { useState } from 'react'; // 입력값을 상태로 관리하기 위해 useState 훅 가져옴
import { useRouter } from 'next/navigation'; // 저장 성공하면 다른 화면으로 이동
import type { GameStatus } from '@/types/game'; // 게임 상태 타입 가져옴
import BackButton from '@/components/BackButton';

export default function NewGamePage() {
  const router = useRouter(); // 저장 성공하면 목록으로 보내는데 씀

  // 폼에 입력한 값들을 저장해두는 state
  const [title, setTitle] = useState(''); // 게임제목
  const [platform, setPlatform] = useState(''); // 플렛폼
  const [genre, setGenre] = useState('') // 장르
  const [startDate, setStartDate] = useState(''); // 시작일
  const [endDate, setEndDate] = useState(''); // 종료일
  const [playTime, setPlayTime] = useState(''); // 총 플레이 시간
  const [rating, setRating] = useState(0); // 게임 평점
  const [status, setStatus] = useState<GameStatus>('하고싶음'); // 게임 상태, 기본값은 '하고싶음'
  const [trailerUrl, setTrailerUrl] = useState(''); // 게임 트레일러 URL

  // 저장 버튼을 눌렀을 때 실행되는 함수
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

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

    // 입력한 값들을 /api/games로 보냄
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform, genre, startDate, playTime, endDate, rating, status, trailerUrl }), // 입력값들을 JSON으로 변환해서 보냄
    });

    if (res.ok) {
      router.push('/'); // 저장 성공하면 목록 화면으로 이동
    } else {
      console.error('게임 기록 저장 실패'); // 실패하면 에러 메시지 출력
    }
  }

  return (
        <main className="min-h-screen bg-stone-50 p-8 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
          <BackButton />

          {/* 등록 폼과 같은 흰 카드 스타일 */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-4">
            <h1 className="text-xl font-bold text-stone-800">게임 기록 수정</h1>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              게임명
              <input type="text" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              플랫폼
              <input type="text" className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)} required />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              장르
              <input type="text" className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)} required />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              시작일
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              마지막으로 플레이한 날 (선택)
              <input type="date" className={inputClass} min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              플레이 시간 (시간 단위)
              <input type="number" min={0} className={inputClass} value={playTime} onChange={(e) => setPlayTime(e.target.value)} required />
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
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              상태
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as GameStatus)}>
                <option value="하고싶음">하고싶음</option>
                <option value="하는중">하는중</option>
                <option value="클리어">클리어</option>
                <option value="중단">중단</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              트레일러 유튜브 링크 (선택)
              <input type="url" className={inputClass} value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} />
            </label>

            <button type="submit" className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-2 text-sm font-medium transition mt-2">
              수정 완료
            </button>
          </div>
        </form>
      </main>
    );
  }
