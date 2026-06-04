# Oyun Medya Tepkileri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyun yayınlanınca yayın anını medya tepkileriyle (Metaskor + basın incelemeleri + YouTuber + sosyal yorum + manşet) ve bazen interaktif bir basın röportajıyla zenginleştirmek.

**Architecture:** Yaklaşım A (sunum/tat) — mevcut `PublishResult.score`'tan deterministik (seed'li) küratörlü tepkiler üretilir, projeye iliştirilir, `PublishResult` ekranında gösterilir. Tek mekanik yeni dokunuş: olasılıklı interaktif röportaj (itibar/satış-bonusu/Iris ilişkisi). Yeni ekonomi yok.

**Tech Stack:** TypeScript, Zustand store'lar, React + Tailwind, Vitest. Seed'li RNG için mevcut `seededRandom` (Math.sin) pattern'i.

**Spec:** `docs/superpowers/specs/2026-06-04-oyun-medya-tepkileri-design.md`

---

## Dosya Yapısı

- **Create** `src/data/mediaOutlets.ts` — skor bandı, verdict, sabit dergi/YouTuber kadrosu, seed yardımcıları.
- **Create** `src/data/mediaQuotes.ts` — banda göre küratörlü alıntı havuzları + şablon doldurucu.
- **Create** `src/engine/mediaReactionEngine.ts` — `generateMediaReactions(...)` saf fonksiyon.
- **Create** `src/engine/mediaReactionEngine.test.ts` — motor testleri.
- **Modify** `src/types/index.ts` — `OutletReview`, `YoutuberReaction`, `MediaReactions` + `PublishResult.media?`.
- **Modify** `src/store/projectStore.ts` — `publishProject` içinde media üret + manşet ekle.
- **Modify** `src/components/PublishResult.tsx` — medya bölümlerini render et.
- **Modify** `src/store/npcStore.ts` — `adjustRelationship(npcId, delta)`.
- **Create** `src/data/interviews.ts` — banda göre röportaj soru/cevapları.
- **Create** `src/store/interviewStore.ts` — röportaj state'i (roll + cooldown + cevap uygulama).
- **Create** `src/store/interviewStore.test.ts` — röportaj testleri.
- **Create** `src/components/InterviewModal.tsx` — röportaj arayüzü.
- **Modify** `src/App.tsx` — InterviewModal'ı bağla; yayından sonra roll tetikle.

---

## Task 1: Tipler (MediaReactions)

**Files:**
- Modify: `src/types/index.ts:15-20` (PublishResult bloğunun hemen ardı)

- [ ] **Step 1: Tipleri ekle**

`src/types/index.ts` içinde `PublishResult` arayüzünün hemen altına ekle ve `PublishResult`'a `media` alanı ekle:

```ts
export interface OutletReview {
  outlet: string
  score: number   // 0–10
  quote: string
}

export interface YoutuberReaction {
  channel: string
  viewsLabel: string
  quote: string
}

export interface MediaReactions {
  metascore: number          // = PublishResult.score
  verdict: string            // bant etiketi
  reviews: OutletReview[]
  youtubers: YoutuberReaction[]
  social: string[]
}
```

`PublishResult` arayüzünü güncelle (mevcut alanların sonuna ekle):

```ts
export interface PublishResult {
  score: number       // 1–100
  sales: number       // birim
  revenue: number     // para cinsinden
  publishDate: GameDate
  media?: MediaReactions   // yayın sonrası üretilen medya tepkileri
}
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: hatasız derlenir (`✓ built`).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: MediaReactions tipleri + PublishResult.media alanı"
```

---

## Task 2: mediaOutlets.ts (bant + kadro + seed)

**Files:**
- Create: `src/data/mediaOutlets.ts`
- Test: `src/data/mediaOutlets.test.ts`

- [ ] **Step 1: Failing test yaz**

`src/data/mediaOutlets.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scoreToBand, VERDICT, hashSeed, seededRandom } from './mediaOutlets'

describe('mediaOutlets', () => {
  it('scoreToBand doğru bant döndürür', () => {
    expect(scoreToBand(90)).toBe('acclaim')
    expect(scoreToBand(85)).toBe('acclaim')
    expect(scoreToBand(70)).toBe('approval')
    expect(scoreToBand(55)).toBe('mixed')
    expect(scoreToBand(30)).toBe('pan')
  })

  it('her bandın bir verdict etiketi var', () => {
    expect(VERDICT.acclaim).toBeTruthy()
    expect(VERDICT.pan).toBeTruthy()
  })

  it('hashSeed deterministik ve negatif değil', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0)
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'))
  })

  it('seededRandom 0–1 arası ve deterministik', () => {
    const r = seededRandom(42)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
    expect(seededRandom(42)).toBe(r)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/data/mediaOutlets.test.ts`
Expected: FAIL ("Cannot find module './mediaOutlets'").

