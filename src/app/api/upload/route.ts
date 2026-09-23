// 이미지 파일 하나를 받아서 Vercel Blob에 올리고 주소를 돌려주는 API

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData(); // 브라우저가 보낸 파일을 꺼냄
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'no file' }, { status:400 });
  }

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true // 같은 이름으로 덮어쓰는 사고 방지
  });

  return NextResponse.json({ url: blob.url }) // 업로드된 주소를 돌려줌
}
