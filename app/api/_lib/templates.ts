export type TemplateCut = {
  durationRatio: number; // fraction of total duration
  layout: 'bottom' | 'top' | 'center';
  transition: string;
  animation: string;
  mainTextPlaceholder: string;
  subTextPlaceholder: string;
};

export type VideoTemplate = {
  id: string;
  name: string;
  platform: string;
  duration: number; // 15 | 30 | 60
  purpose: string;
  colorPrimary: string;
  colorAccent: string;
  style: 'standard' | 'magazine' | 'minimal' | 'collage' | 'gradient';
  bgm: string;
  cuts: TemplateCut[];
  thumbnailGradient: string; // CSS gradient for thumbnail card
  family: string; // visual family name
};

// Platforms
const PLATFORMS = [
  { key: 'instagram_reel',   label: 'Instagram リール (9:16)' },
  { key: 'instagram_story',  label: 'Instagram ストーリーズ (9:16)' },
  { key: 'instagram_feed',   label: 'Instagram フィード (1:1)' },
  { key: 'tiktok',           label: 'TikTok (9:16)' },
  { key: 'youtube_short',    label: 'YouTube ショート (9:16)' },
  { key: 'youtube',          label: 'YouTube (16:9)' },
  { key: 'x_twitter',        label: 'X (Twitter) (4:5)' },
  { key: 'line_voom',        label: 'LINE VOOM (4:5)' },
  { key: 'facebook',         label: 'Facebook (4:5)' },
  { key: 'web_banner',       label: 'Webバナー動画 (16:9)' },
] as const;

const DURATIONS = [15, 30, 60] as const;

const PURPOSES = [
  { key: 'promotion',   label: 'プロモーション' },
  { key: 'sns_post',    label: 'SNS投稿' },
  { key: 'sns_ad',      label: 'SNS広告' },
  { key: 'review',      label: 'クチコミ・レビュー' },
  { key: 'achievement', label: '実績・成果' },
] as const;

