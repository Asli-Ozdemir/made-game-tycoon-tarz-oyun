# NPC Etkileşim & Felsefe Sistemi (Spec A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keşif modunda sabit NPC'lerle Yarn (YarnBound) tabanlı, kalbe göre katmanlı konuşma sistemi + başlangıç karakter içeriği (felsefe/sıradan/romantizm) + imza mektubu kutusu.

**Architecture:** Diyaloglar `.yarn` betiklerinde; **YarnBound** (saf JS) runner ile oynatılır. `npcStore` kalp/aktif konuşma durumunu tutar, kalbi Yarn'a `$heart` değişkeni olarak verir. `NpcDialog` runner çıktısını render eder. Pixi `NpcLayer` NPC'leri çizip yakınlık + `E` tuşunu yönetir. Max kalpte imza mektubu `letterStore`'a düşer.

**Tech Stack:** TypeScript, React, Zustand, PixiJS, electron-vite, Vitest. Diyalog: **Yarn 2.0** via `yarn-bound` (npm). Paket yöneticisi: **npm**.

**Referans:** `docs/superpowers/specs/2026-05-30-npc-etkilesim-felsefe-design.md` (tüm karakter içeriğinin kanonik kaynağı).

**Notlar:**
- `build` = `electron-vite build` (tip denetimi yapmaz). Doğrulama: `npx vitest run`.
- Vite/Vitest `?raw` import'u destekler → `.yarn` dosyaları metin olarak hem app'te hem testte yüklenir.
- Renderer alias `@` → `src` (electron.vite.config.ts + vitest.config.ts).
- Servis mekanikleri (Avukat/Yatırımcı/Arcade), romantizm-arc, gezen NPC AI **kapsam dışı** (kendi spec'leri).

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|-------|-----------|-------|
| `src/dialogue/yarn-raw.d.ts` | `*.yarn?raw` ve `yarn-bound` tip bildirimleri | Create |
| `src/dialogue/*.yarn` | NPC diyalog betikleri (Yarn) | Create |
| `src/dialogue/index.ts` | npcId → yarn metni yükleyici | Create |
| `src/data/npcs.ts` | NPC meta (id, isim, rol, spot, felsefe, mektup, bağ) | Create |
| `src/store/npcStore.ts` | Kalp + aktif konuşma akışı (YarnBound sarmalayıcı) | Create |
| `src/store/letterStore.ts` | Gelen imza mektupları | Create |
| `src/components/NpcDialog.tsx` | Diyalog kutusu (runner çıktısı) | Create |
| `src/components/MektupKutusu.tsx` | Mektup kutusu paneli | Create |
| `src/pixi/NpcLayer.ts` | NPC çizimi + yakınlık + "E" ipucu | Create |
| `src/pixi/Game.ts` | NpcLayer + E tuşu kablolama | Modify |
| `src/App.tsx` | NpcDialog + MektupKutusu render | Modify |

---

### Task 1: Spike — YarnBound stack'te çalışıyor mu

**Files:**
- Modify: `package.json` (dependency)
- Test: `tests/dialogue/yarnbound-spike.test.ts`

- [ ] **Step 1: yarn-bound kur**

Run: `npm install yarn-bound`
Expected: `package.json` `dependencies`'e `yarn-bound` eklenir, hata yok.

- [ ] **Step 2: Spike testini yaz**

`tests/dialogue/yarnbound-spike.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import YarnBound from 'yarn-bound'

const DIALOGUE = `title: Start
---
<<if $heart >= 4>>
yüksek
<<else>>
düşük
<<endif>>
===
`

function firstText(heart: number): string {
  const storage = new Map<string, unknown>([['heart', heart]])
  const runner = new YarnBound({ dialogue: DIALOGUE, startNode: 'Start', variableStorage: storage })
  // currentResult bir TextResult olmalı
  return (runner.currentResult as { text: string }).text
}

describe('yarn-bound spike', () => {
  it('düşük kalpte düşük metni döndürür', () => {
    expect(firstText(0)).toBe('düşük')
  })
  it('yüksek kalpte yüksek metni döndürür', () => {
    expect(firstText(5)).toBe('yüksek')
  })
})
```

- [ ] **Step 3: Testi çalıştır**

Run: `npx vitest run tests/dialogue/yarnbound-spike.test.ts`
Expected: PASS (2 test). Bu, YarnBound'ın `<<if $heart>>` + Map variableStorage ile bizim stack'te (vitest/Vite) çalıştığını kanıtlar.

- [ ] **Step 4: Build'de doğrula**

Run: `npm run build`
Expected: Hatasız tamamlanır (yarn-bound bundle'a girer, sorun çıkarmaz).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/dialogue/yarnbound-spike.test.ts
git commit -m "chore: yarn-bound spike — YarnBound stack'te çalışıyor"
```

---

### Task 2: Tip bildirimleri + diyalog yükleyici

**Files:**
- Create: `src/dialogue/yarn-raw.d.ts`, `src/dialogue/marcus.yarn`, `src/dialogue/index.ts`
- Test: `tests/dialogue/loader.test.ts`

- [ ] **Step 1: Tip bildirimleri**

`src/dialogue/yarn-raw.d.ts`:

```ts
declare module '*.yarn?raw' {
  const content: string
  export default content
}

declare module 'yarn-bound' {
  interface YarnBoundOptions {
    dialogue: string
    startNode?: string
    variableStorage?: Map<string, unknown>
    combineTextAndOptionsResults?: boolean
    functions?: Record<string, (...args: unknown[]) => unknown>
  }
  export interface TextResult { text: string; isDialogueEnd: boolean; options?: undefined }
  export interface OptionsResult { options: { text: string; isAvailable: boolean }[]; text?: undefined }
  export type YarnResult = TextResult | OptionsResult | { command: string }
  export default class YarnBound {
    constructor(options: YarnBoundOptions)
    currentResult: YarnResult
    advance(optionIndex?: number): void
  }
}
```

- [ ] **Step 2: İlk yarn dosyası (Marcus)**

`src/dialogue/marcus.yarn`:

```
title: Start
---
<<if $heart >= 4>>
Hiçbir şey, üzerine anlam yüklenmedikçe iyi ya da kötü değildir — sadece bir deneyim. Yargıyı sen koyarsın, geri de alırsın.
<<elseif $heart >= 2>>
Ben de zirvedeydim bir zamanlar. Bir çöküş, bir ihanet... Kırılmadım, sadeleştim.
<<else>>
<<if $day % 2 == 0>>
Övgü de yergi de rüzgâr. Sen kayanı sağlam tut.
<<else>>
Satışlar elinde değildi. Yargın, çaban senindi; onları koru, gerisini bırak.
<<endif>>
<<endif>>
===
```

- [ ] **Step 3: Yükleyiciyi yaz**

`src/dialogue/index.ts`:

```ts
import marcus from './marcus.yarn?raw'

const DIALOGUES: Record<string, string> = {
  marcus,
}

export function getDialogue(npcId: string): string | null {
  return DIALOGUES[npcId] ?? null
}

export function hasDialogue(npcId: string): boolean {
  return npcId in DIALOGUES
}
```

- [ ] **Step 4: Yükleyici testi**

`tests/dialogue/loader.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getDialogue, hasDialogue } from '@/dialogue'

describe('dialogue loader', () => {
  it('bilinen NPC için boş olmayan yarn metni döndürür', () => {
    const d = getDialogue('marcus')
    expect(d).toBeTruthy()
    expect(d!).toContain('title: Start')
  })
  it('bilinmeyen NPC için null döndürür', () => {
    expect(getDialogue('yok')).toBeNull()
    expect(hasDialogue('yok')).toBe(false)
  })
})
```

- [ ] **Step 5: Çalıştır + commit**

Run: `npx vitest run tests/dialogue/loader.test.ts`
Expected: PASS.

```bash
git add src/dialogue tests/dialogue/loader.test.ts
git commit -m "feat: yarn diyalog yükleyici + tip bildirimleri + Marcus betiği"
```

---

### Task 3: npcStore — kalp + konuşma akışı

**Files:**
- Create: `src/data/npcs.ts`, `src/store/npcStore.ts`
- Test: `tests/store/npcStore.test.ts`

- [ ] **Step 1: NPC meta verisi (başlangıç)**

`src/data/npcs.ts`:

```ts
export interface NpcDef {
  id:          string
  name:        string
  role:        string
  spot:        { x: number; y: number }   // dünya koordinatı (player x,y uzayında)
  philosophy?: string                      // varsa felsefe etiketi
  isRomance?:  boolean
  letter?:     string                      // max kalpte düşen imza mektubu
}

export const NPCS: NpcDef[] = [
  {
    id: 'marcus', name: 'Marcus Thorne', role: 'Sahaf', philosophy: 'stoa',
    spot: { x: 520, y: 320 },
    letter: 'Hiçbir şey kalıcı değil — ne övgü, ne yergi. Yargını sadeleştir, huzur orada. — Marcus',
  },
]

export function getNpc(id: string): NpcDef | undefined {
  return NPCS.find(n => n.id === id)
}
```

- [ ] **Step 2: npcStore testini yaz (önce test)**

`tests/store/npcStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useNpcStore } from '@/store/npcStore'
import { useDayTimeStore } from '@/store/dayTimeStore'

