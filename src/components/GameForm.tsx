// 게임 기록을 등록/수정하는 폼. game prop이 있으면 수정 모드, 없으면 등록 모드로 동작
// (등록 폼과 수정 폼이 거의 똑같아서 하나로 합쳐서 둘 다 고칠 때 한 곳만 고치면 되게 함)
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, GameStatus, Screenshot } from '@/types/game';
import { GENRE_OPTIONS, PLATFORM_OPTIONS } from '@/types/game';
import BackButton from '@/components/BackButton';
import { checkImage, uploadImage } from '@/lib/uploadImage';
import { matchRawgGenres, matchRawgPlatforms } from '@/lib/rawgMapping';

// /api/rawg/search 결과 하나
interface RawgSearchResult {
  id: number;
  name: string;
  released: string | null;
  backgroundImage: string | null;
  platforms: string[];
}

// /api/rawg/[id] 응답
interface RawgGameDetail {
  title: string;
  released: string | null;
  coverImage: string | null;
  summary: string;
  metacritic: number | null;
  platforms: string[];
  genreTerms: string[];
  developers: string[];
  publishers: string[];
  screenshots: string[];
  trailerUrl: string | null;
  sourceUrl: string | null;
}

// /api/steam 응답의 result
interface SteamInfo {
  price: string | null;
  trailerUrl: string | null;
  playTimeHours: number | null;
}

interface SteamLibraryGame {
  appid: number;
  name: string;
  playTimeHours: number;
  iconUrl: string | null;
  lastPlayedAt: string | null;
}

interface SteamSearchResult {
  appid: number;
  name: string;
  image: string | null;
}
interface SteamGameDetail {
  title: string;
  coverImage: string | null;
  summary: string;
  genreTerms: string[];
  developers: string[];
  publishers: string[];
  metacritic: number | null;
  releaseDate: string | null;
  screenshots: string[];
  price: string | null;
  trailerUrl: string | null;
  sourceUrl: string;
}

type SearchResult =
  | ({ source: 'rawg' } & RawgSearchResult)
  | ({ source: 'steam' } & SteamSearchResult);

const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed';
const sectionTitleClass = 'text-xs font-semibold text-stone-400 uppercase tracking-wide';

