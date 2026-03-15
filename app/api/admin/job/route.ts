import { NextResponse } from 'next/server';
import { getJobsByPaletteId, getJobById, createJob, updateJob, type CreateJobData } from '../../_lib/pal-video-store';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const paletteId = url.searchParams.get('paletteId');

    if (id) {
      const job = await getJobById(id);
      if (!job) {
        return NextResponse.json({ success: false, error: 'ジョブが見つかりません。' }, { status: 404 });
      }
      return NextResponse.json({ success: true, job });
    }

    if (paletteId) {
      const jobs = await getJobsByPaletteId(paletteId, 20);
      return NextResponse.json({ success: true, jobs });
    }

    return NextResponse.json({ success: false, error: 'id または paletteId を指定してください。' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ジョブ取得に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateJobData & { id?: string };

    if (!body.paletteId) {
      return NextResponse.json({ success: false, error: 'paletteId は必須です。' }, { status: 400 });
    }

    let job;
    if (body.id) {
      job = await updateJob(body.id, body);
    } else {
      job = await createJob(body);
    }

    if (!job) {
      return NextResponse.json({ success: false, error: 'ジョブの保存に失敗しました。' }, { status: 500 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ジョブ保存に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id を指定してください。' }, { status: 400 });
    }

    const job = await updateJob(id, { status: 'draft' });
    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ジョブの削除に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
