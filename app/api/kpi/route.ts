import { NextRequest, NextResponse } from 'next/server';
import { getJobsByPaletteId } from '../_lib/pal-video-store';

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid');
  if (!cid) return NextResponse.json({ error: 'cid is required' }, { status: 400 });

  try {
    const jobs = await getJobsByPaletteId(cid, 100);

    const completed = jobs.filter((j) => j.status === 'rendered' || j.status === 'published').length;
    const rendering = jobs.filter((j) => j.status === 'rendering' || j.status === 'queued').length;
    const draft = jobs.filter((j) => j.status === 'draft' || j.status === 'preview' || j.status === '編集中').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const youtubePublished = jobs.filter((j) => j.youtubeUrl).length;

    const lastJob = jobs.length > 0 ? jobs[0] : null;
    const lastActivity = lastJob?.updatedAt || lastJob?.createdAt || null;
    const daysSince = lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000) : 999;

    let health: 'green' | 'yellow' | 'red' = 'green';
    if (failed > 0) health = 'red';
    else if (daysSince > 30) health = 'yellow';

    return NextResponse.json({
      service: 'pal_video',
      serviceName: 'Pal Video',
      paletteId: cid,
      kpi: {
        totalVideos: jobs.length,
        completed,
        rendering,
        draft,
        failed,
        youtubePublished,
      },
      health,
      lastActivity,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
