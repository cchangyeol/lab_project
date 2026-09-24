// 게임 정보 + 트레일러를 콘솔 화면처럼 보여주는 부품
import type { Game, GameStatus } from '@/types/game';

const STATUS_STYLES: Record<GameStatus, string> = {
  하고싶음: 'bg-sky-100 text-sky-700',
  하는중: 'bg-amber-100 text-amber-700',
  클리어: 'bg-emerald-100 text-emerald-700',
  중단: 'bg-rose-100 text-rose-700',
};

export default function GameConsoleCard({ game, trailerIds }: { game: Game; trailerIds: string[] }) {
  return (
    <div className="rounded-3xl border-4 border-stone-200 bg-white p-1.5 shadow-md">
      <div className="rounded-2xl bg-sky-50 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-stone-400 tracking-wide">POWER ON</span>
        </div>

        <h1 className="text-xl font-bold text-stone-800">{game.title}</h1>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">{game.platform}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">{game.genre}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[game.status]}`}>{game.status}</span>
        </div>

        <dl className="text-sm text-stone-600 flex flex-col gap-1 mt-1">
          <div className="flex justify-between">
            <dt>시작일</dt>
            <dd>{game.status === '하고싶음' ? '출시 예정' : game.startDate}</dd>
          </div>
          {game.endDate && (
            <div className="flex justify-between">
              <dt>마지막 플레이</dt>
              <dd>{game.endDate}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>플레이 시간</dt>
            <dd>{game.playTime}시간</dd>
          </div>
          <div className="flex justify-between">
            <dt>평점</dt>
            <dd>{game.rating} / 5</dd>
          </div>
        </dl>

        {trailerIds.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {trailerIds.map((id) => (
              <iframe key={id} className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${id}`} title="트레일러" allowFullScreen />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
