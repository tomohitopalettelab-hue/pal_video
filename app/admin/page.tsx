'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LogOut, Plus, X, Copy, ExternalLink, Download, Youtube, Link2, Loader2,
  MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { PalVideoJob, PalVideoCut, PalVideoPayload } from '../api/_lib/pal-video-store';
import type { VideoTemplate } from '../api/_lib/templates';
import { TEMPLATES, PLATFORM_LABELS, PURPOSE_LABELS, DURATION_LABELS } from '../api/_lib/templates';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#E95464';

const BGM_PREVIEW_URLS: Record<string, string> = {
  bright_pop:   'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  cool_minimal: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  cinematic:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  natural_warm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
};

const BGM_LABELS: Record<string, string> = {
  bright_pop:   '明るい・ポップ',
  cool_minimal: 'クール・ミニマル',
  cinematic:    '感動・シネマ',
  natural_warm: 'ナチュラル・ほのぼの',
};

// ── 10 Template Presets ───────────────────────────────────────────────────────
type TemplatePreset = {
  id: string;
  name: string;
  desc: string;
  colorPrimary: string;
  colorAccent: string;
  textColor: string;
  bgColor: string;
  style: 'standard' | 'magazine' | 'minimal' | 'collage' | 'gradient';
  bgm: string;
};

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'modern',
    name: 'Modern',
    desc: 'シンプル & クリーン',
    colorPrimary: '#1A1A2E', colorAccent: '#E95464',
    textColor: '#ffffff', bgColor: '#F8F9FA',
    style: 'standard', bgm: 'cool_minimal',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    desc: 'ラグジュアリー',
    colorPrimary: '#1C1C1C', colorAccent: '#C4973A',
    textColor: '#ffffff', bgColor: '#0D0D0D',
    style: 'magazine', bgm: 'cinematic',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    desc: '信頼と実績',
    colorPrimary: '#1A2744', colorAccent: '#2A7FC1',
    textColor: '#ffffff', bgColor: '#F5F7FA',
    style: 'standard', bgm: 'cool_minimal',
  },
  {
    id: 'pop',
    name: 'Pop',
    desc: '元気 & 親しみ',
    colorPrimary: '#E95464', colorAccent: '#F5A623',
    textColor: '#ffffff', bgColor: '#FFF5F5',
    style: 'gradient', bgm: 'bright_pop',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: '洗練された余白',
    colorPrimary: '#1A1A1A', colorAccent: '#888888',
    textColor: '#1A1A1A', bgColor: '#FFFFFF',
    style: 'minimal', bgm: 'cool_minimal',
  },
  {
    id: 'dark',
    name: 'Dark',
    desc: 'テック & クール',
    colorPrimary: '#0D1B2A', colorAccent: '#4F7CFF',
    textColor: '#ffffff', bgColor: '#0A0A0A',
    style: 'gradient', bgm: 'cool_minimal',
  },
  {
    id: 'natural',
    name: 'Natural',
    desc: 'オーガニック',
    colorPrimary: '#3A5A40', colorAccent: '#D4A853',
    textColor: '#ffffff', bgColor: '#F5F0E8',
    style: 'standard', bgm: 'natural_warm',
  },
  {
    id: 'japanese',
    name: 'Japanese',
    desc: '和の伝統',
    colorPrimary: '#1C3D5A', colorAccent: '#C0392B',
    textColor: '#ffffff', bgColor: '#FDF5E6',
    style: 'magazine', bgm: 'cinematic',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    desc: '作品重視',
    colorPrimary: '#212121', colorAccent: '#FF6B35',
    textColor: '#ffffff', bgColor: '#F5F5F5',
    style: 'collage', bgm: 'cool_minimal',
  },
  {
    id: 'lp',
    name: 'LP',
    desc: 'コンバージョン特化',
    colorPrimary: '#E95464', colorAccent: '#1A1A1A',
    textColor: '#ffffff', bgColor: '#FFF5F5',
    style: 'standard', bgm: 'bright_pop',
  },
];

// ── Style Groups (スタイル分類) ────────────────────────────────────────────────
type StyleGroup = {
  styleId: 'magazine' | 'minimal' | 'standard' | 'collage' | 'gradient';
  name: string;
  icon: string;
  desc: string;
};

const STYLE_GROUPS: StyleGroup[] = [
  { styleId: 'magazine',  name: 'MAGAZINE',  icon: '📰', desc: '高級感・編集部風' },
  { styleId: 'minimal',   name: 'MINIMAL',   icon: '⬜', desc: '洗練・余白重視'  },
  { styleId: 'standard',  name: 'STANDARD',  icon: '🎬', desc: 'SNS映え・定番'   },
  { styleId: 'gradient',  name: 'GRADIENT',  icon: '🎨', desc: 'カラフル・動的'  },
  { styleId: 'collage',   name: 'COLLAGE',   icon: '🖼', desc: '複数写真・グリッド' },
];

// 用途 → 推奨テンプレート順
const PURPOSE_TEMPLATE_DEFAULTS: Record<string, string[]> = {
  promotion:   ['modern', 'pop', 'corporate'],
  sns_post:    ['modern', 'natural', 'pop'],
  sns_ad:      ['pop', 'lp', 'dark'],
  review:      ['natural', 'modern', 'japanese'],
  achievement: ['corporate', 'elegant', 'portfolio'],
};

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
  { value: 'flip',       label: 'フリップ' },
  { value: 'blur',       label: 'ブラー' },
  { value: 'bounce',     label: 'バウンス' },
  { value: 'push',       label: 'プッシュ' },
  { value: 'film-roll',  label: 'フィルムロール' },
  { value: 'circular',   label: 'サークルワイプ' },
  { value: 'stripe',     label: 'ストライプ' },
  { value: 'none',       label: 'なし' },
];