// 10 visual families
const FAMILIES = {
  urban_modern: {
    name: 'Urban Modern',
    colorPrimary: '#1A1A2E', colorAccent: '#E95464',
    style: 'standard' as const, bgm: 'cool_minimal',
    thumbnailGradient: 'linear-gradient(135deg, #1A1A2E 0%, #E95464 100%)',
    layoutPattern: ['bottom','bottom','center','bottom','bottom','center','bottom','bottom','center','bottom','bottom','center','bottom','bottom'] as const,
    transitions: ['fade','slide','fade','zoom','fade','slide','fade','zoom','fade','slide','fade','zoom','fade','fade'],
  },
  elegant_luxury: {
    name: 'Elegant Luxury',
    colorPrimary: '#0D0D0D', colorAccent: '#C4973A',
    style: 'magazine' as const, bgm: 'cinematic',
    thumbnailGradient: 'linear-gradient(135deg, #0D0D0D 0%, #C4973A 100%)',
    layoutPattern: ['center','bottom','bottom','center','bottom','bottom','center','bottom','bottom','center','bottom','bottom','center','bottom'] as const,
    transitions: ['fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade'],
  },
  fresh_clean: {
    name: 'Fresh Clean',
    colorPrimary: '#1CA9A0', colorAccent: '#F5A623',
    style: 'minimal' as const, bgm: 'bright_pop',
    thumbnailGradient: 'linear-gradient(135deg, #1CA9A0 0%, #F5A623 100%)',
    layoutPattern: ['top','top','center','top','top','center','top','top','center','top','top','center','top','top'] as const,
    transitions: ['fade','wipe','fade','wipe','fade','wipe','fade','wipe','fade','wipe','fade','wipe','fade','fade'],
  },
  nature_organic: {
    name: 'Nature Organic',
    colorPrimary: '#3A5A40', colorAccent: '#D4A853',
    style: 'standard' as const, bgm: 'natural_warm',
    thumbnailGradient: 'linear-gradient(135deg, #3A5A40 0%, #D4A853 100%)',
    layoutPattern: ['bottom','center','bottom','bottom','center','bottom','bottom','center','bottom','bottom','center','bottom','bottom','center'] as const,
    transitions: ['fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade'],
  },
  bold_pop: {
    name: 'Bold Pop',
    colorPrimary: '#E95464', colorAccent: '#F5A623',
    style: 'gradient' as const, bgm: 'bright_pop',
    thumbnailGradient: 'linear-gradient(135deg, #E95464 0%, #F5A623 100%)',
    layoutPattern: ['bottom','top','center','bottom','top','center','bottom','top','center','bottom','top','center','bottom','top'] as const,
    transitions: ['zoom','slide','fade','zoom','slide','fade','zoom','slide','fade','zoom','slide','fade','zoom','fade'],
  },
  corporate_pro: {
    name: 'Corporate Pro',
    colorPrimary: '#1A2744', colorAccent: '#2A7FC1',
    style: 'standard' as const, bgm: 'cool_minimal',
    thumbnailGradient: 'linear-gradient(135deg, #1A2744 0%, #2A7FC1 100%)',
    layoutPattern: ['bottom','bottom','bottom','center','bottom','bottom','bottom','center','bottom','bottom','bottom','center','bottom','bottom'] as const,
    transitions: ['fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade'],
  },
  sunset_warm: {
    name: 'Sunset Warm',
    colorPrimary: '#2D1B00', colorAccent: '#FF6B35',
    style: 'gradient' as const, bgm: 'natural_warm',
    thumbnailGradient: 'linear-gradient(135deg, #FF6B35 0%, #F5A623 100%)',
    layoutPattern: ['bottom','center','top','bottom','center','top','bottom','center','top','bottom','center','top','bottom','center'] as const,
    transitions: ['fade','zoom','fade','fade','zoom','fade','fade','zoom','fade','fade','zoom','fade','fade','fade'],
  },
  midnight_dark: {
    name: 'Midnight Dark',
    colorPrimary: '#0D1B2A', colorAccent: '#4F7CFF',
    style: 'gradient' as const, bgm: 'cinematic',
    thumbnailGradient: 'linear-gradient(135deg, #0D1B2A 0%, #4F7CFF 100%)',
    layoutPattern: ['center','bottom','center','bottom','center','bottom','center','bottom','center','bottom','center','bottom','center','bottom'] as const,
    transitions: ['fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade'],
  },
  vintage_retro: {
    name: 'Vintage Retro',
    colorPrimary: '#2C1810', colorAccent: '#D4A853',
    style: 'magazine' as const, bgm: 'natural_warm',
    thumbnailGradient: 'linear-gradient(135deg, #5C3D2E 0%, #D4A853 100%)',
    layoutPattern: ['top','bottom','top','bottom','top','bottom','top','bottom','top','bottom','top','bottom','top','bottom'] as const,
    transitions: ['fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade'],
  },
  pastel_soft: {
    name: 'Pastel Soft',
    colorPrimary: '#6B4C82', colorAccent: '#FF9EAA',
    style: 'minimal' as const, bgm: 'bright_pop',
    thumbnailGradient: 'linear-gradient(135deg, #A8C5E8 0%, #FF9EAA 100%)',
    layoutPattern: ['bottom','bottom','top','bottom','bottom','top','bottom','bottom','top','bottom','bottom','top','bottom','bottom'] as const,
    transitions: ['fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade','fade'],
  },
};

// Purpose → accent color override and BGM modifier
const PURPOSE_MODS: Record<string, { accentOverride?: string; bgmOverride?: string }> = {
  promotion:   { accentOverride: '#E95464' },
  sns_post:    { accentOverride: '#F5A623' },
  sns_ad:      { accentOverride: '#2A7FC1' },
  review:      { accentOverride: '#D4A853' },
  achievement: { accentOverride: '#C4973A', bgmOverride: 'cinematic' },
};

