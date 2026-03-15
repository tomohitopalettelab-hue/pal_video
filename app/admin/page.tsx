'use client';

import { useCallback, useEffect, useState } from 'react';
import { LogOut, Plus, X, ChevronDown, ChevronUp, Copy, ExternalLink, Download, Youtube, Link2, Loader2 } from 'lucide-react';
import type { PalVideoJob, PalVideoCut, PalVideoPayload } from '../api/_lib/pal-video-store';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#E95464';

const PURPOSE_OPTIONS = [
  { value: 'instagram_reel', label: 'Instagramリール' },
  { value: 'youtube_short', label: 'YouTubeショート' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'web_banner', label: 'Webバナー' },
];

const RESOLUTION_OPTIONS = [
  { value: '1080x1920', label: '1080x1920 (縦型)' },
  { value: '1920x1080', label: '1920x1080 (横型)' },
  { value: '1080x1080', label: '1080x1080 (正方形)' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '60秒' },
];

const BGM_OPTIONS = [
  { value: 'bright_pop', label: '明るい・ポップ' },
  { value: 'cool_minimal', label: 'クール・ミニマル' },
  { value: 'cinematic', label: '感動・シネマ' },
  { value: 'natural_warm', label: 'ナチュラル・ほのぼの' },
];

const TRANSITION_OPTIONS = [
  { value: 'fade', label: 'フェード' },
  { value: 'slide', label: 'スライド' },
  { value: 'zoom', label: 'ズーム' },
  { value: 'none', label: 'なし' },
];

const ANIMATION_OPTIONS = [
  { value: 'slide', label: 'スライド' },
  { value: 'zoom', label: 'ズーム' },
  { value: 'fade', label: 'フェード' },
  { value: 'none', label: 'なし' },
];

const DEFAULT_PAYLOAD: PalVideoPayload = {
  title: '新しい動画',
  purpose: 'instagram_reel',
  resolution: '1080x1920',
  duration: 30,
  colorPrimary: '#E95464',
  colorAccent: '#1c9a8b',
  bgm: 'bright_pop',
  cuts: [],
};

// Merge job payload with defaults, ignoring empty/null values so defaults aren't overridden
const mergePayload = (base: PalVideoPayload, override: PalVideoPayload): PalVideoPayload => {
  const result: PalVideoPayload = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v !== null && v !== undefined && v !== '') {
      (result as Record<string, unknown>)[k] = v;
    }
  }
  return result;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'bg-slate-100 text-slate-600' },
  preview: { label: 'プレビュー', color: 'bg-blue-100 text-blue-700' },
  rendered: { label: 'レンダリング済', color: 'bg-green-100 text-green-700' },
  published: { label: '公開済', color: 'bg-purple-100 text-purple-700' },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  paletteId: string;
  name: string;
  status: string;
  planCode?: string;
  isStandard?: boolean;
};

// ── Helper ─────────────────────────────────────────────────────────────────────

const newCutId = () => `c${Date.now().toString(36)}`;

const makeNewCut = (): PalVideoCut => ({
  id: newCutId(),
  duration: 3,
  mainText: '',
  subText: '',
  transition: 'fade',
  animation: 'slide',
  imageUrl: null,
});

// ── Media Modal ───────────────────────────────────────────────────────────────

type MediaAsset = {
  url: string;
  originalName?: string;
  fileName?: string;
};

type MediaModalProps = {
  paletteId: string;
  onSelect: (url: string) => void;
  onClose: () => void;
};

