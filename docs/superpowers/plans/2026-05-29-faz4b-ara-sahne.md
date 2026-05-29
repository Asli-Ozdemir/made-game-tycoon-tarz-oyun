# Faz 4B — Ara Sahne Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stardew Valley tarzı ara sahne sistemi — pixel CSS arka plan, avatar, typewriter diyalog, siyahtan fade geçiş; kovulma ve ilk yayın sahneleriyle birlikte.

**Architecture:** Bağımsız `cutsceneStore` (Zustand) sahne state'ini yönetir. `CutscenePlayer` tam ekran overlay olarak render edilir, App.tsx'te wizard gate'inden sonra tek satır eklenir. Frame geçişi ve sahne kapanışı animasyonları bileşende yönetilir, store sadece flag set eder.

**Tech Stack:** React, TypeScript, Zustand, Tailwind CSS, Vitest

---

## Dosya Haritası

| İşlem | Dosya | Sorumluluk |
|-------|-------|------------|
| Oluştur | `src/types/cutscene.ts` | Tip tanımları |
| Oluştur | `src/data/cutscenes.ts` | Sahne verileri (placeholder diyaloglar) |
| Oluştur | `src/store/cutsceneStore.ts` | State yönetimi |
| Oluştur | `src/components/CutscenePlayer.tsx` | Tam ekran sahne bileşeni |
| Oluştur | `tests/store/cutsceneStore.test.ts` | Store unit testleri |
| Oluştur | `tests/data/cutscenes.test.ts` | Veri doğrulama testleri |
| Değiştir | `src/App.tsx` | Cutscene gate eklenir |
| Değiştir | `src/components/CharacterCreationWizard.tsx` | Kovulma tetikleyicisi |
| Değiştir | `src/components/Dashboard.tsx` | İlk yayın tetikleyicisi + reset |

---

## Task 1: Tip Tanımları

**Files:**
- Create: `src/types/cutscene.ts`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/types/cutscene.ts

export interface DialogLine {
  speaker: string  // "Patron", "{{playerName}}", "Anlatıcı"
  text:    string  // {{playerName}} ve {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'studio'
  lines:      DialogLine[]
}

export type CutsceneId = 'kovulma' | 'ilk_yayin'

export interface CutsceneDef {
  id:     CutsceneId
  frames: CutsceneFrame[]
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun"
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/types/cutscene.ts
git commit -m "feat: cutscene tip tanımları"
```

---

## Task 2: Sahne Verileri + Testler

**Files:**
- Create: `src/data/cutscenes.ts`
- Create: `tests/data/cutscenes.test.ts`

- [ ] **Step 1: Önce testi yaz**

```typescript
// tests/data/cutscenes.test.ts
import { describe, it, expect } from 'vitest'
import { CUTSCENES } from '@/data/cutscenes'
import type { CutsceneId } from '@/types/cutscene'

const ALL_IDS: CutsceneId[] = ['kovulma', 'ilk_yayin']

describe('cutscenes verisi', () => {
  it('her sahne ID\'si mevcut', () => {
    for (const id of ALL_IDS) {
      expect(CUTSCENES[id]).toBeDefined()
      expect(CUTSCENES[id].id).toBe(id)
    }
  })

  it('her sahnenin en az bir frame\'i var', () => {
    for (const id of ALL_IDS) {
      expect(CUTSCENES[id].frames.length).toBeGreaterThan(0)
    }
  })

  it('her frame\'in en az bir diyalog satırı var', () => {
    for (const id of ALL_IDS) {
      for (const frame of CUTSCENES[id].frames) {
        expect(frame.lines.length).toBeGreaterThan(0)
      }
    }
  })

  it('her satırın boş olmayan speaker ve text\'i var', () => {
    for (const id of ALL_IDS) {
      for (const frame of CUTSCENES[id].frames) {
        for (const line of frame.lines) {
          expect(line.speaker.trim()).not.toBe('')
          expect(line.text.trim()).not.toBe('')
        }
      }
    }
  })

  it('her frame\'in geçerli bir background tipi var', () => {
    const valid = new Set(['office', 'bedroom', 'studio'])
    for (const id of ALL_IDS) {
      for (const frame of CUTSCENES[id].frames) {
        expect(valid.has(frame.background)).toBe(true)
      }
    }
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun"
npx vitest run tests/data/cutscenes.test.ts
```

Beklenen: FAIL (modül bulunamadı).

- [ ] **Step 3: Veri dosyasını oluştur**

```typescript
// src/data/cutscenes.ts
import type { CutsceneId, CutsceneDef } from '@/types/cutscene'

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  kovulma: {
    id: 'kovulma',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Patron',         text: '[PLACEHOLDER] Seni işten çıkarmak zorundayım.' },
          { speaker: '{{playerName}}', text: '[PLACEHOLDER] Anlamıyorum, neden?' },
          { speaker: 'Patron',         text: '[PLACEHOLDER] Bütçe kısıtlamaları. Üzgünüm.' },
        ],
      },
      {
        background: 'bedroom',
        lines: [
          { speaker: 'Anlatıcı', text: '[PLACEHOLDER] Kutuyu topladın ve kapıdan çıktın.' },
          { speaker: 'Anlatıcı', text: '[PLACEHOLDER] Belki de bu bir başlangıçtı.' },
        ],
      },
    ],
  },
  ilk_yayin: {
    id: 'ilk_yayin',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] İlk oyunun yayında.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Sonunda...' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} adını dünyaya duyuruyorsun.' },
        ],
      },
    ],
  },
}
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```bash
npx vitest run tests/data/cutscenes.test.ts
```

