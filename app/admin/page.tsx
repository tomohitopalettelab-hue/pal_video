'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LogOut, Plus, X, Copy, ExternalLink, Download, Youtube, Link2, Loader2,
  MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { PalVideoJob, PalVideoCut, PalVideoPayload } from '../api/_lib/pal-video-store';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#E95464';

const PURPOSE_OPTIONS = [
  { value: 'promotion',    label: 'プロモーション' },
  { value: 'sns_post',     label: 'SNS投稿' },
  { value: 'sns_ad',       label: 'SNS広告' },
  { value: 'review',       label: '口コミ紹介' },
  { value: 'achievement',  label: '実績紹介' },
];

const DESTINATION_OPTIONS = [
  { value: 'instagram_reel',   label: 'Instagram リール', dims: '9:16' },
  { value: 'instagram_story',  label: 'Instagram ストーリーズ', dims: '9:16' },
  { value: 'instagram_feed',   label: 'Instagram フィード', dims: '1:1' },
  { value: 'tiktok',           label: 'TikTok', dims: '9:16' },
  { value: 'youtube_short',    label: 'YouTube ショート', dims: '9:16' },
  { value: 'youtube',          label: 'YouTube', dims: '16:9' },
  { value: 'x_twitter',        label: 'X (Twitter)', dims: '4:5' },
  { value: 'line_voom',        label: 'LINE VOOM', dims: '4:5' },
  { value: 'facebook',         label: 'Facebook', dims: '4:5' },
  { value: 'web_banner',       label: 'Webバナー動画', dims: '16:9' },
];

const DIMS_LABEL: Record<string, string> = {
  instagram_reel:  '1080×1920',
  instagram_story: '1080×1920',
  instagram_feed:  '1080×1080',
  tiktok:          '1080×1920',
  youtube_short:   '1080×1920',
  youtube:         '1920×1080',
  x_twitter:       '1080×1350',
  line_voom:       '1080×1350',
  facebook:        '1080×1350',
  web_banner:      '1920×1080',
};

