# Faz 4A — Karakter Yaratma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyun başlamadan önce oynanan 3 adımlı karakter yaratma wizard'ı — arkaplan seçimi (5 seçenek, meslek stat'ları + ev satışı), kişilik stat dağılımı ve kimlik girişi — oyun sistemlerine tam entegreli.

**Architecture:** `characterStore` (Zustand) karakter state'ini tutar. `backgrounds.ts` 5 arkaplanı tanımlar. Wizard (`CharacterCreationWizard` + 3 adım bileşeni) `App.tsx`'te `isCreated` kontrolüyle gösterilir. `finalize()` çağrısı başlangıç parasını, itibarı ve CEO özel mekaniklerini tetikler. `scoreEngine` ve `projectEngine` oyuncu stat bonusu alır.

**Tech Stack:** React 19, Zustand v5, TypeScript, Vitest, Tailwind CSS, Electron + electron-vite

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|-----------|
| `src/data/backgrounds.ts` | Yeni | 5 arkaplan tanımı, stat'lar, hikayeler |
| `src/store/characterStore.ts` | Yeni | Karakter state, setBackground, setPersonality, setIdentity, finalize, reset |
| `src/store/gameStore.ts` | Güncelle | `setMoney`, `setReputation`, `reset` metodları ekle |
| `src/store/projectStore.ts` | Güncelle | `reset` metodu ekle |
| `src/store/employeeStore.ts` | Güncelle | `reset` metodu ekle |
| `src/store/timeStore.ts` | Güncelle | `reset` metodu ekle |
| `src/store/dayTimeStore.ts` | Güncelle | `reset` metodu ekle |
| `src/engine/scoreEngine.ts` | Güncelle | `calculatePublishResult`'a `playerSkillBonus` parametresi ekle |
| `src/components/CharacterCreationWizard.tsx` | Yeni | Wizard shell, adım yönetimi |
| `src/components/character/BackgroundStep.tsx` | Yeni | Adım 1: arkaplan seçimi |
| `src/components/character/PersonalityStep.tsx` | Yeni | Adım 2: kişilik stat dağılımı |
| `src/components/character/IdentityStep.tsx` | Yeni | Adım 3: isim + stüdyo adı + oyuna başla |
| `src/App.tsx` | Güncelle | `isCreated` kontrolü, wizard gate |
| `src/components/Dashboard.tsx` | Güncelle | "Yeni Oyun" butonu ekle |
| `tests/store/characterStore.test.ts` | Yeni | characterStore unit testler |
| `tests/engine/scoreEngine.test.ts` | Güncelle | playerSkillBonus testleri ekle |

---

## Task 1: backgrounds.ts — 5 arkaplan verisi

**Files:**
- Create: `src/data/backgrounds.ts`

- [ ] **backgrounds.ts implement et**

