// 게임 정보 + 트레일러를 보여주는 부품
'use client'

import { useState } from 'react'
import type { Game } from '@/types/game';
import { STATUS_STYLES } from '@/types/game';
import GameSummary from '@/components/GameSummary';

const YOUTUBE_HOSTNAMES = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);

function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    if (YOUTUBE_HOSTNAMES.has(parsed.hostname)) return parsed.searchParams.get('v');
    return null;
  } catch {
    return null;
  }
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?.*)?$/i.test(url);
}

// 유튜브도, mp4/webm 링크도 아니면 새 탭으로 여는 링크를 보여줌
function renderTrailer(url: string) {
  const youtubeId = getYoutubeId(url);
  if (youtubeId) {
    return <iframe key={url} className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${youtubeId}`} title="트레일러" allowFullScreen />;
  }
  if (isDirectVideoUrl(url)) {
    return <video key={url} className="w-full aspect-video rounded-xl" src={url} controls />;
  }
  return (
    <a
      key={url}
      href={url}
      rel="noreferrer"
      className="flex items-center justify-center w-full aspect-video rounded-xl bg-stone-100 text-sky-600 text-sm underline"
    >
      트레일러 링크 열기 ↗
    </a>
  )
}

export default function GameConsoleCard({ game, trailerUrls }: { game: Game; trailerUrls: string[] }) {
  const [view, setView] = useState<'trailer' | 'summary'>(trailerUrls.length > 0 ? 'trailer' : 'summary');

  return (
    <div className="rounded-3xl border-4 border-stone-200 bg-white p-1.5 shadow-md">
      <div className="rounded-2xl bg-sky-50 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-stone-400 tracking-wide">POWER ON</span>
        </div>

      {game.coverImage && (
        <img src={game.coverImage}
          alt=""
          className="w-full aspect-video object-cover rounded-xl" />
      )}
        <h1 className="text-xl font-bold text-stone-800">{game.title}</h1>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">{game.platform}</span>
          {typeof game.metacritic === 'number' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">메타크리틱 {game.metacritic}</span>)}
            {game.price && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{game.price}</span>
            )}
          {game.genres?.map((g) => (
            <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">{g}</span>
            ))}
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[game.status]}`}>{game.status}</span>
          </div>

          {(game.developers?.length || game.publishers?.length) ? (
            <p className="text-xs text-stone-400">{[...(game.developers ?? []), ...(game.publishers ?? [])].join(' · ')}</p>
          ) : null}

          <dl className="text-sm text-stone-600 flex flex-col gap-1 mt-1">
            {game.releaseDate && (
                <div className="flex justify-between">
                  <dt>공식 출시일</dt>
                  <dd>{game.releaseDate}</dd>
                </div>
              )}
              {game.status !== '하고싶음' && (
                <div className="flex justify-between">
                <dt>시작일</dt>
                <dd>{game.startDate}</dd>
              </div>
              )}
              {game.endDate && (
                <div className="flex justify-between">
                  <dt>마지막 플레이</dt>
                  <dd>{game.endDate}</dd>
                </div>
              )}
              {game.status !== '하고싶음' && (
                <>
                  <div className="flex justify-between">
                    <dt>플레이 시간</dt>
                    <dd>{game.playTime}시간</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>평점</dt>
                    <dd>{game.rating} / 5</dd>
                  </div>
                </>
              )}
            </dl>

          {(trailerUrls.length > 0 || game.summary) && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView((v) => (v === 'trailer' ? 'summary' : 'trailer'))}
                aria-label="이전 보기"
                className="w-7 h-7 rounded-full bg-white border border-stone-200 text-stone-500 text-xs flex items-center justify-center hover:bg-stone-50"
              >
                ◀
              </button>
              <span className="text-xs font-semibold text-stone-400">{view === 'trailer' ? '트레일러' : '소개글'}</span>
              <button
                type="button"
                onClick={() => setView((v) => (v === 'trailer' ? 'summary' : 'trailer'))}
                aria-label="다음 보기"
                className="w-7 h-7 rounded-full bg-white border border-stone-200 text-stone-500 text-xs flex items-center justify-center hover:bg-stone-50"
              >
                ▶
              </button>
            </div>

            {view === 'trailer' ? (
              trailerUrls.length > 0 ? (
                <div className="flex flex-col gap-2">{trailerUrls.map(renderTrailer)}</div>
              ) : (
                <p className="text-sm text-stone-400 text-center py-6">등록된 트레일러가 없습니다.</p>
              )
            ) : game.summary ? (
              <GameSummary text={game.summary} />
            ) : (
              <p className="text-sm text-stone-400 text-center py-6">등록된 소개글이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
