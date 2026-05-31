# Final / Emeklilik Epilogu (Spec C2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ~30. yılda (`arcEnd`) bir kez otomatik oynayan kapanış epilogu: sahil evi monoloğu (evli/yalnız dallanır) + oyuncunun seçimlerini yansıtan dinamik "neredeler" kartları; sonra sandbox sürer.

**Architecture:** Saf `finaleEngine.buildEpilogue(snapshot)` durumdan içerik üretir (monolog + kartlar). Bir snapshot-derleyici store'lardan `FinaleSnapshot` kurar. `EpiloguePlayer` içeriği render eder. `App`, `arcEnd && !arcEnd_shown` olunca epilogu açıp `arcEnd_shown` set eder.

**Tech Stack:** TypeScript, React, Zustand, Vitest, electron-vite. Doğrulama: `npx vitest run`.

**Referans:** `docs/superpowers/specs/2026-05-31-final-emeklilik-epilog-design.md`.

**Önkoşullar:** A (`lifeStore` flags: `arcEnd`, `setFlag`, `hasFlag`), C1 (`characterStore.spouseId/childIds`), 4C (`rivalStore` nexus relationship), `gameStore.reputation`, `awardsStore.history`, NPC sistemi (`npcStore.hearts`, `getNpc`). `arcEnd_shown` yeni bir `lifeStore` bayrağıdır (mevcut flag mekanizması).

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/engine/finaleEngine.ts` | Saf: snapshot → epilog (monolog + kartlar) | Create |
| `src/engine/finaleSnapshot.ts` | Store'lardan `FinaleSnapshot` derler | Create |
| `src/components/EpiloguePlayer.tsx` | Epilogu render eder (monolog + kartlar) | Create |
| `src/App.tsx` | arcEnd tetikleyici + EpiloguePlayer render | Modify |

---

### Task 1: finaleEngine — saf içerik üretimi

**Files:** Create `src/engine/finaleEngine.ts`, Test `tests/engine/finaleEngine.test.ts`

- [ ] **Step 1: Testi yaz** — `tests/engine/finaleEngine.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { buildEpilogue } from '@/engine/finaleEngine'
import type { FinaleSnapshot } from '@/engine/finaleEngine'

const base: FinaleSnapshot = {
  playerName: 'Aslı', spouseId: null, spouseName: null, childNames: [],
  nexusOutcome: 'none', reputation: 40, awardsWon: 0, trioStudio: false,
  topPhilosophy: null, cityFlags: { hanDevir: false, beaMural: false },
}
const cardText = (r: ReturnType<typeof buildEpilogue>, baslik: string) =>
  r.kartlar.find(k => k.baslik === baslik)?.metin ?? ''

describe('buildEpilogue', () => {
  it('bekarken monolog yalnız varyantı + evrensel kapanış', () => {
    const r = buildEpilogue(base)
    const mono = r.monolog.map(l => l.text).join(' ')
    expect(mono).toContain('Hâlâ yalnızım')
    expect(mono).toContain('Nehir beni buraya getirdi')
  })
  it('evliyken eş & çocuk kartı isimlerle', () => {
    const r = buildEpilogue({ ...base, spouseId: 'daniel', spouseName: 'Daniel', childNames: ['Mira'] })
    expect(cardText(r, 'Eş & Çocuklar')).toContain('Daniel')
    expect(cardText(r, 'Eş & Çocuklar')).toContain('Mira')
  })
  it('Crane kartı 4C sonucuna göre', () => {
    expect(cardText(buildEpilogue({ ...base, nexusOutcome: 'destroy' }), 'Crane')).toContain('korku tuttu')
    expect(cardText(buildEpilogue({ ...base, nexusOutcome: 'forgive' }), 'Crane')).toContain('affettin')
    expect(cardText(buildEpilogue({ ...base, nexusOutcome: 'none' }), 'Crane')).toContain('yüzleşmedin')
  })
  it('itibar eşiği: efsane', () => {
    expect(cardText(buildEpilogue({ ...base, reputation: 90 }), 'Stüdyo & Kariyer')).toContain('efsane')
  })
  it('felsefe merceği: stoa', () => {
    expect(cardText(buildEpilogue({ ...base, topPhilosophy: 'stoa' }), 'Yakın Felsefe & Şehir')).toContain('dinginli')
  })
  it('şehir bayrağı yoksa o satır yok', () => {
    const r = buildEpilogue({ ...base, topPhilosophy: 'stoa', cityFlags: { hanDevir: false, beaMural: false } })
    expect(cardText(r, 'Yakın Felsefe & Şehir')).not.toContain('Han artık')
  })
})
```

- [ ] **Step 2: Çalıştır (fail)** — FAIL.

- [ ] **Step 3: finaleEngine'i yaz** — `src/engine/finaleEngine.ts`

```ts
export type NexusOutcome = 'buyout' | 'destroy' | 'forgive' | 'merge' | 'none'

