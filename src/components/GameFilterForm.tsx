// 메인 화면 검색/필터 폼 select나 장르 체크박스를 바꾸면 버튼 없이 바로 변경
'use client';

import type { GameStatus } from "@/types/game";
import { GENRE_OPTIONS } from "@/types/game";

const STATUS_OPTIONS: GameStatus[] = ['하고싶음', '하는중', '클리어', '중단'];

const selectClass = 'appearance-none bg-stone-50 border border-stone-200 rounded-xl pl-3 pr-7 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition cursor-pointer';

export default function GameFilterForm({
  q,
  sort,
  status,
  platform,
  platforms,
  selectedGenres,
  cols,
} : {
  q: string;
  sort: string;
  status: string;
  platform: string;
  platforms: string[];
  selectedGenres: string[];
  cols: number;
}) {

  // 체크박스가 바뀌면 적용 버튼 없이 바로 폼을 제출
  function submitOnChange(e: React.ChangeEvent<HTMLSelectElement |
    HTMLInputElement>) {
      e.currentTarget.form?.requestSubmit();
    }

    return (
    <form method="get" className="mb-8 bg-white border border-stone-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      {/* 한 줄에 보기 설정은 필터 제출 때 같이 사라지지 않게 숨은 값으로 유지 */}
      <input type="hidden" name="cols" value={cols} />

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          placeholder="게임명으로 검색 (Enter)"
          defaultValue={q}
          className="flex-1 min-w-[160px] bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition"
        />

        <div className="relative">
          <select name="sort" defaultValue={sort} onChange={submitOnChange} className={selectClass}>
            <option value="">정렬: 기본</option>
            <option value="rating">평점 높은 순</option>
            <option value="title">이름 가나다순</option>
            <option value="recent">최근 플레이한 순</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
        <div className="relative">
          <select name="status" defaultValue={status} onChange={submitOnChange} className={selectClass}>
            <option value="">상태 전체</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
        </div>

        <div className="relative">
          <select name="platform" defaultValue={platform} onChange={submitOnChange} className={selectClass}>
            <option value="">플랫폼 전체</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
        </div>

        <div className="w-px h-6 bg-stone-200 mx-1" />

        <div className="flex flex-wrap gap-1.5">
          {GENRE_OPTIONS.map((g) => (
            <label
              key={g}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 text-stone-600 has-[:checked]:bg-sky-200 has-[:checked]:border-sky-300 has-[:checked]:text-sky-900 cursor-pointer transition"
            >
              <input
                type="checkbox"
                name="genre"
                value={g}
                defaultChecked={selectedGenres.includes(g)}
                onChange={submitOnChange}
                className="sr-only"
              />
              {g}
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
