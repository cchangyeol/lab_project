//메인 목록의 게임팩 카드 클릭하면 CD가 돌면서 튀어나오는 애니메이션 후 상세 화면으로 이동
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Game } from '@/types/game';
import { STATUS_STYLES } from '@/types/game';

export default function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false); // 열리는 애니메이션 중인지
  const coverUrl = game.screenshots?.[0]?.url;

  // 그냥 왼쪽 클릭이면 CD 열리는 애니메이션을 보여주고 애니메이션이 끝난 뒤 이동
  // 새 탭으로 열기(Ctrl/Cmd/가운데 클릭)는 Link 기본 동작을 그대로 두어서 동작하게 함
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();

    if (opening) return; // 이미 열리는 중이면 무시
    setOpening(true);

    // 애니메이션이 끝나는 타이밍(0.65초)에 맞춰 상세 화면으로 이동
    setTimeout(() => {
      router.push(`/games/${game._id}`);
    }, 650)
  }

  return (
    <Link
      href={`/games/${game._id}`}
      onClick={handleClick}
      className="group relative w-full text-left rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col transition hover:-translate-y-1 hover:shadow-md aspect-[3/4]"
    >
      { /* CD 애니메이션 */ }
      <div className="absolute inset-0 flex items-center justify-center bg-stone-800">
        <div
          className={`relative flex items-center justify-center w-2/3 aspect-square rounded-full border-4 border-white/70 shadow-xl bg-gradient-to-br from-sky-200 via-white to-amber-200 overflow-hidden ${
            opening ? 'animate-[cd-pop_0.65s_ease-out_forwards]' : 'opacity-0 scale-0'
          }`}
        >
          {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />}
          <div className="relative w-1/4 aspect-square rounded-full bg-stone-900/50 border border-white/40" />
        </div>
      </div>

      {/* 게임팩 겉면 */}
      <div
        className={`absolute inset-0 flex flex-col transition-all duration-300 ${opening ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {coverUrl ? (
          <>
            <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover scale-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}

        <div
          className={`absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 rounded-b-md transition ${coverUrl ? 'bg-white/40 group-hover:bg-sky-200' : 'bg-stone-200 group-hover:bg-sky-200'}`}
        />

        <div className="relative mt-auto p-4 flex flex-col gap-1.5">
          <span className={`font-bold ${coverUrl ? 'text-white drop-shadow' : 'text-stone-800'}`}>{game.title}</span>
          <span className={`text-sm ${coverUrl ? 'text-white/80 drop-shadow' : 'text-stone-500'}`}>{game.platform} · {(game.genres ?? []).join(', ')} </span>
          <span className={`self-start text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[game.status]}`}>{game.status}</span>
        </div>
      </div>
    </Link>
  );
}
