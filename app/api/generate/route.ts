import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { PalVideoCut } from '../_lib/pal-video-store';

export const maxDuration = 60;

type GenerateBody = {
  paletteId: string;
  jobId?: string;
  purpose: string;
  destination?: string;
  templateId?: string;
  templateName?: string;
  hearingData?: Record<string, unknown>;
  hearingAnswers?: Array<{ q: string; a: string }>;
  hearingMessages?: Array<{ role: string; content: string }>;
  existingCuts?: PalVideoCut[];
};

// ── Pexels image search ──────────────────────────────────────────────────────
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

async function searchPexelsImages(
  keyword: string,
  orientation: 'portrait' | 'landscape' | 'square' = 'portrait',
  count = 1,
): Promise<string[]> {
  if (!PEXELS_API_KEY) return [];
  try {
    const perPage = Math.min(count + 4, 15); // fetch a few extras for variety
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=${perPage}&orientation=${orientation}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      photos?: Array<{ src: { large2x?: string; large?: string; original?: string } }>;
    };
    const photos = data?.photos || [];
    if (photos.length === 0) return [];
    // Shuffle and pick `count` distinct photos
    const shuffled = [...photos].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count)
      .map((p) => p?.src?.large2x || p?.src?.large || p?.src?.original || '')
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function searchPexelsImage(
  keyword: string,
  orientation: 'portrait' | 'landscape' | 'square' = 'portrait',
): Promise<string | null> {
  const results = await searchPexelsImages(keyword, orientation, 1);
  return results[0] ?? null;
}

// ── AI system prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an award-winning video editor AI specializing in cinematic short-form social media content for Japanese businesses.
Generate a sequence of high-impact video cuts for a professional marketing video.

## Cut Rules
- Generate 6-8 cuts. Never fewer than 6.
- id: short alphanumeric like "c1", "c2", etc.
- duration: 2.5–4.5 seconds. First and last cuts: 3.5–5 seconds.
- mainText: punchy Japanese marketing headline. MAX 12 chars. Use line breaks (\n) for rhythm. Make it memorable, poetic, or provocative.
- subText: supporting Japanese detail. MAX 22 chars. Concrete specifics beat vague claims.
- imageKeyword: 5-8 specific English words for Pexels stock photo search. Be VERY specific about subject, lighting, mood, and setting (e.g., "japanese cafe barista morning golden light bokeh" not just "cafe"). This is critical for image quality. For collage style, make each cut's imageKeyword describe a DIFFERENT scene/angle of the business.

## Transitions (vary HEAVILY, never repeat consecutive)
- "color-wipe" → bold brand-color reveal (high energy)
- "bounce" → elastic scale-in (playful, dynamic)
- "film-roll" → horizontal strip wipe (nostalgic, editorial)
- "circular" → circle wipe in (dramatic, eye-catching)
- "stripe" → vertical stripe reveal (modern, geometric)
- "zoom" → scale entrance with back-easing (elegant)
- "flip" → rotation spin (cinematic)
- "slide" → directional slide (clean)
- "wipe" → directional wipe (smooth)
- "fade" → simple dissolve (neutral, use sparingly)

## Text Animations (vary every cut, match energy to content)
- "text-slide" → word-by-word up reveal (premium, editorial — use for headlines)
- "typewriter" → character-by-character typing (tech, authentic)
- "spin" → rotation pop (bold, impactful — use for key statements)
- "elastic" → rubber-band bounce (playful, energetic)
- "pop" → quick scale burst (punchy CTAs)
- "rise" → large upward slide (dramatic reveals)
- "blur" → defocus-to-focus (cinematic, mysterious)
- "wipe" → horizontal wipe-in (clean, modern)
- "zoom" → scale from small (confident)

## Layout Strategy (must vary — do NOT use same layout twice in a row)
- "billboard" → GIANT headline at top (use for most impactful message, cut 1 or 3)
- "center" → full-screen cinematic overlay (use for emotional peak, cut 3 or 5)
- "caption" → solid band at bottom — modern, clean (good for feature details)
- "bottom" → gradient lower-third (classic social media look)
- "top" → gradient upper-third (fresh, contrasting)

## Layout Sequence (follow this pattern):
- Cut 0: "caption" or "bottom" — inviting opener, set the scene
- Cut 1: "billboard" — BOLD product/service statement
- Cut 2: "top" or "caption" — first feature benefit
- Cut 3: "center" — emotional core message (most important)
- Cut 4: "caption" or "billboard" — second feature / proof point
- Cut 5: "bottom" or "top" — third feature / social proof
- Cut 6+: "caption" or "center" — urgency / CTA
- Last cut: "caption" — strong CTA (visit / apply / call / reserve)

