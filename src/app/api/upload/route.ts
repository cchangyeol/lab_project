// 이미지 파일 하나를 받아서 Vercel Blob에 올리고 주소를 돌려주는 API

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const form = await request.formData(); // 브라우저가 보낸 파일을 꺼냄
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  }

  // accept="image/*"는 브라우저 쪽 힌트일 뿐이라 서버에서도 똑같이 확인해야 함
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '이미지 파일(png, jpeg, webp, gif)만 올릴 수 있습니다.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 용량은 10MB를 넘을 수 없습니다.' }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true // 같은 이름으로 덮어쓰는 사고 방지
  });

  return NextResponse.json({ url: blob.url }) // 업로드된 주소를 돌려줌
}
