import { buildPalDbUrl } from '../../api/_lib/pal-db-client';
import type { PalVideoJob } from '../../api/_lib/pal-video-store';

const ACCENT = '#E95464';

const DESTINATION_LABELS: Record<string, string> = {
  instagram_reel:  'Instagram リール',
  instagram_story: 'Instagram ストーリーズ',
  instagram_feed:  'Instagram フィード',
  tiktok:          'TikTok',
  youtube_short:   'YouTube ショート',
  youtube:         'YouTube',
  x_twitter:       'X (Twitter)',
  line_voom:       'LINE VOOM',
  facebook:        'Facebook',
  web_banner:      'Webバナー動画',
};

const PURPOSE_LABELS: Record<string, string> = {
  promotion:   'プロモーション',
  sns_post:    'SNS投稿',
  sns_ad:      'SNS広告',
  review:      '口コミ紹介',
  achievement: '実績紹介',
};

const STATUS_LABELS: Record<string, string> = {
  draft:     '下書き',
  preview:   'プレビュー',
  rendered:  '完成',
  published: '公開済',
};

// Portrait destinations (9:16 or 4:5)
const PORTRAIT_DESTINATIONS = new Set([
  'instagram_reel', 'instagram_story', 'tiktok', 'youtube_short',
  'x_twitter', 'line_voom', 'facebook',
]);
const SQUARE_DESTINATIONS = new Set(['instagram_feed']);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF2F3' }}>
        <div className="text-center">
          <p className="text-2xl mb-2">🎬</p>
          <p className="text-slate-600 font-medium">動画が見つかりません</p>
          <p className="text-slate-400 text-sm mt-1">URLを確認してください</p>
        </div>
      </div>
    );
  }

  const title = job.payload?.title || '動画プレビュー';
  const destination = job.payload?.destination || '';
  const purpose = PURPOSE_LABELS[job.payload?.purpose || ''] || job.payload?.purpose || '';
  const destLabel = DESTINATION_LABELS[destination] || destination;
  const status = STATUS_LABELS[job.status] || job.status;

  const isPortrait = PORTRAIT_DESTINATIONS.has(destination);
  const isSquare   = SQUARE_DESTINATIONS.has(destination);
  // Portrait → スマホ幅(390px), Square → 480px, Landscape → full(max-w-2xl)
  const videoContainerClass = isPortrait
    ? 'w-full max-w-[390px] mx-auto'
    : isSquare
    ? 'w-full max-w-[480px] mx-auto'
    : 'w-full';

  return (
    <div style={{ backgroundColor: '#FDF2F3', minHeight: '100vh' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ACCENT }}
          >
            <span className="text-white text-[10px] font-black">PV</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {purpose && <span className="text-[10px] text-slate-400">{purpose}</span>}
              {destLabel && <span className="text-[10px] text-slate-400">· {destLabel}</span>}
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {status}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">
        {/* Video player */}
        <div className={`${videoContainerClass} mb-6`}>
          {job.previewUrl ? (
            <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
              <video
                src={job.previewUrl}
                controls
                playsInline
                className="w-full block"
              >
                <source src={job.previewUrl} type="video/mp4" />
                お使いのブラウザは動画再生に対応していません。
              </video>
            </div>
          ) : (
            <div
              className="rounded-2xl flex items-center justify-center shadow-xl"
              style={{
                aspectRatio: isPortrait ? '9/16' : isSquare ? '1/1' : '16/9',
                background: `linear-gradient(140deg, ${job.payload?.colorPrimary || ACCENT}, ${job.payload?.colorAccent || '#1c9a8b'})`,
              }}
            >
              <div className="text-center text-white p-8">
                <p className="text-5xl mb-3">🎬</p>
                <p className="font-bold text-lg">プレビュー準備中</p>
                <p className="text-sm opacity-70 mt-1">しばらくお待ちください</p>
              </div>
            </div>
          )}
        </div>

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
            {destLabel && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">投稿先</p>
                <p className="text-slate-700">{destLabel}</p>
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
          {job.payload?.cuts && job.payload.cuts.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">カット構成</p>
              <p className="text-sm text-slate-700">{job.payload.cuts.length}カット</p>
            </div>
          )}
        </div>

        {/* Download / contact */}
        <div className="mt-5 flex flex-col gap-3">
          {job.previewUrl && (
            <a
              href={job.previewUrl}
              download
              className="w-full py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 bg-white hover:bg-slate-50"
            >
              ⬇ MP4 をダウンロード
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
