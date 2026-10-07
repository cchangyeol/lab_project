// 게임 정보 + 트레일러를 보여주는 부품
import type { Game } from '@/types/game';
import { STATUS_STYLES } from '@/types/game';

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

export default function GameConsoleCard({ game, trailerUrls }: { game: Game; trailerUrls: string[] }) {
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
            <span className="text-xs px py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">메타크리틱 {game.metacritic}</span>)}
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
            <div className="flex justify-between">
              <dt>시작일</dt>
              {game.releaseDate && (
                <div className="flex justify-between">
                  <dt>공식 출시일</dt>
                  <dd>{game.releaseDate}</dd>
                </div>
              )}
              <dd>{game.status === '하고싶음' ? '출시 예정' : game.startDate}</dd>
            </div>
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

          {game.summary && <p className="text-sm text-stone-500">{game.summary}</p>}

          {trailerUrls.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {trailerUrls.map((url) => {
                const youtubeId = getYoutubeId(url);
                if (youtubeId) {
                  return <iframe key={url} className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${youtubeId}`} title="트레일러" allowFullScreen />;
                }
                if (isDirectVideoUrl(url)) {
                  return <video key={url} className="w-full aspect-video rounded-xl" src={url} controls />;
                }
                return null;
              })}
            </div>
          )}
      </div>
    </div>
  );
}
