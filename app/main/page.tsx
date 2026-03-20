'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Download, Loader2 } from 'lucide-react';
import type { PalVideoJob } from '../api/_lib/pal-video-store';

const ACCENT = '#E95464';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'bg-slate-100 text-slate-500' },
  preview: { label: 'プレビュー', color: 'bg-blue-100 text-blue-700' },
  rendered: { label: '完成', color: 'bg-green-100 text-green-700' },
  published: { label: '公開済', color: 'bg-purple-100 text-purple-700' },
};

const PURPOSE_LABELS: Record<string, string> = {
  instagram_reel: 'Instagramリール',
  youtube_short: 'YouTubeショート',
  tiktok: 'TikTok',
  web_banner: 'Webバナー',
};

type SessionData = {
  authenticated: boolean;
  paletteId: string | null;
  jobs: PalVideoJob[];
};

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/main/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || 'ログインに失敗しました。');
        return;
      }
      onSuccess();
    } catch {
      setError('通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FDF2F3' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: ACCENT }}
          >
            <span className="text-white text-xs font-black">PV</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 leading-none">Pal Video</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">動画ポータル</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-5">ログインして動画を確認</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ログインID</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none"
              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
              onBlur={(e) => (e.target.style.boxShadow = '')}
              placeholder="チャットログインID"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none"
              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
              onBlur={(e) => (e.target.style.boxShadow = '')}
              placeholder="パスワード"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-60"
            style={{ backgroundColor: ACCENT }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </main>
  );
}

function JobCard({ job }: { job: PalVideoJob }) {
  const status = STATUS_LABELS[job.status] || STATUS_LABELS.draft;
  const purpose = PURPOSE_LABELS[job.payload?.purpose || ''] || job.payload?.purpose || '';
  const title = job.payload?.title || '無題の動画';
  const date = job.createdAt ? new Date(job.createdAt).toLocaleDateString('ja-JP') : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
        {job.previewUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <span className="text-white text-2xl">🎬</span>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(140deg, ${job.payload?.colorPrimary || ACCENT}, ${job.payload?.colorAccent || '#1c9a8b'})`,
            }}
          >
            <span className="text-white/70 text-2xl">▶</span>
          </div>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-slate-800 text-sm truncate">{title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {purpose && <span className="text-[10px] text-slate-400">{purpose}</span>}
          {date && <span className="text-[10px] text-slate-400">· {date}</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {job.previewUrl ? (
            <>
              <a
                href={`/preview/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1"
                style={{ backgroundColor: ACCENT }}
              >
                <ExternalLink size={12} /> プレビュー
              </a>
              <a
                href={job.previewUrl}
                download
                className="py-1.5 px-3 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium flex items-center gap-1 hover:bg-slate-50"
              >
                <Download size={12} /> MP4
              </a>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">プレビュー未生成</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MainPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/main/session');
      const data = await res.json().catch(() => ({ authenticated: false, paletteId: null, jobs: [] }));
      setSession(data);
    } catch {
      setSession({ authenticated: false, paletteId: null, jobs: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setSession({ authenticated: false, paletteId: null, jobs: [] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF2F3' }}>
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session?.authenticated) {
    return <LoginForm onSuccess={loadSession} />;
  }

  return (
    <div className="min-h-screen overflow-auto" style={{ backgroundColor: '#FDF2F3' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
              <span className="text-white text-[10px] font-black">PV</span>
            </div>
            <h1 className="text-sm font-black text-slate-800">Pal Video</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-xl font-black text-slate-800 mb-1">あなたの動画</h2>
        <p className="text-sm text-slate-500 mb-6">
          {session.paletteId && <span className="font-mono text-xs">{session.paletteId}</span>}
        </p>

        {session.jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🎬</div>
            <p className="font-medium">まだ動画がありません</p>
            <p className="text-xs mt-1">担当者にご連絡ください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {session.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* pal_ad banner */}
        <div className="mt-10 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center opacity-50">
          <p className="text-sm font-bold text-slate-500">📊 SNS広告運用 — Pal Ad</p>
          <p className="text-xs text-slate-400 mt-1">Coming Soon</p>
        </div>
      </main>
    </div>
  );
}
