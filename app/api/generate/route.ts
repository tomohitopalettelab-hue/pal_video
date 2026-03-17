import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { palDbGet } from '../_lib/pal-db-client';
import type { PalVideoCut } from '../_lib/pal-video-store';

type GenerateBody = {
  paletteId: string;
  jobId?: string;
  purpose: string;
  destination?: string;
  hearingData?: Record<string, unknown>;
  existingCuts?: PalVideoCut[];
};

// ── Pexels image search ──────────────────────────────────────────────────────
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

async function searchPexelsImage(
  keyword: string,
  orientation: 'portrait' | 'landscape' | 'square' = 'portrait',
): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=5&orientation=${orientation}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      photos?: Array<{ src: { large2x?: string; large?: string; original?: string } }>;
    };
    const photos = data?.photos || [];
    if (photos.length === 0) return null;
    const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
    return pick?.src?.large2x || pick?.src?.large || pick?.src?.original || null;
  } catch {
    return null;
  }
}

// ── AI system prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional video editor AI specialized in short-form social media video production for Japanese businesses.
Your task is to generate a sequence of video cuts (scenes) for a high-quality marketing video.

Rules:
- Generate 5-8 cuts for the video.
- Each cut must have a unique id (use short alphanumeric strings like "c1", "c2", etc.).
- Duration should be 2-5 seconds per cut.
- mainText: catchy Japanese marketing copy — max 14 chars, impactful, poetic if possible.
- subText: supporting detail — max 22 chars, shorter than mainText.
- transition options: "fade", "slide", "zoom", "wipe", "color-wipe", "flip", "blur", "bounce", "none"
- animation options: "slide", "zoom", "fade", "pop", "blur", "wipe", "rise", "drop", "elastic", "none"
- layout options:
    "bottom"    → lower-third overlay (classic Instagram/TikTok)
    "top"       → upper-third overlay (fresh, contrasting)
    "center"    → full-screen centered statement (use for most impactful lines)
    "caption"   → solid dark band at bottom (modern, clean caption style)
    "billboard" → giant headline at top of screen (magazine cover feel)
- imageKeyword: 3-5 English words describing the ideal stock photo for this cut.
  Must be concrete and visual (e.g. "japanese ramen restaurant interior", "woman smiling coffee shop", "cherry blossom street japan").
  Tailor to the specific business from hearingData.

Layout strategy:
- Cut 0: "bottom" or "caption" (welcoming opener)
- Cut 1: "billboard" (bold visual statement)
- Cut 2: "caption" or "top" (feature highlight)
- Cut 3: "center" (emotional peak / key message)
- Cut 4+: mix of "bottom", "caption", "top"
- Last cut: "bottom" or "caption" with strong CTA copy like "今すぐチェック" or "詳しくはプロフィールへ"

Transition strategy: vary heavily. Use "color-wipe" and "bounce" for energy. Use "blur" for smooth sophistication.
Animation strategy: use "pop" and "elastic" for impact moments. Use "rise" and "slide" for elegant flow.

You MUST respond ONLY with valid JSON in this exact format:
{
  "cuts": [
    {
      "id": "c1",
      "duration": 3,
      "mainText": "春の新作、解禁。",
      "subText": "3日間限定オファー",
      "transition": "color-wipe",
      "animation": "pop",
      "layout": "bottom",
      "imageKeyword": "japanese spring cherry blossom cafe food"
    }
  ]
}

Do not include any explanation or text outside the JSON.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { paletteId, purpose, destination, jobId } = body;

    if (!paletteId || !purpose) {
      return NextResponse.json({ success: false, error: 'paletteId と purpose は必須です。' }, { status: 400 });
    }

    // Fetch hearing data if not provided
    let hearingData = body.hearingData || {};
    if (!body.hearingData && paletteId) {
      try {
        const hearingRes = await palDbGet(`/api/hearing?paletteId=${encodeURIComponent(paletteId)}`);
        if (hearingRes.ok) {
          hearingData = await hearingRes.json().catch(() => ({}));
        }
      } catch {
        // Ignore hearing fetch error, use empty object
      }
    }

    const apiKey = process.env.OPENAI_KEY_API || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'OpenAI API キーが設定されていません。' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const purposeLabels: Record<string, string> = {
      promotion: 'プロモーション動画（商品・サービスの宣伝）',
      sns_post: 'SNS投稿用（オーガニック投稿）',
      sns_ad: 'SNS広告（有料広告配信用）',
      review: '口コミ紹介（レビュー・お客様の声）',
      achievement: '実績紹介（事例・実績アピール）',
    };
    const destinationLabels: Record<string, string> = {
      instagram_reel: 'Instagram リール（縦型9:16）',
      instagram_story: 'Instagram ストーリーズ（縦型9:16）',
      instagram_feed: 'Instagram フィード（正方形1:1）',
      tiktok: 'TikTok（縦型9:16）',
      youtube_short: 'YouTube ショート（縦型9:16）',
      youtube: 'YouTube（横型16:9）',
      x_twitter: 'X (Twitter)（縦型4:5）',
      line_voom: 'LINE VOOM（縦型4:5）',
      facebook: 'Facebook（縦型4:5）',
      web_banner: 'Webバナー動画（横型16:9）',
    };
    const purposeLabel = purposeLabels[purpose] || purpose;
    const destinationLabel = destination ? (destinationLabels[destination] || destination) : null;

    const userPrompt = [
      `用途: ${purposeLabel}`,
      destinationLabel ? `投稿先: ${destinationLabel}` : '',
      jobId ? `ジョブID: ${jobId}` : '',
      `顧客ID: ${paletteId}`,
      hearingData && Object.keys(hearingData).length > 0
        ? `ヒアリングデータ: ${JSON.stringify(hearingData, null, 2)}`
        : 'ヒアリングデータ: なし',
      body.existingCuts && body.existingCuts.length > 0
        ? `既存カット数: ${body.existingCuts.length}`
        : '',
      '上記の情報に基づいて動画カットを生成してください。',
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed: { cuts?: Array<PalVideoCut & { imageKeyword?: string }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ success: false, error: 'AI レスポンスのパースに失敗しました。' }, { status: 500 });
    }

    const rawCuts: Array<PalVideoCut & { imageKeyword?: string }> = Array.isArray(parsed.cuts) ? parsed.cuts : [];
    if (rawCuts.length === 0) {
      return NextResponse.json({ success: false, error: 'カットの生成に失敗しました。' }, { status: 500 });
    }

    // Determine image orientation from destination
    const orientationMap: Record<string, 'portrait' | 'landscape' | 'square'> = {
      youtube: 'landscape',
      web_banner: 'landscape',
      instagram_feed: 'square',
    };
    const orientation = orientationMap[destination || ''] || 'portrait';

    // Parallel-fetch stock images via Pexels for each cut that has imageKeyword
    const cuts: PalVideoCut[] = await Promise.all(
      rawCuts.map(async (cut) => {
        const { imageKeyword, ...rest } = cut;
        if (rest.imageUrl) return rest; // already has image
        if (!imageKeyword) return rest;
        const imageUrl = await searchPexelsImage(imageKeyword, orientation);
        return imageUrl ? { ...rest, imageUrl } : rest;
      }),
    );

    return NextResponse.json({ success: true, cuts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI生成に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
