// 기존 게임 기록을 수정할 수 있는 폼
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, GameStatus } from '@/types/game';
import BackButton from '@/components/BackButton';

// 부모(수정 페이지)가 DB에서 가져온 기존 기록을 game이라는 prop으로 넘겨줌
export default function EditGameForm({ game }: { game: Game }) {
    const router = useRouter();

    // 빈 값이 아닌 기존 game 값으로 state를 초기화
    const [title, setTitle] = useState(game.title);
    const [platform, setPlatform] = useState(game.platform);
    const [startDate, setStartDate] = useState(game.startDate);
    const [endDate, setEndDate] = useState(game.endDate ?? '');
    const [playTime, setPlayTime] = useState(String(game.playTime));
    const [rating, setRating] = useState(game.rating);
    const [status, setStatus] = useState<GameStatus>(game.status);
    const [trailerUrl, setTrailerUrl] = useState(game.trailerUrl ?? '');

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();

      // 마지막 플레이한 날이 시작일보다 빠르면 저장하지 않고 알림만 띄움
      if (endDate && endDate < startDate) {
        alert('적절한 날짜를 선택해주세요.');
        return;
      }

      // 플레이 시간이나 평점이 숫자가 아니면 저장하지 않고 알림만 띄움
      if (Number.isNaN(playTime) || Number.isNaN(rating)) {
        alert('숫자 외엔 입력할 수 없습니다.');
        return;
      }

      const res = await fetch(`/api/games/${game._id}`, {
        method: 'PUT', // 새로 만드는 게 아닌 기존 문서를 바꾸는거라 POST 대신 PUT
        headers: { 'Content-Type': 'application/json' },
        body : JSON.stringify({ title, platform, startDate, endDate, playTime, rating, status, trailerUrl }),
      });

      if (res.ok) {
        router.refresh(); // 상세 화면 캐시를 비워서 수정한 값이 새로고침 없이 바로 보이게 함
        router.push(`/games/${game._id}`); // 수정 성공하면 상세 화면으로 이동
      } else {
        console.error('수정에 실패했습니다.');
      }
    }

    return (
      <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4 max-w-md">
        <BackButton />

        <h1 className="text-xl font-bold">게임 기록 수정</h1>
          <label className="flex flex-col gap-1 text-sm">
          게임명
          <input
            type="text"
            placeholder="게임 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)} // 입력할 때 마다 title state 업데이트
            required // 비어있으면 제출 안 되게 함
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          게임 플랫폼
          <input
            type="text"
            placeholder="플랫폼 (예: PC, PS5, 닌텐도 Switch)"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          />
        </label>

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
            min={endDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)} // 입력 안 하면 빈 문자열 그대로 둠
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          플레이 시간 (시간 단위)
          <input
            type="number"
            placeholder="총 플레이 시간 (시간 단위)"
            min={0}
            value={playTime}
            onChange={(e) => setPlayTime(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          평점 (1점 ~ 5점)
          <input
            type="number"
            placeholder="게임 평점 (1~5)"
            min={1}
            max={5}
            value={rating === 0 ? '' : rating}
            onChange={(e) => {
              const value = e.target.value;
              setRating(value === '' ? 0 : Math.min(5, Math.max(1, Number(value))));
            }} // 지우면 0으로, 입력하면 숫자로 표시
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          상태
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as GameStatus)} // select 값을 GameStatus 타입으로 취급
          >
            <option value="하고싶음">하고싶음</option>
            <option value="하는중">하는중</option>
            <option value="클리어">클리어</option>
            <option value="중단">중단</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          트레일러 유튜브 링크 (선택)
          <input
            type="url"
            placeholder="게임 트레일러 URL"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
          />
        </label>

        <button type="submit">수정 완료</button>
      </form>
    )
}