const DURATION_OPTIONS = [
  { value: 15, label: '15秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '60秒' },
];

const BGM_OPTIONS = [
  { value: 'bright_pop',   label: '明るい・ポップ' },
  { value: 'cool_minimal', label: 'クール・ミニマル' },
  { value: 'cinematic',    label: '感動・シネマ' },
  { value: 'natural_warm', label: 'ナチュラル・ほのぼの' },
];

const TRANSITION_OPTIONS = [
  { value: 'fade',       label: 'フェード' },
  { value: 'slide',      label: 'スライド' },
  { value: 'zoom',       label: 'ズーム' },
  { value: 'wipe',       label: 'ワイプ' },
  { value: 'color-wipe', label: 'カラーワイプ' },
  { value: 'flip',       label: 'フリップ（スピン）' },
  { value: 'blur',       label: 'ブラー' },
  { value: 'bounce',     label: 'バウンス' },
  { value: 'push',       label: 'プッシュ' },
  { value: 'none',       label: 'なし' },
];

const ANIMATION_OPTIONS = [
  { value: 'slide',   label: 'スライド' },
  { value: 'rise',    label: 'ライズ（大きくスライドアップ）' },
  { value: 'zoom',    label: 'ズーム' },
  { value: 'pop',     label: 'ポップ' },
  { value: 'elastic', label: 'エラスティック（強めポップ）' },
  { value: 'fade',    label: 'フェード' },
  { value: 'blur',    label: 'ブラー' },
  { value: 'wipe',    label: 'ワイプ' },
  { value: 'drop',    label: 'ドロップ' },
  { value: 'none',    label: 'なし' },
];

const LAYOUT_OPTIONS = [
  { value: 'bottom',    label: 'ボトム（下テロップ）' },
  { value: 'top',       label: 'トップ（上テロップ）' },
  { value: 'center',    label: 'センター（全画面）' },
  { value: 'caption',   label: 'キャプション（ソリッドバンド）' },
  { value: 'billboard', label: 'ビルボード（大見出し）' },
];

const STYLE_OPTIONS = [
  { value: 'standard', label: 'スタンダード（ダーク/KenBurns）' },
  { value: 'magazine', label: 'マガジン（サイドパネル/高級感）' },
  { value: 'minimal',  label: 'ミニマル（白背景/余白重視）' },
  { value: 'collage',  label: 'コラージュ（白背景/ポラロイドグリッド）' },
];

const DEFAULT_PAYLOAD: PalVideoPayload = {
  title:        '新しい動画',
  purpose:      'promotion',
  destination:  'instagram_reel',
  duration:     30,
  colorPrimary: '#E95464',
  colorAccent:  '#1c9a8b',
  textColor:    '#ffffff',
  bgm:          'bright_pop',
  style:        'standard',
  cuts:         [],
};

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
  draft:     { label: '下書き',        color: 'bg-slate-100 text-slate-600' },
  preview:   { label: 'プレビュー',    color: 'bg-blue-100 text-blue-700' },
  rendered:  { label: 'レンダリング済', color: 'bg-green-100 text-green-700' },
  published: { label: '公開済',        color: 'bg-purple-100 text-purple-700' },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const newCutId = () => `c${Date.now().toString(36)}`;
const makeNewCut = (): PalVideoCut => ({
  id: newCutId(), duration: 3, mainText: '', subText: '',
  transition: 'fade', animation: 'slide', layout: 'bottom', imageUrl: null,
});

// ── Hearing Modal ─────────────────────────────────────────────────────────────

type HearingModalProps = {
  payload: PalVideoPayload;
  onClose: () => void;
};

function HearingModal({ payload, onClose }: HearingModalProps) {
  const messages = payload.hearingMessages || [];
  const answers  = payload.hearingAnswers  || [];

  // Prefer hearingMessages (chat-style), fall back to hearingAnswers (Q&A)
  const hasChat = messages.length > 0;
  const hasQA   = answers.length > 0;

  if (!hasChat && !hasQA) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} style={{ color: ACCENT }} />
            <h3 className="font-bold text-slate-800 text-sm">ヒアリング内容</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hasChat ? (
            // Chat-style display using hearingMessages
            messages
              .filter((m) => m.role !== 'system')
              .map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0 mr-2 mt-0.5"
                        style={{ backgroundColor: ACCENT }}
                      >
                        AI
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-slate-800 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
          ) : (
            // Q&A style fallback
            answers
              .filter((qa) => qa.a && qa.a !== '••••••')
              .map((qa, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-start">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0 mr-2 mt-0.5"
                      style={{ backgroundColor: ACCENT }}
                    >
                      AI
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 text-slate-700 px-3 py-2 text-xs leading-relaxed">
                      {qa.q}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-slate-800 text-white px-3 py-2 text-xs leading-relaxed">
                      {qa.a}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Media Modal ───────────────────────────────────────────────────────────────

type MediaAsset = { url: string; originalName?: string; fileName?: string };
type MediaModalProps = { paletteId: string; onSelect: (url: string) => void; onClose: () => void };

function MediaModal({ paletteId, onSelect, onClose }: MediaModalProps) {
  const [assets, setAssets]     = useState<MediaAsset[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/media?paletteId=${encodeURIComponent(paletteId)}`);
        const body = await res.json().catch(() => ({}));
        setAssets(Array.isArray(body?.assets) ? body.assets : []);
      } catch { setError('メディアの取得に失敗しました。'); }
      finally  { setLoading(false); }
    })();
  }, [paletteId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-800">メディアを選択</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && <div className="flex items-center justify-center h-32"><Loader2 size={24} className="animate-spin text-slate-400" /></div>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!isLoading && assets.length === 0 && <p className="text-sm text-slate-400 text-center py-8">メディアがありません。</p>}
          <div className="grid grid-cols-3 gap-3">
            {assets.map((asset, idx) => (
              <button
                key={idx}
                onClick={() => { onSelect(asset.url); onClose(); }}
                className="rounded-xl overflow-hidden border-2 border-transparent hover:border-rose-400 transition-all group"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.originalName || asset.fileName || 'media'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[10px] text-slate-500 p-1 truncate">{asset.originalName || asset.fileName || 'image'}</p>
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
  const [customers, setCustomers]             = useState<Customer[]>([]);
  const [isLoadingCustomers, setLoadingCust]  = useState(true);
  const [selectedCustomerId, setSelectedCid]  = useState<string | null>(null);

  // State: jobs
  const [jobs, setJobs]                       = useState<PalVideoJob[]>([]);
  const [isLoadingJobs, setLoadingJobs]       = useState(false);
  const [selectedJobId, setSelectedJobId]     = useState<string | null>(null);

  // State: editing
  const [editingPayload, setPayload]          = useState<PalVideoPayload>(DEFAULT_PAYLOAD);
  const [selectedCutId, setSelectedCutId]     = useState<string | null>(null);

  // State: operations
  const [isGenerating, setIsGenerating]       = useState(false);
  const [isRendering, setIsRendering]         = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [previewUrl, setPreviewUrl]           = useState<string | null>(null);

  // State: UI
  const [showMediaModal, setShowMedia]        = useState(false);
  const [mediaSlot, setMediaSlot]             = useState<number>(0); // 0=single/slot0, 1-3=collage slots
  const [showHearingModal, setShowHearing]    = useState(false);
  const [showHearingInline, setShowInline]    = useState(false);
  const [opMessage, setOpMessage]             = useState('');

  // Derived
  const selectedCustomer = customers.find((c) => c.paletteId === selectedCustomerId) || null;
  const selectedJob      = jobs.find((j) => j.id === selectedJobId) || null;
  const selectedCut      = (editingPayload.cuts || []).find((c) => c.id === selectedCutId) || null;
  const hasHearing = (editingPayload.hearingMessages?.length ?? 0) > 0
                  || (editingPayload.hearingAnswers?.length ?? 0) > 0
                  || Object.keys(editingPayload.hearingData ?? {}).length > 0;

  // ── Load customers ────────────────────────────────────────────────────────

  const loadCustomers = useCallback(async () => {
    setLoadingCust(true);
    try {
      const res  = await fetch('/api/admin/customers');
      const body = await res.json().catch(() => ({}));
      setCustomers(Array.isArray(body?.customers) ? body.customers : []);
    } catch { setCustomers([]); }
    finally  { setLoadingCust(false); }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // ── Load jobs for customer ────────────────────────────────────────────────

  const loadJobs = useCallback(async (paletteId: string) => {
    setLoadingJobs(true);
    setJobs([]);
    setSelectedJobId(null);
    setPayload(DEFAULT_PAYLOAD);
    setPreviewUrl(null);
    try {
      const res     = await fetch(`/api/admin/job?paletteId=${encodeURIComponent(paletteId)}`);
      const body    = await res.json().catch(() => ({}));
      const fetched: PalVideoJob[] = Array.isArray(body?.jobs) ? body.jobs : [];
      setJobs(fetched);
      if (fetched.length > 0) {
        const latest = fetched[0];
        setSelectedJobId(latest.id);
        setPayload(mergePayload(DEFAULT_PAYLOAD, latest.payload));
        setPreviewUrl(latest.previewUrl || null);
        const cuts = latest.payload?.cuts || [];
        if (cuts.length > 0) setSelectedCutId(cuts[0].id);
      }
    } catch { setJobs([]); }
    finally  { setLoadingJobs(false); }
  }, []);

  const handleSelectCustomer = useCallback((paletteId: string) => {
    setSelectedCid(paletteId);
    loadJobs(paletteId);
  }, [loadJobs]);

  // ── Job selection ─────────────────────────────────────────────────────────

  const handleSelectJob = (job: PalVideoJob) => {
    setSelectedJobId(job.id);
    setPayload(mergePayload(DEFAULT_PAYLOAD, job.payload));
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
      const res  = await fetch('/api/admin/job', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paletteId: selectedCustomer.paletteId,
          planCode:  selectedCustomer.planCode || 'pal_video_lite',
          status:    'draft',
          payload:   { ...DEFAULT_PAYLOAD },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.job) {
        setJobs((prev) => [body.job, ...prev]);
        setSelectedJobId(body.job.id);
        setPayload({ ...DEFAULT_PAYLOAD, ...body.job.payload });
        setPreviewUrl(null);
        setSelectedCutId(null);
        setOpMessage('新しいジョブを作成しました。');
        setTimeout(() => setOpMessage(''), 3000);
      }
    } catch { setOpMessage('ジョブの作成に失敗しました。'); }
    finally  { setIsSaving(false); }
  };

  // ── Cut operations ────────────────────────────────────────────────────────

  const updateCut = (cutId: string, updates: Partial<PalVideoCut>) =>
    setPayload((prev) => ({
      ...prev,
      cuts: (prev.cuts || []).map((c) => c.id === cutId ? { ...c, ...updates } : c),
    }));

  const addCut = () => {
    const nc = makeNewCut();
    setPayload((prev) => ({ ...prev, cuts: [...(prev.cuts || []), nc] }));
    setSelectedCutId(nc.id);
  };

  const removeCut = (cutId: string) => {
    const cuts = (editingPayload.cuts || []).filter((c) => c.id !== cutId);
    setPayload((prev) => ({ ...prev, cuts }));
    if (selectedCutId === cutId) setSelectedCutId(cuts.length > 0 ? cuts[0].id : null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/job', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:         selectedJobId || undefined,
          paletteId:  selectedCustomer.paletteId,
          planCode:   selectedCustomer.planCode || 'pal_video_lite',
          status:     selectedJob?.status || 'draft',
          payload:    editingPayload,
          previewUrl,
        }),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok || !resBody?.job) {
        throw new Error(resBody?.error || '保存に失敗しました。');
      }
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存に失敗しました。';
      setOpMessage(`⚠️ ${msg}`);
      throw e; // re-throw so handleRender knows the save failed
    }
    finally  { setIsSaving(false); }
  };

  // ── AI Generate ───────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedCustomer) return;
    setIsGenerating(true);
    setOpMessage('AIでカットを生成中...');
    try {
      const res  = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paletteId:    selectedCustomer.paletteId,
          jobId:        selectedJobId,
          purpose:      editingPayload.purpose      || 'promotion',
          destination:  editingPayload.destination  || 'instagram_reel',
          hearingData:  editingPayload.hearingData,
          existingCuts: editingPayload.cuts,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.cuts && Array.isArray(body.cuts)) {
        const bc = body.brandColors;
        setPayload((prev) => ({
          ...prev,
          cuts: body.cuts,
          ...(bc?.colorPrimary ? { colorPrimary: bc.colorPrimary } : {}),
          ...(bc?.colorAccent  ? { colorAccent:  bc.colorAccent  } : {}),
          ...(bc?.textColor    ? { textColor:    bc.textColor    } : {}),
          ...(bc?.bgColor      ? { bgColor:      bc.bgColor      } : {}),
          ...(bc?.style        ? { style:        bc.style as 'standard'|'magazine'|'minimal'|'collage' } : {}),
          ...(bc?.bgm          ? { bgm:          bc.bgm          } : {}),
        }));
        if (body.cuts.length > 0) setSelectedCutId(body.cuts[0].id);
        setOpMessage(`AIが${body.cuts.length}カットを生成しました。`);
        setTimeout(() => setOpMessage(''), 5000);
      } else {
        setOpMessage(body?.error || 'AI生成に失敗しました。');
      }
    } catch { setOpMessage('AI生成に失敗しました。'); }
    finally  { setIsGenerating(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const handleRender = async (mode: 'preview' | 'final') => {
    if (!selectedJobId) { setOpMessage('先に保存してください。'); return; }
    setIsRendering(true);
    setOpMessage(mode === 'preview' ? 'プレビューを生成中...' : '最終レンダリング中...');
    try {
      // Auto-save first to include latest payload changes
      await handleSave();
      const res  = await fetch('/api/render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, mode }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.url) {
        setPreviewUrl(body.url);
        setOpMessage(mode === 'preview' ? 'プレビューURLを取得しました。' : 'レンダリング完了！');
        setTimeout(() => setOpMessage(''), 5000);
      } else {
        setOpMessage(body?.error || 'レンダリングに失敗しました。');
      }
    } catch (e: unknown) {
      if (!(e instanceof Error && e.message.includes('保存'))) {
        setOpMessage('レンダリングに失敗しました。');
      }
    } finally  { setIsRendering(false); }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const destDimsLabel = DIMS_LABEL[editingPayload.destination || 'instagram_reel'] || '';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ACCENT }}>
            <span className="text-white text-[10px] font-black">PV</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-800 leading-none">Pal Video</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Admin</p>
          </div>
          <button onClick={handleLogout}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="ログアウト">
            <LogOut size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingCustomers ? (
            <div className="p-4 flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" /> 読み込み中...
            </div>
          ) : customers.length === 0 ? (
            <p className="p-4 text-xs text-slate-400">対象プランの顧客がいません。</p>
          ) : customers.map((customer) => {
            const isSelected = customer.paletteId === selectedCustomerId;
            const tier = customer.planCode?.replace('pal_video_', '') || 'lite';
            const tierColor = tier === 'pro' ? 'bg-purple-100 text-purple-700'
              : tier === 'standard' ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-500';
            return (
              <button key={customer.paletteId}
                onClick={() => handleSelectCustomer(customer.paletteId)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                  isSelected ? 'bg-rose-50 border-r-4' : 'hover:bg-slate-50 border-r-4 border-r-transparent'
                }`}
                style={isSelected ? { borderRightColor: ACCENT } : {}}>
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{customer.name || '名称未設定'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{customer.paletteId}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${tierColor}`}>
                    {tier}
                  </span>
                </div>
              </button>
            );
          })}
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

              {/* Hearing button */}
              {hasHearing && (
                <button
                  onClick={() => setShowHearing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  <MessageCircle size={12} />
                  ヒアリング内容
                </button>
              )}

              {/* Job tabs */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {jobs.map((job) => (
                  <button key={job.id} onClick={() => handleSelectJob(job)}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                      job.id === selectedJobId
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    style={job.id === selectedJobId ? { backgroundColor: ACCENT } : {}}>
                    {job.payload?.title ? job.payload.title.slice(0, 8) : `Job ${jobs.indexOf(job) + 1}`}
                  </button>
                ))}
                <button onClick={handleNewJob} disabled={isSaving}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500" title="新規ジョブ">
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
                  <button onClick={handleNewJob} disabled={isSaving}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                    style={{ backgroundColor: ACCENT }}>
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
                      <div key={cut.id} role="button" tabIndex={0}
                        onClick={() => setSelectedCutId(cut.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedCutId(cut.id)}
                        className={`flex-shrink-0 w-24 h-20 rounded-xl border-2 relative overflow-hidden transition-all group cursor-pointer ${
                          cut.id === selectedCutId ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={cut.id === selectedCutId ? { borderColor: ACCENT } : {}}>
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
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCut(cut.id); }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex">
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    <button onClick={addCut}
                      className="flex-shrink-0 w-12 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-rose-300 hover:bg-rose-50 transition-colors">
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
                          <input value={selectedCut.mainText || ''}
                            onChange={(e) => updateCut(selectedCut.id, { mainText: e.target.value })}
                            placeholder="春の新作、解禁。"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                            onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                            onBlur={(e) => (e.target.style.boxShadow = '')} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            {editingPayload.style === 'collage' ? 'ラベル（小テキスト）' : 'サブテキスト'}
                          </label>
                          <input value={selectedCut.subText || ''}
                            onChange={(e) => updateCut(selectedCut.id, { subText: e.target.value })}
                            placeholder={editingPayload.style === 'collage' ? 'スタッフ募集のお知らせ' : '3日間限定オファー'}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                            onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                            onBlur={(e) => (e.target.style.boxShadow = '')} />
                        </div>
                        {editingPayload.style === 'collage' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">キャプション（下部）</label>
                            <input value={selectedCut.caption || ''}
                              onChange={(e) => updateCut(selectedCut.id, { caption: e.target.value })}
                              placeholder="詳細・ご応募はこちら"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                              onBlur={(e) => (e.target.style.boxShadow = '')} />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">尺: {selectedCut.duration}s</label>
                          <input type="range" min={1} max={10} value={selectedCut.duration}
                            onChange={(e) => updateCut(selectedCut.id, { duration: Number(e.target.value) })}
                            className="w-full accent-rose-400" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">レイアウト</label>
                          <select value={selectedCut.layout || 'bottom'}
                            onChange={(e) => updateCut(selectedCut.id, { layout: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none">
                            {LAYOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">トランジション</label>
                          <select value={selectedCut.transition || 'fade'}
                            onChange={(e) => updateCut(selectedCut.id, { transition: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none">
                            {TRANSITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">アニメーション</label>
                          <select value={selectedCut.animation || 'slide'}
                            onChange={(e) => updateCut(selectedCut.id, { animation: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none">
                            {ANIMATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>

                      {editingPayload.style === 'collage' ? (
                        /* ── Collage: 2×2 グリッド画像選択 ──────────────── */
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                            グリッド画像（最大4枚）
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[0, 1, 2, 3].map((slot) => {
                              const imgs = selectedCut.images || [];
                              const url  = imgs[slot] || null;
                              return (
                                <div key={slot} className="relative group">
                                  <button
                                    onClick={() => { setMediaSlot(slot); setShowMedia(true); }}
                                    className="w-full aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-400 overflow-hidden bg-slate-50 flex items-center justify-center transition-colors">
                                    {url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">#{slot + 1}</span>
                                    )}
                                  </button>
                                  {url && (
                                    <button
                                      onClick={() => {
                                        const newImgs = [...(selectedCut.images || [])];
                                        newImgs[slot] = '';
                                        updateCut(selectedCut.id, { images: newImgs });
                                      }}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] items-center justify-center hidden group-hover:flex">
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* ── Standard: 単一画像選択 ──────────────────────── */
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">画像</label>
                          <div className="flex items-center gap-2">
                            {selectedCut.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={selectedCut.imageUrl} alt="cut" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                            )}
                            <button onClick={() => { setMediaSlot(0); setShowMedia(true); }}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50">
                              画像を選択
                            </button>
                            {selectedCut.imageUrl && (
                              <button onClick={() => updateCut(selectedCut.id, { imageUrl: null })}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-red-500 hover:bg-red-50">
                                削除
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hearing inline (collapsible) */}
                {hasHearing && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setShowInline((v) => !v)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={12} style={{ color: ACCENT }} />
                        <p className="text-[11px] font-bold text-slate-500 uppercase">ヒアリング概要</p>
                      </div>
                      {showHearingInline ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showHearingInline && (
                      <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {(editingPayload.hearingAnswers || [])
                          .filter((qa) => qa.a && qa.a !== '••••••')
                          .map((qa, idx) => (
                            <div key={idx} className="text-[11px]">
                              <p className="text-slate-400 mb-0.5">Q: {qa.q.slice(0, 60)}{qa.q.length > 60 ? '…' : ''}</p>
                              <p className="text-slate-700 font-medium pl-2 border-l-2" style={{ borderColor: ACCENT }}>
                                {qa.a}
                              </p>
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
              <input value={editingPayload.title || ''}
                onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))}
                placeholder="新しい動画"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                onBlur={(e) => (e.target.style.boxShadow = '')} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">用途</label>
              <select value={editingPayload.purpose || 'promotion'}
                onChange={(e) => setPayload((p) => ({ ...p, purpose: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                投稿先
                {destDimsLabel && (
                  <span className="ml-1.5 text-[9px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {destDimsLabel}
                  </span>
                )}
              </label>
              <select value={editingPayload.destination || 'instagram_reel'}
                onChange={(e) => setPayload((p) => ({ ...p, destination: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                {DESTINATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label} ({o.dims})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">尺</label>
              <select value={editingPayload.duration || 30}
                onChange={(e) => setPayload((p) => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">BGM</label>
              <select value={editingPayload.bgm || 'bright_pop'}
                onChange={(e) => setPayload((p) => ({ ...p, bgm: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                {BGM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* ── テンプレートスタイル ─────────────────────────────────── */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">テンプレートスタイル</label>
              <select value={editingPayload.style || 'standard'}
                onChange={(e) => setPayload((p) => ({ ...p, style: e.target.value as 'standard' | 'magazine' | 'minimal' | 'collage' }))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none bg-white">
                {STYLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {editingPayload.style === 'collage' ? (
              /* ── Collage カラー設定 ──────────────────────────────────── */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">背景色</label>
                  <input type="color" value={editingPayload.bgColor || '#FAF8F5'}
                    onChange={(e) => setPayload((p) => ({ ...p, bgColor: e.target.value }))}
                    className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">テキスト色</label>
                  <input type="color" value={editingPayload.textColor || '#1C1C1C'}
                    onChange={(e) => setPayload((p) => ({ ...p, textColor: e.target.value }))}
                    className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">アクセント</label>
                  <input type="color" value={editingPayload.colorAccent || '#9C7B5C'}
                    onChange={(e) => setPayload((p) => ({ ...p, colorAccent: e.target.value }))}
                    className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
              </div>
            ) : (
              /* ── Standard / Magazine / Minimal カラー設定 ───────────── */
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">メインカラー</label>
                  <input type="color" value={editingPayload.colorPrimary || '#E95464'}
                    onChange={(e) => setPayload((p) => ({ ...p, colorPrimary: e.target.value }))}
                    className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">アクセントカラー</label>
                  <input type="color" value={editingPayload.colorAccent || '#1c9a8b'}
                    onChange={(e) => setPayload((p) => ({ ...p, colorAccent: e.target.value }))}
                    className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">テキストカラー</label>
                  <input type="color" value={editingPayload.textColor || '#ffffff'}
                    onChange={(e) => setPayload((p) => ({ ...p, textColor: e.target.value }))}
                    className="w-full h-8 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Operations */}
        <div className="p-4 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-3">操作</p>

          <button onClick={handleGenerate} disabled={isGenerating || !selectedCustomer}
            className="w-full py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT }}>
            {isGenerating ? <><Loader2 size={14} className="animate-spin" /> 生成中...</> : '🤖 AIでカットを自動生成'}
          </button>

          <button onClick={() => handleRender('preview')} disabled={isRendering || !selectedJobId}
            className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {isRendering ? <><Loader2 size={14} className="animate-spin" /> 処理中...</> : '👁 プレビュー生成'}
          </button>

          <button onClick={() => handleRender('final')} disabled={isRendering || !selectedJobId}
            className="w-full py-2 rounded-xl bg-slate-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            🎬 最終レンダリング
          </button>

          <button onClick={handleSave} disabled={isSaving || !selectedCustomer}
            className="w-full py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold disabled:opacity-50 hover:bg-slate-50 flex items-center justify-center gap-2">
            {isSaving ? <><Loader2 size={14} className="animate-spin" /> 保存中...</> : '💾 保存'}
          </button>

          {opMessage && (
            <p className="text-xs text-center font-medium" style={{ color: ACCENT }}>{opMessage}</p>
          )}

          {previewUrl && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(previewUrl); setOpMessage('URLをコピーしました'); setTimeout(() => setOpMessage(''), 3000); }}
                  className="flex-1 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1">
                  <Copy size={12} /> URLをコピー
                </button>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                  <ExternalLink size={14} />
                </a>
              </div>
              <a href={previewUrl} download
                className="w-full py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1">
                <Download size={12} /> MP4ダウンロード
              </a>
            </div>
          )}

          <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
            <button disabled
              className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed">
              <Youtube size={12} /> YouTubeに投稿 (Phase 7)
            </button>
            <button disabled
              className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed">
              <Link2 size={12} /> pal_studioに連携 (Coming)
            </button>
          </div>
        </div>
      </aside>

      {/* Hearing Chat Modal */}
      {showHearingModal && (
        <HearingModal payload={editingPayload} onClose={() => setShowHearing(false)} />
      )}

      {/* Media Modal */}
      {showMediaModal && selectedCustomer && (
        <MediaModal
          paletteId={selectedCustomer.paletteId}
          onSelect={(url) => {
            if (!selectedCut) return;
            if (editingPayload.style === 'collage') {
              const newImgs = [...(selectedCut.images || ['', '', '', ''])];
              newImgs[mediaSlot] = url;
              updateCut(selectedCut.id, { images: newImgs });
            } else {
              updateCut(selectedCut.id, { imageUrl: url });
            }
          }}
          onClose={() => setShowMedia(false)}
        />
      )}
    </div>
  );
}
