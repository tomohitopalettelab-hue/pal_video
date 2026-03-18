import { NextResponse } from 'next/server';
import { getJobById, updateJob } from '../_lib/pal-video-store';
import { palDbPost } from '../_lib/pal-db-client';

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

    const renderRes = await palDbPost(endpoint, renderPayload, { timeoutMs: 90000 });
    const renderBody = await renderRes.json().catch(() => ({}));

    if (!renderRes.ok) {
      return NextResponse.json(
        { success: false, error: renderBody?.error || 'レンダリングに失敗しました。' },
        { status: renderRes.status },
      );
    }

    const url = renderBody?.url || renderBody?.previewUrl || renderBody?.renderUrl || null;

    // Update job with the returned URL
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