const ANIMATION_OPTIONS = [
  { value: 'slide',      label: 'スライド' },
  { value: 'rise',       label: 'ライズ' },
  { value: 'zoom',       label: 'ズーム' },
  { value: 'pop',        label: 'ポップ' },
  { value: 'elastic',    label: 'エラスティック' },
  { value: 'text-slide', label: 'テキストスライド' },
  { value: 'typewriter', label: 'タイプライター' },
  { value: 'spin',       label: 'スピン' },
  { value: 'fade',       label: 'フェード' },
  { value: 'blur',       label: 'ブラー' },
  { value: 'wipe',       label: 'ワイプ' },
  { value: 'drop',       label: 'ドロップ' },
  { value: 'none',       label: 'なし' },
];

const LAYOUT_OPTIONS = [
  { value: 'bottom',    label: 'ボトム' },
  { value: 'top',       label: 'トップ' },
  { value: 'center',    label: 'センター' },
  { value: 'caption',   label: 'キャプション' },
  { value: 'billboard', label: 'ビルボード' },
];

const DEFAULT_PAYLOAD: PalVideoPayload = {
  title:        '新しい動画',
  purpose:      'promotion',
  destination:  'instagram_reel',
  duration:     30,
  colorPrimary: '#1A1A2E',
  colorAccent:  '#E95464',
  textColor:    '#ffffff',
  bgColor:      '#F8F9FA',
  bgm:          'cool_minimal',
  style:        'standard',
  templateId:   'modern',
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

// ── Cut Preview Card ──────────────────────────────────────────────────────────

type CutPreviewCardProps = {
  cut: PalVideoCut | null;
  payload: PalVideoPayload;
  cutIndex?: number;
  tmplFamily?: string;
  tmplGradient?: string;
  tmplFirstCut?: { layout: string; mainTextPlaceholder: string; subTextPlaceholder: string };
  size?: 'md' | 'lg';
};

function CutPreviewCard({ cut, payload, cutIndex, tmplFamily, tmplGradient, tmplFirstCut, size = 'lg' }: CutPreviewCardProps) {
  const colorPrimary = payload.colorPrimary || '#1A1A2E';
  const colorAccent  = payload.colorAccent  || '#E95464';
  const dest         = payload.destination  || 'instagram_reel';
  const style        = payload.style        || 'standard';

  const is169 = dest === 'youtube' || dest === 'web_banner';
  const is11  = dest === 'instagram_feed';

  const cardW = size === 'lg'
    ? (is169 ? 440 : is11 ? 300 : 220)
    : (is169 ? 200 : is11 ? 130 : 90);
  const cardH = size === 'lg'
    ? (is169 ? 248 : is11 ? 300 : 391)
    : (is169 ? 113 : is11 ? 130 : 160);

  const layout   = cut?.layout   || tmplFirstCut?.layout   || 'bottom';
  const mainText = cut?.mainText || tmplFirstCut?.mainTextPlaceholder || 'メインテキスト';
  const subText  = cut?.subText  || tmplFirstCut?.subTextPlaceholder  || 'サブテキスト';
  const imageUrl = cut?.imageUrl || null;
  const label    = tmplFamily || (cutIndex !== undefined ? `CUT ${cutIndex + 1}` : '');

  const s = cardW / 440;
  const stripW = Math.round(cardW * 0.115);
  const bgGrad = tmplGradient || `linear-gradient(145deg, ${colorPrimary} 0%, ${colorPrimary}dd 60%, ${colorAccent}55 100%)`;

  const textStyle: React.CSSProperties =
    layout === 'top'
      ? { position: 'absolute', top: Math.round(cardH * 0.08), left: stripW + Math.round(12 * s), right: Math.round(10 * s) }
      : layout === 'center'
      ? { position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: stripW + Math.round(12 * s), right: Math.round(10 * s) }
      : { position: 'absolute', bottom: Math.round(cardH * 0.06), left: stripW + Math.round(12 * s), right: Math.round(10 * s) };

  const animKey = `${cut?.id ?? 'tmpl'}_${mainText}_${subText}_${colorAccent}_${imageUrl}`;

  return (
    <div
      key={animKey}
      className="relative overflow-hidden flex-shrink-0"
      style={{
        width: cardW, height: cardH,
        borderRadius: Math.round(10 * s),
        background: imageUrl ? colorPrimary : bgGrad,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="pv-img absolute inset-0 w-full h-full object-cover" />
      )}
      {imageUrl && style !== 'minimal' && (
        <div className="absolute inset-0" style={{
          background: layout === 'top'
            ? `linear-gradient(160deg, ${colorPrimary}BB 0%, ${colorPrimary}44 45%, transparent 100%)`
            : layout === 'center'
            ? `${colorPrimary}55`
            : `linear-gradient(to top, ${colorPrimary}DD 0%, ${colorPrimary}66 40%, transparent 75%)`,
        }} />
      )}
      <div className="pv-strip absolute top-0 left-0 bottom-0 flex flex-col items-center" style={{
        width: stripW, backgroundColor: colorAccent,
        paddingTop: Math.round(10 * s), paddingBottom: Math.round(10 * s), zIndex: 4,
      }}>
        <div style={{ width: Math.round(5 * s), height: Math.round(5 * s), borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', flexShrink: 0 }} />
        {label && size === 'lg' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <p style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: Math.round(7 * s), fontWeight: 900, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.92)', lineHeight: 1, userSelect: 'none' }}>
              {label.toUpperCase()}
            </p>
          </div>
        )}
        <div style={{ width: Math.round(4 * s), height: Math.round(4 * s), borderRadius: '50%', border: `${Math.max(1, Math.round(1 * s))}px solid rgba(255,255,255,0.7)`, flexShrink: 0 }} />
      </div>
      <div className="pv-plus1 absolute font-black select-none" style={{ top: Math.round(8 * s), right: Math.round(10 * s), fontSize: Math.round(18 * s), lineHeight: 1, color: 'rgba(255,255,255,0.65)', zIndex: 4 }}>+</div>
      <div className="pv-plus2 absolute font-black select-none" style={{ bottom: Math.round(8 * s), left: stripW + Math.round(8 * s), fontSize: Math.round(13 * s), lineHeight: 1, color: colorAccent, zIndex: 4 }}>+</div>
      {size === 'lg' && (
        <div className="pv-dots absolute" style={{ bottom: Math.round(10 * s), right: Math.round(10 * s), display: 'grid', gridTemplateColumns: `repeat(4, ${Math.round(3 * s)}px)`, gap: Math.round(4 * s), zIndex: 3 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: Math.round(2.5 * s), height: Math.round(2.5 * s), borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.28)' }} />
          ))}
        </div>
      )}
      {size === 'lg' && (
        <div className="absolute" style={{
          ...(layout === 'top'
            ? { top: Math.round(cardH * 0.065), left: stripW + Math.round(12 * s) }
            : layout === 'center'
            ? { top: '48%', transform: 'translateY(-50%) translateY(-16px)', left: stripW + Math.round(12 * s) }
            : { bottom: Math.round(cardH * 0.06 + (subText ? 36 * s : 20 * s)) + Math.round(16 * s), left: stripW + Math.round(12 * s) }),
          width: Math.round(28 * s), height: Math.round(2.5 * s), backgroundColor: colorAccent, zIndex: 4,
        }} />
      )}
      <div style={{ ...textStyle, zIndex: 5 }}>
        {size === 'lg' && (
          <div className="pv-line" style={{ width: Math.round(24 * s), height: Math.round(2.5 * s), backgroundColor: colorAccent, marginBottom: Math.round(6 * s) }} />
        )}
        {mainText && (
          <p className="pv-main font-black leading-tight" style={{ fontSize: Math.round((size === 'lg' ? 15 : 8) * s), color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.6)', lineHeight: 1.25, wordBreak: 'break-word' }}>
            {mainText}
          </p>
        )}
        {subText && (
          <p className="pv-sub leading-tight" style={{ fontSize: Math.round((size === 'lg' ? 9.5 : 5.5) * s), color: 'rgba(255,255,255,0.82)', marginTop: Math.round(5 * s), lineHeight: 1.4, wordBreak: 'break-word' }}>
            {subText}
          </p>
        )}
      </div>
      {cut && size === 'lg' && (
        <div className="absolute" style={{
          top: Math.round(8 * s), left: stripW + Math.round(8 * s),
          fontSize: Math.round(7.5 * s), color: 'rgba(255,255,255,0.75)',
          backgroundColor: 'rgba(0,0,0,0.35)', padding: `${Math.round(2 * s)}px ${Math.round(5 * s)}px`,
          borderRadius: Math.round(4 * s), zIndex: 4,
        }}>
          {cut.duration}s
        </div>
      )}
    </div>
  );
}