```ts
// src/data/backgrounds.ts
export type BackgroundId =
  | 'kk_uzmani'
  | 'yaratici_direktor'
  | 'bas_muhendis'
  | 'yapimci'
  | 'eski_ceo'

export interface ProfessionStats {
  programlama:   number
  tasarim:       number
  ses:           number
  projeyonetimi: number
}

export interface PersonalityStats {
  karisma:       number
  odak:          number
  rekabetcilik:  number
  yaraticilik:   number
  isZekasi:      number
}

type BackgroundSpecial =
  | { type: 'rival_early' }
  | { type: 'rep_loss_multiplier'; multiplier: 2 }
  | { type: 'no_bugs' }

export interface BackgroundDef {
  id:          BackgroundId
  emoji:       string
  title:       string
  story:       string
  houseStory:  string
  houseSale:   number
  startRep:    number
  profession:  ProfessionStats
  advantage:   string
  special?:    BackgroundSpecial
}

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'kk_uzmani',
    emoji: '🔍',
    title: 'KK Uzmanı',
    story: 'Otomasyon bahanesiyle çıkarıldın. On yıllık emeğin bir e-postayla bitti.',
    houseStory: 'Küçük daireni $30,000\'a sattın. Az, ama başlangıç için yeterli.',
    houseSale: 30_000,
    startRep: 0,
    profession: { programlama: 4, tasarim: 4, ses: 5, projeyonetimi: 5 },
    advantage: 'Playtesting bonusu — yayınlanan oyunlarda bug olmaz.',
    special: { type: 'no_bugs' },
  },
  {
    id: 'yaratici_direktor',
    emoji: '🎨',
    title: 'Yaratıcı Direktör',
    story: 'En iyi fikrin çalındı, sen çıkarıldın. İmzasız kalan bir oyun senin eserindi.',
    houseStory: 'Sanat atölyeni $40,000\'a kaptırdın. Resimler gitti, hayaller kaldı.',
    houseSale: 40_000,
    startRep: 0,
    profession: { programlama: 2, tasarim: 9, ses: 4, projeyonetimi: 3 },
    advantage: 'Görsel kalite yüksek (Faz 5\'te aktif olur).',
  },
  {
    id: 'bas_muhendis',
    emoji: '💻',
    title: 'Baş Mühendis',
    story: 'Başarısız projenin faturası sana kesildi. Takım başarısızken sen günah keçisi oldun.',
    houseStory: 'Eve dönüp çantanı topladın. $50,000\'lık bir başlangıç, başka şansın yok.',
    houseSale: 50_000,
    startRep: 0,
    profession: { programlama: 8, tasarim: 3, ses: 2, projeyonetimi: 4 },
    advantage: 'Solo oyun yapabilir, programlama kalite bonusu yüksek.',
  },
  {
    id: 'yapimci',
    emoji: '📋',
    title: 'Yapımcı',
    story: 'Yeni CEO "kültürel uyum yok" dedi. Aslında çok şey biliyordun.',
    houseStory: 'Geniş apartman dairesini $75,000\'a sattın. Aileni ikna etmek daha zordu.',
    houseSale: 75_000,
    startRep: 0,
    profession: { programlama: 1, tasarim: 4, ses: 3, projeyonetimi: 9 },
    advantage: 'En yüksek ekip verimliliği (Faz 5\'te aktif olur).',
  },
  {
    id: 'eski_ceo',
    emoji: '👔',
    title: 'Eski CEO',
    story: 'Yönetim kurulu seni devirdi. Hisseler düşünce ilk feda edilensin.',
    houseStory: 'Villanı $120,000\'a sattın. Basın bunu da haber yaptı.',
    houseSale: 120_000,
    startRep: 20,
    profession: { programlama: 3, tasarim: 3, ses: 2, projeyonetimi: 7 },
    advantage: 'Yüksek başlangıç parası ve itibar — ama herkes seni izliyor.',
    special: { type: 'rep_loss_multiplier', multiplier: 2 },
  },
]
```

- [ ] **Commit**

```bash
git add src/data/backgrounds.ts
git commit -m "feat: backgrounds data with 5 character backgrounds"
```

---

## Task 2: characterStore — state ve aksiyonlar

**Files:**
- Create: `src/store/characterStore.ts`
- Create: `tests/store/characterStore.test.ts`

- [ ] **Test yaz**

```ts
// tests/store/characterStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterStore } from '@/store/characterStore'
import { BACKGROUNDS } from '@/data/backgrounds'

const DEFAULT_PERSONALITY = { karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0 }

beforeEach(() => {
  useCharacterStore.setState({
    isCreated: false,
    name: '',
    studioName: '',
    background: null,
    profession: { programlama: 0, tasarim: 0, ses: 0, projeyonetimi: 0 },
    personality: DEFAULT_PERSONALITY,
  })
})

describe('characterStore', () => {
  it('başlangıçta isCreated false', () => {
    expect(useCharacterStore.getState().isCreated).toBe(false)
  })

  it('setBackground arkaplan stat\'larını ayarlar', () => {
    useCharacterStore.getState().setBackground('bas_muhendis')
    const s = useCharacterStore.getState()
    expect(s.background).toBe('bas_muhendis')
    expect(s.profession.programlama).toBe(8)
    expect(s.profession.tasarim).toBe(3)
  })

  it('setPersonality kişilik stat\'larını ayarlar', () => {
    const stats = { karisma: 2, odak: 1, rekabetcilik: 1, yaraticilik: 1, isZekasi: 0 }
    useCharacterStore.getState().setPersonality(stats)
    expect(useCharacterStore.getState().personality).toEqual(stats)
  })

  it('setIdentity isim ve stüdyo adını ayarlar', () => {
    useCharacterStore.getState().setIdentity('Aslı', 'Pixel Dreams')
    const s = useCharacterStore.getState()
    expect(s.name).toBe('Aslı')
    expect(s.studioName).toBe('Pixel Dreams')
  })

  it('reset tüm state\'i temizler', () => {
    useCharacterStore.getState().setBackground('bas_muhendis')
    useCharacterStore.getState().reset()
    const s = useCharacterStore.getState()
    expect(s.isCreated).toBe(false)
    expect(s.background).toBeNull()
    expect(s.name).toBe('')
  })

  it('getPlayerSkillBonus meslek stat ortalamasını döner', () => {
    useCharacterStore.getState().setBackground('bas_muhendis')
    // (8+3+2+4)/4 * 0.3 = 17/4 * 0.3 = 4.25 * 0.3 = 1.275
    const bonus = useCharacterStore.getState().getPlayerSkillBonus()
    expect(bonus).toBeCloseTo(1.275, 2)
  })
})
```