export interface FinaleSnapshot {
  playerName:    string
  spouseId:      string | null
  spouseName:    string | null
  childNames:    string[]
  nexusOutcome:  NexusOutcome
  reputation:    number
  awardsWon:     number
  trioStudio:    boolean
  topPhilosophy: string | null
  cityFlags:     { hanDevir: boolean; beaMural: boolean }
}

export interface EpilogueLine { speaker: string; text: string }
export interface EpilogueCard { baslik: string; metin: string }

const CRANE: Record<NexusOutcome, string> = {
  buyout:  'Nexus\'u satın aldın. Crane koltuğu bıraktı, sen oturdun. Bazen onun gülümsemesini takınıyorsun — fark etmeden.',
  destroy: 'Crane\'i yıktın. Düsturunu kanıtladın: korku tuttu. Aynaya bakınca bazen onu görüyorsun.',
  forgive: 'Crane\'i affettin. Anlamadı, ama af senin içindi. Yıllar sonra kısa bir not geldi: "Hâlâ anlamıyorum. Teşekkürler."',
  merge:   'Nexus\'la birleştin. İki düşman, tek çatı; kâr yerine ihtiyaç tuttu sizi.',
  none:    'Crane\'le hiç yüzleşmedin. Nexus uzakta, büyük, kayıtsız kaldı — ve sen huzurla küçük kaldın.',
}

const PHILOSOPHY_LENS: Record<string, string> = {
  stoa:     'En çok Marcus\'a uğradın; onun dinginliğini öğrendin.',
  tao:      'Theo gibi akmayı öğrendin; zorlamadan vardın.',
  nietzsche:'Magnus\'un uçurumuna baktın ve kendini aştın.',
  camus:    'Remy\'nin isyanını taşıdın: anlamı sen kurdun.',
  nihilizm: 'Yevgeni\'nin boşluğunu gördün, yine de bir şeylere tutundun.',
  aristoteles:'Bruno gibi karakterini perçin perçin ördün.',
  sartre:   'Søren gibi rotanı hep kendin seçtin.',
  kant:     'Clara\'nın ilkesini taşıdın: kimseyi araç yapmadın.',
  epikur:   'Aldo\'nun sofrasını öğrendin: sade olan yetti.',
  bakim:    'Marta gibi, önce insana baktın.',
  kirenaik: 'Rex gibi anı yaşadın; ertelemedin.',
  fayda:    'Vivian gibi teraziyi tuttun: en geniş iyiliği aradın.',
}

