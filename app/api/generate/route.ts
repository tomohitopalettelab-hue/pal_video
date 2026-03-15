import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { palDbGet } from '../_lib/pal-db-client';
import type { PalVideoCut } from '../_lib/pal-video-store';

type GenerateBody = {
  paletteId: string;
  jobId?: string;
  purpose: string;
  hearingData?: Record<string, unknown>;
  existingCuts?: PalVideoCut[];
};

const SYSTEM_PROMPT = `You are a professional video editor AI specialized in short-form social media video production.
Your task is to generate a sequence of video cuts (scenes) for a short marketing video.

Rules:
- Generate 5-8 cuts for the video.
- Each cut must have a unique id (use short alphanumeric strings like "c1", "c2", etc.).
- Duration should be 2-5 seconds per cut.
- mainText should be catchy Japanese marketing copy (keep it short, impactful).
- subText should be a supporting phrase or detail (shorter than mainText).
- transition options: "fade", "slide", "zoom", "none"
- animation options: "slide", "zoom", "fade", "none"
- Vary transitions and animations for visual interest.
- Use the hearing data and purpose to tailor the copy to the business context.

You MUST respond ONLY with valid JSON in this exact format:
{
  "cuts": [
    {
      "id": "c1",
      "duration": 3,
      "mainText": "春の新作、解禁。",
      "subText": "3日間限定オファー",
      "transition": "fade",
      "animation": "slide"
    }
  ]
}

Do not include any explanation or text outside the JSON.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { paletteId, purpose, jobId } = body;

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
      instagram_reel: 'Instagramリール（縦型・15-30秒）',
      youtube_short: 'YouTubeショート（縦型・60秒以内）',
      tiktok: 'TikTok（縦型・15-60秒）',
      web_banner: 'Webバナー動画（横型）',
    };
    const purposeLabel = purposeLabels[purpose] || purpose;

    const userPrompt = [
      `目的: ${purposeLabel}`,
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
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed: { cuts?: PalVideoCut[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ success: false, error: 'AI レスポンスのパースに失敗しました。' }, { status: 500 });
    }

    const cuts: PalVideoCut[] = Array.isArray(parsed.cuts) ? parsed.cuts : [];
    if (cuts.length === 0) {
      return NextResponse.json({ success: false, error: 'カットの生成に失敗しました。' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cuts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI生成に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
