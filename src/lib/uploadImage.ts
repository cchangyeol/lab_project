// 브라우저에서 Vercel Blob으로 이미지를 바로 올리는 함수
// 파일을 우리 서버(Vercel 함수)를 거쳐 올리면 요청 크기 한도(4.5MB)에 걸려서,
// 서버(/api/upload)에서는 업로드 허가 토큰만 받고 파일은 Blob으로 직접 보냄
import { upload } from '@vercel/blob/client';

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// 올릴 수 없는 파일이면 이유를, 괜찮으면 null을 돌려줌 (진짜 검사는 서버가 발급하는 토큰에서 한 번 더 함)
export function checkImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: 이미지 파일(png, jpeg, webp, gif)만 올릴 수 있습니다.`;
  if (file.size > MAX_IMAGE_SIZE) return `${file.name}: 파일 용량은 10MB를 넘을 수 없습니다.`;
  return null;
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
  return blob.url;
}
