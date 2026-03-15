import { NextResponse } from 'next/server';
import { palDbGet, buildPalDbUrl } from '../_lib/pal-db-client';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const paletteId = url.searchParams.get('paletteId') || '';
    const res = await palDbGet(`/api/media?paletteId=${encodeURIComponent(paletteId)}`);
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'メディア取得に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const paletteId = formData.get('paletteId') as string || '';
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'ファイルが必要です。' }, { status: 400 });
    }

    // Forward multipart upload to pal_db
    const forwardForm = new FormData();
    forwardForm.append('file', file);
    forwardForm.append('paletteId', paletteId);

    const uploadUrl = buildPalDbUrl('/api/media/upload');
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: forwardForm,
    });

    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'メディアアップロードに失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