- [ ] **Step 3: mediaOutlets.ts yaz**

`src/data/mediaOutlets.ts`:

```ts
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
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npx vitest run src/data/mediaOutlets.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/data/mediaOutlets.ts src/data/mediaOutlets.test.ts
git commit -m "feat: mediaOutlets — skor bandı, verdict, kadro, seed yardımcıları"
```

---

## Task 3: mediaQuotes.ts (küratörlü havuzlar)

**Files:**
- Create: `src/data/mediaQuotes.ts`
- Test: `src/data/mediaQuotes.test.ts`

- [ ] **Step 1: Failing test yaz**

`src/data/mediaQuotes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { OUTLET_QUOTES, YOUTUBER_QUOTES, SOCIAL_QUOTES, SOCIAL_VIRAL, SOCIAL_BOMB, fillTemplate } from './mediaQuotes'
import type { ScoreBand } from './mediaOutlets'

const BANDS: ScoreBand[] = ['acclaim', 'approval', 'mixed', 'pan']

describe('mediaQuotes', () => {
  it('her bant için boş olmayan havuzlar var', () => {
    for (const b of BANDS) {
      expect(OUTLET_QUOTES[b].length).toBeGreaterThan(0)
      expect(YOUTUBER_QUOTES[b].length).toBeGreaterThan(0)
      expect(SOCIAL_QUOTES[b].length).toBeGreaterThan(0)
    }
    expect(SOCIAL_VIRAL.length).toBeGreaterThan(0)
    expect(SOCIAL_BOMB.length).toBeGreaterThan(0)
  })

  it('fillTemplate {oyun} ve {tür} değişkenlerini doldurur', () => {
    expect(fillTemplate('"{oyun}" harika bir {tür}', { oyun: 'Nehir', tur: 'RPG' }))
      .toBe('"Nehir" harika bir RPG')
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/data/mediaQuotes.test.ts`
Expected: FAIL ("Cannot find module './mediaQuotes'").

- [ ] **Step 3: mediaQuotes.ts yaz**

`src/data/mediaQuotes.ts`:

```ts
// src/data/mediaQuotes.ts
import type { ScoreBand } from './mediaOutlets'

// Şablon değişkenleri: {oyun} = oyun adı, {tür} = tür
export const OUTLET_QUOTES: Record<ScoreBand, string[]> = {
  acclaim: [
    '"{oyun}" yılın en cesur işlerinden biri.',
    'Kalbi olan bir {tür}. Kaçırmayın.',
    'Nehrin sakin yakasından gelen bir başyapıt.',
    '"{oyun}" türün çıtasını yükseltiyor.',
  ],
  approval: [
    '"{oyun}" sağlam, sıcak, oynaması keyifli.',
    'Kusursuz değil ama gönülden yapılmış bir {tür}.',
    'Küçük stüdyodan beklenmedik bir olgunluk.',
  ],
  mixed: [
    '"{oyun}" parlak bir fikir, kaba kenarlar.',
    'İddialı ama bazen dağınık bir {tür}.',
    'İyi anları var; tutarlılık eksik.',
  ],
  pan: [
    '"{oyun}" fikrini gerçekleştiremiyor.',
    'Hırslı ama pişmemiş bir {tür}.',
    'Daha fırına girmesi gereken bir oyun.',
  ],
}

export const YOUTUBER_QUOTES: Record<ScoreBand, string[]> = {
  acclaim: [
    'Bu {tür} beni şaşırttı, finali konuşulur!',
    '"{oyun}" oynarken saati unuttum dostum.',
    'Yılın indie sürprizi olabilir, izleyin.',
  ],
  approval: [
    '"{oyun}" fena değil, birkaç saat keyif aldım.',
    'Solid bir {tür}, tavsiye ederim ama abartmayın.',
    'Beklemiyordum ama oturup bitirdim.',
  ],
  mixed: [
    '30 dk oynadım, fena değil ama bug var.',
    '"{oyun}" kararsız bıraktı beni açıkçası.',
    'Fikir güzel, uygulama yarım kalmış gibi.',
  ],
  pan: [
    'Dürüst olayım, "{oyun}" beni sıktı.',
    'Yarısında bıraktım, kusura bakmayın.',
    'Bu {tür} için erken çıkmış gibi duruyor.',
  ],
}

export const SOCIAL_QUOTES: Record<ScoreBand, string[]> = {
  acclaim: [
    'gece 3\'e kadar oynadım uyuyamıyorum',
    'finali içime oturdu yaa',
    '"{oyun}" başyapıt demiştim demedim demeyin',
  ],
  approval: [
    'beklediğimden iyiymiş valla',
    '{tür} sevenler bir baksın derim',
    'fiyatına değer bence',
  ],
  mixed: [
    'idare eder işte, indirimde alın',
    'bug yedim ama eğlenceli kısımları var',
    'kararsızım, ne iyi ne kötü',
  ],
  pan: [
    'iade ettim 👎',
    'bu kadar hype neden anlamadım',
    'bekleyin yamaları belki düzelir',
  ],
}

export const SOCIAL_VIRAL: string[] = [
  'herkes "{oyun}" oynuyor, ben de aldım!',
  'akış "{oyun}" klipleriyle doldu 😂',
  'bu oyun nasıl bu kadar patladı ya',
]

export const SOCIAL_BOMB: string[] = [
  'eksi bombardımanı başlattım, hak etti',
  '"{oyun}" yüzünden ekibe kızgınım',
  'bu fiyata bu mu, olmadı',
]

export function fillTemplate(s: string, vars: { oyun: string; tur: string }): string {
  return s.replace(/\{oyun\}/g, vars.oyun).replace(/\{tür\}/g, vars.tur)
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npx vitest run src/data/mediaQuotes.test.ts`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/data/mediaQuotes.ts src/data/mediaQuotes.test.ts
git commit -m "feat: mediaQuotes — banda göre küratörlü alıntı havuzları + şablon"
```

---

## Task 4: mediaReactionEngine.ts (üretim)

**Files:**
- Create: `src/engine/mediaReactionEngine.ts`
- Test: `src/engine/mediaReactionEngine.test.ts`

- [ ] **Step 1: Failing test yaz**

`src/engine/mediaReactionEngine.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateMediaReactions } from './mediaReactionEngine'
import type { GameProject, PublishResult } from '@/types'