export function buildEpilogue(s: FinaleSnapshot): { monolog: EpilogueLine[]; kartlar: EpilogueCard[] } {
  const P = s.playerName || 'Sen'
  const monolog: EpilogueLine[] = [
    { speaker: P, text: 'Otuz yıl. Kovulmuş, terk edilmiş gelmiştim bu eve. Tuz hâlâ aynı kokuyor.' },
    s.spouseId
      ? { speaker: P, text: `Ama artık yalnız değilim. ${s.spouseName} yakında; ev ilk kez dolu.` }
      : { speaker: P, text: 'Hâlâ yalnızım. Ama bu, terk edilmişlik değil — seçtiğim bir sükûnet.' },
    { speaker: P, text: 'Nehir beni buraya getirdi. Bir kısmını ben kürek çektim, bir kısmını bıraktım. İkisi de benim.' },
  ]

  const kartlar: EpilogueCard[] = []

  // 1) Eş & çocuklar
  kartlar.push({
    baslik: 'Eş & Çocuklar',
    metin: s.spouseId
      ? `${s.spouseName} ile bir ömür.` + (s.childNames.length ? ` ${s.childNames.join(', ')} büyüdü; kendi yollarını buldu.` : '')
      : 'Kimseyle evlenmedin. Yine de evin hiç boş olmadı — uğrayan dostlar, gelen mektuplar.',
  })

  // 2) Crane / Nexus
  kartlar.push({ baslik: 'Crane', metin: CRANE[s.nexusOutcome] })

  // 3) Stüdyo & kariyer
  const tier = s.reputation >= 80 ? 'Adın sektöre efsane olarak yazıldı.'
             : s.reputation >= 50 ? 'Küçük ama sevilen bir iz bıraktın.'
             : 'Büyük olmadı, ama tümüyle senindi.'
  const trio = s.trioStudio ? ' Lena, Sam ve Milo kendi stüdyolarını kurdu — ilk teşekkürleri sanaydı.' : ''
  kartlar.push({ baslik: 'Stüdyo & Kariyer', metin: tier + trio })

  // 4) Yakın felsefe & şehir
  const lens = s.topPhilosophy ? (PHILOSOPHY_LENS[s.topPhilosophy] ?? '') : 'Kimseye fazla yaklaşmadın; yolu yalnız yürüdün.'
  const sehir = [
    s.cityFlags.hanDevir ? 'Han artık Tomas\'ın.' : '',
    s.cityFlags.beaMural ? 'Bea\'nın murali hâlâ rıhtımda.' : '',
  ].filter(Boolean).join(' ')
  kartlar.push({ baslik: 'Yakın Felsefe & Şehir', metin: (lens + ' ' + sehir).trim() })

  return { monolog, kartlar }
}
```

- [ ] **Step 4: Çalıştır (pass)** — `npx vitest run tests/engine/finaleEngine.test.ts` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/engine/finaleEngine.ts tests/engine/finaleEngine.test.ts
git commit -m "feat(C2): finaleEngine — saf epilog içerik üretimi (monolog + kartlar)"
```

---

### Task 2: Snapshot derleyici (store'lardan)

**Files:** Create `src/engine/finaleSnapshot.ts`

- [ ] **Step 1: Yaz** — `src/engine/finaleSnapshot.ts`

