// src/data/mediaOutlets.ts
export type ScoreBand = 'acclaim' | 'approval' | 'mixed' | 'pan'

export function scoreToBand(score: number): ScoreBand {
  if (score >= 85) return 'acclaim'
  if (score >= 70) return 'approval'
  if (score >= 50) return 'mixed'
  return 'pan'
}

export const VERDICT: Record<ScoreBand, string> = {
  acclaim:  'Övgü yağmuru',
  approval: 'Genel onay',
  mixed:    'Karışık',
  pan:      'Soğuk karşılama',
}

// Sabit kadro — süreklilik hissi (Yaklaşım C'de karaktere dönüşür)
export const OUTLETS = ['PixelPress', 'OyunDergisi', 'PixelKritik', 'HardcoreGG', 'NeonReview'] as const

export const YOUTUBERS: { channel: string; viewsLabel: string }[] = [
  { channel: 'BurakOynuyor', viewsLabel: '1.2M' },
  { channel: 'PixelPaşa',    viewsLabel: '480K' },
  { channel: 'NeonGamer',    viewsLabel: '820K' },
  { channel: 'KurtAbi',      viewsLabel: '2.1M' },
  { channel: 'MiniBoss',     viewsLabel: '150K' },
]

export function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