export default function GameForm({ game }: { game?: Game }) {
  const router = useRouter();
  const isEdit = Boolean(game);
  const today = new Date().toISOString().slice(0, 10);

  // 수정 모드면 기존 값으로, 등록 모드면 빈 값으로 state를 초기화
  const [title, setTitle] = useState(game?.title ?? '');
  const [platform, setPlatform] = useState(game?.platform ?? '');
  const [genres, setGenres] = useState<string[]>(game?.genres ?? []);
  const [releaseDate, setReleaseDate] = useState(game?.releaseDate ?? '');
  const [startDate, setStartDate] = useState(game?.startDate ?? '');
  const [endDate, setEndDate] = useState(game?.endDate ?? '');
  const [playTime, setPlayTime] = useState(game ? String(game.playTime) : '');
  const [rating, setRating] = useState(game?.rating ?? 0);
  const [status, setStatus] = useState<GameStatus>(game?.status ?? '하는중');
  const [trailerUrls, setTrailerUrls] = useState<string[]>(
    game?.trailerUrls && game.trailerUrls.length > 0 ? game.trailerUrls : ['']
  );
  const [screenshots, setScreenshot] = useState<Screenshot[]>(game?.screenshots ?? []);
  const [uploading, setUploading] = useState(false);
  const pendingFiles = useRef<Map<string, File>>(new Map()); // 미리보기 주소 → 아직 안 올린 파일

  // RAWG/Steam에서 가져온 선택 정보
  const [coverImage, setCoverImage] = useState(game?.coverImage ?? '');
  const [summary, setSummary] = useState(game?.summary ?? '');
  const [sourceUrl, setSourceUrl] = useState(game?.sourceUrl ?? '');
  const [metacritic, setMetacritic] = useState<number | undefined>(game?.metacritic);
  const [developers, setDevelopers] = useState<string[]>(game?.developers ?? []);
  const [publishers, setPublishers] = useState<string[]>(game?.publishers ?? []);
  const [price, setPrice] = useState(game?.price ?? '');

  const [rawgPlatformCandidates, setRawgPlatformCandidates] = useState<string[]>([]);

  const [steamLibrary, setSteamLibrary] = useState<SteamLibraryGame[]>([]);
  const [steamLibraryOpen, setSteamLibraryOpen] = useState(false);
  const [steamLibraryLoading, setSteamLibraryLoading] = useState(false);
  const [steamApplyingAppId, setSteamApplyingAppId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  // 검색으로 새 게임을 고를 때, 이전 선택으로 채워졌던 값들을 먼저 비움
  // (스크린샷 중 blob:으로 시작하는 건 사용자가 직접 올린 거라 안 지움)
  function resetFetchedInfo() {
    setCoverImage('');
    setSummary('');
    setSourceUrl('');
    setMetacritic(undefined);
    setDevelopers([]);
    setPublishers([]);
    setPrice('');
    setTrailerUrls(['']);
    setScreenshot((prev) => prev.filter((s) => s.url.startsWith('blob:')));
    setRawgPlatformCandidates([]);
  }

  // 고른 RAWG 결과를 폼에 채움 (성공/실패 처리는 호출하는 쪽에서)
  async function applyRawgItem(item: RawgSearchResult) {
    const [detailRes, steamRes] = await Promise.all([
      fetch(`/api/rawg/${item.id}`),
      fetch(`/api/steam?title=${encodeURIComponent(item.name)}`),
    ]);

    const detail: RawgGameDetail = await detailRes.json();
    if (!detailRes.ok) throw new Error((detail as unknown as { error?: string }).error ?? 'RAWG 상세 정보를 가져오지 못했습니다.');

    const steamData = steamRes.ok ? await steamRes.json() : { result: null };
    const steamInfo: SteamInfo | null = steamData.result ?? null;

    setTitle(detail.title);

    const matchedPlatforms = matchRawgPlatforms(detail.platforms);
    setRawgPlatformCandidates(matchedPlatforms);
    if (matchedPlatforms.length === 1) {
      setPlatform(matchedPlatforms[0]);
    }

    const matchedGenres = matchRawgGenres(detail.genreTerms);
    if (matchedGenres.length > 0) {
      setGenres((prev) => Array.from(new Set([...prev, ...matchedGenres])));
    }

    if (detail.released) setReleaseDate(detail.released);
    if (detail.coverImage) setCoverImage(detail.coverImage);
    if (detail.summary) setSummary(detail.summary);
    if (detail.sourceUrl) setSourceUrl(detail.sourceUrl);
    if (typeof detail.metacritic === 'number') setMetacritic(detail.metacritic);
    if (detail.developers.length > 0) setDevelopers(detail.developers);
    if (detail.publishers.length > 0) setPublishers(detail.publishers);

    if (detail.screenshots.length > 0) {
      const remaining = 24 - screenshots.length;
      if (remaining > 0) {
        const added = detail.screenshots.slice(0, remaining).map((url) => ({ url }));
        setScreenshot((prev) => [...prev, ...added]);
      }
    }
    if (steamInfo?.price) setPrice(steamInfo.price);

    const trailerUrl = steamInfo?.trailerUrl ?? detail.trailerUrl ?? null;
    if (trailerUrl) {
      setTrailerUrls((prev) => {
        const filled = prev.filter((u) => u.trim() !== '');
        if (filled.includes(trailerUrl) || filled.length >= 3) return prev;
        return [...filled, trailerUrl];
      });
    }

    if (typeof steamInfo?.playTimeHours === 'number') {
      setPlayTime(String(steamInfo.playTimeHours));
    }
  }

  // Steam appid 하나로 상세 정보를 가져와 폼에 채우는 공통 로직
  // (Steam 검색에서 고르든, 내 라이브러리에서 고르든 여기서 끝남)
  async function applySteamDetail(appid: number, fallbackTitle: string) {
    const res = await fetch(`/api/steam/${appid}`);
    const detail: SteamGameDetail = await res.json();
    if (!res.ok) throw new Error((detail as unknown as { error?: string }).error ?? 'Steam 상세 정보를 가져오지 못했습니다.');

    setTitle(detail.title || fallbackTitle);
    setPlatform('PC');

    const matchedGenres = matchRawgGenres(detail.genreTerms);
    if (matchedGenres.length > 0) {
      setGenres((prev) => Array.from(new Set([...prev, ...matchedGenres])));
    }

    if (detail.releaseDate) setReleaseDate(detail.releaseDate);
    if (detail.coverImage) setCoverImage(detail.coverImage);
    if (detail.summary) setSummary(detail.summary);
    setSourceUrl(detail.sourceUrl);
    if (typeof detail.metacritic === 'number') setMetacritic(detail.metacritic);
    if (detail.developers.length > 0) setDevelopers(detail.developers);
    if (detail.publishers.length > 0) setPublishers(detail.publishers);
    if (detail.price) setPrice(detail.price);

    if (detail.trailerUrl) {
      const trailerUrl = detail.trailerUrl;
      setTrailerUrls((prev) => {
        const filled = prev.filter((u) => u.trim() !== '');
        if (filled.includes(trailerUrl) || filled.length >= 3) return prev;
        return [...filled, trailerUrl];
      });
    }

    if (detail.screenshots.length > 0) {
      const remaining = 24 - screenshots.length;
      if (remaining > 0) {
        const added = detail.screenshots.slice(0, remaining).map((url) => ({ url }));
        setScreenshot((prev) => [...prev, ...added]);
      }
    }
  }

  // 검색창 하나로 RAWG + Steam 동시 검색
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const q = searchQuery.trim();
      const [rawgRes, steamRes] = await Promise.all([
        fetch(`/api/rawg/search?q=${encodeURIComponent(q)}`),
        fetch(`/api/steam/search?q=${encodeURIComponent(q)}`),
      ]);
      const rawgData = rawgRes.ok ? await rawgRes.json() : { results: [] };
      const steamData = steamRes.ok ? await steamRes.json() : { results: [] };

      const rawgItems: SearchResult[] = (rawgData.results ?? []).map((r: RawgSearchResult) => ({ source: 'rawg' as const, ...r }));
      const steamItems: SearchResult[] = (steamData.results ?? []).map((r: SteamSearchResult) => ({ source: 'steam' as const, ...r }));

      setSearchResults([...steamItems, ...rawgItems]);
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  // 통합 검색 결과 중 하나를 고르면 출처에 맞는 함수로 폼을 채움
  async function applySearchResult(item: SearchResult) {
    const key = item.source === 'rawg' ? `rawg-${item.id}` : `steam-${item.appid}`;
    setApplyingKey(key);
    setSearchError('');
    resetFetchedInfo();
    try {
      if (item.source === 'rawg') {
        await applyRawgItem(item);
      } else {
        await applySteamDetail(item.appid, item.name);
      }
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setApplyingKey(null);
    }
  }

  // Steam 라이브러리 목록을 불러옴 (이미 불러왔으면 토글만)
  async function loadSteamLibrary() {
    if (steamLibrary.length > 0) {
      setSteamLibraryOpen((prev) => !prev);
      return;
    }
    setSteamLibraryLoading(true);
    try {
      const res = await fetch('/api/steam/library');
      const data = await res.json();
      setSteamLibrary(data.games ?? []);
      setSteamLibraryOpen(true);
    } finally {
      setSteamLibraryLoading(false);
    }
  }

  // 라이브러리에서 게임을 고르면, 이미 알고 있는 appid로 Steam 상세를 바로 가져와 적용
  // (장르 · 플랫폼 · 커버 · 소개글 · 가격 · 트레일러는 Steam이, 플레이 시간 · 마지막 플레이는 라이브러리 데이터가 채움)
  async function applySteamLibraryItem(game: SteamLibraryGame) {
    setSteamApplyingAppId(game.appid);
    setSearchError('');
    resetFetchedInfo();
    try {
      await applySteamDetail(game.appid, game.name);
      setPlayTime(String(game.playTimeHours));
      if (game.lastPlayedAt) setEndDate(game.lastPlayedAt);
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setSteamApplyingAppId(null);
      setSteamLibraryOpen(false);
    }
  }

  // 파일을 고르면 바로 올리지 않고 미리보기(blob: 주소)만 만들어 둠
  // 실제 업로드는 저장 버튼을 눌렀을 때 함 → 올려놓고 저장 안 하고 나가도 Blob에 파일이 안 남음
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 24 - screenshots.length; // 몇 개 더 추가 가능한지
    if (remaining <= 0) {
      alert('스크린샷 한도 도달');
      e.target.value = '';
      return;
    }

    if (files.length > remaining) {
      alert(`스크린샷은 최대 24개까지라 ${remaining}개만 추가합니다.`);
    }

    const added: Screenshot[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const problem = checkImage(file);
      if (problem) {
        alert(problem);
        continue; // 못 올리는 파일은 건너뛰고 나머지는 추가
      }
      const previewUrl = URL.createObjectURL(file);
      pendingFiles.current.set(previewUrl, file);
      added.push({ url: previewUrl });
    }

    setScreenshot((prev) => [...prev, ...added]);
    e.target.value = '';
  }

  function handleRemoveScreenshot(url: string) {
    if (pendingFiles.current.delete(url)) URL.revokeObjectURL(url); // 아직 안 올린 파일이면 미리보기만 정리
    setScreenshot((prev) => prev.filter((s) => s.url !== url));
  }

  // 미리보기로만 있던 사진을 Blob에 올리고 진짜 주소로 바꾼 목록을 돌려줌
  // 올라간 건 바로 state에도 반영해서, 저장이 실패해 다시 눌러도 같은 파일을 또 올리지 않게 함
  // ponytail: 업로드 후 저장 자체가 실패하고 그대로 나가면 그 파일은 Blob에 남음 — 문제되면 서버에 정리 API 추가
  async function uploadPending(): Promise<Screenshot[]> {
    const result: Screenshot[] = [];
    for (const shot of screenshots) {
      const file = pendingFiles.current.get(shot.url);
      if (!file) {
        result.push(shot);
        continue;
      }
      const url = await uploadImage(file);
      pendingFiles.current.delete(shot.url);
      URL.revokeObjectURL(shot.url);
      setScreenshot((prev) => prev.map((s) => (s.url === shot.url ? { ...s, url } : s)));
      result.push({ ...shot, url });
    }
    return result;
  }

  function handleTrailerChange(index: number, value: string) {
    setTrailerUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  }

  function handleAddTrailer() {
    if (trailerUrls.length >= 3) {
      alert('트레일러는 최대 3개까지 등록할 수 있습니다.');
      return;
    }
    setTrailerUrls((prev) => [...prev, '']);
  }

  function handleRemoveTrailer(index: number) {
    setTrailerUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (genres.length === 0) {
      alert('장르를 하나 이상 선택해주세요.');
      return;
    }

    // 날짜 유효성 검사: 미래 날짜거나, 마지막 플레이가 시작일보다 빠르면 저장 안 함
    if (startDate && startDate > today) {
      alert('시작일은 오늘보다 미래일 수 없습니다.');
      return;
    }
    if (endDate && endDate > today) {
      alert('마지막 플레이 날짜는 오늘보다 미래일 수 없습니다.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      alert('마지막 플레이 날짜가 시작일보다 빠를 수 없습니다.');
      return;
    }

    // 플레이 시간이나 평점이 숫자가 아니면 저장하지 않고 알림만 띄움
    const playTimeNum = playTime === '' ? 0 : Math.max(0, Number(playTime));
    if (Number.isNaN(playTimeNum) || Number.isNaN(rating)) {
      alert('숫자 외엔 입력할 수 없습니다.');
      return;
    }

    setUploading(true);
    let res: Response;
    try {
      const payload = {
        title,
        platform,
        genres,
        releaseDate: releaseDate || undefined,
        startDate,
        endDate,
        playTime: playTimeNum,
        rating,
        status,
        trailerUrls: trailerUrls.filter((u) => u.trim() !== ''),
        screenshots: await uploadPending(),
        coverImage: coverImage || undefined,
        summary: summary || undefined,
        sourceUrl: sourceUrl || undefined,
        metacritic,
        developers: developers.length > 0 ? developers : undefined,
        publishers: publishers.length > 0 ? publishers : undefined,
        price: price || undefined,
      };

      res = await fetch(isEdit ? `/api/games/${game!._id}` : '/api/games', {
        method: isEdit ? 'PUT' : 'POST', // 새로 만드는 게 아니라 기존 문서를 바꾸는 거면 PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      alert(`업로드에 실패했습니다: ${(error as Error).message}`);
      return;
    } finally {
      setUploading(false); // 중간에 에러가 나도 업로드 중 표시가 계속 남지 않게 함
    }

    if (res.ok) {
      if (isEdit) {
        router.refresh(); // 상세 화면 캐시를 비워서 수정한 값이 새로고침 없이 바로 보이게 함
        router.replace(`/games/${game!._id}`);
      } else {
        router.refresh(); // 목록 캐시를 비워서 방금 등록한 카드가 바로 보이게 함
        router.back();
      }
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? (isEdit ? '수정에 실패했습니다.' : '게임 기록 저장에 실패했습니다.'));
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 p-8 flex justify-center">
      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="w-full max-w-md flex flex-col gap-4">
        <BackButton />

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-6">
          <h1 className="text-xl font-bold text-stone-800">{isEdit ? '게임 기록 수정' : '게임 기록 등록'}</h1>

          {!isEdit && (
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-5">
            <h2 className={sectionTitleClass}>RAWG/Steam 정보로 채우기 (선택)</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="게임명으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                className={`${inputClass} flex-1 text-stone-800`}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg px-4 text-sm font-medium transition disabled:opacity-50"
              >
                {searching ? '검색 중...' : '검색'}
              </button>
            </div>

            <button
              type="button"
              onClick={loadSteamLibrary}
              disabled={steamLibraryLoading}
              className="self-start text-sky-600 text-sm underline disabled:opacity-50"
            >
              {steamLibraryLoading ? '불러오는 중...' : '내 Steam 라이브러리에서 고르기'}
            </button>

            {searchError && <p className="text-xs text-rose-500">{searchError}</p>}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {searchResults.map((item) => {
                  const key = item.source === 'rawg' ? `rawg-${item.id}` : `steam-${item.appid}`;
                  const image = item.source === 'rawg' ? item.backgroundImage : item.image;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => applySearchResult(item)}
                      disabled={applyingKey !== null}
                      className="flex items-center gap-3 text-left border border-stone-200 rounded-lg p-2 text-xs hover:bg-sky-50 transition disabled:opacity-50"
                    >
                      {image && <img src={image} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="font-semibold text-stone-800">{item.name}</div>
                        <div className="text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.source === 'rawg' ? 'bg-sky-100 text-sky-700' : 'bg-stone-800 text-white'}`}>
                            {item.source === 'rawg' ? 'RAWG' : 'Steam'}
                          </span>
                          {item.source === 'rawg' && <span>{item.released ?? '출시일 미상'}</span>}
                        </div>
                      </div>
                      {applyingKey === key && <span className="text-stone-400">불러오는 중...</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {steamLibraryOpen && (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto border border-stone-200 rounded-lg p-2">
                {steamLibrary.length === 0 ? (
                  <p className="text-xs text-stone-400 p-2">라이브러리가 비어있거나 비공개 설정입니다.</p>
                ) : (
                  steamLibrary.map((game) => (
                    <button
                      type="button"
                      key={game.appid}
                      onClick={() => applySteamLibraryItem(game)}
                      disabled={steamApplyingAppId !== null}
                      className="flex items-center gap-3 text-left border border-stone-200 rounded-lg p-2 text-xs hover:bg-sky-50 transition disabled:opacity-50"
                    >
                      {game.iconUrl && <img src={game.iconUrl} alt="" className="w-8 h-8 rounded flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="font-semibold text-stone-800">{game.name}</div>
                        <div className="text-stone-500">{game.playTimeHours}시간 플레이</div>
                      </div>
                      {steamApplyingAppId === game.appid && <span className="text-stone-400">적용 중...</span>}
                    </button>
                  ))
                )}
              </div>
            )}

            {coverImage && (
              <div className="flex gap-3 items-start border border-stone-200 rounded-lg p-3">
                <img src={coverImage} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                <div className="text-xs text-stone-500 flex flex-col gap-0.5">
                  <div className="flex gap-2">
                    {releaseDate && <span>출시일 {releaseDate}</span>}
                    {metacritic !== undefined && <span>메타크리틱 {metacritic}</span>}
                    {price && <span>{price}</span>}
                  </div>
                  {(developers.length > 0 || publishers.length > 0) && (
                    <span>{[...developers, ...publishers].join(' · ')}</span>
                  )}
                  {summary && <p className="text-stone-400 line-clamp-3">{summary}</p>}
                </div>
              </div>
            )}
          </div>
          )}

          <div className="flex flex-col gap-3">
            <h2 className={sectionTitleClass}>기본 정보</h2>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              게임명
              <input type="text" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-stone-600">
                플랫폼
                <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)} required>
                  <option value="">선택하세요</option>
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {rawgPlatformCandidates.length > 1 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rawgPlatformCandidates.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition ${
                          platform === p ? 'bg-sky-200 border-sky-300 text-sky-900' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </label>

              <label className="flex flex-col gap-1 text-sm text-stone-600">
                상태
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as GameStatus;
                    setStatus(newStatus);
                    if (newStatus === '하고싶음') {
                      setStartDate('');
                      setEndDate('');
                      setPlayTime('');
                      setRating(0);
                    }
                  }}
                >
                  <option value="하고싶음">하고싶음</option>
                  <option value="하는중">하는중</option>
                  <option value="클리어">클리어</option>
                  <option value="중단">중단</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-1 text-sm text-stone-600">
              장르 (하나 이상 선택)
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((g) => (
                  <label
                    key={g}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition ${
                      genres.includes(g) ? 'bg-sky-200 border-sky-300 text-sky-900' : 'bg-white border-stone-200 text-stone-600'
                    }`}
                  >
                    <input type="checkbox" checked={genres.includes(g)} onChange={() => toggleGenre(g)} className="sr-only" />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-5">
            <h2 className={sectionTitleClass}>날짜 · 플레이 정보</h2>

            <label className="flex flex-col gap-1 text-sm text-stone-600">
              출시일 (선택)
              <input type="date" className={inputClass} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-stone-600">
                시작일
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={status === '하고싶음'}
                  max={today}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-stone-600">
                마지막 플레이 (선택)
                <input
                  type="date"
                  className={inputClass}
                  min={startDate}
                  max={today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={status === '하고싶음'}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-stone-600">
                플레이 시간 (시간)
                <input type="number"
                  min={0}
                  className={inputClass}
                  value={playTime}
                  onChange={(e) => setPlayTime(e.target.value)}
                  disabled={status === '하고싶음'}
                  required={status !== '하고싶음'}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-stone-600">
                평점 (1~5점)
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
                  disabled={status === '하고싶음'}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-5">
            <h2 className={sectionTitleClass}>트레일러 (최대 3개)</h2>
            <div className="flex flex-col gap-2">
              {trailerUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" className={`${inputClass} flex-1`} value={url} onChange={(e) => handleTrailerChange(i, e.target.value)} />
                    <button type="button" onClick={() => handleRemoveTrailer(i)} className="text-rose-600 text-sm px-2">삭제</button>
                </div>
              ))}
              {trailerUrls.length < 3 && (
                <button type="button" onClick={handleAddTrailer} className="self-start text-sky-600 text-sm underline">+ 트레일러 추가</button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-5">
            <h2 className={sectionTitleClass}>스크린샷 (선택, 최대 24장 — {screenshots.length}/24)</h2>
            <label className="sr-only" htmlFor="screenshot-upload">스크린샷 업로드</label>
            <input id="screenshot-upload" type="file" accept="image/*" multiple onChange={handleFileChange} className={inputClass} disabled={screenshots.length >= 24} />
            {uploading && <p className="text-xs text-stone-400">업로드 중...</p>}
            {screenshots.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {screenshots.map((shot) => (
                  <div key={shot.url} className="relative">
                    <img src={shot.url} alt="스크린샷 미리보기" className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(shot.url)}
                      aria-label="스크린샷 삭제"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-200 text-rose-900 text-xs leading-none flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '업로드 중...' : isEdit ? '수정 완료' : '등록 완료'}
          </button>
        </div>
      </form>
    </main>
  );
}