- [ ] **Test başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/characterStore.test.ts
```
Expected: FAIL — `Cannot find module '@/store/characterStore'`

- [ ] **characterStore implement et**

```ts
// src/store/characterStore.ts
import { create } from 'zustand'
import { BACKGROUNDS } from '@/data/backgrounds'
import type { BackgroundId, ProfessionStats, PersonalityStats } from '@/data/backgrounds'

const DEFAULT_PROFESSION: ProfessionStats = { programlama: 0, tasarim: 0, ses: 0, projeyonetimi: 0 }
const DEFAULT_PERSONALITY: PersonalityStats = { karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0 }

interface CharacterStore {
  isCreated:   boolean
  name:        string
  studioName:  string
  background:  BackgroundId | null
  profession:  ProfessionStats
  personality: PersonalityStats
  setBackground:  (bg: BackgroundId) => void
  setPersonality: (stats: PersonalityStats) => void
  setIdentity:    (name: string, studioName: string) => void
  finalize:       () => void
  reset:          () => void
  getPlayerSkillBonus: () => number
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  isCreated:   false,
  name:        '',
  studioName:  '',
  background:  null,
  profession:  DEFAULT_PROFESSION,
  personality: DEFAULT_PERSONALITY,

  setBackground: (bg) => {
    const def = BACKGROUNDS.find((b) => b.id === bg)!
    set({ background: bg, profession: def.profession })
  },

  setPersonality: (stats) => set({ personality: stats }),

  setIdentity: (name, studioName) => set({ name, studioName }),

  finalize: () => set({ isCreated: true }),

  reset: () => set({
    isCreated:   false,
    name:        '',
    studioName:  '',
    background:  null,
    profession:  { ...DEFAULT_PROFESSION },
    personality: { ...DEFAULT_PERSONALITY },
  }),

  getPlayerSkillBonus: () => {
    const { profession } = get()
    const avg = (profession.programlama + profession.tasarim + profession.ses + profession.projeyonetimi) / 4
    return avg * 0.3
  },
}))
```

- [ ] **Testleri çalıştır**

```bash
npx vitest run tests/store/characterStore.test.ts
```
Expected: PASS (6 test)

- [ ] **Commit**

```bash
git add src/store/characterStore.ts tests/store/characterStore.test.ts
git commit -m "feat: characterStore with background, personality, identity, finalize"
```

---

## Task 3: gameStore — setMoney, setReputation, reset ekle

**Files:**
- Modify: `src/store/gameStore.ts`

- [ ] **Mevcut gameStore'u oku ve güncelle**

Şu anki `src/store/gameStore.ts` içeriği:
```ts
interface GameStoreState {
  money: number
  reputation: number
  totalPublished: number
  addMoney: (amount: number) => void
  gainReputation: (amount: number) => void
  incrementPublished: () => void
}
```

Yeni hali:
```ts
// src/store/gameStore.ts
import { create } from 'zustand'