```ts
import { useCharacterStore } from '@/store/characterStore'
import { useRivalStore } from '@/store/rivalStore'
import { useGameStore } from '@/store/gameStore'
import { useAwardsStore } from '@/store/awardsStore'
import { useNpcStore } from '@/store/npcStore'
import { useLifeStore } from '@/store/lifeStore'
import { getNpc, NPCS } from '@/data/npcs'
import type { FinaleSnapshot, NexusOutcome } from '@/engine/finaleEngine'

function nexusOutcome(): NexusOutcome {
  const nexus = useRivalStore.getState().rivals.find(r => r.id === 'nexus')
  if (!nexus) return 'none'
  switch (nexus.relationship) {
    case 'destroyed': return useGameStore.getState().money >= 0 ? 'destroy' : 'destroy' // satın al/yok et ikisi de 'destroyed'; ayrım için resolution kaydı gerekirse rivalStore'a eklenebilir
    case 'ally':      return 'forgive'
    case 'merged':    return 'merge'
    default:          return 'none'
  }
}

function topPhilosophy(): string | null {
  const hearts = useNpcStore.getState().hearts
  let best: { id: string; h: number } | null = null
  for (const npc of NPCS) {
    if (!npc.philosophy) continue
    const h = hearts[npc.id] ?? 0
    if (h > 0 && (!best || h > best.h)) best = { id: npc.id, h }
  }
  return best ? (getNpc(best.id)?.philosophy ?? null) : null
}

export function buildFinaleSnapshot(): FinaleSnapshot {
  const cs = useCharacterStore.getState()
  const spouse = cs.spouseId ? getNpc(cs.spouseId) : null
  return {
    playerName:   cs.name,
    spouseId:     cs.spouseId,
    spouseName:   spouse?.name ?? null,
    childNames:   cs.childIds.map(id => getNpc(id)?.name ?? 'çocuğun'),
    nexusOutcome: nexusOutcome(),
    reputation:   useGameStore.getState().reputation,
    awardsWon:    useAwardsStore.getState().history.filter(e => e.winnerId === 'player').length,
    trioStudio:   useLifeStore.getState().hasFlag('uclu_studyo_kuruldu'),
    topPhilosophy: topPhilosophy(),
    cityFlags: {
      hanDevir: useLifeStore.getState().hasFlag('devir_han_tomas'),
      beaMural: useLifeStore.getState().hasFlag('bea_mural_yapildi'),
    },
  }
}
```
> **Notlar:**
> - **buyout vs destroy ayrımı:** Spec B/4C'de her ikisi `relationship='destroyed'`. Ayrım gerekiyorsa `rivalStore.resolveRival` çözümü bir `lastResolution: ResolutionChoice` alanına yazmalı (4C'ye küçük ek). MVP'de `destroyed` → 'destroy' kabul; istenirse `lastResolution` okunur. Bu notu 4C ekibine bırak.
> - `uclu_studyo_kuruldu` / `bea_mural_yapildi`: B'deki ilgili olaylar bu bayrakları da `setFlag` ile bırakmalı (B'ye küçük ek; B planında cutscene tetikleniyordu, yanına flag eklenir). Yoksa kart satırı atlanır (zararsız).

- [ ] **Step 2: Build doğrula + commit**
```bash
npm run build   # hatasız (tip uyumu)
git add src/engine/finaleSnapshot.ts
git commit -m "feat(C2): finaleSnapshot — store'lardan FinaleSnapshot derleyici"
```

---

### Task 3: EpiloguePlayer bileşeni

**Files:** Create `src/components/EpiloguePlayer.tsx`

- [ ] **Step 1: Yaz** — `src/components/EpiloguePlayer.tsx` (CutscenePlayer diyalog-kutusu stilini yeniden kullanır):