Beklenen: 5 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/cutscenes.ts tests/data/cutscenes.test.ts
git commit -m "feat: cutscene sahne verileri ve testler"
```

---

## Task 3: cutsceneStore + Testler

**Files:**
- Create: `src/store/cutsceneStore.ts`
- Create: `tests/store/cutsceneStore.test.ts`

- [ ] **Step 1: Önce testi yaz**

```typescript
// tests/store/cutsceneStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'

function resetAll() {
  useCutsceneStore.setState({
    activeCutscene:  null,
    frameIndex:      0,
    lineIndex:       0,
    displayedText:   '',
    isTyping:        false,
    isTransitioning: false,
    isEnding:        false,
    seenCutscenes:   new Set(),
  })
  useDayTimeStore.getState().reset()
}

beforeEach(resetAll)

describe('cutsceneStore', () => {
  it('başlangıç state\'i doğru', () => {
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(false)
    expect(s.isTransitioning).toBe(false)
    expect(s.isEnding).toBe(false)
    expect(s.seenCutscenes.size).toBe(0)
  })

  it('startCutscene sahneyi başlatır ve index\'leri sıfırlar', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBe('kovulma')
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(true)
  })

  it('startCutscene oyunu duraklatır', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    expect(useDayTimeStore.getState().isPaused).toBe(true)
  })

  it('startCutscene seenCutscenes\'te varsa hiçbir şey yapmaz', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['kovulma']) })
    useCutsceneStore.getState().startCutscene('kovulma')
    expect(useCutsceneStore.getState().activeCutscene).toBeNull()
  })

  it('advance — isTyping true\'yken finishTyping çağırır', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ displayedText: 'kısa', isTyping: true })
    useCutsceneStore.getState().advance()
    const s = useCutsceneStore.getState()
    // finishTyping tüm metni göstermeli
    expect(s.isTyping).toBe(false)
    expect(s.displayedText).not.toBe('kısa') // tam metin geldi
  })

  it('advance — sonraki satıra geçer', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isTyping: false })
    useCutsceneStore.getState().advance()
    const s = useCutsceneStore.getState()
    expect(s.lineIndex).toBe(1)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(true)
  })

  it('advance — son satırda frame geçişini başlatır', () => {
    // kovulma frame 0 = 3 satır (index 0,1,2) → son satır index 2
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ lineIndex: 2, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isTransitioning).toBe(true)
    expect(useCutsceneStore.getState().frameIndex).toBe(0) // henüz değişmedi
  })

  it('nextFrame — frameIndex\'i artırır ve isTransitioning\'i temizler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ lineIndex: 2, isTyping: false, isTransitioning: true })
    useCutsceneStore.getState().nextFrame()
    const s = useCutsceneStore.getState()
    expect(s.frameIndex).toBe(1)
    expect(s.lineIndex).toBe(0)
    expect(s.isTransitioning).toBe(false)
    expect(s.isTyping).toBe(true)
    expect(s.displayedText).toBe('')
  })

  it('advance — son frame\'in son satırında isEnding\'i set eder', () => {
    // kovulma frame 1 = 2 satır (index 0,1) → son satır index 1
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ frameIndex: 1, lineIndex: 1, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isEnding).toBe(true)
    expect(useCutsceneStore.getState().activeCutscene).toBe('kovulma') // henüz kapanmadı
  })

  it('endCutscene — sahneyi kapatır ve seenCutscenes\'e ekler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isEnding: true })
    useCutsceneStore.getState().endCutscene()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.has('kovulma')).toBe(true)
    expect(s.isEnding).toBe(false)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('skip — sahneyi kapatır, seenCutscenes\'e ekler, oyunu devam ettirir', () => {
    useCutsceneStore.getState().startCutscene('ilk_yayin')
    useCutsceneStore.getState().skip()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.has('ilk_yayin')).toBe(true)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('reset — tüm state\'i ve seenCutscenes\'i temizler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().skip()
    useCutsceneStore.getState().reset()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.size).toBe(0)
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
  })

  it('tick — displayedText\'e karakter ekler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().tick('M')
    useCutsceneStore.getState().tick('e')
    useCutsceneStore.getState().tick('r')
    expect(useCutsceneStore.getState().displayedText).toBe('Mer')
  })

  it('finishTyping — mevcut satırın tüm metnini gösterir', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    // frame 0, line 0 = '[PLACEHOLDER] Seni işten çıkarmak zorundayım.'
    useCutsceneStore.getState().finishTyping()
    const s = useCutsceneStore.getState()
    expect(s.displayedText).toBe('[PLACEHOLDER] Seni işten çıkarmak zorundayım.')
    expect(s.isTyping).toBe(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

```bash
npx vitest run tests/store/cutsceneStore.test.ts
```

Beklenen: FAIL (modül bulunamadı).

- [ ] **Step 3: Store'u oluştur**

```typescript
// src/store/cutsceneStore.ts
import { create } from 'zustand'
import { CUTSCENES } from '@/data/cutscenes'
import { useDayTimeStore } from '@/store/dayTimeStore'
import type { CutsceneId } from '@/types/cutscene'

interface CutsceneStore {
  activeCutscene:  CutsceneId | null
  frameIndex:      number
  lineIndex:       number
  displayedText:   string
  isTyping:        boolean
  isTransitioning: boolean
  isEnding:        boolean
  seenCutscenes:   Set<CutsceneId>

  startCutscene: (id: CutsceneId) => void
  advance:       () => void
  tick:          (char: string) => void
  finishTyping:  () => void
  nextFrame:     () => void
  endCutscene:   () => void
  skip:          () => void
  reset:         () => void
}

export const useCutsceneStore = create<CutsceneStore>((set, get) => ({
  activeCutscene:  null,
  frameIndex:      0,
  lineIndex:       0,
  displayedText:   '',
  isTyping:        false,
  isTransitioning: false,
  isEnding:        false,
  seenCutscenes:   new Set(),

  startCutscene: (id) => {
    if (get().seenCutscenes.has(id)) return
    set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(true)
  },

  advance: () => {
    const { activeCutscene, isTyping, frameIndex, lineIndex } = get()
    if (!activeCutscene) return

    // 1. Hâlâ yazıyorsa hemen bitir
    if (isTyping) {
      get().finishTyping()
      return
    }

    const def = CUTSCENES[activeCutscene]
    const currentFrame = def.frames[frameIndex]

    // 2. Aynı frame'de sonraki satır var
    if (lineIndex < currentFrame.lines.length - 1) {
      set({ lineIndex: lineIndex + 1, displayedText: '', isTyping: true })
      return
    }

    // 3. Sonraki frame var — bileşen isTransitioning'i izler
    if (frameIndex < def.frames.length - 1) {
      set({ isTransitioning: true })
      return
    }

    // 4. Son frame'in son satırı — bileşen isEnding'i izler
    set({ isEnding: true })
  },

  tick: (char) => set((s) => ({ displayedText: s.displayedText + char })),

  finishTyping: () => {
    const { activeCutscene, frameIndex, lineIndex } = get()
    if (!activeCutscene) return
    const fullText = CUTSCENES[activeCutscene].frames[frameIndex].lines[lineIndex].text
    set({ displayedText: fullText, isTyping: false })
  },

  nextFrame: () => {
    const { frameIndex } = get()
    set({ frameIndex: frameIndex + 1, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false })
  },

  endCutscene: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isEnding: false })
    useDayTimeStore.getState().setIsPaused(false)
  },

  skip: () => {
    const { activeCutscene } = get()
    if (!activeCutscene) return
    const newSeen = new Set(get().seenCutscenes)
    newSeen.add(activeCutscene)
    set({ activeCutscene: null, seenCutscenes: newSeen, isTransitioning: false, isEnding: false })
    useDayTimeStore.getState().setIsPaused(false)
  },

  reset: () => set({
    activeCutscene:  null,
    frameIndex:      0,
    lineIndex:       0,
    displayedText:   '',
    isTyping:        false,
    isTransitioning: false,
    isEnding:        false,
    seenCutscenes:   new Set(),
  }),
}))
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

```bash
npx vitest run tests/store/cutsceneStore.test.ts
```

Beklenen: 13 test PASS.

- [ ] **Step 5: Tüm testlerin hâlâ geçtiğini doğrula**

```bash
npx vitest run
```

Beklenen: tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/cutsceneStore.ts tests/store/cutsceneStore.test.ts
git commit -m "feat: cutsceneStore — state yönetimi ve testler"
```

---

## Task 4: CutscenePlayer Bileşeni

**Files:**
- Create: `src/components/CutscenePlayer.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/CutscenePlayer.tsx
import { useEffect, useState } from 'react'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { CUTSCENES } from '@/data/cutscenes'
import type { CutsceneFrame } from '@/types/cutscene'

// Placeholder metinlerdeki {{playerName}} ve {{studioName}} yerlerine gerçek değerleri koy
function replacePlaceholders(text: string, name: string, studioName: string): string {
  return text
    .replace(/\{\{playerName\}\}/g, name || 'Sen')
    .replace(/\{\{studioName\}\}/g, studioName || 'Stüdyon')
}

// CSS pixel art arka planları
function SceneBackground({ type }: { type: CutsceneFrame['background'] }) {
  const gridTexture = {
    backgroundImage:
      'repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(0,0,0,0.12) 8px),' +
      'repeating-linear-gradient(90deg,transparent,transparent 7px,rgba(0,0,0,0.12) 8px)',
  } as const

  if (type === 'office') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a0505 0%,#2d0d0d 50%,#1a0505 100%)', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
        {/* Pencere */}
        <div style={{ position: 'absolute', top: 40, left: 60, width: 80, height: 100, background: '#0a1520', border: '4px solid #5a3a2a' }}>
          <div style={{ width: '100%', height: '50%', borderBottom: '4px solid #5a3a2a', background: '#0e2035' }} />
        </div>
        {/* Masa */}
        <div style={{ position: 'absolute', bottom: 90, left: '20%', right: '10%', height: 12, background: '#5a3010', borderTop: '4px solid #7a4a20' }} />
        <div style={{ position: 'absolute', bottom: 78, left: '22%', width: 10, height: 14, background: '#4a2010' }} />
        <div style={{ position: 'absolute', bottom: 78, right: '13%', width: 10, height: 14, background: '#4a2010' }} />
      </div>
    )
  }

  if (type === 'bedroom') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#050518 0%,#0a0a2d 50%,#050518 100%)', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
        {/* Ay ışıklı pencere */}
        <div style={{ position: 'absolute', top: 30, right: 80, width: 70, height: 90, background: '#0a1530', border: '4px solid #2a2a5a' }}>
          <div style={{ width: '100%', height: '50%', borderBottom: '4px solid #2a2a5a', background: '#0d1f45' }} />
        </div>
        {/* Yatak */}
        <div style={{ position: 'absolute', bottom: 90, left: '15%', width: '40%', height: 16, background: '#3a2a1a', borderTop: '4px solid #5a3a2a' }} />
        <div style={{ position: 'absolute', bottom: 104, left: '15%', width: 24, height: 28, background: '#4a3a2a', border: '4px solid #5a3a2a' }} />
      </div>
    )
  }

  // studio
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#020210 0%,#050520 50%,#020210 100%)', imageRendering: 'pixelated' }}>
      <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
      {/* Bilgisayar ekranı parıltısı */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 130, height: 90, background: '#0a1540', border: '4px solid #1a2a6a', boxShadow: '0 0 40px #1a3a8a' }}>
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0d1f55 0%,#1a3a8a 100%)', opacity: 0.8 }} />
      </div>
      {/* Masa */}
      <div style={{ position: 'absolute', bottom: 90, left: '10%', right: '10%', height: 12, background: '#1a1a3a', borderTop: '4px solid #2a2a5a' }} />
    </div>
  )
}

// CSS pixel silüet avatar
function PixelAvatar({ isPlayer }: { isPlayer: boolean }) {
  const bodyColor  = isPlayer ? '#3a5a8a' : '#5a2a2a'
  const headColor  = isPlayer ? '#4a6a9a' : '#6a3a3a'
  const borderColor = '#c8a050'

  return (
    <div style={{
      width: 44,
      height: 44,
      border: `2px solid ${borderColor}`,
      borderRadius: 0,
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      background: '#1a1a1a',
      imageRendering: 'pixelated',
    }}>
      {/* Gövde */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 22, height: 18, background: bodyColor }} />
      {/* Baş */}
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, background: headColor, borderRadius: '50%' }} />
    </div>
  )
}

export default function CutscenePlayer() {
  const {
    activeCutscene,
    frameIndex,
    lineIndex,
    displayedText,
    isTyping,
    isTransitioning,
    isEnding,
    advance,
    nextFrame,
    endCutscene,
    skip,
    tick,
  } = useCutsceneStore()

  const playerName  = useCharacterStore((s) => s.name)
  const studioName  = useCharacterStore((s) => s.studioName)

  // Siyah overlay opacity'si: 1 = tam siyah, 0 = sahne görünür
  const [blackOpacity, setBlackOpacity] = useState(1)

  // İlk açılış: siyahtan fade-in
  useEffect(() => {
    const t = setTimeout(() => setBlackOpacity(0), 50)
    return () => clearTimeout(t)
  }, [])

  // Frame geçişi: isTransitioning → fade-out → nextFrame → fade-in
  useEffect(() => {
    if (!isTransitioning) return
    setBlackOpacity(1)
    const t = setTimeout(() => {
      nextFrame()
      setBlackOpacity(0)
    }, 200)
    return () => clearTimeout(t)
  }, [isTransitioning, nextFrame])

  // Sahne bitişi: isEnding → fade-out → endCutscene
  useEffect(() => {
    if (!isEnding) return
    setBlackOpacity(1)
    const t = setTimeout(() => endCutscene(), 400)
    return () => clearTimeout(t)
  }, [isEnding, endCutscene])

  // Typewriter: her 30ms'de bir karakter ekle
  useEffect(() => {
    if (!isTyping || !activeCutscene) return
    const id = setInterval(() => {
      const state = useCutsceneStore.getState()
      if (!state.isTyping || !state.activeCutscene) { clearInterval(id); return }
      const def = CUTSCENES[state.activeCutscene]
      const fullText = def.frames[state.frameIndex].lines[state.lineIndex].text
      if (state.displayedText.length >= fullText.length) {
        useCutsceneStore.getState().finishTyping()
        clearInterval(id)
        return
      }
      useCutsceneStore.getState().tick(fullText[state.displayedText.length])
    }, 30)
    return () => clearInterval(id)
  }, [isTyping, activeCutscene, lineIndex, frameIndex, tick])

  // Klavye: Space / Enter → advance
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  if (!activeCutscene) return null

  const def          = CUTSCENES[activeCutscene]
  const currentFrame = def.frames[frameIndex]
  const currentLine  = currentFrame.lines[lineIndex]
  const isPlayer     = currentLine.speaker.includes('{{playerName}}')
  const speakerName  = replacePlaceholders(currentLine.speaker, playerName, studioName)
  const lineText     = replacePlaceholders(displayedText, playerName, studioName)

  function handleSkip() {
    setBlackOpacity(1)
    setTimeout(() => skip(), 400)
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={advance}
    >
      {/* Sahne arka planı */}
      <SceneBackground type={currentFrame.background} />

      {/* Atla butonu */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSkip() }}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(0,0,0,0.5)', color: '#ccc',
          border: '1px solid #555', padding: '4px 10px',
          fontSize: 12, cursor: 'pointer', zIndex: 10,
          fontFamily: 'monospace',
        }}
      >
        Atla &gt;&gt;
      </button>

      {/* Diyalog kutusu */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#faf0d8',
        borderTop: '3px solid #c8a050',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        minHeight: 72,
        zIndex: 10,
      }}>
        <PixelAvatar isPlayer={isPlayer} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#7a4a1e', marginBottom: 4, fontFamily: 'monospace' }}>
            {speakerName}
          </div>
          <div style={{ fontSize: 13, color: '#3a2a1a', fontFamily: 'monospace', lineHeight: 1.5 }}>
            {lineText}
            {isTyping && <span style={{ animation: 'none' }}>_</span>}
          </div>
        </div>
        {!isTyping && (
          <div style={{ fontSize: 16, color: '#9a7a4a', alignSelf: 'flex-end' }}>▶</div>
        )}
      </div>

      {/* Siyah overlay — fade geçişleri için */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        opacity: blackOpacity,
        transition: 'opacity 400ms ease',
        pointerEvents: 'none',
        zIndex: 20,
      }} />
    </div>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/CutscenePlayer.tsx
git commit -m "feat: CutscenePlayer bileşeni — pixel CSS sahne, avatar, typewriter, fade"
```

---

## Task 5: App.tsx Entegrasyonu

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Mevcut dosyayı oku**

`src/App.tsx` satır 87'yi bul:
```tsx
if (!isCreated) return <CharacterCreationWizard />
```

- [ ] **Step 2: Import ve gate ekle**

`src/App.tsx` başına import ekle:
```tsx
import CutscenePlayer from '@/components/CutscenePlayer'
import { useCutsceneStore } from '@/store/cutsceneStore'
```

`useCharacterStore` hook'larının yanına şunu ekle:
```tsx
const activeCutscene = useCutsceneStore((s) => s.activeCutscene)
```

`if (!isCreated) return <CharacterCreationWizard />` satırından hemen sonra:
```tsx
if (activeCutscene) return <CutscenePlayer />
```

Sonuç olarak bu iki satır yan yana olmalı:
```tsx
if (!isCreated)     return <CharacterCreationWizard />
if (activeCutscene) return <CutscenePlayer />
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx cutscene gate entegrasyonu"
```

---

## Task 6: CharacterCreationWizard — Kovulma Tetikleyicisi

**Files:**
- Modify: `src/components/CharacterCreationWizard.tsx`

- [ ] **Step 1: Import ekle**

`src/components/CharacterCreationWizard.tsx` dosyasına:
```tsx
import { useCutsceneStore } from '@/store/cutsceneStore'
```

- [ ] **Step 2: handleFinalize içine tetikleyiciyi ekle**

Mevcut `handleFinalize`:
```ts
function handleFinalize(name: string, studioName: string) {
  useCharacterStore.getState().setIdentity(name, studioName)
  const bg = BACKGROUNDS.find((b) => b.id === background)!
  setMoney(bg.houseSale)
  if (bg.startRep > 0) setRep(bg.startRep)
  finalize()
}
```

`finalize()` satırından sonra ekle:
```ts
  finalize()
  useCutsceneStore.getState().startCutscene('kovulma')
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/components/CharacterCreationWizard.tsx
git commit -m "feat: CharacterCreationWizard kovulma sahnesi tetikleyicisi"
```

---

## Task 7: Dashboard — İlk Yayın + Yeni Oyun

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Import ekle**

`src/components/Dashboard.tsx` dosyasına:
```tsx
import { useCutsceneStore } from '@/store/cutsceneStore'
```

- [ ] **Step 2: handlePublish içine ilk yayın tetikleyicisini ekle**

Mevcut `handlePublish` içinde `incrementPub()` satırından sonra:
```ts
  incrementPub()
  if (useGameStore.getState().totalPublished === 1) {
    useCutsceneStore.getState().startCutscene('ilk_yayin')
  }
  unassignFromProject(projectId)
  onPublishResult(projectId)
```

> **Not:** `incrementPub()` önce çağrılır. `totalPublished === 1` kontrolü, az önce arttırılan değeri okur — yani ilk yayında `1` olur. Sonraki yayınlarda `> 1` olduğu için sahne çalışmaz.

- [ ] **Step 3: handleNewGame içine reset ekle**

Mevcut `handleNewGame`:
```ts
function handleNewGame() {
  if (!window.confirm('Mevcut oyun silinecek. Devam etmek istiyor musun?')) return
  useCharacterStore.getState().reset()
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useEmployeeStore.getState().reset()
  useTimeStore.getState().reset()
  useDayTimeStore.getState().reset()
}
```

Listesinin sonuna ekle:
```ts
  useCutsceneStore.getState().reset()
```

- [ ] **Step 4: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Beklenen: hata yok.

- [ ] **Step 5: Tüm testleri çalıştır**

```bash
npx vitest run
```

Beklenen: tüm testler PASS (önceki 56 + yeni 18 = 74 test).

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: Dashboard ilk yayın sahnesi ve yeni oyun reset entegrasyonu"
```

---

## Task 8: Son Kontrol ve Push

- [ ] **Step 1: Tüm testler geçiyor mu?**

```bash
npx vitest run
```

Beklenen: tüm testler PASS, hiç FAIL yok.

- [ ] **Step 2: Build çalışıyor mu?**

```bash
npm run build
```

Beklenen: hata yok.

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: DURUM.md güncelle**

`docs/superpowers/DURUM.md` dosyasını güncelle:

```markdown
| **Faz 4B — Ara Sahne Sistemi** | ✅ Bitti | `specs/2026-05-29-faz4b-ara-sahne-design.md` | `plans/2026-05-29-faz4b-ara-sahne.md` |
```

`Devam Edilecek` bölümünü **Faz 4C — Rakip Şirket Arc'ı** olarak güncelle.

```bash
git add docs/superpowers/DURUM.md
git commit -m "docs: DURUM.md Faz 4B tamamlandı"
git push
```
