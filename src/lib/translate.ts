// RAWG/Steam 검색에서 공용으로 쓰는 번역 유틸

// 한글이 섞여 있으면 번역
export function containsHangul(text: string): boolean {
  return /[\uac00-\ud7a3]/.test(text);
}

// 키 없이 쓸 수 있는 무료 번역 API
export async function translateText(text: string, langpair: string): Promise<string> {
  if (!text.trim()) return text;
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
    if (!res.ok) return text;
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text; // 번역 API가 죽어도 검색 자체는 계속됨
  }
}

export function translateToEnglish(text: string): Promise<string> {
  return translateText(text, 'ko|en');
}

export function translateToKorean(text: string): Promise<string> {
  return translateText(text, 'en|ko');
}
