import { NextResponse } from 'next/server';
import { updateJob } from '../_lib/pal-video-store';
import { palDbPost } from '../_lib/pal-db-client';

export const maxDuration = 60;

type RenderBody = {
  jobId: string;
  mode: 'preview' | 'final';
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RenderBody;
    const { jobId, mode } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId は必須です。' }, { status: 400 });
    }

    const endpoint = mode === 'preview'
      ? '/api/pal-video/generate'
      : '/api/pal-video/render';

    // pal_db 側でジョブを DB から取得してレンダリングするため、jobId だけ渡せば十分
    // （pal_db の render/generate エンドポイントが getPalVideoJob(jobId) で自前で取得する）
    const renderRes = await palDbPost(endpoint, { jobId }, { timeoutMs: 300000 });
    const renderBody = await renderRes.json().catch(() => ({}));

    if (!renderRes.ok) {
      return NextResponse.json(
        { success: false, error: renderBody?.error || 'レンダリングに失敗しました。' },
        { status: renderRes.status },
      );
    }

    // バックグラウンドレンダー開始 → フロントがポーリングで完了を検知する
    // ポーリング（4秒ごと）が pal_db へ HTTP リクエストを送り続けるため
    // pal_db は Render.com のスリープ判定に引っかからずウォーム状態を維持できる
    if (renderBody?.status === 'rendering') {
      return NextResponse.json({ success: true, status: 'rendering', jobId });
    }

    // Creatomate などの同期レンダー（URL が即時返却される場合）
    const url = renderBody?.url || renderBody?.previewUrl || renderBody?.renderUrl || null;
    if (url) {
      const updateData = mode === 'preview'
        ? { previewUrl: url, status: 'preview' as const }
        : { previewUrl: url, status: 'rendered' as const };
      await updateJob(jobId, updateData);
    }

    return NextResponse.json({ success: true, url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'レンダリングに失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