// ── Hearing Modal ─────────────────────────────────────────────────────────────

type HearingModalProps = { payload: PalVideoPayload; onClose: () => void };

function HearingModal({ payload, onClose }: HearingModalProps) {
  const messages = payload.hearingMessages || [];
  const answers  = payload.hearingAnswers  || [];
  const hasChat = messages.length > 0;
  const hasQA   = answers.length > 0;
  if (!hasChat && !hasQA) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} style={{ color: ACCENT }} />
            <h3 className="font-bold text-slate-800 text-sm">ヒアリング内容</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hasChat ? (
            messages.filter((m) => m.role !== 'system').map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0 mr-2 mt-0.5" style={{ backgroundColor: ACCENT }}>AI</div>}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${isUser ? 'bg-slate-800 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>{m.content}</div>
                </div>
              );
            })
          ) : (
            answers.filter((qa) => qa.a && qa.a !== '••••••').map((qa, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0 mr-2 mt-0.5" style={{ backgroundColor: ACCENT }}>AI</div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 text-slate-700 px-3 py-2 text-xs leading-relaxed">{qa.q}</div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-slate-800 text-white px-3 py-2 text-xs leading-relaxed">{qa.a}</div>
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
              <button key={idx} onClick={() => { onSelect(asset.url); onClose(); }}
                className="rounded-xl overflow-hidden border-2 border-transparent hover:border-rose-400 transition-all group">
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.originalName || asset.fileName || 'media'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
  const [renderProgress, setRenderProgress]   = useState<{ current: number; total: number; label: string } | null>(null);

  // State: UI
  const [showMediaModal, setShowMedia]        = useState(false);
  const [mediaSlot, setMediaSlot]             = useState<number>(0);
  const [showHearingModal, setShowHearing]    = useState(false);
  const [showHearingInline, setShowInline]    = useState(false);
  const [showColorOverride, setShowColor]     = useState(false);
  const [opMessage, setOpMessage]             = useState('');
  const [activeStep, setActiveStep]           = useState<1 | 2 | 3>(1);

  // State: BGM
  const [bgmPlaying, setBgmPlaying]         = useState(false);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Derived
  const selectedCustomer = customers.find((c) => c.paletteId === selectedCustomerId) || null;
  const selectedJob      = jobs.find((j) => j.id === selectedJobId) || null;
  const selectedCut      = (editingPayload.cuts || []).find((c) => c.id === selectedCutId) || null;
  const hasHearing = (editingPayload.hearingMessages?.length ?? 0) > 0
                  || (editingPayload.hearingAnswers?.length ?? 0) > 0
                  || Object.keys(editingPayload.hearingData ?? {}).length > 0;
  const destDimsLabel = DIMS_LABEL[editingPayload.destination || 'instagram_reel'] || '';
  const totalDurationSec = (editingPayload.cuts || []).reduce((s, c) => s + (c.duration || 3), 0);

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

  // ── Apply template ────────────────────────────────────────────────────────
  const handleApplyTemplate = (tmpl: VideoTemplate) => {
    const totalDur = tmpl.duration;
    const newCuts = tmpl.cuts.map((tc, i) => ({
      id: `cut_${Date.now()}_${i}`,
      duration: Math.round(totalDur * tc.durationRatio),
      imageUrl: (editingPayload.cuts || [])[i]?.imageUrl || null,
      mainText: (editingPayload.cuts || [])[i]?.mainText || tc.mainTextPlaceholder,
      subText:  (editingPayload.cuts || [])[i]?.subText  || tc.subTextPlaceholder,
      layout:   tc.layout,
      transition: tc.transition,
      animation:  tc.animation,
    }));
    setPayload((prev) => ({
      ...prev,
      colorPrimary: tmpl.colorPrimary,
      colorAccent:  tmpl.colorAccent,
      style:        tmpl.style,
      bgm:          tmpl.bgm,
      duration:     tmpl.duration,
      destination:  tmpl.platform,
      purpose:      tmpl.purpose,
      cuts:         newCuts,
    }));
    if (newCuts.length > 0) setSelectedCutId(newCuts[0].id);
    setOpMessage(`テンプレート「${tmpl.name}」を適用しました`);
    setTimeout(() => setOpMessage(''), 3000);
  };

  const handleBgmToggle = () => {
    const url = BGM_PREVIEW_URLS[editingPayload.bgm || ''];
    if (!url) return;
    if (!bgmAudioRef.current) {
      bgmAudioRef.current = new Audio(url);
      bgmAudioRef.current.loop = true;
    }
    if (bgmPlaying) {
      bgmAudioRef.current.pause();
      setBgmPlaying(false);
    } else {
      if (bgmAudioRef.current.src !== url) bgmAudioRef.current.src = url;
      bgmAudioRef.current.play().catch(() => {});
      setBgmPlaying(true);
    }
  };

  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current = null;
      setBgmPlaying(false);
    }
  }, [editingPayload.bgm]);

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
        setActiveStep(1);
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
      if (!res.ok || !resBody?.job) throw new Error(resBody?.error || '保存に失敗しました。');
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
      throw e;
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
          paletteId:       selectedCustomer.paletteId,
          jobId:           selectedJobId,
          purpose:         editingPayload.purpose      || 'promotion',
          destination:     editingPayload.destination  || 'instagram_reel',
          templateId:      editingPayload.templateId,
          templateName:    TEMPLATE_PRESETS.find((t) => t.id === editingPayload.templateId)?.name,
          hearingData:     editingPayload.hearingData,
          hearingAnswers:  editingPayload.hearingAnswers,
          hearingMessages: editingPayload.hearingMessages,
          existingCuts:    editingPayload.cuts,
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
          ...(bc?.style        ? { style:        bc.style as 'standard'|'magazine'|'minimal'|'collage'|'gradient' } : {}),
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

  const handleRender = async (mode: 'preview' | 'final', _retryCount = 0) => {
    if (!selectedJobId) { setOpMessage('先に保存してください。'); return; }
    setIsRendering(true);
    setOpMessage(mode === 'preview' ? 'プレビューを生成中...' : '最終レンダリング中...');
    try {
      // リトライ時は handleSave をスキップ:
      // handleSave が status:'draft' で上書きすると、pal_db が 'レンダリング中' に更新する前に
      // ポーリングが 'draft' を検知してしまい「サーバーが再起動しました。」が誤発火する
      if (_retryCount === 0) await handleSave();
      const res  = await fetch('/api/render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, mode }),
      });
      const body = await res.json().catch(() => ({}));

      if (body?.url) {
        setPreviewUrl(body.url);
        setOpMessage(mode === 'preview' ? 'プレビューURLを取得しました。' : 'レンダリング完了！');
        setTimeout(() => setOpMessage(''), 5000);
        setIsRendering(false);
      } else if (body?.status === 'rendering') {
        setOpMessage('🎬 レンダリング開始...');
        setRenderProgress({ current: 0, total: 1, label: '準備中...' });
        const jobIdToPoll = selectedJobId;
        const maxPollMs = mode === 'preview' ? 600000 : 7200000;
        // staleMs: プログレス更新が途絶えた場合のタイムアウト
        // preview=2分、final=30分（フル解像度1カットが10分超かかる場合に備え余裕を持たせる）
        const staleMs   = mode === 'preview' ? 120000  : 1800000;
        const renderStartedAtMs = Date.now();
        let lastProgressLabel = '';
        let lastProgressAt = Date.now();
        const poll = setInterval(async () => {
          try {
            const jobRes  = await fetch(`/api/admin/job?id=${encodeURIComponent(jobIdToPoll)}`);
            const jobBody = await jobRes.json().catch(() => ({}));
            const job     = jobBody?.job as { status?: string; previewUrl?: string | null; payload?: Record<string, unknown> } | undefined;
            const prog    = job?.payload?.['renderProgress'] as { current: number; total: number; label: string } | undefined;
            if (prog) {
              setRenderProgress({ current: prog.current, total: prog.total, label: prog.label });
              // ラベルが同じでもプログレスを受信できた＝pal_dbが生きている証拠
              // 常に lastProgressAt をリセットして誤スタールを防ぐ
              lastProgressLabel = prog.label;
              lastProgressAt = Date.now();
            }
            if (job?.previewUrl) {
              clearInterval(poll);
              setPreviewUrl(job.previewUrl as string);
              setRenderProgress(null);
              setOpMessage('✅ レンダリング完了！');
              setTimeout(() => setOpMessage(''), 5000);
              setIsRendering(false);
            } else if (String(job?.status) === 'エラー') {
              clearInterval(poll);
              setRenderProgress(null);
              const errMsg = (job?.payload?.['renderError'] as string) || '不明なエラー';
              setOpMessage(`⚠️ レンダリングエラー: ${errMsg}`);
              setIsRendering(false);
            } else if (
              String(job?.status) === 'draft' &&
              // pal_db の setImmediate が 'レンダリング中' に更新するまで30秒以上待つ
              // （開始直後に draft が見えても誤検知しないようにする）
              Date.now() - renderStartedAtMs > 30000 &&
              _retryCount < 2
            ) {
              clearInterval(poll);
              setRenderProgress(null);
              const retryNum = _retryCount + 1;
              setOpMessage(`🔄 サーバーが再起動しました。自動リトライ中... (${retryNum}/2)`);
              setTimeout(() => handleRender(mode, retryNum), 3000);
            } else if (Date.now() - lastProgressAt > staleMs) {
              clearInterval(poll);
              setRenderProgress(null);
              if (_retryCount < 2) {
                const retryNum = _retryCount + 1;
                setOpMessage(`🔄 レンダリングが停止しました。自動リトライ中... (${retryNum}/2)`);
                setTimeout(() => handleRender(mode, retryNum), 5000);
              } else {
                setOpMessage('⚠️ レンダリングが停止しました。再度お試しください。');
                setIsRendering(false);
              }
            }
          } catch (pollErr) {
            // ポーリングエラーはコンソールに出力して診断を助ける（UIには表示しない）
            console.warn('[render poll] error:', pollErr instanceof Error ? pollErr.message : pollErr);
          }
        }, 4000);
        setTimeout(() => {
          clearInterval(poll);
          setRenderProgress(null);
          setOpMessage('⚠️ タイムアウト。ページを更新して確認してください。');
          setIsRendering(false);
        }, maxPollMs);
      } else {
        setOpMessage(body?.error || 'レンダリングに失敗しました。');
        setIsRendering(false);
      }
    } catch (e: unknown) {
      if (!(e instanceof Error && e.message.includes('保存'))) setOpMessage('レンダリングに失敗しました。');
      setIsRendering(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // ── Suppress unused-import warnings (used via handleApplyTemplate) ─────────
  void TEMPLATES; void PLATFORM_LABELS; void PURPOSE_LABELS; void DURATION_LABELS;
  void PURPOSE_TEMPLATE_DEFAULTS; void destDimsLabel;

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT }}>
            <span className="text-white text-[10px] font-black">PV</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-800 leading-none">Pal Video</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Admin</p>
          </div>
          <button onClick={handleLogout} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="ログアウト">
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
              <button key={customer.paletteId} onClick={() => handleSelectCustomer(customer.paletteId)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${isSelected ? 'bg-rose-50 border-r-4' : 'hover:bg-slate-50 border-r-4 border-r-transparent'}`}
                style={isSelected ? { borderRightColor: ACCENT } : {}}>
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{customer.name || '名称未設定'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{customer.paletteId}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${tierColor}`}>{tier}</span>
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
                  {selectedJob && <span className="ml-2 text-slate-400 font-normal">/ {selectedJob.payload?.title || '無題の動画'}</span>}
                </p>
                {selectedJob && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_LABELS[selectedJob.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[selectedJob.status]?.label || selectedJob.status}
                    </span>
                    {selectedJob.createdAt && (
                      <span className="text-[10px] text-slate-400">{new Date(selectedJob.createdAt).toLocaleDateString('ja-JP')}</span>
                    )}
                  </div>
                )}
              </div>
              {hasHearing && (
                <button onClick={() => setShowHearing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{ borderColor: ACCENT, color: ACCENT }}>
                  <MessageCircle size={12} /> ヒアリング内容
                </button>
              )}
              <div className="flex items-center gap-1 flex-shrink-0">
                {jobs.map((job) => (
                  <button key={job.id} onClick={() => handleSelectJob(job)}
                    className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${job.id === selectedJobId ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    style={job.id === selectedJobId ? { backgroundColor: ACCENT } : {}}>
                    {job.payload?.title ? String(job.payload.title).slice(0, 8) : `Job ${jobs.indexOf(job) + 1}`}
                  </button>
                ))}
                <button onClick={handleNewJob} disabled={isSaving} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="新規ジョブ">
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
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* ── Step tabs ──────────────────────────────────────── */}
                <div className="bg-white border-b border-slate-100 flex items-center px-2 flex-shrink-0">
                  {([
                    { n: 1 as const, label: 'スタイル選択', icon: '🎨' },
                    { n: 2 as const, label: 'コンテンツ編集', icon: '✏️' },
                    { n: 3 as const, label: '出力・公開', icon: '🚀' },
                  ] as const).map(({ n, label, icon }) => (
                    <button key={n} onClick={() => setActiveStep(n)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold border-b-2 transition-colors ${activeStep === n ? 'text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      style={activeStep === n ? { borderBottomColor: ACCENT } : {}}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                        style={{ backgroundColor: activeStep === n ? ACCENT : '#e2e8f0', color: activeStep === n ? '#fff' : '#94a3b8' }}>
                        {n}
                      </span>
                      <span className="hidden sm:inline">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Step content ───────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                  {/* ════════ STEP 1: スタイル選択 ════════ */}
                  {activeStep === 1 && (
                    <div className="p-5 space-y-6">

                      {/* ① 投稿先 */}
                      <section>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                          <span className="inline-flex w-5 h-5 rounded-full text-white text-[9px] items-center justify-center mr-1.5" style={{ backgroundColor: ACCENT }}>1</span>
                          投稿先を選ぶ
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {DESTINATION_OPTIONS.map((opt) => {
                            const isSelected = editingPayload.destination === opt.value;
                            return (
                              <button key={opt.value}
                                onClick={() => setPayload((p) => ({ ...p, destination: opt.value }))}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border-2 text-left transition-all ${isSelected ? 'bg-rose-50' : 'bg-white hover:border-slate-300 border-slate-200'}`}
                                style={isSelected ? { borderColor: ACCENT } : {}}>
                                <p className="text-[11px] font-bold text-slate-700 truncate">{opt.label}</p>
                                <span className="text-[9px] text-slate-400 flex-shrink-0 ml-1">{opt.dims}</span>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* ② スタイル */}
                      <section>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                          <span className="inline-flex w-5 h-5 rounded-full text-white text-[9px] items-center justify-center mr-1.5" style={{ backgroundColor: ACCENT }}>2</span>
                          スタイルを選ぶ
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {STYLE_GROUPS.map((sg) => {
                            const isSelected = editingPayload.style === sg.styleId;
                            return (
                              <button key={sg.styleId}
                                onClick={() => {
                                  const firstPreset = TEMPLATE_PRESETS.find((p) => p.style === sg.styleId);
                                  if (firstPreset) {
                                    setPayload((p) => ({
                                      ...p,
                                      style:        sg.styleId,
                                      templateId:   firstPreset.id,
                                      colorPrimary: firstPreset.colorPrimary,
                                      colorAccent:  firstPreset.colorAccent,
                                      textColor:    firstPreset.textColor,
                                      bgColor:      firstPreset.bgColor,
                                      bgm:          firstPreset.bgm,
                                    }));
                                  } else {
                                    setPayload((p) => ({ ...p, style: sg.styleId }));
                                  }
                                }}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isSelected ? 'bg-rose-50' : 'bg-white hover:border-slate-300 border-slate-200'}`}
                                style={isSelected ? { borderColor: ACCENT } : {}}>
                                <span className="text-xl">{sg.icon}</span>
                                <p className="text-[10px] font-black text-slate-700">{sg.name}</p>
                                <p className="text-[8px] text-slate-400 text-center leading-tight">{sg.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* ③ カラーバリエーション */}
                      <section>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                          <span className="inline-flex w-5 h-5 rounded-full text-white text-[9px] items-center justify-center mr-1.5" style={{ backgroundColor: ACCENT }}>3</span>
                          カラーを選ぶ
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TEMPLATE_PRESETS.filter((p) => p.style === (editingPayload.style || 'standard')).map((tpl) => {
                            const isSelected = editingPayload.templateId === tpl.id;
                            return (
                              <button key={tpl.id}
                                onClick={() => setPayload((p) => ({
                                  ...p,
                                  templateId:   tpl.id,
                                  colorPrimary: tpl.colorPrimary,
                                  colorAccent:  tpl.colorAccent,
                                  textColor:    tpl.textColor,
                                  bgColor:      tpl.bgColor,
                                  bgm:          tpl.bgm,
                                }))}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${isSelected ? 'bg-rose-50' : 'bg-white hover:border-slate-300 border-slate-200'}`}
                                style={isSelected ? { borderColor: ACCENT } : {}}>
                                <div className="flex gap-1">
                                  <div className="w-5 h-5 rounded-full shadow-sm border border-white/50" style={{ backgroundColor: tpl.colorPrimary }} />
                                  <div className="w-5 h-5 rounded-full shadow-sm border border-white/50" style={{ backgroundColor: tpl.colorAccent }} />
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-slate-700 leading-none">{tpl.name}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">{tpl.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {/* カラー微調整 */}
                        <button onClick={() => setShowColor((v) => !v)}
                          className="flex items-center gap-1 mt-3 text-[10px] text-slate-400 hover:text-slate-600">
                          {showColorOverride ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          カラー微調整
                        </button>
                        {showColorOverride && (
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {[
                              { label: 'メイン', key: 'colorPrimary', def: '#1A1A2E' },
                              { label: 'アクセント', key: 'colorAccent', def: '#E95464' },
                              { label: 'テキスト', key: 'textColor', def: '#ffffff' },
                              { label: '背景', key: 'bgColor', def: '#F8F9FA' },
                            ].map(({ label, key, def }) => (
                              <div key={key}>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">{label}</label>
                                <input type="color"
                                  value={(editingPayload as Record<string, unknown>)[key] as string || def}
                                  onChange={(e) => setPayload((p) => ({ ...p, [key]: e.target.value }))}
                                  className="w-full h-7 border border-slate-200 rounded cursor-pointer" />
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* ④ BGM */}
                      <section>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                          <span className="inline-flex w-5 h-5 rounded-full text-white text-[9px] items-center justify-center mr-1.5" style={{ backgroundColor: ACCENT }}>4</span>
                          BGMを選ぶ
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {BGM_OPTIONS.map((opt) => {
                            const isSelected = editingPayload.bgm === opt.value;
                            return (
                              <button key={opt.value}
                                onClick={() => setPayload((p) => ({ ...p, bgm: opt.value }))}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${isSelected ? 'bg-rose-50' : 'bg-white hover:border-slate-300 border-slate-200'}`}
                                style={isSelected ? { borderColor: ACCENT } : {}}>
                                <span className="text-[11px] font-bold text-slate-700">{opt.label}</span>
                                {isSelected && (
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); handleBgmToggle(); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBgmToggle()}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 cursor-pointer"
                                    style={{ backgroundColor: bgmPlaying ? '#ef4444' : ACCENT }}>
                                    {bgmPlaying ? '⏸' : '▶'}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* プレビュー */}
                      {(editingPayload.cuts || []).length > 0 && (
                        <section>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">プレビュー</p>
                          {previewUrl ? (
                            <div className="rounded-2xl overflow-hidden bg-black flex justify-center">
                              <video
                                key={previewUrl}
                                src={previewUrl}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="max-h-72 w-auto"
                                style={{ maxWidth: '100%' }}
                              />
                            </div>
                          ) : (
                            <div className="rounded-2xl overflow-hidden p-4 flex justify-center"
                              style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)' }}>
                              <CutPreviewCard
                                cut={(editingPayload.cuts || [])[0]}
                                cutIndex={0}
                                payload={editingPayload}
                                size="lg"
                              />
                            </div>
                          )}
                        </section>
                      )}

                      <div className="flex justify-end pt-1">
                        <button onClick={() => setActiveStep(2)}
                          className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                          style={{ backgroundColor: ACCENT }}>
                          次へ: コンテンツ編集 →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ════════ STEP 2: コンテンツ編集 ════════ */}
                  {activeStep === 2 && (
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          カット一覧（{(editingPayload.cuts || []).length}カット・{totalDurationSec}秒）
                        </p>
                        <button onClick={handleGenerate} disabled={isGenerating || !selectedCustomer}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50"
                          style={{ backgroundColor: ACCENT }}>
                          {isGenerating ? <><Loader2 size={10} className="animate-spin" /> 生成中...</> : '🤖 AI自動生成'}
                        </button>
                      </div>

                      {(editingPayload.cuts || []).length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-slate-200">
                          <p className="text-sm text-slate-400 mb-4">まだカットがありません</p>
                          <div className="flex justify-center gap-2">
                            <button onClick={addCut}
                              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50">
                              + 手動で追加
                            </button>
                            <button onClick={handleGenerate} disabled={isGenerating || !selectedCustomer}
                              className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                              style={{ backgroundColor: ACCENT }}>
                              🤖 AIで自動生成
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(editingPayload.cuts || []).map((cut, idx) => {
                            const isActive = cut.id === selectedCutId;
                            return (
                              <div key={cut.id}
                                className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${isActive ? '' : 'border-slate-200'}`}
                                style={isActive ? { borderColor: ACCENT } : {}}>

                                {/* Card header */}
                                <button
                                  onClick={() => setSelectedCutId(isActive ? null : cut.id)}
                                  className="w-full flex items-center gap-3 p-3 text-left">
                                  {/* Mini preview */}
                                  <div className="flex-shrink-0 w-10 h-16 rounded-lg overflow-hidden"
                                    style={{ background: `linear-gradient(145deg, ${editingPayload.colorPrimary || '#1a1a2e'} 0%, ${editingPayload.colorAccent || '#e95464'}55 100%)` }}>
                                    {cut.imageUrl && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={cut.imageUrl} alt="" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                                        style={{ backgroundColor: isActive ? ACCENT : '#94a3b8' }}>
                                        {idx + 1}
                                      </span>
                                      <p className="text-xs font-bold text-slate-700 truncate">{cut.mainText || '(テキストなし)'}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-7 mt-0.5 truncate">{cut.subText || ''}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] text-slate-400">{cut.duration}s</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); removeCut(cut.id); }}
                                      className="w-5 h-5 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                                      <X size={10} />
                                    </button>
                                    {isActive ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                  </div>
                                </button>

                                {/* Expanded form */}
                                {isActive && (
                                  <div className="px-3 pb-3 border-t border-slate-100 pt-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">メインテキスト</label>
                                        <input value={cut.mainText || ''}
                                          onChange={(e) => updateCut(cut.id, { mainText: e.target.value })}
                                          placeholder="春の新作、解禁。"
                                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                                          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                                          onBlur={(e) => (e.target.style.boxShadow = '')} />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                          {editingPayload.style === 'collage' ? 'ラベル' : 'サブテキスト'}
                                        </label>
                                        <input value={cut.subText || ''}
                                          onChange={(e) => updateCut(cut.id, { subText: e.target.value })}
                                          placeholder="3日間限定オファー"
                                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
                                          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
                                          onBlur={(e) => (e.target.style.boxShadow = '')} />
                                      </div>
                                    </div>

                                    {/* Image */}
                                    {editingPayload.style === 'collage' ? (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5">グリッド画像（最大4枚）</label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                          {[0, 1, 2, 3].map((slot) => {
                                            const url = (cut.images || [])[slot] || null;
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
                                                      const newImgs = [...(cut.images || [])];
                                                      newImgs[slot] = '';
                                                      updateCut(cut.id, { images: newImgs });
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
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">画像</label>
                                        <div className="flex items-center gap-2">
                                          {cut.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={cut.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                                          )}
                                          <button onClick={() => { setMediaSlot(0); setShowMedia(true); }}
                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                            {cut.imageUrl ? '画像を変更' : '画像を選択'}
                                          </button>
                                          {cut.imageUrl && (
                                            <button onClick={() => updateCut(cut.id, { imageUrl: null })}
                                              className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50">
                                              削除
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Live preview */}
                                    <div className="rounded-xl overflow-hidden flex justify-center py-3"
                                      style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)' }}>
                                      <CutPreviewCard cut={cut} cutIndex={idx} payload={editingPayload} size="lg" />
                                    </div>

                                    {/* Advanced */}
                                    <details className="group">
                                      <summary className="cursor-pointer text-[10px] font-bold text-slate-400 hover:text-slate-600 list-none flex items-center gap-1">
                                        <ChevronDown size={10} className="group-open:rotate-180 transition-transform" />
                                        詳細設定（尺・レイアウト・トランジション・アニメ）
                                      </summary>
                                      <div className="mt-2 grid grid-cols-4 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 mb-1">尺: {cut.duration}s</label>
                                          <input type="range" min={1} max={10} value={cut.duration}
                                            onChange={(e) => updateCut(cut.id, { duration: Number(e.target.value) })}
                                            className="w-full accent-rose-400" />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 mb-1">レイアウト</label>
                                          <select value={cut.layout || 'bottom'}
                                            onChange={(e) => updateCut(cut.id, { layout: e.target.value })}
                                            className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] outline-none bg-white">
                                            {LAYOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 mb-1">トランジション</label>
                                          <select value={cut.transition || 'fade'}
                                            onChange={(e) => updateCut(cut.id, { transition: e.target.value })}
                                            className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] outline-none bg-white">
                                            {TRANSITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 mb-1">アニメ</label>
                                          <select value={cut.animation || 'slide'}
                                            onChange={(e) => updateCut(cut.id, { animation: e.target.value })}
                                            className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] outline-none bg-white">
                                            {ANIMATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                          </select>
                                        </div>
                                      </div>
                                    </details>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(editingPayload.cuts || []).length > 0 && (
                        <button onClick={addCut}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-400 font-medium hover:border-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1">
                          <Plus size={14} /> カットを追加
                        </button>
                      )}

                      <div className="flex justify-between pt-1">
                        <button onClick={() => setActiveStep(1)}
                          className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          ← スタイル選択に戻る
                        </button>
                        <button onClick={() => setActiveStep(3)}
                          className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                          style={{ backgroundColor: ACCENT }}>
                          次へ: 出力・公開 →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ════════ STEP 3: 出力・公開 ════════ */}
                  {activeStep === 3 && (
                    <div className="p-5 space-y-4">

                      {/* サマリー */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">動画サマリー</p>
                        <div className="flex items-start gap-4">
                          <div className="rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)', padding: 10 }}>
                            <CutPreviewCard
                              cut={(editingPayload.cuts || [])[0] || null}
                              cutIndex={0}
                              payload={editingPayload}
                              size="md"
                            />
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-slate-400">タイトル</p>
                              <p className="text-sm font-bold text-slate-700">{editingPayload.title || '無題の動画'}</p>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[10px] text-slate-400">スタイル</p>
                                <p className="text-xs font-bold text-slate-700 uppercase">{editingPayload.style || 'standard'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400">投稿先</p>
                                <p className="text-xs font-bold text-slate-700">{DESTINATION_OPTIONS.find((o) => o.value === editingPayload.destination)?.label || editingPayload.destination}</p>
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[10px] text-slate-400">カット数</p>
                                <p className="text-xs font-bold text-slate-700">{(editingPayload.cuts || []).length}カット</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400">合計尺</p>
                                <p className="text-xs font-bold text-slate-700">{totalDurationSec}秒</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* レンダリング */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">レンダリング</p>

                        <button onClick={() => handleRender('preview')} disabled={isRendering || !selectedJobId}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                          {isRendering ? <><Loader2 size={14} className="animate-spin" /> 処理中...</> : '👁 プレビュー動画を生成'}
                        </button>

                        <button onClick={() => handleRender('final')} disabled={isRendering || !selectedJobId}
                          className="w-full py-3 rounded-xl bg-slate-700 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                          🎬 最終レンダリング（高画質）
                        </button>

                        {renderProgress && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>{renderProgress.label}</span>
                              <span>{renderProgress.current} / {renderProgress.total}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div className="h-2.5 rounded-full transition-all duration-700"
                                style={{
                                  width: `${renderProgress.total > 0 ? Math.round((renderProgress.current / renderProgress.total) * 100) : 0}%`,
                                  backgroundColor: ACCENT,
                                }} />
                            </div>
                          </div>
                        )}

                        {opMessage && (
                          <p className="text-xs text-center font-medium" style={{ color: ACCENT }}>{opMessage}</p>
                        )}
                      </div>

                      {/* 動画プレビュー & 配布・公開 */}
                      {previewUrl && selectedJobId && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">動画プレビュー</p>
                          {/* 生成済み動画をインライン表示 */}
                          <div className="rounded-xl overflow-hidden bg-black flex justify-center">
                            <video
                              key={previewUrl}
                              src={previewUrl}
                              controls
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="max-h-64 w-auto"
                              style={{ maxWidth: '100%' }}
                            />
                          </div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider pt-1">配布・公開</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/preview/${selectedJobId}`;
                                navigator.clipboard.writeText(url);
                                setOpMessage('お客様確認URLをコピーしました');
                                setTimeout(() => setOpMessage(''), 3000);
                              }}
                              className="flex-1 py-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-rose-50 transition-colors"
                              style={{ borderColor: ACCENT, color: ACCENT }}>
                              <Copy size={13} /> お客様確認URLをコピー
                            </button>
                            <a href={`/preview/${selectedJobId}`} target="_blank" rel="noopener noreferrer"
                              className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          </div>
                          <a href={previewUrl} download
                            className="w-full py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors">
                            <Download size={13} /> MP4ダウンロード
                          </a>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button disabled className="py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed">
                              <Youtube size={12} /> YouTube投稿
                            </button>
                            <button disabled className="py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-400 flex items-center justify-center gap-1 cursor-not-allowed">
                              <Link2 size={12} /> pal_studio連携
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ヒアリング内容 */}
                      {hasHearing && (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <button onClick={() => setShowInline((v) => !v)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50">
                            <div className="flex items-center gap-1.5">
                              <MessageCircle size={12} style={{ color: ACCENT }} />
                              <p className="text-[11px] font-bold text-slate-500 uppercase">ヒアリング内容</p>
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
                                    <p className="text-slate-700 font-medium pl-2 border-l-2" style={{ borderColor: ACCENT }}>{qa.a}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-start pt-1">
                        <button onClick={() => setActiveStep(2)}
                          className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          ← コンテンツ編集に戻る
                        </button>
                      </div>
                    </div>
                  )}

                </div>{/* end step content */}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
      <aside className="w-60 border-l border-slate-200 bg-white flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">

        {/* 動画設定 */}
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
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none bg-white">
                {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">尺</label>
              <select value={editingPayload.duration || 30}
                onChange={(e) => setPayload((p) => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none bg-white">
                {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ステータス・進捗バッジ */}
        {selectedJob && (
          <div className="px-4 py-2.5 border-b border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_LABELS[selectedJob.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABELS[selectedJob.status]?.label || selectedJob.status}
              </span>
              <span className="text-[10px] text-slate-400">
                {(editingPayload.cuts || []).length}カット · {totalDurationSec}秒
              </span>
            </div>
            {/* Style badge */}
            {editingPayload.style && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase"
                  style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}>
                  {editingPayload.style}
                </span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editingPayload.colorPrimary || '#1A1A2E' }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editingPayload.colorAccent || ACCENT }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 保存 */}
        <div className="p-4 space-y-2">
          <button onClick={handleSave} disabled={isSaving || !selectedCustomer}
            className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT }}>
            {isSaving ? <><Loader2 size={14} className="animate-spin" /> 保存中...</> : '💾 保存する'}
          </button>

          {opMessage && !isRendering && (
            <p className="text-xs text-center font-medium" style={{ color: ACCENT }}>{opMessage}</p>
          )}
        </div>

        {/* ステップ別クイックアクション */}
        <div className="px-4 pb-4 space-y-1 border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">クイックアクション</p>
          <button onClick={() => setActiveStep(1)}
            className={`w-full py-1.5 rounded-lg text-[11px] font-bold text-left px-3 transition-colors ${activeStep === 1 ? 'text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            style={activeStep === 1 ? { backgroundColor: ACCENT } : {}}>
            🎨 スタイル選択
          </button>
          <button onClick={() => setActiveStep(2)}
            className={`w-full py-1.5 rounded-lg text-[11px] font-bold text-left px-3 transition-colors ${activeStep === 2 ? 'text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            style={activeStep === 2 ? { backgroundColor: ACCENT } : {}}>
            ✏️ コンテンツ編集
          </button>
          <button onClick={() => setActiveStep(3)}
            className={`w-full py-1.5 rounded-lg text-[11px] font-bold text-left px-3 transition-colors ${activeStep === 3 ? 'text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            style={activeStep === 3 ? { backgroundColor: ACCENT } : {}}>
            🚀 出力・公開
          </button>
        </div>
      </aside>

      {/* Hearing Modal */}
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