function reset() {
  useNpcStore.getState().reset()
  useDayTimeStore.getState().reset()
}
beforeEach(reset)

describe('npcStore', () => {
  it('başlangıç durumu boş', () => {
    const s = useNpcStore.getState()
    expect(s.activeNpc).toBeNull()
    expect(s.current).toBeNull()
  })

  it('startTalk aktif NPC ve ilk repliği ayarlar, oyunu duraklatır', () => {
    useNpcStore.getState().startTalk('marcus')
    const s = useNpcStore.getState()
    expect(s.activeNpc).toBe('marcus')
    expect(s.current?.kind).toBe('text')
    expect((s.current as { text: string }).text.length).toBeGreaterThan(0)
    expect(useDayTimeStore.getState().isPaused).toBe(true)
  })

  it('ilk konuşmada kalp artar, aynı gün ikinci konuşmada artmaz', () => {
    useNpcStore.getState().startTalk('marcus')
    const h1 = useNpcStore.getState().hearts['marcus']
    useNpcStore.getState().endTalk()
    useNpcStore.getState().startTalk('marcus')
    const h2 = useNpcStore.getState().hearts['marcus']
    expect(h1).toBe(1)
    expect(h2).toBe(1) // aynı gün tekrar artmaz
  })

  it('endTalk konuşmayı kapatır ve oyunu devam ettirir', () => {
    useNpcStore.getState().startTalk('marcus')
    useNpcStore.getState().endTalk()
    const s = useNpcStore.getState()
    expect(s.activeNpc).toBeNull()
    expect(s.current).toBeNull()
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('yüksek kalpte T3 repliği gelir', () => {
    useNpcStore.setState({ hearts: { marcus: 5 } })
    useNpcStore.getState().startTalk('marcus')
    const text = (useNpcStore.getState().current as { text: string }).text
    expect(text).toContain('anlam yüklenmedikçe')
  })
})
```

- [ ] **Step 3: Testi çalıştır (fail)**

Run: `npx vitest run tests/store/npcStore.test.ts`
Expected: FAIL — `npcStore` yok.

- [ ] **Step 4: npcStore'u yaz**

`src/store/npcStore.ts`:

```ts
import { create } from 'zustand'
import YarnBound from 'yarn-bound'
import { getDialogue } from '@/dialogue'
import { getNpc } from '@/data/npcs'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useLetterStore } from '@/store/letterStore'

export const HEART_MAX = 5

export type DialogSnapshot =
  | { kind: 'text'; speaker: string; text: string; isEnd: boolean }
  | { kind: 'options'; speaker: string; options: string[] }

interface NpcStore {
  activeNpc:   string | null
  hearts:      Record<string, number>
  lastTalkDay: Record<string, number>
  current:     DialogSnapshot | null

  startTalk: (npcId: string) => void
  advance:   (optionIndex?: number) => void
  endTalk:   () => void
  reset:     () => void
}

let runner: YarnBound | null = null

function dayIndex(): number {
  const d = useDayTimeStore.getState()
  return d.weekNumber * 7 + d.dayOfWeek
}

function snapshot(npcName: string): DialogSnapshot | null {
  if (!runner) return null
  const r = runner.currentResult as { text?: string; options?: { text: string }[]; isDialogueEnd?: boolean; command?: string }
  if ('command' in r && r.command) { runner.advance(); return snapshot(npcName) }
  if (r.options) return { kind: 'options', speaker: npcName, options: r.options.map(o => o.text) }
  return { kind: 'text', speaker: npcName, text: r.text ?? '', isEnd: !!r.isDialogueEnd }
}

export const useNpcStore = create<NpcStore>((set, get) => ({
  activeNpc:   null,
  hearts:      {},
  lastTalkDay: {},
  current:     null,

  startTalk: (npcId) => {
    const def = getNpc(npcId)
    const dialogue = getDialogue(npcId)
    if (!def || !dialogue) return

    // Günde bir kalp artışı
    const today = dayIndex()
    const hearts = { ...get().hearts }
    const lastTalkDay = { ...get().lastTalkDay }
    if (lastTalkDay[npcId] !== today) {
      hearts[npcId] = Math.min(HEART_MAX, (hearts[npcId] ?? 0) + 1)
      lastTalkDay[npcId] = today
    }

    // Max kalpte imza mektubu (bir kez)
    if (hearts[npcId] === HEART_MAX && def.letter) {
      useLetterStore.getState().deliver(npcId, def.name, def.letter)
    }

    const storage = new Map<string, unknown>([
      ['heart', hearts[npcId] ?? 0],
      ['day', today],
    ])
    runner = new YarnBound({ dialogue, startNode: 'Start', variableStorage: storage, combineTextAndOptionsResults: true })

    set({ activeNpc: npcId, hearts, lastTalkDay, current: snapshot(def.name) })
    useDayTimeStore.getState().setIsPaused(true)
  },

  advance: (optionIndex) => {
    const { activeNpc, current } = get()
    if (!activeNpc || !runner || !current) return
    if (current.kind === 'text' && current.isEnd) { get().endTalk(); return }
    runner.advance(optionIndex)
    const def = getNpc(activeNpc)!
    set({ current: snapshot(def.name) })
  },

  endTalk: () => {
    runner = null
    set({ activeNpc: null, current: null })
    useDayTimeStore.getState().setIsPaused(false)
  },

  reset: () => {
    runner = null
    set({ activeNpc: null, hearts: {}, lastTalkDay: {}, current: null })
  },
}))
```

- [ ] **Step 5: Çalıştır (Task 4'teki letterStore gerekli — sıra: Task 4'ü önce yapıp dönebilir ya da geçici stub). Not:** `npcStore` `useLetterStore`'a bağımlı; Task 4 letterStore'u oluşturur. Bu görevin testini çalıştırmadan önce Task 4 Step 1-4 tamamlanmalı. İki dosya birlikte commit'lenir.

Run (Task 4 sonrası): `npx vitest run tests/store/npcStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit (Task 4 ile birlikte)**

```bash
git add src/data/npcs.ts src/store/npcStore.ts tests/store/npcStore.test.ts
git commit -m "feat: npcStore — kalp + YarnBound konuşma akışı"
```

---

### Task 4: letterStore + mektup kutusu

**Files:**
- Create: `src/store/letterStore.ts`, `src/components/MektupKutusu.tsx`
- Test: `tests/store/letterStore.test.ts`

- [ ] **Step 1: letterStore testini yaz**

`tests/store/letterStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useLetterStore } from '@/store/letterStore'

beforeEach(() => useLetterStore.getState().reset())

describe('letterStore', () => {
  it('mektup teslim eder', () => {
    useLetterStore.getState().deliver('marcus', 'Marcus Thorne', 'metin')
    expect(useLetterStore.getState().letters).toHaveLength(1)
    expect(useLetterStore.getState().letters[0].npcId).toBe('marcus')
  })
  it('aynı NPC mektubunu iki kez teslim etmez', () => {
    useLetterStore.getState().deliver('marcus', 'Marcus Thorne', 'metin')
    useLetterStore.getState().deliver('marcus', 'Marcus Thorne', 'metin')
    expect(useLetterStore.getState().letters).toHaveLength(1)
  })
  it('okundu işaretler', () => {
    useLetterStore.getState().deliver('marcus', 'Marcus Thorne', 'metin')
    const id = useLetterStore.getState().letters[0].id
    useLetterStore.getState().markRead(id)
    expect(useLetterStore.getState().letters[0].read).toBe(true)
  })
})
```

- [ ] **Step 2: letterStore'u yaz**

`src/store/letterStore.ts`:

```ts
import { create } from 'zustand'

export interface Letter {
  id:     string
  npcId:  string
  from:   string
  text:   string
  read:   boolean
}

interface LetterStore {
  letters: Letter[]
  deliver:  (npcId: string, from: string, text: string) => void
  markRead: (id: string) => void
  reset:    () => void
}

export const useLetterStore = create<LetterStore>((set, get) => ({
  letters: [],
  deliver: (npcId, from, text) => {
    if (get().letters.some(l => l.npcId === npcId)) return
    set(s => ({ letters: [...s.letters, { id: `${npcId}-${Date.now()}`, npcId, from, text, read: false }] }))
  },
  markRead: (id) => set(s => ({ letters: s.letters.map(l => l.id === id ? { ...l, read: true } : l) })),
  reset: () => set({ letters: [] }),
}))
```

- [ ] **Step 3: Çalıştır (fail→pass)**

Run: `npx vitest run tests/store/letterStore.test.ts`
Expected: PASS.

- [ ] **Step 4: MektupKutusu paneli**

`src/components/MektupKutusu.tsx`:

```tsx
import { useLetterStore } from '@/store/letterStore'

export default function MektupKutusu({ onClose }: { onClose: () => void }) {
  const letters  = useLetterStore((s) => s.letters)
  const markRead = useLetterStore((s) => s.markRead)

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#faf0d8] border-4 border-[#c8a050] rounded p-5 w-[28rem] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-[#7a4a1e]">✉️ Mektuplar</h2>
          <button onClick={onClose} className="text-[#7a4a1e]">✕</button>
        </div>
        {letters.length === 0 && <p className="text-[#7a4a1e] text-sm opacity-70">Henüz mektup yok.</p>}
        {letters.map((l) => (
          <div key={l.id} className="mb-3 border-b border-[#c8a050]/40 pb-2" onClick={() => markRead(l.id)}>
            <p className="text-xs font-bold text-[#7a4a1e]">{l.from} {l.read ? '' : '•'}</p>
            <p className="text-sm text-[#3a2a1a] whitespace-pre-line">{l.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/store/letterStore.ts src/components/MektupKutusu.tsx tests/store/letterStore.test.ts
git commit -m "feat: letterStore + Mektuplar kutusu paneli"
```

---

### Task 5: NpcDialog bileşeni

**Files:**
- Create: `src/components/NpcDialog.tsx`

- [ ] **Step 1: NpcDialog'u yaz**

`src/components/NpcDialog.tsx`:

```tsx
import { useEffect } from 'react'
import { useNpcStore } from '@/store/npcStore'

export default function NpcDialog() {
  const activeNpc = useNpcStore((s) => s.activeNpc)
  const current   = useNpcStore((s) => s.current)
  const advance   = useNpcStore((s) => s.advance)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  if (!activeNpc || !current) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40" style={{ userSelect: 'none' }}>
      <div className="bg-[#faf0d8] border-t-4 border-[#c8a050] p-4 min-h-[5rem]">
        <div className="text-xs font-bold text-[#7a4a1e] mb-1">{current.speaker}</div>
        {current.kind === 'text' ? (
          <div className="text-sm text-[#3a2a1a] cursor-pointer" onClick={() => advance()}>
            {current.text}
            <span className="float-right text-[#9a7a4a]">▶</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {current.options.map((opt, i) => (
              <button key={i} onClick={() => advance(i)} className="text-left text-sm text-[#3a2a1a] hover:text-[#7a4a1e]">
                ▸ {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build doğrula + commit**

Run: `npm run build`
Expected: Hatasız.

```bash
git add src/components/NpcDialog.tsx
git commit -m "feat: NpcDialog — YarnBound çıktısını render eden diyalog kutusu"
```

---

### Task 6: Başlangıç içeriği — Greta (sıradan) + Elise (flört)

**Files:**
- Create: `src/dialogue/greta.yarn`, `src/dialogue/elise.yarn`
- Modify: `src/dialogue/index.ts`, `src/data/npcs.ts`
- Test: `tests/data/npcs.test.ts`

- [ ] **Step 1: greta.yarn**

`src/dialogue/greta.yarn`:

```
title: Start
---
<<if $heart >= 4>>
Sen uğrayınca günüm güzelleşiyor. Kendi torunum gibisin.
<<elseif $heart >= 2>>
Oğlum başkente gitti, pek aramıyor. Tezgâh sessiz oluyor bazen.
<<else>>
Bahar geldi, laleler patladı. Al şu demeti, masana koy.
<<endif>>
===
```

- [ ] **Step 2: elise.yarn**

`src/dialogue/elise.yarn`:

```
title: Start
---
<<if $heart >= 4>>
Oyun mu yapıyorsun, büyü mü? Her uğradığında bir saatim nasıl uçuyor anlamıyorum.
<<elseif $heart >= 2>>
Sahnede çalarken hep kapıya bakıyorum — bugün geldin işte.
<<else>>
Yeni bir şarkı yazıyorum. İçinde senin stüdyonun adı geçebilir, kim bilir?
<<endif>>
===
```

- [ ] **Step 3: Yükleyiciye ekle**

`src/dialogue/index.ts` içinde import + map güncelle:

```ts
import marcus from './marcus.yarn?raw'
import greta from './greta.yarn?raw'
import elise from './elise.yarn?raw'

const DIALOGUES: Record<string, string> = {
  marcus,
  greta,
  elise,
}
```

- [ ] **Step 4: npcs.ts'e ekle**

`src/data/npcs.ts` `NPCS` dizisine ekle:

```ts
  {
    id: 'greta', name: 'Greta Lund', role: 'Çiçekçi',
    spot: { x: 300, y: 360 },
    letter: 'Tezgâhımdan en güzel laleyi sana ayırdım. Çiçek de insan da, bakınca açar. — Greta',
  },
  {
    id: 'elise', name: 'Elise Moreau', role: 'Kafe müzisyeni', isRomance: true,
    spot: { x: 460, y: 420 },
    letter: 'Yeni şarkımı bitirdim — adı seninle ilgili. Bir gün dinletirim, eğer korkmazsam. — Elise',
  },
```

- [ ] **Step 5: Veri testi**

`tests/data/npcs.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { NPCS } from '@/data/npcs'
import { hasDialogue } from '@/dialogue'

describe('npc verisi', () => {
  it('her NPC geçerli meta ve diyaloga sahip', () => {
    for (const n of NPCS) {
      expect(n.id).toBeTruthy()
      expect(n.name.trim()).not.toBe('')
      expect(typeof n.spot.x).toBe('number')
      expect(typeof n.spot.y).toBe('number')
      expect(hasDialogue(n.id)).toBe(true)
    }
  })
  it('id\'ler benzersiz', () => {
    const ids = NPCS.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 6: Çalıştır + commit**

Run: `npx vitest run tests/data/npcs.test.ts`
Expected: PASS.

```bash
git add src/dialogue tests/data/npcs.test.ts src/data/npcs.ts
git commit -m "feat: başlangıç NPC içeriği — Greta (sıradan) + Elise (flört)"
```

---

### Task 7: Dünya entegrasyonu — NpcLayer + E tuşu + App render

**Files:**
- Create: `src/pixi/NpcLayer.ts`
- Modify: `src/pixi/Game.ts`, `src/App.tsx`

- [ ] **Step 1: NpcLayer'ı yaz**

`src/pixi/NpcLayer.ts` (Player'daki Graphics + scene-container deseniyle):

```ts
import { Application, Container, Graphics, Text } from 'pixi.js'
import { NPCS } from '@/data/npcs'
import type { WorldScene } from './WorldScene'

const INTERACT_RADIUS = 40

export class NpcLayer {
  private container: Container
  private prompt: Text
  private scene: WorldScene
  private nearbyId: string | null = null

  constructor(app: Application, scene: WorldScene) {
    this.scene = scene
    this.container = new Container()

    for (const npc of NPCS) {
      const g = new Graphics()
      g.rect(npc.spot.x - 8, npc.spot.y - 24, 16, 24).fill({ color: 0x5a8a5a }) // gövde
      g.circle(npc.spot.x, npc.spot.y - 30, 8).fill({ color: 0xffcc99 })        // baş
      const label = new Text({ text: npc.name, style: { fontSize: 10, fill: 0xffffff } })
      label.x = npc.spot.x - 20; label.y = npc.spot.y - 52
      this.container.addChild(g); this.container.addChild(label)
    }

    this.prompt = new Text({ text: 'E ile konuş', style: { fontSize: 11, fill: 0xffe08a } })
    this.prompt.visible = false
    this.container.addChild(this.prompt)

    scene.getContainer().addChild(this.container)
  }

  /** Player konumuna göre en yakın NPC'yi bulur, ipucu konumlandırır. */
  update(px: number, py: number): void {
    let found: string | null = null
    for (const npc of NPCS) {
      const dx = npc.spot.x - px, dy = npc.spot.y - py
      if (dx * dx + dy * dy <= INTERACT_RADIUS * INTERACT_RADIUS) {
        found = npc.id
        this.prompt.x = npc.spot.x - 24; this.prompt.y = npc.spot.y - 68
        break
      }
    }
    this.nearbyId = found
    this.prompt.visible = found !== null
  }

  getNearbyId(): string | null { return this.nearbyId }

  destroy(): void {
    this.scene.getContainer().removeChild(this.container)
  }
}
```

- [ ] **Step 2: Game.ts — NpcLayer + E tuşu kablola**

`src/pixi/Game.ts` değişiklikleri:

(a) import ekle:
```ts
import { NpcLayer } from './NpcLayer'
import { useWorldStore } from '@/store/worldStore'
import { useNpcStore } from '@/store/npcStore'
```

(b) modül değişkenleri (`let player ...` yanına):
```ts
let npcLayer: NpcLayer | null = null
let onNpcKey: ((e: KeyboardEvent) => void) | null = null
```

(c) `player = new Player(...)` ve `player.setPosition(...)` satırlarından sonra:
```ts
  npcLayer = new NpcLayer(app, worldScene)

  onNpcKey = (e: KeyboardEvent) => {
    if (e.code !== 'KeyE') return
    const { gameMode, currentLocation } = useWorldStore.getState()
    if (gameMode !== 'exploration' || currentLocation !== null) return
    if (useNpcStore.getState().activeNpc) return
    const id = npcLayer?.getNearbyId()
    if (id) useNpcStore.getState().startTalk(id)
  }
  window.addEventListener('keydown', onNpcKey)
```

(d) ticker içinde, `worldScene.checkTriggers(x, y)` satırından sonra:
```ts
      npcLayer?.update(x, y)
```

(e) `destroyGame()` içinde, `player?.destroy()` yanına:
```ts
    if (onNpcKey) { window.removeEventListener('keydown', onNpcKey); onNpcKey = null }
    npcLayer?.destroy()
    npcLayer = null
```

- [ ] **Step 3: App.tsx — NpcDialog + MektupKutusu render**

`src/App.tsx`:

(a) import ekle:
```tsx
import NpcDialog from '@/components/NpcDialog'
import MektupKutusu from '@/components/MektupKutusu'
import { useState } from 'react'   // zaten varsa tekrar ekleme
```

(b) Bileşen gövdesinde (diğer `useState`'lerin yanında):
```tsx
  const [mektupAcik, setMektupAcik] = useState(false)
```

(c) Ana render JSX'inin en sonuna (kapanış `</...>`'dan hemen önce), HUD/diğer overlay'lerle aynı seviyede:
```tsx
      <NpcDialog />
      <button
        onClick={() => setMektupAcik(true)}
        className="fixed top-3 right-3 z-30 bg-[#c8a050] text-[#3a2a1a] text-xs px-2 py-1 rounded"
      >
        ✉️ Mektuplar
      </button>
      {mektupAcik && <MektupKutusu onClose={() => setMektupAcik(false)} />}
```

> Not: Buton/konum mevcut HUD ile çakışırsa konumu ayarla; önemli olan `NpcDialog` ve `MektupKutusu`'nun render ağacında olması.

- [ ] **Step 4: Build + manuel duman testi**

Run: `npm run build`
Expected: Hatasız.

Run: `npm run dev`
Keşif modunda bir NPC'ye yaklaş → "E ile konuş" çıkar → `E` → diyalog kutusu açılır, Space/tıklama ilerletir, biter → oyun devam eder. Birkaç gün aynı NPC ile konuş → kalp artışıyla replik değişir. Kalp max olunca "Mektuplar"da imza mektubu görünür.

- [ ] **Step 5: Commit**

```bash
git add src/pixi/NpcLayer.ts src/pixi/Game.ts src/App.tsx
git commit -m "feat: dünyada NPC etkileşimi — NpcLayer, E tuşu, NpcDialog + Mektuplar render"
```

---

### Task 8: Kalan NPC içeriği (veri/içerik authoring)

**Files:**
- Create: `src/dialogue/<npc>.yarn` (her biri), Modify: `src/dialogue/index.ts`, `src/data/npcs.ts`

Spec'teki (`2026-05-30-npc-etkilesim-felsefe-design.md`) kanonik karakter İncili'ni izleyerek kalan NPC'leri ekle. **Yeni kod yok** — yalnızca yeni `.yarn` dosyaları + `index.ts` import'u + `npcs.ts` kaydı (Task 2/6'daki desenin birebir aynısı).

- [ ] **Step 1: Felsefe NPC'leri** — Theo, Magnus, Remy, Nina, Bruno, Søren, Clara, Aldo, Marta, Rex, Vivian. Her biri için `<npc>.yarn` (T1/T2/T3 `<<if $heart>>` katmanları, spec'teki replikler) + `npcs.ts` kaydı (`philosophy`, `letter`) + `index.ts` import.
- [ ] **Step 2: Sıradan/romantizm/kasabalı** — Daniel, Nadia, Cassian, Rosa, Iris, Bjorn, Lena, Sam, Milo, Felix, Hanna, Pjotr, Tomas, Pippa, Otto, Wilhelm&Edith, Marek, Liesl, Bea. Replikler spec'teki gibi; arka plan stub'ları genişledikçe `.yarn` zenginleşir (sonraki içerik turları).
- [ ] **Step 3: Doğrula** — `npx vitest run tests/data/npcs.test.ts` (her NPC'nin diyaloğu var, id'ler benzersiz) PASS.
- [ ] **Step 4: Commit**

```bash
git add src/dialogue src/data/npcs.ts
git commit -m "content: kalan NPC diyalogları (.yarn) eklendi"
```

> Bu görev içerik authoring'dir; spec bible kaynaktır. Spot koordinatları TMX haritasına göre yürünebilir alanlara yerleştirilmeli (dev'de ayarla).

---

### Task 9: Tam doğrulama + DURUM

- [ ] **Step 1:** `npx vitest run` → tüm testler PASS.
- [ ] **Step 2:** `npm run build` → hatasız.
- [ ] **Step 3 (manuel):** `npm run dev` — birden çok NPC ile konuş, kalp/katman geçişi, flört (Elise), mektup kutusu.
- [ ] **Step 4:** `docs/superpowers/DURUM.md` tablosuna ekle:
```markdown
| **NPC Etkileşim & Felsefe (Spec A)** | ✅ Bitti | `specs/2026-05-30-npc-etkilesim-felsefe-design.md` | `plans/2026-05-30-npc-etkilesim-felsefe.md` |
```
ve test sayısını güncelle.
- [ ] **Step 5:** Commit: `git commit -am "docs: NPC etkileşim sistemi (Spec A) tamamlandı"`

---

## Self-Review

**1. Spec coverage:**
- Yarn (YarnBound) + spike-first → Task 1 ✅
- Sabit NPC, yaklaş + E, NpcDialog → Task 5, 7 ✅
- Kalp + 3 katman (`<<if $heart>>`), günlük değişim (`$day`) → Task 2 (yarn), Task 3 (store) ✅
- Felsefe T3 isimsiz öğüt / sıradan dert-dostluk / flört → Task 6 (Greta/Elise), Task 8 (kalanı) ✅
- Mektup kutusu (max kalpte imza, bir kez) → Task 4 + npcStore tetikleyici ✅
- Aile/bağ ağı → içerik (`.yarn` repliklerinde anılır) Task 8; veri `npcs.ts` genişletilebilir ✅
- Test stratejisi → Task 1/2/3/4/6 testleri ✅
- Servis/romantizm-arc/gezme = kapsam dışı (spec'le tutarlı) ✅

**2. Placeholder scan:** Gerçek kod/komut var. Task 8 bir içerik-authoring görevidir (kod değil); deseni Task 2/6'da tam gösterildi, kaynak spec bible. "Stub arka plan" spec'te bilinçli işaretli (iteratif içerik), kod açığı değil.

**3. Type consistency:**
- `getDialogue(npcId): string | null`, `hasDialogue(npcId): boolean` — Task 2 tanım, Task 3/6 kullanım ✅
- `NpcDef` (id/name/role/spot/philosophy?/isRomance?/letter?) — Task 3 tanım, Task 6/8 kullanım ✅
- `useLetterStore.deliver(npcId, from, text)` — Task 4 tanım, Task 3 (npcStore) çağrı ✅ (bağımlılık notu Task 3 Step 5'te)
- `DialogSnapshot` (text|options) — Task 3 tanım, Task 5 (NpcDialog) tüketim ✅
- `HEART_MAX = 5` — Task 3; yarn eşikleri (`>= 4`) T3 ile tutarlı ✅
- YarnBound API (`new YarnBound({dialogue,startNode,variableStorage,combineTextAndOptionsResults})`, `currentResult`, `advance(idx?)`) — Task 1 spike'ta doğrulanır, Task 3'te kullanılır ✅

---

## Kapsam Dışı
- Servis mekanikleri (Avukat/Yatırımcı/Arcade) → kendi spec'leri.
- Romantizm arc (buluşma/ilişki ilerleyişi) — Spec A sadece flört repliği.
- Gezen NPC AI, hediye sistemi, tam kalp etkinlikleri.
- Oyuncu cinsiyetine göre flört yönü (karakter yaratmada cinsiyet yoksa küçük ekleme — ayrı iş).
- Save/load'da kalp/mektup persist'i.