```tsx
import { useState } from 'react'
import type { EpilogueLine, EpilogueCard } from '@/engine/finaleEngine'

interface Props {
  monolog: EpilogueLine[]
  kartlar: EpilogueCard[]
  onClose: () => void
}

export default function EpiloguePlayer({ monolog, kartlar, onClose }: Props) {
  // Sıra: önce monolog satırları, sonra kartlar
  const total = monolog.length + kartlar.length
  const [i, setI] = useState(0)

  function next() {
    if (i + 1 >= total) onClose()
    else setI(i + 1)
  }

  const isMono = i < monolog.length
  const mono = isMono ? monolog[i] : null
  const kart = isMono ? null : kartlar[i - monolog.length]

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end justify-center" onClick={next} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <div className="bg-[#faf0d8] border-t-4 border-[#c8a050] w-full p-6 min-h-[8rem]">
        {mono && (
          <>
            <div className="text-xs font-bold text-[#7a4a1e] mb-1">{mono.speaker}</div>
            <div className="text-base text-[#3a2a1a] leading-relaxed">{mono.text}</div>
          </>
        )}
        {kart && (
          <>
            <div className="text-xs font-bold text-[#9a7a4a] uppercase tracking-wider mb-1">{kart.baslik}</div>
            <div className="text-base text-[#3a2a1a] leading-relaxed">{kart.metin}</div>
          </>
        )}
        <div className="text-right text-[#9a7a4a] mt-2">▶</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build doğrula + commit**
```bash
npm run build
git add src/components/EpiloguePlayer.tsx
git commit -m "feat(C2): EpiloguePlayer — monolog + kart render"
```

---

### Task 4: App tetikleyici + doğrulama + DURUM

**Files:** Modify `src/App.tsx`, `docs/superpowers/DURUM.md`

- [ ] **Step 1: App tetikleyici** — `src/App.tsx`:
  - import: `EpiloguePlayer`, `buildFinaleSnapshot`, `buildEpilogue`, `useLifeStore`, `useState`/`useEffect`.
  - Bileşen gövdesinde:
    ```tsx
    const [epilog, setEpilog] = useState<ReturnType<typeof buildEpilogue> | null>(null)
    const flagsTick = useLifeStore((s) => s.flags)   // flags değişince yeniden değerlendir
    useEffect(() => {
      const life = useLifeStore.getState()
      if (life.hasFlag('arcEnd') && !life.hasFlag('arcEnd_shown')) {
        setEpilog(buildEpilogue(buildFinaleSnapshot()))
        life.setFlag('arcEnd_shown')
      }
    }, [flagsTick])
    ```
  - Render ağacına: `{epilog && <EpiloguePlayer monolog={epilog.monolog} kartlar={epilog.kartlar} onClose={() => setEpilog(null)} />}`
  - Reset zincirine dokunma (yeni oyunda `lifeStore.reset` zaten `arcEnd`/`arcEnd_shown`'u temizler).

- [ ] **Step 2: Doğrula** — `npx vitest run` → PASS; `npm run build` → hatasız.

- [ ] **Step 3 (manuel):** dev'de `lifeStore.setFlag('arcEnd')` (ya da 30 yıl ilerlet) → epilog bir kez açılır (monolog + kartlar, seçimlere göre), kapanınca sandbox sürer; tekrar açılmaz.

- [ ] **Step 4: DURUM** — tabloya:
```markdown
| **Final / Emeklilik Epilogu (C2)** | ✅ Bitti | `specs/2026-05-31-final-emeklilik-epilog-design.md` | `plans/2026-05-31-final-emeklilik-epilog.md` |
```

- [ ] **Step 5: Commit**
```bash
git add src/App.tsx docs/superpowers/DURUM.md
git commit -m "feat(C2): arcEnd epilog tetikleyici; final tamamlandı"
```

---

## Self-Review

**1. Spec coverage:**
- Tetik: arcEnd → bir kez + sandbox sürer → Task 4 (`arcEnd_shown`) ✅
- Monolog (evli/yalnız + evrensel kapanış) → Task 1 `buildEpilogue` ✅
- 4 kart (eş&çocuk, Crane 5 varyant, stüdyo eşik+trio, felsefe mercek+şehir) → Task 1 ✅
- Snapshot store'lardan derlenir → Task 2 ✅
- EpiloguePlayer render → Task 3 ✅
- Test stratejisi (her outcome, evli/bekar, eşik, mercek, şehir bayrağı) → Task 1 testleri ✅

**2. Placeholder scan:** Gerçek kod/içerik var. İki entegrasyon notu açık işaretli: (a) buyout/destroy ayrımı için 4C `lastResolution` (MVP: destroyed→destroy), (b) `uclu_studyo_kuruldu`/`bea_mural_yapildi` bayraklarını B set etmeli (yoksa satır atlanır — zararsız). Bunlar kod açığı değil, çapraz-spec küçük ekler. ✅

**3. Type consistency:**
- `FinaleSnapshot`/`NexusOutcome`/`EpilogueLine`/`EpilogueCard` — Task 1 tanım, Task 2/3 kullanım ✅
- `buildEpilogue(snapshot)` / `buildFinaleSnapshot()` — Task 1/2 tanım, Task 4 kullanım ✅
- `lifeStore.hasFlag/setFlag` — A + C1 Task 2'de public; Task 4 kullanım ✅
- Kart başlıkları ('Eş & Çocuklar'/'Crane'/'Stüdyo & Kariyer'/'Yakın Felsefe & Şehir') — Task 1 üretir, testler aynı başlıkları sorgular ✅

---

## Kapsam Dışı
- Sert oyun-sonu (sandbox sürer).
- İstatistik/score paneli.
- buyout/destroy ince ayrımı (4C `lastResolution` eklenirse otomatik kapsanır).
- Save/load persist'i (`arcEnd_shown`).