interface GameStoreState {
  money:          number
  reputation:     number
  totalPublished: number
  addMoney:           (amount: number) => void
  setMoney:           (amount: number) => void
  gainReputation:     (amount: number) => void
  setReputation:      (amount: number) => void
  incrementPublished: () => void
  reset:              () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  money:          50_000,
  reputation:     0,
  totalPublished: 0,
  addMoney:           (amount) => set((s) => ({ money: s.money + amount })),
  setMoney:           (amount) => set({ money: amount }),
  gainReputation:     (amount) =>
    set((s) => ({ reputation: Math.min(100, s.reputation + amount) })),
  setReputation:      (amount) => set({ reputation: Math.min(100, Math.max(0, amount)) }),
  incrementPublished: () => set((s) => ({ totalPublished: s.totalPublished + 1 })),
  reset:              () => set({ money: 50_000, reputation: 0, totalPublished: 0 }),
}))
```

- [ ] **Tüm testlerin hâlâ geçtiğini doğrula**

```bash
npx vitest run 2>&1 | tail -8
```
Expected: tüm testler PASS, regression yok.

- [ ] **Commit**

```bash
git add src/store/gameStore.ts
git commit -m "feat: gameStore add setMoney, setReputation, reset"
```

---

## Task 4: store reset metodları — projectStore, employeeStore, timeStore, dayTimeStore

**Files:**
- Modify: `src/store/projectStore.ts`
- Modify: `src/store/employeeStore.ts`
- Modify: `src/store/timeStore.ts`
- Modify: `src/store/dayTimeStore.ts`

- [ ] **projectStore'a reset ekle**

`src/store/projectStore.ts` interface'ine `reset: () => void` ekle, implementation:
```ts
reset: () => set({ projects: [] }),
```

- [ ] **employeeStore'a reset ekle**

`src/store/employeeStore.ts` interface'ine `reset: () => void` ekle, implementation:
```ts
reset: () => set({ employees: [], candidates: generateCandidates(1), pendingEvents: [] }),
```

- [ ] **timeStore'a reset ekle**

`src/store/timeStore.ts` interface'ine `reset: () => void` ekle. `START_DATE` sabiti zaten tanımlı:
```ts
reset: () => set({ date: START_DATE, speed: 'durduruldu', tickCount: 0 }),
```

- [ ] **dayTimeStore'a reset ekle**

`src/store/dayTimeStore.ts` interface'ine `reset: () => void` ekle:
```ts
reset: () => set({ hour: 9, minute: 0, minuteFraction: 0, dayOfWeek: 1, weekNumber: 1, isPaused: false }),
```

- [ ] **Tüm testlerin geçtiğini doğrula**

```bash
npx vitest run 2>&1 | tail -8
```
Expected: PASS, regression yok.

- [ ] **Commit**

```bash
git add src/store/projectStore.ts src/store/employeeStore.ts src/store/timeStore.ts src/store/dayTimeStore.ts
git commit -m "feat: add reset() to projectStore, employeeStore, timeStore, dayTimeStore"
```

---

## Task 5: scoreEngine — playerSkillBonus parametresi

**Files:**
- Modify: `src/engine/scoreEngine.ts`
- Modify: `tests/engine/scoreEngine.test.ts`

- [ ] **Mevcut scoreEngine testlerini oku**

```bash
cat tests/engine/scoreEngine.test.ts
```

- [ ] **Yeni test ekle**

`tests/engine/scoreEngine.test.ts` dosyasına ekle:
```ts
it('playerSkillBonus skoru artırır', () => {
  const project: GameProject = {
    id: 'p1', name: 'Test', genreId: 'action', topicId: 'space',
    platformId: 'pc', scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    totalWeeks: 4, weeksElapsed: 4, qualityPoints: 12, status: 'gelistirme'
  }
  const opts = { reputation: 0, publishDate: { year: 2000, season: 'ilkbahar', week: 4 } }
  const resultWithout = calculatePublishResult(project, opts, 0)
  const resultWith    = calculatePublishResult(project, opts, 3)
  expect(resultWith.score).toBeGreaterThan(resultWithout.score)
})
```

- [ ] **Test başarısız olduğunu doğrula**

```bash
npx vitest run tests/engine/scoreEngine.test.ts
```
Expected: FAIL — `calculatePublishResult` 2 argüman bekliyor, 3 veriliyor.

- [ ] **scoreEngine'i güncelle**

`src/engine/scoreEngine.ts` içinde `calculatePublishResult` imzasını ve `score` hesabını güncelle:

```ts
export function calculatePublishResult(
  project: GameProject,
  opts: ScoreOptions,
  playerSkillBonus: number = 0   // YENİ — varsayılan 0, geriye dönük uyumlu
): PublishResult {
  const topic    = TOPICS[project.topicId]
  const genre    = GENRES[project.genreId]
  const platform = PLATFORMS[project.platformId]

  const affinityBonus = topic?.genreAffinity.includes(project.genreId) ? 20 : 0
  const maxQuality    = project.totalWeeks * 6
  const qualityBonus  = clamp(Math.round((project.qualityPoints / maxQuality) * 20), 0, 20)
  const repBonus      = Math.round(opts.reputation / 10)
  const variance      = Math.round((seededRandom(project.id.charCodeAt(0)) * 20) - 10)

  const score = clamp(
    50 + affinityBonus + qualityBonus + repBonus + Math.round(playerSkillBonus) + variance,
    1, 100
  )

  const baseSales       = genre?.baseSales ?? 500
  const salesMultiplier = platform?.salesMultiplier ?? 1.0
  const sales = Math.round(baseSales * salesMultiplier * (score / 50) * (1 + opts.reputation / 100))

  const pricePerUnit = platform?.pricePerUnit ?? 20
  const revenue      = sales * pricePerUnit

  return { score, sales, revenue, publishDate: opts.publishDate }
}
```

- [ ] **Testleri çalıştır**

```bash
npx vitest run tests/engine/scoreEngine.test.ts
```
Expected: PASS (tüm mevcut + yeni test)

- [ ] **Dashboard.tsx:33 satırını güncelle**

`src/components/Dashboard.tsx` içinde `handlePublish` fonksiyonunu güncelle (şu an satır ~30–39):

```tsx
// import ekle (dosyanın üstüne)
import { useCharacterStore } from '@/store/characterStore'