## Brand Analysis
Deeply analyze the hearing Q&A and conversation to extract:
- Business type, industry, target customers, unique value proposition
- Tone of voice (luxury, friendly, professional, energetic, etc.)
- Visual aesthetic (warm/cool, light/dark, minimal/bold)

## Brand Color Recommendation
- colorPrimary: dominant brand color (strong, saturated hex)
- colorAccent: complementary/contrasting accent (creates visual pop)
- textColor: "#ffffff" for dark backgrounds, "#1A1A1A" for light
- bgColor: background color for minimal/collage styles
- style: "standard" (photos + Ken Burns, most versatile) | "magazine" (side panel, luxury/B2B) | "minimal" (ultra-clean, beauty/fashion) | "collage" (grid layout, recruitment/events) | "gradient" (brand color full-bleed, no photos needed — great for announcements/launches)
- bgm: "bright_pop" (energetic) | "cool_minimal" (stylish) | "cinematic" (emotional/premium) | "natural_warm" (friendly/casual)

## Industry Color Guide
- Restaurant/Café/Food: warm amber (#C4783A), accent: #2D9E8A, bgm: natural_warm
- Beauty/Nail/Salon: deep rose (#C94577), accent: #E8C84A (gold), bgm: cool_minimal
- Medical/Dental/Clinic: trust blue (#1B6CA8), accent: #3ABFA3, bgm: cool_minimal
- Real Estate/Construction: navy (#1A2744), accent: #C4973A (gold), bgm: cinematic
- IT/SaaS/Tech: deep blue (#1B3A6B) or near-black (#0D1B2A), accent: #4F7CFF, bgm: cool_minimal
- Fitness/Sports/Gym: fire red (#D93526), accent: #1B6CA8, bgm: bright_pop
- Education/School/Cram: trustworthy blue (#1B5CA8), accent: #E8A730, bgm: bright_pop
- Retail/Fashion: derive from brand identity, bgm: bright_pop or cool_minimal
- Wedding/Event: cream white (#FAF8F5), accent: #C4973A (gold), style: minimal, bgm: cinematic
- Recruitment/HR: fresh green (#2D9E5A), accent: #E95464, bgm: bright_pop

## Collage Style Special Rules (when style === "collage")
- Generate only 2-4 cuts (fewer but more impactful)
- Each cut represents a "theme" or "aspect" of the business (e.g., workplace culture, products, team, environment)
- imageKeyword must describe scenes with different angles/subjects so 4 fetched images look like a varied photoshoot
- mainText: larger, bolder statement (1-2 short lines max), often a recruitment or event headline
- layout: always "center" for collage cuts (text appears in center band between photo rows)
- transition: "fade" or "slide" (keep it clean/elegant for collage style)

## Response Format
Respond ONLY with valid JSON. No markdown, no explanation, no code fences.
{
  "cuts": [
    {
      "id": "c1",
      "duration": 3.5,
      "mainText": "日本語テキスト",
      "subText": "サポートテキスト",
      "imageKeyword": "specific descriptive english keywords here",
      "transition": "color-wipe",
      "animation": "text-slide",
      "layout": "caption"
    }
  ],
  "brandColors": {
    "colorPrimary": "#E95464",
    "colorAccent": "#1c9a8b",
    "textColor": "#ffffff",
    "bgColor": "#FAF8F5",
    "style": "standard",
    "bgm": "bright_pop"
  }
}`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { paletteId, purpose, destination, jobId, templateId, templateName } = body;

    if (!paletteId || !purpose) {
      return NextResponse.json({ success: false, error: 'paletteId と purpose は必須です。' }, { status: 400 });
    }

    // Hearing data: merge all available sources
    const hearingData = body.hearingData || {};
    const hearingAnswers  = body.hearingAnswers  || [];
    const hearingMessages = body.hearingMessages || [];

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

    // Build hearing context string (most informative format available)
    const hearingContext = (() => {
      const parts: string[] = [];
      if (hearingAnswers.length > 0) {
        parts.push('ヒアリングQ&A:\n' + hearingAnswers
          .filter((qa) => qa.a && qa.a !== '••••••')
          .map((qa) => `Q: ${qa.q}\nA: ${qa.a}`)
          .join('\n'));
      }
      if (hearingMessages.length > 0) {
        const chatText = hearingMessages
          .filter((m) => m.role !== 'system' && m.content)
          .slice(-20)  // last 20 messages
          .map((m) => `${m.role === 'user' ? '顧客' : 'AI'}: ${m.content}`)
          .join('\n');
        if (chatText) parts.push(`ヒアリングチャット:\n${chatText}`);
      }
      if (Object.keys(hearingData).length > 0 && parts.length === 0) {
        parts.push(`ヒアリングデータ: ${JSON.stringify(hearingData, null, 2)}`);
      }
      return parts.length > 0 ? parts.join('\n\n') : 'ヒアリングデータ: なし';
    })();

    // Template aesthetic guidance
    const TEMPLATE_AESTHETIC: Record<string, string> = {
      modern:    'シンプル＆クリーン。余白を活かし、洗練されたモダンなレイアウト。読みやすいフォントサイズ。color-wipe/slideを多用。',
      elegant:   'ラグジュアリー。暗いトーン、ゴールドアクセント、マガジンスタイルのレイアウト。flipやfilm-rollで高級感。',
      corporate: '信頼と実績。ネイビー系、billboardとcaptionを使った力強い見出し構成。professional tone。',
      pop:       '元気で親しみやすい。鮮やかな色使い、bounce/elastic、gradient全面カットを積極的に使う。',
      minimal:   '洗練された余白。テキスト中心、白い背景、静かなアニメーション。fadeやslideのみ。',
      dark:      'テック＆クール。暗い背景にブルーアクセント。spin/flipで動的に。gradient fullbleedを多用。',
      natural:   'オーガニック＆温かい。アースカラー、自然の写真、ゆっくりしたアニメーション。natural_warm BGM。',
      japanese:  '和の伝統。藍色・朱色。縦書き風テキスト（\n改行活用）、余白重視、film-roll/fadeで品格。',
      portfolio: '作品・事例重視。画像を大きく見せる。collageスタイル推奨。テキストは最小限。',
      lp:        'コンバージョン特化。CTAが明確、billboardでインパクト、最後のカットに強いCTA。color-wipeで引き付ける。',
    };
    const templateAesthetic = templateId ? (TEMPLATE_AESTHETIC[templateId] || '') : '';
    const templateSection = templateId
      ? `\nテンプレート: ${templateName || templateId}\n美学・スタイル: ${templateAesthetic}`
      : '';

    const userPrompt = [
      `用途: ${purposeLabel}`,
      destinationLabel ? `投稿先: ${destinationLabel}` : '',
      `顧客ID: ${paletteId}`,
      templateSection,
      hearingContext,
      body.existingCuts && body.existingCuts.length > 0
        ? `既存カット数: ${body.existingCuts.length}`
        : '',
      '上記のヒアリング内容とテンプレートの美学を深く読み込み、そのビジネス・ブランドに最適な動画カットを生成してください。',
    ]
      .filter(Boolean)
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed: { cuts?: Array<PalVideoCut & { imageKeyword?: string }>; brandColors?: Record<string, string> };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ success: false, error: 'AI レスポンスのパースに失敗しました。' }, { status: 500 });
    }

    const rawCuts: Array<PalVideoCut & { imageKeyword?: string }> = Array.isArray(parsed.cuts) ? parsed.cuts : [];
    // Extract brand colors from AI response
    const brandColors = parsed.brandColors as Record<string, string> | undefined;
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

    // Determine if collage style (needs 4 images per cut)
    const isCollageStyle = brandColors?.style === 'collage';

    // Parallel-fetch stock images via Pexels for each cut that has imageKeyword
    const cuts: PalVideoCut[] = await Promise.all(
      rawCuts.map(async (cut) => {
        const { imageKeyword, ...rest } = cut;
        if (isCollageStyle) {
          // Collage: fetch 4 images for 2×2 grid
          if (rest.images && rest.images.length >= 2) return rest; // already has images
          if (!imageKeyword) return rest;
          const imgs = await searchPexelsImages(imageKeyword, orientation, 4);
          return imgs.length > 0 ? { ...rest, images: imgs, imageUrl: imgs[0] } : rest;
        }
        // Non-collage: single image
        if (rest.imageUrl) return rest;
        if (!imageKeyword) return rest;
        const imageUrl = await searchPexelsImage(imageKeyword, orientation);
        return imageUrl ? { ...rest, imageUrl } : rest;
      }),
    );

    return NextResponse.json({ success: true, cuts, brandColors: brandColors || null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI生成に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