function MediaModal({ paletteId, onSelect, onClose }: MediaModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/media?paletteId=${encodeURIComponent(paletteId)}`);
        const body = await res.json().catch(() => ({}));
        setAssets(Array.isArray(body?.assets) ? body.assets : []);
      } catch {
        setError('メディアの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [paletteId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-800">メディアを選択</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!isLoading && assets.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">メディアがありません。</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {assets.map((asset, idx) => (
              <button
                key={idx}
                onClick={() => { onSelect(asset.url); onClose(); }}
                className="rounded-xl overflow-hidden border-2 border-transparent hover:border-rose-400 transition-all group"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.originalName || asset.fileName || 'media'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-[10px] text-slate-500 p-1 truncate">
                  {asset.originalName || asset.fileName || 'image'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  // State: customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // State: jobs
  const [jobs, setJobs] = useState<PalVideoJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // State: editing
  const [editingPayload, setEditingPayload] = useState<PalVideoPayload>(DEFAULT_PAYLOAD);
  const [selectedCutId, setSelectedCutId] = useState<string | null>(null);

  // State: operations
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State: UI
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showHearing, setShowHearing] = useState(false);
  const [opMessage, setOpMessage] = useState('');

  // Derived
  const selectedCustomer = customers.find((c) => c.paletteId === selectedCustomerId) || null;
  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;
  const selectedCut = (editingPayload.cuts || []).find((c) => c.id === selectedCutId) || null;

  // ── Load customers ────────────────────────────────────────────────────────

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/admin/customers');
      const body = await res.json().catch(() => ({}));
      setCustomers(Array.isArray(body?.customers) ? body.customers : []);
    } catch {
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // ── Load jobs for customer ────────────────────────────────────────────────

  const loadJobs = useCallback(async (paletteId: string) => {
    setIsLoadingJobs(true);
    setJobs([]);
    setSelectedJobId(null);
    setEditingPayload(DEFAULT_PAYLOAD);
    setPreviewUrl(null);
    try {
      const res = await fetch(`/api/admin/job?paletteId=${encodeURIComponent(paletteId)}`);
      const body = await res.json().catch(() => ({}));
      const fetched: PalVideoJob[] = Array.isArray(body?.jobs) ? body.jobs : [];
      setJobs(fetched);
      // Auto-select most recent job
      if (fetched.length > 0) {
        const latest = fetched[0];
        setSelectedJobId(latest.id);
        setEditingPayload(mergePayload(DEFAULT_PAYLOAD, latest.payload));
        setPreviewUrl(latest.previewUrl || null);
        const cuts = latest.payload?.cuts || [];
        if (cuts.length > 0) setSelectedCutId(cuts[0].id);
      }
    } catch {
      setJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  const handleSelectCustomer = useCallback((paletteId: string) => {
    setSelectedCustomerId(paletteId);
    loadJobs(paletteId);
  }, [loadJobs]);

  // ── Job selection ─────────────────────────────────────────────────────────

  const handleSelectJob = (job: PalVideoJob) => {
    setSelectedJobId(job.id);
    setEditingPayload(mergePayload(DEFAULT_PAYLOAD, job.payload));
    setPreviewUrl(job.previewUrl || null);
    const cuts = job.payload?.cuts || [];
    if (cuts.length > 0) setSelectedCutId(cuts[0].id);
    else setSelectedCutId(null);
  };

  // ── Create new job ────────────────────────────────────────────────────────

  const handleNewJob = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paletteId: selectedCustomer.paletteId,
          planCode: selectedCustomer.planCode || 'pal_video_lite',
          status: 'draft',
          payload: { ...DEFAULT_PAYLOAD },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.job) {
        setJobs((prev) => [body.job, ...prev]);
        setSelectedJobId(body.job.id);
        setEditingPayload({ ...DEFAULT_PAYLOAD, ...body.job.payload });
        setPreviewUrl(null);
        setSelectedCutId(null);
        setOpMessage('新しいジョブを作成しました。');
        setTimeout(() => setOpMessage(''), 3000);
      }
    } catch {
      setOpMessage('ジョブの作成に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Cut operations ────────────────────────────────────────────────────────

  const updateCut = (cutId: string, updates: Partial<PalVideoCut>) => {
    setEditingPayload((prev) => ({
      ...prev,
      cuts: (prev.cuts || []).map((c) => c.id === cutId ? { ...c, ...updates } : c),
    }));
  };

  const addCut = () => {
    const newCut = makeNewCut();
    setEditingPayload((prev) => ({
      ...prev,
      cuts: [...(prev.cuts || []), newCut],
    }));
    setSelectedCutId(newCut.id);
  };

  const removeCut = (cutId: string) => {
    const cuts = (editingPayload.cuts || []).filter((c) => c.id !== cutId);
    setEditingPayload((prev) => ({ ...prev, cuts }));
    if (selectedCutId === cutId) {
      setSelectedCutId(cuts.length > 0 ? cuts[0].id : null);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
      const body = {
        id: selectedJobId || undefined,
        paletteId: selectedCustomer.paletteId,
        planCode: selectedCustomer.planCode || 'pal_video_lite',
        status: selectedJob?.status || 'draft',
        payload: editingPayload,
        previewUrl: previewUrl,
      };
      const res = await fetch('/api/admin/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const resBody = await res.json().catch(() => ({}));
      if (resBody?.job) {
        const updated = resBody.job as PalVideoJob;
        setJobs((prev) => {
          const idx = prev.findIndex((j) => j.id === updated.id);
          if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n; }
          return [updated, ...prev];
        });
        setSelectedJobId(updated.id);
        setPreviewUrl(updated.previewUrl || null);
        setOpMessage('保存しました。');
        setTimeout(() => setOpMessage(''), 3000);
      }
    } catch {
      setOpMessage('保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // ── AI Generate ───────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedCustomer) return;
    setIsGenerating(true);
    setOpMessage('AIでカットを生成中...');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paletteId: selectedCustomer.paletteId,
          jobId: selectedJobId,
          purpose: editingPayload.purpose || 'instagram_reel',
          hearingData: editingPayload.hearingData,
          existingCuts: editingPayload.cuts,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.cuts && Array.isArray(body.cuts)) {
        setEditingPayload((prev) => ({ ...prev, cuts: body.cuts }));
        if (body.cuts.length > 0) setSelectedCutId(body.cuts[0].id);
        setOpMessage(`AIが${body.cuts.length}カットを生成しました。`);
        setTimeout(() => setOpMessage(''), 5000);
      } else {
        setOpMessage(body?.error || 'AI生成に失敗しました。');
      }
    } catch {
      setOpMessage('AI生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const handleRender = async (mode: 'preview' | 'final') => {
    if (!selectedJobId) {
      setOpMessage('先に保存してください。');
      return;
    }
    setIsRendering(true);
    setOpMessage(mode === 'preview' ? 'プレビューを生成中...' : '最終レンダリング中...');
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, mode }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.url) {
        setPreviewUrl(body.url);
        setOpMessage(mode === 'preview' ? 'プレビューURLを取得しました。' : 'レンダリングが完了しました。');
        setTimeout(() => setOpMessage(''), 5000);
      } else {
        setOpMessage(body?.error || 'レンダリングに失敗しました。');
      }
    } catch {
      setOpMessage('レンダリングに失敗しました。');
    } finally {
      setIsRendering(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // ── Render UI ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ACCENT }}
          >
            <span className="text-white text-[10px] font-black">PV</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-800 leading-none">Pal Video</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="ログアウト"
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingCustomers ? (
            <div className="p-4 flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
              読み込み中...
            </div>
          ) : customers.length === 0 ? (
            <p className="p-4 text-xs text-slate-400">対象プランの顧客がいません。</p>
          ) : (
            customers.map((customer) => {
              const isSelected = customer.paletteId === selectedCustomerId;
              const tier = customer.planCode?.replace('pal_video_', '') || 'lite';
              const tierColor = tier === 'pro' ? 'bg-purple-100 text-purple-700' : tier === 'standard' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500';
              return (
                <button
                  key={customer.paletteId}
                  onClick={() => handleSelectCustomer(customer.paletteId)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                    isSelected
                      ? 'bg-rose-50 border-r-4'
                      : 'hover:bg-slate-50 border-r-4 border-r-transparent'
                  }`}
                  style={isSelected ? { borderRightColor: ACCENT } : {}}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {customer.name || '名称未設定'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{customer.paletteId}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${tierColor}`}>
                      {tier}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── MIDDLE AREA ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!selectedCustomer ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm font-medium">顧客を選択してください</p>
              <p className="text-xs mt-1">左のリストから顧客を選択すると、動画ジョブを管理できます</p>
            </div>
          </div>
        ) : (
          <>
            {/* Job header bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-700 truncate">
                  {selectedCustomer.name}
                  {selectedJob && (
                    <span className="ml-2 text-slate-400 font-normal">
                      / {selectedJob.payload?.title || '無題の動画'}
                    </span>
                  )}
                </p>
                {selectedJob && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_LABELS[selectedJob.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[selectedJob.status]?.label || selectedJob.status}
                    </span>
                    {selectedJob.createdAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(selectedJob.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Job tabs */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                      job.id === selectedJobId
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    style={job.id === selectedJobId ? { backgroundColor: ACCENT } : {}}
                  >
                    {job.payload?.title ? job.payload.title.slice(0, 8) : `Job ${jobs.indexOf(job) + 1}`}
                  </button>
                ))}
                <button
                  onClick={handleNewJob}
                  disabled={isSaving}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                  title="新規ジョブ"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {isLoadingJobs ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-sm">読み込み中...</span>
              </div>
            ) : !selectedJob && jobs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-3">まだジョブがありません</p>
                  <button
                    onClick={handleNewJob}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                    style={{ backgroundColor: ACCENT }}
                  >
                    新しいジョブを作成
                  </button>
                </div>
              </div>
            ) : selectedJob ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Cut Timeline */}
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">カットタイムライン</p>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {(editingPayload.cuts || []).map((cut, idx) => (
                      <div
                        key={cut.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCutId(cut.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedCutId(cut.id)}
                        className={`flex-shrink-0 w-24 h-20 rounded-xl border-2 relative overflow-hidden transition-all group cursor-pointer ${
                          cut.id === selectedCutId ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={cut.id === selectedCutId ? { borderColor: ACCENT } : {}}
                      >
                        {cut.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cut.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1">
                          <p className="text-[9px] text-white truncate">{cut.mainText || '(空)'}</p>
                          <p className="text-[9px] text-white/70">{cut.duration}s</p>
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCut(cut.id); }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addCut}
                      className="flex-shrink-0 w-12 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-rose-300 hover:bg-rose-50 transition-colors"
                    >
                      <Plus size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Cut Detail Editor */}
                {selectedCut && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">カット編集</p>
                      <span className="text-[10px] text-slate-400">
                        #{(editingPayload.cuts || []).findIndex((c) => c.id === selectedCut.id) + 1}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">メインテキスト</label>
                          <input
                            value={selectedCut.mainText || ''}
                            onChange={(e) => updateCut(selectedCut.id, { mainText: e.target.value })}
                            placeholder="春の新作、解禁。"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                            onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                            onBlur={(e) => (e.target.style.boxShadow = '')}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">サブテキスト</label>
                          <input
                            value={selectedCut.subText || ''}
                            onChange={(e) => updateCut(selectedCut.id, { subText: e.target.value })}
                            placeholder="3日間限定オファー"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                            onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                            onBlur={(e) => (e.target.style.boxShadow = '')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            尺: {selectedCut.duration}s
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={selectedCut.duration}
                            onChange={(e) => updateCut(selectedCut.id, { duration: Number(e.target.value) })}
                            className="w-full accent-rose-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">トランジション</label>
                          <select
                            value={selectedCut.transition || 'fade'}
                            onChange={(e) => updateCut(selectedCut.id, { transition: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                          >
                            {TRANSITION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">アニメーション</label>
                          <select
                            value={selectedCut.animation || 'slide'}
                            onChange={(e) => updateCut(selectedCut.id, { animation: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                          >
                            {ANIMATION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">画像</label>
                        <div className="flex items-center gap-2">
                          {selectedCut.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedCut.imageUrl}
                              alt="cut"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            />
                          )}
                          <button
                            onClick={() => setShowMediaModal(true)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            画像を選択
                          </button>
                          {selectedCut.imageUrl && (
                            <button
                              onClick={() => updateCut(selectedCut.id, { imageUrl: null })}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-red-500 hover:bg-red-50"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hearing Data (collapsible) */}
                {editingPayload.hearingData && Object.keys(editingPayload.hearingData).length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setShowHearing((v) => !v)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50"
                    >
                      <p className="text-[11px] font-bold text-slate-500 uppercase">ヒアリングデータ</p>
                      {showHearing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showHearing && (
                      <div className="px-3 pb-3 space-y-1">
                        {Object.entries(editingPayload.hearingData).map(([key, val]) => (
                          <div key={key} className="flex gap-2 text-[11px]">
                            <span className="font-bold text-slate-500 min-w-24">{key}:</span>
                            <span className="text-slate-700 break-all">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
      <aside className="w-80 border-l border-slate-200 bg-white flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">
        {/* Video settings */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-3">動画設定</p>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">タイトル</label>
              <input
                value={editingPayload.title || ''}
                onChange={(e) => setEditingPayload((p) => ({ ...p, title: e.target.value }))}
                placeholder="新しい動画"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                onBlur={(e) => (e.target.style.boxShadow = '')}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">用途</label>
              <select
                value={editingPayload.purpose || 'instagram_reel'}
                onChange={(e) => setEditingPayload((p) => ({ ...p, purpose: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white"
              >
                {PURPOSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">解像度</label>
              <select
                value={editingPayload.resolution || '1080x1920'}
                onChange={(e) => setEditingPayload((p) => ({ ...p, resolution: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white"
              >
                {RESOLUTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">尺</label>
              <select
                value={editingPayload.duration || 30}
                onChange={(e) => setEditingPayload((p) => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">BGM</label>
              <select
                value={editingPayload.bgm || 'bright_pop'}
                onChange={(e) => setEditingPayload((p) => ({ ...p, bgm: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white"
              >
                {BGM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">メインカラー</label>
                <input
                  type="color"
                  value={editingPayload.colorPrimary || '#E95464'}
                  onChange={(e) => setEditingPayload((p) => ({ ...p, colorPrimary: e.target.value }))}
                  className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">アクセントカラー</label>
                <input
                  type="color"
                  value={editingPayload.colorAccent || '#1c9a8b'}
                  onChange={(e) => setEditingPayload((p) => ({ ...p, colorAccent: e.target.value }))}
                  className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="p-4 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-3">操作</p>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedCustomer}
            className="w-full py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT }}
          >
            {isGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> 生成中...</>
            ) : (
              '🤖 AIでカットを自動生成'
            )}
          </button>

          <button
            onClick={() => handleRender('preview')}
            disabled={isRendering || !selectedJobId}
            className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRendering ? (
              <><Loader2 size={14} className="animate-spin" /> 処理中...</>
            ) : (
              '👁 プレビュー生成'
            )}
          </button>

          <button
            onClick={() => handleRender('final')}
            disabled={isRendering || !selectedJobId}
            className="w-full py-2 rounded-xl bg-slate-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            🎬 最終レンダリング
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !selectedCustomer}
            className="w-full py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold disabled:opacity-50 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <><Loader2 size={14} className="animate-spin" /> 保存中...</>
            ) : (
              '💾 保存'
            )}
          </button>

          {opMessage && (
            <p className="text-xs text-center font-medium" style={{ color: ACCENT }}>
              {opMessage}
            </p>
          )}

          {previewUrl && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(previewUrl); setOpMessage('URLをコピーしました'); setTimeout(() => setOpMessage(''), 3000); }}
                  className="flex-1 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
                >
                  <Copy size={12} /> URLをコピー
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <a
                href={previewUrl}
                download
                className="w-full py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
              >
                <Download size={12} /> MP4ダウンロード
              </a>
            </div>
          )}

          <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
            <button
              disabled
              className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <Youtube size={12} /> YouTubeに投稿 (Phase 7)
            </button>
            <button
              disabled
              className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <Link2 size={12} /> pal_studioに連携 (Coming)
            </button>
          </div>
        </div>
      </aside>

      {/* Media Modal */}
      {showMediaModal && selectedCustomer && (
        <MediaModal
          paletteId={selectedCustomer.paletteId}
          onSelect={(url) => {
            if (selectedCut) {
              updateCut(selectedCut.id, { imageUrl: url });
            }
          }}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </div>
  );
}