// handlePublish içinde (şu anki satır 33'ü değiştir):
const playerSkillBonus = useCharacterStore.getState().getPlayerSkillBonus()
const result = calculatePublishResult(project, { reputation, publishDate: date }, playerSkillBonus)
```

- [ ] **Commit**

```bash
git add src/engine/scoreEngine.ts tests/engine/scoreEngine.test.ts src/components/Dashboard.tsx
git commit -m "feat: scoreEngine playerSkillBonus parameter"
```

---

## Task 6: CharacterCreationWizard — shell ve adım yönetimi

**Files:**
- Create: `src/components/CharacterCreationWizard.tsx`
- Create: `src/components/character/` (dizin)

- [ ] **Dizin oluştur**

```bash
mkdir -p src/components/character
```

- [ ] **CharacterCreationWizard.tsx implement et**

```tsx
// src/components/CharacterCreationWizard.tsx
import { useState } from 'react'
import BackgroundStep from './character/BackgroundStep'
import PersonalityStep from './character/PersonalityStep'
import IdentityStep from './character/IdentityStep'
import { useCharacterStore } from '@/store/characterStore'
import { useGameStore } from '@/store/gameStore'
import { BACKGROUNDS } from '@/data/backgrounds'

type Step = 1 | 2 | 3

export default function CharacterCreationWizard() {
  const [step, setStep] = useState<Step>(1)
  const background  = useCharacterStore((s) => s.background)
  const finalize    = useCharacterStore((s) => s.finalize)
  const setMoney    = useGameStore((s) => s.setMoney)
  const setRep      = useGameStore((s) => s.setReputation)

  function handleFinalize(name: string, studioName: string) {
    useCharacterStore.getState().setIdentity(name, studioName)

    const bg = BACKGROUNDS.find((b) => b.id === background)!
    setMoney(bg.houseSale)
    if (bg.startRep > 0) setRep(bg.startRep)

    finalize()
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Adım göstergesi */}
        <div className="flex justify-center gap-4 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {step === 1 && <BackgroundStep onNext={() => setStep(2)} />}
        {step === 2 && <PersonalityStep onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <IdentityStep onBack={() => setStep(2)} onFinalize={handleFinalize} />}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/CharacterCreationWizard.tsx
git commit -m "feat: CharacterCreationWizard shell with step navigation"
```

---

## Task 7: BackgroundStep — arkaplan seçimi

**Files:**
- Create: `src/components/character/BackgroundStep.tsx`

- [ ] **BackgroundStep.tsx implement et**

```tsx
// src/components/character/BackgroundStep.tsx
import { BACKGROUNDS } from '@/data/backgrounds'
import { useCharacterStore } from '@/store/characterStore'
import type { BackgroundId } from '@/data/backgrounds'

interface Props { onNext: () => void }

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-sm ${i < value ? 'bg-blue-500' : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <span className="text-gray-500">{value}</span>
    </div>
  )
}

