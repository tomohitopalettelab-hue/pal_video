import { buildPalDbUrl } from '../../api/_lib/pal-db-client';
import type { PalVideoJob } from '../../api/_lib/pal-video-store';

const ACCENT = '#E95464';

const PURPOSE_LABELS: Record<string, string> = {
  instagram_reel: 'Instagramリール',
  youtube_short: 'YouTubeショート',
  tiktok: 'TikTok',
  web_banner: 'Webバナー',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  preview: 'プレビュー',
  rendered: '完成',
  published: '公開済',
};

type PageProps = {
  params: Promise<{ jobId: string }>;
};

async function fetchJob(jobId: string): Promise<PalVideoJob | null> {
  try {
    const url = buildPalDbUrl(`/api/pal-video/jobs/${encodeURIComponent(jobId)}`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    const raw = body?.job || body;
    if (!raw?.id) return null;
    return {
      id: String(raw.id || ''),
      paletteId: String(raw.palette_id || raw.paletteId || ''),
      planCode: String(raw.plan_code || raw.planCode || ''),
      status: raw.status || 'draft',
      payload: raw.payload || {},
      previewUrl: raw.preview_url ?? raw.previewUrl ?? null,
      youtubeUrl: raw.youtube_url ?? raw.youtubeUrl ?? null,
      createdAt: raw.created_at ?? raw.createdAt ?? undefined,
      updatedAt: raw.updated_at ?? raw.updatedAt ?? undefined,
    };
  } catch {
    return null;
  }
}

export default async function PreviewPage({ params }: PageProps) {
  const { jobId } = await params;
  const job = await fetchJob(jobId);

  if (!job) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FDF2F3' }}
      >
        <div className="text-center">
          <p className="text-2xl mb-2">🎬</p>
          <p className="text-slate-600 font-medium">動画が見つかりません</p>
          <p className="text-slate-400 text-sm mt-1">URLを確認してください</p>
        </div>
      </div>
    );
  }

  const title = job.payload?.title || '動画プレビュー';
  const purpose = PURPOSE_LABELS[job.payload?.purpose || ''] || job.payload?.purpose || '';
  const status = STATUS_LABELS[job.status] || job.status;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF2F3' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ACCENT }}
          >
            <span className="text-white text-[10px] font-black">PV</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{title}</p>
            <div className="flex items-center gap-2">
              {purpose && <span className="text-[10px] text-slate-400">{purpose}</span>}
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {status}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {job.previewUrl ? (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl mb-6">
            <video
              src={job.previewUrl}
              controls
              className="w-full"
              poster=""
            >
              <source src={job.previewUrl} type="video/mp4" />
              お使いのブラウザは動画再生に対応していません。
            </video>
          </div>
        ) : (
          <div
            className="rounded-2xl aspect-video flex items-center justify-center mb-6 shadow-xl"
            style={{
              background: `linear-gradient(140deg, ${job.payload?.colorPrimary || ACCENT}, ${job.payload?.colorAccent || '#1c9a8b'})`,
            }}
          >
            <div className="text-center text-white">
              <p className="text-4xl mb-2">🎬</p>
              <p className="font-bold">プレビュー準備中</p>
              <p className="text-sm opacity-70 mt-1">しばらくお待ちください</p>
            </div>
          </div>
        )}

        {/* Job details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-bold text-slate-800">{title}</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {purpose && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">用途</p>
                <p className="text-slate-700">{purpose}</p>
              </div>
            )}
            {job.payload?.resolution && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">解像度</p>
                <p className="text-slate-700">{job.payload.resolution}</p>
              </div>
            )}
            {job.payload?.duration && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">尺</p>
                <p className="text-slate-700">{job.payload.duration}秒</p>
              </div>
            )}
            {job.createdAt && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">作成日</p>
                <p className="text-slate-700">{new Date(job.createdAt).toLocaleDateString('ja-JP')}</p>
              </div>
            )}
          </div>

          {/* Cut count */}
          {job.payload?.cuts && job.payload.cuts.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">カット構成</p>
              <p className="text-sm text-slate-700">{job.payload.cuts.length}カット</p>
            </div>
          )}
        </div>

        {/* Contact button */}
        <div className="mt-6 text-center">
          <a
            href="mailto:info@example.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: ACCENT }}
          >
            この動画についてお問い合わせ
          </a>
        </div>
      </main>
    </div>
  );
}
