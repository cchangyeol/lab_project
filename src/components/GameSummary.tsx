// 소개글이 길면 일부만 보여주고, "본문 보러가기"를 누르면 전체를 펼치는 코드
'use client';

import { useState } from 'react';

const PREVIEW_LENGTH = 120;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

export default function GameSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > PREVIEW_LENGTH;

  return (
    <div className="text-sm text-stone-500">
      <p className="whitespace-pre-line">
        {expanded || !isLong ? text : `${truncate(text, PREVIEW_LENGTH)}...`}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs text-sky-600 hover:text-sky-800 underline"
        >
          {expanded ? '접기' : '본문 보러가기'}
        </button>
      )}
    </div>
  );
}