export default function BackgroundStep({ onNext }: Props) {
  const selected    = useCharacterStore((s) => s.background)
  const setBackground = useCharacterStore((s) => s.setBackground)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white text-center mb-2">Kim olduğunu seç</h1>
      <p className="text-gray-400 text-center mb-6 text-sm">
        Arkaplanın meslek stat'larını ve başlangıç koşullarını belirler.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => setBackground(bg.id as BackgroundId)}
            className={`text-left p-4 rounded-xl border transition-colors ${
              selected === bg.id
                ? 'border-blue-500 bg-blue-950/50'
                : 'border-gray-700 bg-gray-900 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-1">{bg.emoji}</div>
            <div className="font-semibold text-white text-sm mb-1">{bg.title}</div>
            <p className="text-gray-400 text-xs italic mb-3">{bg.story}</p>
            <div className="space-y-1 mb-3">
              <StatBar label="Programlama" value={bg.profession.programlama} />
              <StatBar label="Tasarım"     value={bg.profession.tasarim} />
              <StatBar label="Ses"         value={bg.profession.ses} />
              <StatBar label="Prj.Yön."   value={bg.profession.projeyonetimi} />
            </div>
            <div className="text-green-400 text-xs font-mono">${bg.houseSale.toLocaleString()}</div>
            {bg.startRep > 0 && (
              <div className="text-yellow-400 text-xs">İtibar: {bg.startRep}/100</div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          İleri →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/character/BackgroundStep.tsx
git commit -m "feat: BackgroundStep with 5 background cards and stat bars"
```

---

## Task 8: PersonalityStep — kişilik stat dağılımı

**Files:**
- Create: `src/components/character/PersonalityStep.tsx`

- [ ] **PersonalityStep.tsx implement et**

```tsx
// src/components/character/PersonalityStep.tsx
import { useState } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import type { PersonalityStats } from '@/data/backgrounds'

const TOTAL_POINTS = 5

const STAT_LABELS: { key: keyof PersonalityStats; label: string; desc: string }[] = [
  { key: 'karisma',      label: 'Karisma',      desc: 'İlişki kurma, ikna, NPC bonusu' },
  { key: 'odak',         label: 'Odak',          desc: 'Solo verimlilik, crunch dayanıklılığı' },
  { key: 'rekabetcilik', label: 'Rekabetçilik',  desc: 'Rakip diyalogları, gerilim artışı' },
  { key: 'yaraticilik',  label: 'Yaratıcılık',   desc: 'Konsept özgünlüğü, eleştirmen bonusu' },
  { key: 'isZekasi',     label: 'İş Zekası',     desc: 'Para yönetimi, yatırımcı ikna' },
]

interface Props { onBack: () => void; onNext: () => void }

export default function PersonalityStep({ onBack, onNext }: Props) {
  const setPersonality = useCharacterStore((s) => s.setPersonality)
  const [stats, setStats] = useState<PersonalityStats>({
    karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0,
  })

  const used = Object.values(stats).reduce((a, b) => a + b, 0)
  const remaining = TOTAL_POINTS - used

  function adjust(key: keyof PersonalityStats, delta: number) {
    const next = stats[key] + delta
    if (next < 0 || next > TOTAL_POINTS) return
    if (delta > 0 && remaining === 0) return
    setStats((s) => ({ ...s, [key]: next }))
  }

  function handleNext() {
    setPersonality(stats)
    onNext()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white text-center mb-2">Sen kimsin?</h1>
      <p className="text-gray-400 text-center mb-2 text-sm">
        5 puan, 5 stat arasında dağıt.
      </p>
      <div className={`text-center text-sm font-mono mb-6 ${remaining === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
        {remaining} puan kaldı
      </div>

      <div className="max-w-lg mx-auto space-y-4 mb-8">
        {STAT_LABELS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center gap-4 bg-gray-900 rounded-xl p-4">
            <div className="flex-1">
              <div className="text-white font-medium text-sm">{label}</div>
              <div className="text-gray-400 text-xs">{desc}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjust(key, -1)}
                disabled={stats[key] === 0}
                className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white font-bold"
              >
                −
              </button>
              <span className="text-white font-mono w-4 text-center">{stats[key]}</span>
              <button
                onClick={() => adjust(key, 1)}
                disabled={remaining === 0 || stats[key] === TOTAL_POINTS}
                className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white font-bold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
          ← Geri
        </button>
        <button
          onClick={handleNext}
          disabled={remaining !== 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          İleri →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/character/PersonalityStep.tsx
git commit -m "feat: PersonalityStep with 5-point distribution"
```

---

## Task 9: IdentityStep — isim, stüdyo adı, oyuna başla

**Files:**
- Create: `src/components/character/IdentityStep.tsx`

- [ ] **IdentityStep.tsx implement et**

```tsx
// src/components/character/IdentityStep.tsx
import { useState } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import { BACKGROUNDS } from '@/data/backgrounds'

interface Props {
  onBack:     () => void
  onFinalize: (name: string, studioName: string) => void
}

export default function IdentityStep({ onBack, onFinalize }: Props) {
  const [name,      setName]      = useState('')
  const [studioName, setStudioName] = useState('')
  const backgroundId = useCharacterStore((s) => s.background)
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)!

  const canStart = name.trim().length > 0 && studioName.trim().length > 0

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white text-center mb-2">Son adım</h1>

      <div className="bg-gray-900 rounded-xl p-4 mb-6 text-center">
        <p className="text-gray-300 text-sm italic">{bg.houseStory}</p>
        <p className="text-green-400 font-mono mt-2">${bg.houseSale.toLocaleString()} ile başlıyorsun.</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Adın</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            placeholder="Karakterin adı"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Stüdyo adın</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value.slice(0, 40))}
            placeholder="Stüdyo adı"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
          ← Geri
        </button>
        <button
          onClick={() => onFinalize(name.trim(), studioName.trim())}
          disabled={!canStart}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          Oyuna Başla
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/character/IdentityStep.tsx
git commit -m "feat: IdentityStep with name, studio name, house story"
```

---

## Task 10: App.tsx — wizard gate ve CEO özel mekanikleri

**Files:**
- Modify: `src/App.tsx`

- [ ] **App.tsx'e wizard gate ekle**

`src/App.tsx` içine import ekle:
```tsx
import CharacterCreationWizard from '@/components/CharacterCreationWizard'
import { useCharacterStore } from '@/store/characterStore'
```

Component başında, return'den önce:
```tsx
const isCreated = useCharacterStore((s) => s.isCreated)
if (!isCreated) return <CharacterCreationWizard />
```

Bu iki satır `weeklyTick` useEffect'inden önce gelmeli.

- [ ] **CEO itibar kaybı mekaniklerini Dashboard.tsx'e ekle**

`src/components/Dashboard.tsx` içinde `handlePublish` fonksiyonu şu an (satır ~30–39):
```tsx
function handlePublish(projectId: string) {
  const project = projects.find((p) => p.id === projectId)
  if (!project) return
  const result = calculatePublishResult(project, { reputation, publishDate: date })
  publishProject(projectId, result)
  addMoney(result.revenue)
  gainReputation(Math.round(result.score / 20))
  incrementPub()
  unassignFromProject(projectId)
  onPublishResult(projectId)
}
```

Şu hale getir (Task 5 değişikliğiyle birlikte, import'ları da güncelle):
```tsx
import { useCharacterStore } from '@/store/characterStore'
import { BACKGROUNDS } from '@/data/backgrounds'

function handlePublish(projectId: string) {
  const project = projects.find((p) => p.id === projectId)
  if (!project) return

  const playerSkillBonus = useCharacterStore.getState().getPlayerSkillBonus()
  const result = calculatePublishResult(project, { reputation, publishDate: date }, playerSkillBonus)

  publishProject(projectId, result)
  addMoney(result.revenue)
  gainReputation(Math.round(result.score / 20))

  // CEO özel: başarısız projede 2× itibar kaybı
  if (result.score < 50) {
    const bgId = useCharacterStore.getState().background
    const bg   = BACKGROUNDS.find((b) => b.id === bgId)
    const multiplier = bg?.special?.type === 'rep_loss_multiplier' ? bg.special.multiplier : 1
    gainReputation(-10 * multiplier)
  }

  incrementPub()
  unassignFromProject(projectId)
  onPublishResult(projectId)
}
```

- [ ] **TypeScript kontrol et**

```bash
npx tsc --noEmit 2>&1 | grep -v TS5101 | head -20
```
Expected: hata yok.

- [ ] **Tüm testleri çalıştır**

```bash
npx vitest run 2>&1 | tail -8
```
Expected: PASS, regression yok.

- [ ] **Commit**

```bash
git add src/App.tsx src/components/Dashboard.tsx
git commit -m "feat: wizard gate in App.tsx, CEO rep loss mechanic"
```

---

## Task 11: Dashboard — "Yeni Oyun" butonu

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Dashboard'a "Yeni Oyun" butonu ekle**

`src/components/Dashboard.tsx` içinde uygun bir köşeye (örn. header bölümü, sağ alt) buton ekle:

```tsx
import { useCharacterStore } from '@/store/characterStore'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useTimeStore } from '@/store/timeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'

function handleNewGame() {
  if (!confirm('Mevcut oyun silinecek. Devam etmek istiyor musun?')) return
  useCharacterStore.getState().reset()
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useEmployeeStore.getState().reset()
  useTimeStore.getState().reset()
  useDayTimeStore.getState().reset()
  // isCreated = false → wizard otomatik açılır
}
```

JSX'e ekle (mevcut header'da uygun bir yere):
```tsx
<button
  onClick={handleNewGame}
  className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
>
  Yeni Oyun
</button>
```

- [ ] **Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: Dashboard New Game button resets all stores"
```

---

## Task 12: Tüm testler + manuel doğrulama

- [ ] **Tüm testleri çalıştır**

```bash
npx vitest run
```
Expected: PASS. (characterStore: 6, scoreEngine: +1 yeni, diğerleri mevcut)

- [ ] **Build al ve manuel test yap**

```bash
npm run build
```

Manuel test akışı:
1. App açılır → wizard görünür (HUD ve PixiJS yok) ✓
2. Adım 1: 5 arkaplan kart görünüyor, biri seçilebiliyor ✓
3. Seçim olmadan "İleri" pasif ✓
4. Adım 2: 5 puan dağıtılabiliyor, kalan sayaç çalışıyor ✓
5. 5 puan dolmadan "İleri" pasif ✓
6. Adım 3: İsim + stüdyo adı giriliyor, ev satış hikayesi görünüyor ✓
7. "Oyuna Başla" → wizard kapanır, HUD'da para arkaplan parasıyla başlıyor ✓
8. Eski CEO seçilince HUD'da başlangıç itibarı 20 görünüyor ✓
9. Dashboard "Yeni Oyun" → onay sorar → wizard tekrar açılıyor ✓

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: Faz 4A complete — character creation wizard"
```

---

## Notlar

- **`calculatePublishResult` çağrı yeri:** `grep -rn "calculatePublishResult" src/` ile bul. Muhtemelen `Dashboard.tsx` içindedir.
- **CEO özel: `rival_early`** — rakip şirketin Hafta 1'de haberi olması Faz 4C (Rakip Şirket Arc'ı) spec'ine bırakılmıştır. Bu fazda sadece `startRep: 20` ve `rep_loss_multiplier` aktif.
- **KK Uzmanı `no_bugs` özelliği** — bug sistemi Faz 5'te (playtesting) eklenecek. Bu fazda kaydedilir ama henüz mekanik etkisi yok.
- **Save/load:** `characterStore` state'i `saveGame` çağrısına eklenmesi gerekiyor (App.tsx'teki `weeklyTick` callback). SQLite load tarafında da `character` alanı okunmalı. Temel akış için zorunlu değil (oyun her başlangıçta wizard'dan geçer), ama oyun ortasında kapanıp açılınca wizard tekrar çıkmaması için önerilir.