// Platform → family assignment (by index)
const PLATFORM_FAMILY_MAP: Record<string, string[]> = {
  instagram_reel:  ['urban_modern',   'bold_pop',      'fresh_clean',  'midnight_dark',  'pastel_soft'],
  instagram_story: ['pastel_soft',    'fresh_clean',   'bold_pop',     'urban_modern',   'sunset_warm'],
  instagram_feed:  ['fresh_clean',    'elegant_luxury','urban_modern', 'nature_organic', 'corporate_pro'],
  tiktok:          ['bold_pop',       'urban_modern',  'fresh_clean',  'sunset_warm',    'midnight_dark'],
  youtube_short:   ['midnight_dark',  'urban_modern',  'bold_pop',     'fresh_clean',    'corporate_pro'],
  youtube:         ['corporate_pro',  'elegant_luxury','midnight_dark','nature_organic', 'vintage_retro'],
  x_twitter:       ['urban_modern',   'corporate_pro', 'fresh_clean',  'bold_pop',       'sunset_warm'],
  line_voom:       ['nature_organic', 'pastel_soft',   'fresh_clean',  'urban_modern',   'bold_pop'],
  facebook:        ['corporate_pro',  'nature_organic','urban_modern', 'elegant_luxury', 'fresh_clean'],
  web_banner:      ['elegant_luxury', 'corporate_pro', 'sunset_warm',  'midnight_dark',  'vintage_retro'],
};

// Cut structures by duration
function buildCuts(duration: number, family: typeof FAMILIES[keyof typeof FAMILIES], purposeIdx: number): TemplateCut[] {
  const configs: Record<number, number[]> = {
    15: [5, 5, 5],
    30: [4, 4, 4, 4, 4, 5, 5],
    60: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6],
  };
  const durations = configs[duration] || configs[30];
  const mainTexts = [
    ['魅力をPR', 'こだわりの品質', '選ばれる理由'],
    ['毎日の習慣に', 'こんな使い方', 'お気に入り紹介'],
    ['期間限定', '今だけの特典', 'お見逃しなく'],
    ['お客様の声', '使ってみた感想', '本当に良かった'],
    ['○○%達成', '累計○○件突破', 'ありがとうございます'],
  ];
  const subTexts = [
    ['特別な体験をあなたに', 'プロが認めた品質', 'お客様に選ばれています'],
    ['日常をもっと豊かに', 'シーン別おすすめ', '毎日使いたくなる'],
    ['今すぐチェック', 'キャンペーン実施中', '数量限定'],
    ['リアルな体験談', '使って変わったこと', '満足度99%'],
    ['皆様のおかげです', 'さらなる目標へ', '次のステップへ'],
  ];
  const pi = purposeIdx % 5;
  return durations.map((dur, i) => ({
    durationRatio: dur / duration,
    layout: family.layoutPattern[i % family.layoutPattern.length] as 'bottom' | 'top' | 'center',
    transition: family.transitions[i % family.transitions.length],
    animation: i % 3 === 2 ? 'zoom' : 'slide',
    mainTextPlaceholder: mainTexts[pi][i % mainTexts[pi].length],
    subTextPlaceholder:  subTexts[pi][i % subTexts[pi].length],
  }));
}

function generateTemplates(): VideoTemplate[] {
  const templates: VideoTemplate[] = [];
  let idCounter = 1;

  for (const platform of PLATFORMS) {
    const familyList = PLATFORM_FAMILY_MAP[platform.key] || ['urban_modern','bold_pop','fresh_clean','corporate_pro','elegant_luxury'];
    for (const duration of DURATIONS) {
      for (let pi = 0; pi < PURPOSES.length; pi++) {
        const purpose = PURPOSES[pi];
        const familyKey = familyList[pi] as keyof typeof FAMILIES;
        const family = FAMILIES[familyKey];
        const mod = PURPOSE_MODS[purpose.key] || {};

        templates.push({
          id: `tmpl_${String(idCounter).padStart(3, '0')}`,
          name: `${family.name} · ${purpose.label}`,
          platform: platform.key,
          duration,
          purpose: purpose.key,
          colorPrimary: family.colorPrimary,
          colorAccent: mod.accentOverride || family.colorAccent,
          style: family.style,
          bgm: mod.bgmOverride || family.bgm,
          cuts: buildCuts(duration, family, pi),
          thumbnailGradient: family.thumbnailGradient,
          family: family.name,
        });
        idCounter++;
      }
    }
  }
  return templates;
}

export const TEMPLATES: VideoTemplate[] = generateTemplates();

export const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.label])
);

export const PURPOSE_LABELS: Record<string, string> = Object.fromEntries(
  PURPOSES.map((p) => [p.key, p.label])
);

export const DURATION_LABELS: Record<number, string> = {
  15: '15秒',
  30: '30秒',
  60: '60秒',
};
