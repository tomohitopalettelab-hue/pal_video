import { NextResponse } from 'next/server';
import { getJobById, updateJob } from '../_lib/pal-video-store';
import { palDbPost, palDbGet } from '../_lib/pal-db-client';

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

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'ジョブが見つかりません。' }, { status: 404 });
    }

    const endpoint = mode === 'preview'
      ? '/api/pal-video/generate'
      : '/api/pal-video/render';

    const renderPayload = {
      jobId: job.id,
      paletteId: job.paletteId,
      planCode: job.planCode,
      payload: job.payload,
    };

    // FFmpeg レンダリングは 7 カットで最大 3 分かかるため 300 秒に設定
    const renderRes = await palDbPost(endpoint, renderPayload, { timeoutMs: 300000 });
    const renderBody = await renderRes.json().catch(() => ({}));

    if (!renderRes.ok) {
      return NextResponse.json(
        { success: false, error: renderBody?.error || 'レンダリングに失敗しました。' },
        { status: renderRes.status },
      );
    }

    // バックグラウンドレンダー開始 → ポーリングで完了を検知
    if (renderBody?.status === 'rendering') {
      // pal_db が Render.com でスリープしないよう、バックグラウンドで keep-alive ピングを送る
      // レンダリング中（最大120分）、45秒ごとにヘルスチェックして接続を維持
      void (async () => {
        const pingIntervalMs = 45_000;
        const maxPingMs      = 120 * 60 * 1000;
        const started        = Date.now();
        while (Date.now() - started < maxPingMs) {
          await new Promise((r) => setTimeout(r, pingIntervalMs));
          try {
            // ジョブのステータスを確認（同時にサーバーをウォームに保つ）
            const check = await palDbGet(`/api/pal-video/jobs/${encodeURIComponent(jobId)}`);
            if (check.ok) {
              const body = await check.json().catch(() => ({})) as { job?: { status?: string } };
              const st = body?.job?.status;
              // 完了またはエラーならピング終了
              if (st && !['レンダリング中', 'rendering'].includes(st)) break;
            }
          } catch { /* ピング失敗は無視 */ }
        }
      })();
      return NextResponse.json({ success: true, status: 'rendering', jobId });
    }

    const url = renderBody?.url || renderBody?.previewUrl || renderBody?.renderUrl || null;
    if (url) {
      const updateData = mode === 'preview'
        ? { previewUrl: url, status: 'preview' as const }
        : { previewUrl: url, status: 'rendered' as const };
      await updateJob(jobId, updateData);
    }

    return NextResponse.json({
      success: true,
      url,
      job: { ...job, previewUrl: url || job.previewUrl },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'レンダリングに失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