function makeProject(overrides: Partial<GameProject> = {}): GameProject {
  return {
    id: 'proj-1', name: 'Nehir Kıyısı', genreId: 'RPG', topicId: 't', platformId: 'pc',
    scope: 'orta', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    totalWeeks: 10, weeksElapsed: 10, qualityPoints: 0, status: 'yayinlandi',
    price: 20, discountPct: null, isOnSale: false, publishTickCount: 5,
    featuredUntilTick: null, exclusivePlatformId: null,
    contentType: 'standalone', ...overrides,
  } as GameProject
}
const result = (score: number): PublishResult => ({ score, sales: 1000, revenue: 50000, publishDate: { year: 2001, season: 'yaz', week: 2 } })

describe('generateMediaReactions', () => {
  it('metascore = result.score', () => {
    expect(generateMediaReactions(result(82), makeProject()).metascore).toBe(82)
  })

  it('verdict skora göre seçilir', () => {
    expect(generateMediaReactions(result(90), makeProject()).verdict).toBe('Övgü yağmuru')
    expect(generateMediaReactions(result(30), makeProject()).verdict).toBe('Soğuk karşılama')
  })

  it('deterministik — aynı girdi aynı çıktı', () => {
    const a = generateMediaReactions(result(75), makeProject())
    const b = generateMediaReactions(result(75), makeProject())
    expect(a).toEqual(b)
  })

  it('outlet puanları 0–10 arası', () => {
    const r = generateMediaReactions(result(95), makeProject())
    for (const rev of r.reviews) {
      expect(rev.score).toBeGreaterThanOrEqual(0)
      expect(rev.score).toBeLessThanOrEqual(10)
    }
    expect(r.reviews.length).toBeGreaterThanOrEqual(3)
    expect(r.youtubers.length).toBeGreaterThanOrEqual(2)
    expect(r.social.length).toBeGreaterThanOrEqual(2)
  })

  it('şablon {oyun} ile oyun adını doldurur', () => {
    const r = generateMediaReactions(result(90), makeProject({ name: 'TestOyun' }))
    const allText = [...r.reviews.map(x => x.quote), ...r.youtubers.map(x => x.quote), ...r.social].join(' ')
    expect(allText).not.toContain('{oyun}')
  })

  it('reviewBomb tonu bomb havuzunu kullanır', () => {
    const r = generateMediaReactions(result(40), makeProject(), { reviewBomb: true })
    expect(r.social.join(' ')).not.toContain('{oyun}')
    expect(r.social.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/engine/mediaReactionEngine.test.ts`
Expected: FAIL ("Cannot find module './mediaReactionEngine'").

- [ ] **Step 3: mediaReactionEngine.ts yaz**

`src/engine/mediaReactionEngine.ts`:

```ts
// src/engine/mediaReactionEngine.ts
import type { GameProject, PublishResult, MediaReactions, OutletReview, YoutuberReaction } from '@/types'
import { scoreToBand, VERDICT, OUTLETS, YOUTUBERS, hashSeed, seededRandom } from '@/data/mediaOutlets'
import { OUTLET_QUOTES, YOUTUBER_QUOTES, SOCIAL_QUOTES, SOCIAL_VIRAL, SOCIAL_BOMB, fillTemplate } from '@/data/mediaQuotes'

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length]
}

export function generateMediaReactions(
  result: PublishResult,
  project: GameProject,
  ctx: { viral?: boolean; reviewBomb?: boolean } = {}
): MediaReactions {
  const band = scoreToBand(result.score)
  const d = result.publishDate
  const baseSeed = hashSeed(`${project.id}-${d.year}-${d.season}-${d.week}`)
  const vars = { oyun: project.name, tur: project.genreId }

  const reviews: OutletReview[] = OUTLETS.slice(0, 4).map((outlet, i) => {
    const delta = Math.round(seededRandom(baseSeed + i * 7 + 1) * 2) - 1   // -1..+1
    const outletScore = Math.max(0, Math.min(10, Math.round(result.score / 10) + delta))
    const quote = fillTemplate(pick(OUTLET_QUOTES[band], seededRandom(baseSeed + i * 7 + 2)), vars)
    return { outlet, score: outletScore, quote }
  })

  const youtubers: YoutuberReaction[] = YOUTUBERS.slice(0, 2).map((yt, i) => ({
    channel: yt.channel,
    viewsLabel: yt.viewsLabel,
    quote: fillTemplate(pick(YOUTUBER_QUOTES[band], seededRandom(baseSeed + i * 11 + 5)), vars),
  }))

  const socialPool = ctx.reviewBomb ? SOCIAL_BOMB : ctx.viral ? SOCIAL_VIRAL : SOCIAL_QUOTES[band]
  const social = [0, 1, 2].map((i) =>
    fillTemplate(pick(socialPool, seededRandom(baseSeed + i * 13 + 9)), vars)
  )

  return { metascore: result.score, verdict: VERDICT[band], reviews, youtubers, social }
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npx vitest run src/engine/mediaReactionEngine.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add src/engine/mediaReactionEngine.ts src/engine/mediaReactionEngine.test.ts
git commit -m "feat: mediaReactionEngine — deterministik medya tepkisi üretimi"
```

---

## Task 5: projectStore.publishProject — media üret + manşet

**Files:**
- Modify: `src/store/projectStore.ts:52-79` (publishProject)
- Test: `src/store/projectStore.media.test.ts`

- [ ] **Step 1: Failing test yaz**

`src/store/projectStore.media.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { useNewsStore } from './newsStore'
import type { GameProject, PublishResult } from '@/types'

function makeProject(): GameProject {
  return {
    id: 'p1', name: 'Test Oyun', genreId: 'RPG', topicId: 't', platformId: 'pc',
    scope: 'orta', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    totalWeeks: 10, weeksElapsed: 10, qualityPoints: 0, status: 'gelistirme',
    price: 20, discountPct: null, isOnSale: false, publishTickCount: null,
    featuredUntilTick: null, exclusivePlatformId: null, contentType: 'standalone',
  } as GameProject
}

beforeEach(() => {
  useProjectStore.setState({ projects: [makeProject()] })
  useNewsStore.setState({ items: [], unreadCount: 0 })
})

describe('publishProject — medya tepkileri', () => {
  const result: PublishResult = { score: 80, sales: 1000, revenue: 50000, publishDate: { year: 2001, season: 'yaz', week: 1 } }

  it('publishResult.media doldurulur', () => {
    useProjectStore.getState().publishProject('p1', result)
    const p = useProjectStore.getState().projects.find(p => p.id === 'p1')!
    expect(p.publishResult?.media).toBeDefined()
    expect(p.publishResult?.media?.metascore).toBe(80)
    expect(p.publishResult?.media?.reviews.length).toBeGreaterThan(0)
  })

  it('haber akışına bir manşet düşer', () => {
    useProjectStore.getState().publishProject('p1', result)
    const news = useNewsStore.getState().items
    expect(news.length).toBe(1)
    expect(news[0].type).toBe('player_mention')
    expect(news[0].text).toContain('Test Oyun')
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/store/projectStore.media.test.ts`
Expected: FAIL (`media` undefined / news boş).

- [ ] **Step 3: publishProject'i güncelle**

`src/store/projectStore.ts` başına import ekle (diğer importların yanına):

```ts
import { generateMediaReactions } from '@/engine/mediaReactionEngine'
import { useNewsStore } from '@/store/newsStore'
import { VERDICT, scoreToBand } from '@/data/mediaOutlets'
```

`publishProject` gövdesini şu şekilde değiştir (mevcut `set(...)` bloğundaki `publishResult: result` satırını media'lı sürümle değiştir; fonksiyonun sonuna manşet ekle):

```ts
  publishProject: (id, result) => {
    const tickCount = useTimeStore.getState().tickCount
    const date = useTimeStore.getState().date
    const target = get().projects.find((p) => p.id === id)
    const media = target ? generateMediaReactions(result, target, {}) : undefined
    const resultWithMedia = { ...result, media }
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'yayinlandi',
              publishResult: resultWithMedia,
              publishTickCount: tickCount,
              publishYear: date.year,
              publishScore: result.score,
            }
          : p
      ),
    }))
    const project = get().projects.find((p) => p.id === id)
    // Manşet (E)
    if (project) {
      const seasonIdx = SEASONS.indexOf(date.season)
      useNewsStore.getState().addItem({
        type: 'player_mention',
        rivalId: null,
        text: `"${project.name}" yayında — ${VERDICT[scoreToBand(result.score)]} (Metaskor ${result.score})`,
        year: date.year,
        season: seasonIdx,
      })
    }
    if (project?.platformId) {
      useMarketStore.getState().applyReactiveDelta(project.platformId, -3)
    }
    if (project?.contentType === 'dlc') {
      get().applyFollowUpEffect(project.parentProjectId, 'dlc', project.scope)
    } else if (project?.contentType === 'guncelleme') {
      get().applyFollowUpEffect(project.parentProjectId, 'guncelleme', project.scope)
      useGameStore.getState().gainReputation(3)
    }
  },
```

`SEASONS` importu yoksa ekle: dosya başındaki `@/types` importuna `SEASONS` ekle (ör. `import { ..., SEASONS } from '@/types'`).

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npx vitest run src/store/projectStore.media.test.ts`
Expected: PASS (2 test).

- [ ] **Step 5: Tüm testleri çalıştır (regresyon)**

Run: `npx vitest run`
Expected: tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/projectStore.ts src/store/projectStore.media.test.ts
git commit -m "feat: publishProject medya tepkileri üretir + manşet ekler"
```

---

## Task 6: PublishResult.tsx — medya bölümlerini göster

**Files:**
- Modify: `src/components/PublishResult.tsx` (tüm dosya)

- [ ] **Step 1: PublishResult.tsx'i yeniden yaz**

`src/components/PublishResult.tsx`:

```tsx
import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'

interface Props {
  projectId: string
  onContinue: () => void
}

function scoreColor(s: number) {
  return s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'
}
function outletColor(s: number) {
  return s >= 8 ? 'text-green-400' : s >= 5 ? 'text-yellow-400' : 'text-red-400'
}

export default function PublishResult({ projectId, onContinue }: Props) {
  const project  = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const totalPub = useGameStore((s) => s.totalPublished)
  const [showReviews, setShowReviews] = useState(true)

  if (!project?.publishResult) return null
  const { score, sales, revenue, media } = project.publishResult

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        {/* Üst: skor + verdict + özet */}
        <div className="flex items-center gap-4 border-b border-gray-700 pb-4 mb-4">
          <div className={`text-5xl font-black ${scoreColor(score)}`}>{score}</div>
          <div className="flex-1">
            <p className="text-xs tracking-widest text-gray-500">METASKOR</p>
            <p className={`text-lg font-bold ${scoreColor(score)}`}>{media?.verdict ?? 'Eleştirmen Puanı'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>
          </div>
          <div className="text-right text-sm text-gray-300">
            <p>💰 ${revenue.toLocaleString()}</p>
            <p>📦 {sales.toLocaleString()}</p>
          </div>
        </div>

        {media && (
          <>
            {/* Basın incelemeleri (A+B) */}
            <button onClick={() => setShowReviews((v) => !v)} className="text-xs tracking-widest text-gray-500 mb-2">
              BASIN İNCELEMELERİ {showReviews ? '▾' : '▸'}
            </button>
            {showReviews && (
              <div className="space-y-1.5 mb-4 text-sm">
                {media.reviews.map((r) => (
                  <div key={r.outlet} className="flex gap-2">
                    <b className={`w-9 ${outletColor(r.score)}`}>{r.score}/10</b>
                    <b className="w-24 shrink-0">{r.outlet}</b>
                    <span className="text-gray-400">{r.quote}</span>
                  </div>
                ))}
              </div>
            )}

            {/* YouTuber (C) */}
            <p className="text-xs tracking-widest text-gray-500 mb-2">YOUTUBER TEPKİLERİ</p>
            <div className="flex gap-2 mb-4">
              {media.youtubers.map((y) => (
                <div key={y.channel} className="flex-1 bg-white/5 rounded-lg p-2 text-xs">
                  <div className="text-base mb-1">▶️</div>
                  <b>{y.channel}</b> <span className="text-gray-500">· {y.viewsLabel}</span>
                  <p className="text-gray-400 mt-0.5">{y.quote}</p>
                </div>
              ))}
            </div>

            {/* Sosyal (D, hafif) */}
            <p className="text-xs tracking-widest text-gray-500 mb-1">SOSYAL MEDYA</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {media.social.map((s, i) => <span key={i}>💬 {s}{i < media.social.length - 1 ? '  ·  ' : ''}</span>)}
            </p>
          </>
        )}

        <p className="text-gray-500 text-xs mb-4">Toplam yayın: {totalPub}</p>
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
        >
          Devam Et
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: hatasız derlenir.

- [ ] **Step 3: Commit**

```bash
git add src/components/PublishResult.tsx
git commit -m "feat: PublishResult ekranı medya tepkilerini gösterir"
```

---

## Task 7: npcStore.adjustRelationship

**Files:**
- Modify: `src/store/npcStore.ts` (interface + implementasyon)
- Test: `src/store/__tests__/npcStore.adjust.test.ts`

- [ ] **Step 1: Failing test yaz**

`src/store/__tests__/npcStore.adjust.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useNPCStore } from '../npcStore'

beforeEach(() => {
  useNPCStore.setState({
    npcs: { iris: { relationship: 10, seenDialogueIds: [] } },
    gainMultipliers: { iris: 1.0 },
  })
})

describe('npcStore.adjustRelationship', () => {
  it('ilişkiyi delta kadar değiştirir', () => {
    useNPCStore.getState().adjustRelationship('iris', 5)
    expect(useNPCStore.getState().getRelationship('iris')).toBe(15)
  })
  it('0–100 arasında clamp eder', () => {
    useNPCStore.getState().adjustRelationship('iris', -50)
    expect(useNPCStore.getState().getRelationship('iris')).toBe(0)
    useNPCStore.getState().adjustRelationship('iris', 999)
    expect(useNPCStore.getState().getRelationship('iris')).toBe(100)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/store/__tests__/npcStore.adjust.test.ts`
Expected: FAIL ("adjustRelationship is not a function").

- [ ] **Step 3: npcStore'a metot ekle**

`src/store/npcStore.ts` `NPCStore` arayüzüne ekle (diğer metot imzalarının yanına):

```ts
  adjustRelationship: (npcId: string, delta: number) => void
```

Store implementasyonuna ekle (`penalizeNpc`'nin yanına):

```ts
  adjustRelationship(npcId, delta) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      return {
        npcs: {
          ...s.npcs,
          [npcId]: { ...prev, relationship: Math.max(0, Math.min(100, prev.relationship + delta)) },
        },
      }
    })
  },
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npx vitest run src/store/__tests__/npcStore.adjust.test.ts`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/store/npcStore.ts src/store/__tests__/npcStore.adjust.test.ts
git commit -m "feat: npcStore.adjustRelationship (clamp 0-100)"
```

---

## Task 8: interviews.ts + interviewStore.ts

**Files:**
- Create: `src/data/interviews.ts`
- Create: `src/store/interviewStore.ts`
- Test: `src/store/interviewStore.test.ts`

- [ ] **Step 1: interviews.ts yaz (test öncesi veri — testte kullanılacak)**

`src/data/interviews.ts`:

```ts
// src/data/interviews.ts
import type { ScoreBand } from '@/data/mediaOutlets'

export type Reporter = 'iris' | 'press'
export const INTERVIEW_CHANCE = 0.35

export interface InterviewAnswer {
  text: string
  reputationDelta: number
  salesBonusPct?: number          // projenin gelirinin oranı kadar lansman buzz parası
  irisRelationshipDelta?: number  // reporter === 'iris' ise uygulanır
  resultLine: string
}
export interface InterviewQuestion {
  reporter: Reporter
  prompt: string
  answers: InterviewAnswer[]
}

export const INTERVIEWS: Record<ScoreBand, InterviewQuestion[]> = {
  acclaim: [
    {
      reporter: 'iris',
      prompt: '"Herkes oyununu konuşuyor. Bunu bekliyor muydun, yoksa sen de mi şaşırdın?"',
      answers: [
        { text: 'Ekibime güvendim, hak ettiler.', reputationDelta: 6, irisRelationshipDelta: 3, resultLine: 'Stüdyo "ekip işi" dedi — basın sıcak baktı.' },
        { text: 'Tabii ki. Ben yaparım, beklenir.', reputationDelta: -2, salesBonusPct: 0.06, irisRelationshipDelta: -2, resultLine: 'Kibirli çıkış manşetlere düştü — konuşuldu ama sevilmedi.' },
        { text: 'Asıl hikâye nehrin karşısında...', reputationDelta: 2, irisRelationshipDelta: 5, resultLine: 'Crane\'e üstü kapalı gönderme dikkat çekti.' },
      ],
    },
  ],
  approval: [
    {
      reporter: 'iris',
      prompt: '"İyi işti ama zirve değil. Eksik kalan neydi sence?"',
      answers: [
        { text: 'Dürüst olayım, vakit yetmedi.', reputationDelta: 4, irisRelationshipDelta: 3, resultLine: 'Samimi itiraf okuyucularda karşılık buldu.' },
        { text: 'Eksik yok, beklentiler fazla.', reputationDelta: -2, irisRelationshipDelta: -1, resultLine: 'Savunmacı ton pek tutmadı.' },
      ],
    },
  ],
  mixed: [
    {
      reporter: 'press',
      prompt: '"Eleştiriler karışık. Yamalar gelecek mi?"',
      answers: [
        { text: 'Evet, dinliyoruz, düzelteceğiz.', reputationDelta: 5, salesBonusPct: 0.03, resultLine: 'Stüdyo yama sözü verdi — topluluk umutlandı.' },
        { text: 'Oyun olması gerektiği gibi.', reputationDelta: -3, resultLine: 'Sert savunma tepki çekti.' },
      ],
    },
  ],
  pan: [
    {
      reporter: 'press',
      prompt: '"Çıkış iyi gitmedi. Şimdi ne olacak?"',
      answers: [
        { text: 'Hatayı kabul ediyorum, ders aldım.', reputationDelta: 4, resultLine: 'Olgun cevap, en azından saygı kazandırdı.' },
        { text: 'Bu oyun yanlış anlaşıldı.', reputationDelta: -4, resultLine: 'İnkâr, durumu daha kötü gösterdi.' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Failing test yaz**

`src/store/interviewStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useInterviewStore } from './interviewStore'
import { useGameStore } from './gameStore'
import { useNPCStore } from './npcStore'

beforeEach(() => {
  useInterviewStore.setState({ pending: null, pendingRevenue: 0, lastInterviewPublishCount: null })
  useGameStore.setState({ money: 50000, reputation: 20, totalPublished: 0 })
  useNPCStore.setState({ npcs: { iris: { relationship: 10, seenDialogueIds: [] } }, gainMultipliers: { iris: 1.0 } })
})

describe('interviewStore', () => {
  it('düşük rastgele değerde röportaj tetikler (acclaim)', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.0)
    expect(useInterviewStore.getState().pending).not.toBeNull()
    expect(useInterviewStore.getState().pending?.reporter).toBe('iris')
  })

  it('yüksek rastgele değerde tetiklemez', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.99)
    expect(useInterviewStore.getState().pending).toBeNull()
  })

  it('üst üste iki yayında ikincisini engeller (cooldown)', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.0)
    useInterviewStore.getState().dismiss()
    useInterviewStore.getState().rollInterview('acclaim', 2, 50000, 0.0)
    expect(useInterviewStore.getState().pending).toBeNull()
  })

  it('cevap itibar + Iris ilişkisi + para uygular', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.0)
    // acclaim[0].answers[1]: rep -2, salesBonusPct 0.06, irisRel -2
    useInterviewStore.getState().answer(1)
    expect(useGameStore.getState().reputation).toBe(18)        // 20 - 2
    expect(useGameStore.getState().money).toBe(53000)          // 50000 + 50000*0.06
    expect(useNPCStore.getState().getRelationship('iris')).toBe(8)  // 10 - 2
    expect(useInterviewStore.getState().pending).toBeNull()    // cevap sonrası kapanır
  })
})
```

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run src/store/interviewStore.test.ts`
Expected: FAIL ("Cannot find module './interviewStore'").

- [ ] **Step 4: interviewStore.ts yaz**

`src/store/interviewStore.ts`:

```ts
// src/store/interviewStore.ts
import { create } from 'zustand'
import type { ScoreBand } from '@/data/mediaOutlets'
import { INTERVIEWS, INTERVIEW_CHANCE, type InterviewQuestion } from '@/data/interviews'
import { useGameStore } from '@/store/gameStore'
import { useNPCStore } from '@/store/npcStore'
import { useNewsStore } from '@/store/newsStore'
import { useTimeStore } from '@/store/timeStore'
import { SEASONS } from '@/types'

interface InterviewStore {
  pending: InterviewQuestion | null
  pendingRevenue: number
  lastInterviewPublishCount: number | null
  rollInterview: (band: ScoreBand, publishCount: number, projectRevenue: number, rnd: number) => void
  answer: (index: number) => void
  dismiss: () => void
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  pending: null,
  pendingRevenue: 0,
  lastInterviewPublishCount: null,

  rollInterview(band, publishCount, projectRevenue, rnd) {
    const last = get().lastInterviewPublishCount
    // cooldown: bir önceki yayında röportaj olduysa bu yayında atla
    if (last !== null && publishCount - last < 2) return
    if (rnd >= INTERVIEW_CHANCE) return
    const pool = INTERVIEWS[band]
    if (!pool || pool.length === 0) return
    const q = pool[Math.floor(rnd / INTERVIEW_CHANCE * pool.length) % pool.length]
    set({ pending: q, pendingRevenue: projectRevenue, lastInterviewPublishCount: publishCount })
  },

  answer(index) {
    const q = get().pending
    if (!q) return
    const a = q.answers[index]
    if (!a) return
    useGameStore.getState().gainReputation(a.reputationDelta)
    if (a.salesBonusPct) {
      const bonus = Math.round(get().pendingRevenue * a.salesBonusPct)
      useGameStore.setState((s) => ({ money: s.money + bonus }))
    }
    if (q.reporter === 'iris' && a.irisRelationshipDelta) {
      useNPCStore.getState().adjustRelationship('iris', a.irisRelationshipDelta)
    }
    const date = useTimeStore.getState().date
    useNewsStore.getState().addItem({
      type: 'player_mention', rivalId: null, text: a.resultLine,
      year: date.year, season: SEASONS.indexOf(date.season),
    })
    set({ pending: null, pendingRevenue: 0 })
  },

  dismiss() {
    set({ pending: null, pendingRevenue: 0 })
  },
}))
```

> Not: Para için `useGameStore.setState((s) => ({ money: s.money + bonus }))` kullanılıyor (zustand setState her store'da mevcut). `gameStore`'da `addMoney`/`spend` gibi bir aksiyon varsa onu tercih edebilirsin; testte `money` doğrudan kontrol ediliyor.

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

Run: `npx vitest run src/store/interviewStore.test.ts`
Expected: PASS (4 test).

- [ ] **Step 6: Commit**

```bash
git add src/data/interviews.ts src/store/interviewStore.ts src/store/interviewStore.test.ts
git commit -m "feat: interviews verisi + interviewStore (roll/cooldown/cevap efektleri)"
```

---

## Task 9: InterviewModal.tsx + App + yayın sonrası roll

**Files:**
- Create: `src/components/InterviewModal.tsx`
- Modify: `src/store/projectStore.ts` (publishProject sonunda roll tetikle)
- Modify: `src/App.tsx` (InterviewModal'ı render et)

- [ ] **Step 1: publishProject sonunda röportaj roll'u tetikle**

`src/store/projectStore.ts` — `publishProject` içinde manşet eklendikten sonra ekle (importları da ekle: `import { useInterviewStore } from '@/store/interviewStore'`, `import { scoreToBand } from '@/data/mediaOutlets'` zaten var):

```ts
    // Röportaj roll'u (bazen) — yayın başına deterministik rastgele
    if (project) {
      const publishCount = useGameStore.getState().totalPublished
      const rnd = Math.abs(Math.sin(tickCount * 12.9898) * 43758.5453) % 1
      useInterviewStore.getState().rollInterview(scoreToBand(result.score), publishCount, result.revenue, rnd)
    }
```

- [ ] **Step 2: Build doğrula (henüz modal yok, sadece store wiring)**

Run: `npm run build`
Expected: hatasız.

- [ ] **Step 3: InterviewModal.tsx yaz**

`src/components/InterviewModal.tsx`:

```tsx
import { useInterviewStore } from '@/store/interviewStore'

export default function InterviewModal() {
  const pending = useInterviewStore((s) => s.pending)
  const answer  = useInterviewStore((s) => s.answer)
  const dismiss = useInterviewStore((s) => s.dismiss)

  if (!pending) return null
  const isIris = pending.reporter === 'iris'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
               style={{ background: isIris ? '#7a3b5e' : '#3b4a7a' }}>📰</div>
          <div className="text-sm">
            <b>{isIris ? 'Iris' : 'Basın'}</b> <span className="text-gray-500">· Şehir Gazetesi</span>
            <p className="text-gray-200 mt-1">{pending.prompt}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {pending.answers.map((a, i) => (
            <button key={i} onClick={() => answer(i)}
              className="text-left text-sm bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg px-3 py-2.5">
              {a.text}
            </button>
          ))}
        </div>
        <button onClick={dismiss} className="text-gray-500 text-xs mt-4 hover:text-gray-300">
          Şimdi değil
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: App.tsx'e bağla**

`src/App.tsx` — diğer modal importlarının yanına `import InterviewModal from '@/components/InterviewModal'` ekle. Diğer global modallerin render edildiği yere (ör. `SaleEventModal`/`CrisisModal` yanına) ekle:

```tsx
<InterviewModal />
```

- [ ] **Step 5: Build + tüm testler**

Run: `npm run build && npx vitest run`
Expected: build temiz, tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/projectStore.ts src/components/InterviewModal.tsx src/App.tsx
git commit -m "feat: InterviewModal + yayın sonrası röportaj tetikleme"
```

---

## Tamamlama

- [ ] **Tüm testler ve build:** `npm run build && npx vitest run` — hepsi yeşil.
- [ ] **DURUM.md güncelle:** "Oyun Medya Tepkileri" tamamlandı satırı + spec/plan referansı.
- [ ] **git pull --rebase && git push** (paralel makine aktif).

## Notlar / Kapsam dışı (Yaklaşım C — gelecek)
Gerçek dergi/YouTuber karakterleri, oyundan oyuna süreklilik, kanal büyümesi/abone, video küçük resimleri. Bu plan sabit kadro + küratörlü havuzu bozmadan büyütülebilir bırakır.
