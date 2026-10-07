// 브라우저가 Vercel Blob에 이미지를 직접 올릴 수 있도록 업로드 허가 토큰을 발급하는 API
// (로그인 확인은 middleware가 먼저 함. 파일 자체는 이 서버를 거치지 않아서 4.5MB 요청 한도에 안 걸림)
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/uploadImage';

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      // 토큰에 허용 종류/크기를 박아두면 Blob이 직접 거절함 (accept="image/*"는 브라우저 힌트일 뿐이라 여기서 막아야 함)
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_IMAGE_TYPES,
        maximumSizeInBytes: MAX_IMAGE_SIZE,
        addRandomSuffix: true, // 같은 이름으로 덮어쓰는 사고 방지
      }),
      // onUploadCompleted는 일부러 안 씀: 쓰면 Blob 서버가 쿠키 없이 이 주소로 콜백을 보내서 middleware에 막힘
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
