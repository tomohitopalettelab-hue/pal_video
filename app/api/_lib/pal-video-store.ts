import { palDbGet, palDbPost } from './pal-db-client';

export type PalVideoCut = {
  id: string;
  duration: number;
  imageUrl?: string | null;
  /** collageスタイル用: 複数画像URL (最大4枚) */
  images?: string[];
  mainText?: string;
  subText?: string;
  /** collageスタイル用: カード下キャプション */
  caption?: string;
  transition?: string;
  animation?: string;
  /** レイアウト: bottom (下寄せ) | top (上寄せ) | center (中央) */
  layout?: string;
};

export type PalVideoPayload = {
  title?: string;
  /** コンテンツ用途: promotion / sns_post / sns_ad / review / achievement */
  purpose?: string;
  /** 投稿先プラットフォーム: instagram_reel / tiktok / youtube / etc. */
  destination?: string;
  resolution?: string;
  duration?: number;
  colorPrimary?: string;
  colorAccent?: string;
  bgm?: string;
  /** テンプレートスタイル: 'standard' | 'magazine' | 'minimal' | 'collage' | 'gradient' */
  style?: 'standard' | 'magazine' | 'minimal' | 'collage' | 'gradient';
  /** pal_studio 連携テンプレートID */
  templateId?: string;
  /** collageスタイル用: 背景色 (default: #FAF8F5) */
  bgColor?: string;
  /** collageスタイル用: テキスト色 (default: #1C1C1C) */
  textColor?: string;
  cuts?: PalVideoCut[];
  hearingData?: Record<string, unknown>;
  /** ヒアリングQAペア [{q, a}] */
  hearingAnswers?: Array<{ q: string; a: string }>;
  /** ヒアリングチャット履歴 [{role, content}] */
  hearingMessages?: Array<{ role: string; content: string }>;
  youtubeCredentials?: {
    accessToken?: string;
    refreshToken?: string;
    channelId?: string;
  };
};

export type PalVideoJob = {
  id: string;
  paletteId: string;
  planCode: string;
  status: 'draft' | 'preview' | 'rendered' | 'published';
  payload: PalVideoPayload;
  previewUrl?: string | null;
  youtubeUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const BGM_OPTIONS = [
  { key: 'bright_pop', label: '明るい・ポップ' },
  { key: 'cool_minimal', label: 'クール・ミニマル' },
  { key: 'cinematic', label: '感動・シネマ' },
  { key: 'natural_warm', label: 'ナチュラル・ほのぼの' },
];

// Map snake_case API response to camelCase TypeScript type
const mapJobFromApi = (raw: Record<string, unknown>): PalVideoJob => {
  return {
    id: String(raw.id || ''),
    paletteId: String(raw.palette_id || raw.paletteId || ''),
    planCode: String(raw.plan_code || raw.planCode || ''),
    status: (raw.status as PalVideoJob['status']) || 'draft',
    payload: (raw.payload as PalVideoPayload) || {},
    previewUrl: (raw.preview_url ?? raw.previewUrl ?? null) as string | null,
    youtubeUrl: (raw.youtube_url ?? raw.youtubeUrl ?? null) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt ?? undefined) as string | undefined,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? undefined) as string | undefined,
  };
};

export const getJobsByPaletteId = async (paletteId: string, limit = 20): Promise<PalVideoJob[]> => {
  const res = await palDbGet(
    `/api/pal-video/jobs?palette_id=${encodeURIComponent(paletteId)}&limit=${limit}`,
  );
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({}));
  const jobs = Array.isArray(body?.jobs) ? body.jobs : [];
  return jobs.map((j: Record<string, unknown>) => mapJobFromApi(j));
};

export const getJobById = async (id: string): Promise<PalVideoJob | null> => {
  const res = await palDbGet(`/api/pal-video/jobs/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  const raw = body?.job || body;
  if (!raw?.id) return null;
  return mapJobFromApi(raw as Record<string, unknown>);
};

export type CreateJobData = {
  id?: string;
  paletteId: string;
  planCode: string;
  status?: PalVideoJob['status'];
  payload: PalVideoPayload;
  previewUrl?: string | null;
  youtubeUrl?: string | null;
};

export const createJob = async (data: CreateJobData): Promise<PalVideoJob | null> => {
  const body: Record<string, unknown> = {
    palette_id: data.paletteId,
    plan_code: data.planCode,
    status: data.status || 'draft',
    payload: data.payload,
    preview_url: data.previewUrl ?? null,
    youtube_url: data.youtubeUrl ?? null,
  };
  if (data.id) body.id = data.id;

  const res = await palDbPost('/api/pal-video/jobs', body);
  if (!res.ok) return null;
  const resBody = await res.json().catch(() => ({}));
  const raw = resBody?.job || resBody;
  if (!raw?.id) return null;
  return mapJobFromApi(raw as Record<string, unknown>);
};

export const updateJob = async (id: string, data: Partial<CreateJobData>): Promise<PalVideoJob | null> => {
  const body: Record<string, unknown> = { id };
  if (data.paletteId !== undefined) body.palette_id = data.paletteId;
  if (data.planCode !== undefined) body.plan_code = data.planCode;
  if (data.status !== undefined) body.status = data.status;
  if (data.payload !== undefined) body.payload = data.payload;
  if (data.previewUrl !== undefined) body.preview_url = data.previewUrl;
  if (data.youtubeUrl !== undefined) body.youtube_url = data.youtubeUrl;

  const res = await palDbPost('/api/pal-video/jobs', body);
  if (!res.ok) return null;
  const resBody = await res.json().catch(() => ({}));
  const raw = resBody?.job || resBody;
  if (!raw?.id) return null;
  return mapJobFromApi(raw as Record<string, unknown>);
};
