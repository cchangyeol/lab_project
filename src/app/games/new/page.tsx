// 게임 기록을 입력하는 등록 폼 화면 (아직 저장 기능은 없음, 입력값만 확인)

'use client'; // 클라이언트 컴포넌트로 만들어서 브라우저에서 동작하게 함

import { useState } from 'react'; // 입력값을 상태로 관리하기 위해 useState 훅 가져옴
import { useRouter } from 'next/navigation'; // 저장 성공하면 다른 화면으로 이동
import type { GameStatus } from '@/types/game'; // 게임 상태 타입 가져옴

export default function NewGamePage() {
  const router = useRouter(); // 저장 성공하면 목록으로 보내는데 씀

  // 폼에 입력한 값들을 저장해두는 state
  const [title, setTitle] = useState(''); // 게임제목
  const [platform, setPlatform] = useState(''); // 플렛폼
  const [startDate, setStartDate] = useState(''); // 시작일
  const [endDate, setEndDate] = useState(''); // 종료일
  const [playTime, setPlayTime] = useState(0); // 총 플레이 시간
  const [rating, setRating] = useState(0); // 게임 평점
  const [status, setStatus] = useState<GameStatus>('하고싶음'); // 게임 상태, 기본값은 '하고싶음'
  const [trailerUrl, setTrailerUrl] = useState(''); // 게임 트레일러 URL

  // 저장 버튼을 눌렀을 때 실행되는 함수
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // 입력한 값들을 /api/games로 보냄
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform, startDate, playTime, endDate, rating, status, trailerUrl }), // 입력값들을 JSON으로 변환해서 보냄
    });

    if (res.ok) {
      router.push('/'); // 저장 성공하면 목록 화면으로 이동
    } else {
      console.error('게임 기록 저장 실패'); // 실패하면 에러 메시지 출력
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4 max-w-md">
      <h1 className="text-xl font-bold">게임 기록 등록</h1>

      <input
        type="text"
        placeholder="게임 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)} // 입력할 때 마다 title state 업데이트
        required // 비어있으면 제출 안 되게 함
      />

      <input
        type="text"
        placeholder="플랫폼 (예: PC, PS5, 닌텐도 Switch)"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        required
      />

      <label className="flex flex-col gap-1 text-sm">
        시작일
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        마지막으로 플레이한 날 (선택)
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)} // 입력 안 하면 빈 문자열 그대로 둠
        />
      </label>

      <input
        type="number"
        placeholder="총 플레이 시간 (시간 단위)"
        value={playTime}
        onChange={(e) => setPlayTime(Number(e.target.value))} // 문자로 들어오는 값을 숫자로 바꿔줌
        required
      />

      <input
        type="number"
        placeholder="게임 평점 (1~5)"
        min={1}
        max={5}
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        required
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as GameStatus)} // select 값을 GameStatus 타입으로 취급
      >
        <option value="하고싶음">하고싶음</option>
        <option value="하는중">하는중</option>
        <option value="클리어">클리어</option>
        <option value="중단">중단</option>
      </select>

      <input
        type="url"
        placeholder="게임 트레일러 URL"
        value={trailerUrl}
        onChange={(e) => setTrailerUrl(e.target.value)}
      />

      <button type="submit">등록</button>
    </form>
  );
}
