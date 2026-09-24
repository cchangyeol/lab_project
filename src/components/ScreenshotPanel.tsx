// 스크린샷 목록을 2열 그리드로 보여주는 부품 (왼쪽/오른쪽 어디든 재사용)
export default function ScreenshotPanel({ screenshots }: { screenshots: string[] }) {
  if (screenshots.length === 0) {
    return <p className="text-sm text-stone-400">등록된 스크린샷이 없습니다.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {screenshots.map((url) => (
        <img key={url} src={url} alt="게임 스크린샷" className="w-full h-auto rounded-xl border border-stone-200 shadow-sm" />
      ))}
    </div>
  );
}
