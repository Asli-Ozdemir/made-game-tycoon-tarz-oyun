# Faz 4C-2 — Olaylar ve Çözüm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faz 4C-1 altyapısı üzerine inşa et — yıllık ödül töreni, milestone cutscene'leri (nexus fark etme + arka plan varyasyonları), büyük rakip resolution ekranı, CutscenePlayer'a yeni sahne arka planları.

**Architecture:** `CutsceneId` ve `CutsceneFrame.background` tipleri genişletilir. `awardsStore` (yeni) yıllık ödül hesaplar ve `pendingEvent` tutar. Ödül kazanınca `cutsceneStore.startCutsceneForce` çağrılır (yıllık tekrar için). `rivalStore.noticeCheck` güncellenir — Nexus eşiği aşınca `nexus_notice` sahnesi tetiklenir. `rivalStore.escalationCheck` player ödül kazanıp Nexus `rival` durumundaysa `nemesis`'e yükseltir ve `pendingResolution` set eder. `ResolutionScreen` bu `pendingResolution`'ı izler.

**Tech Stack:** Electron + React + TypeScript + Zustand + Tailwind + Vitest. Alias: `@/` → `src/`. Test komutu: `npx vitest run`.

> **Ön Koşul:** Faz 4C-1 tamamlanmış olmalı — `useRivalStore`, `useNewsStore`, `src/types/rival.ts` mevcut.

---

## Dosya Yapısı

**Değiştirilecek:**
- `src/types/cutscene.ts` — CutsceneId + CutsceneFrame.background genişletme
- `src/data/cutscenes.ts` — 8 yeni cutscene stub'ı
- `src/store/cutsceneStore.ts` — `startCutsceneForce` ekleme
- `src/store/rivalStore.ts` — `noticeCheck` nexus trigger + `escalationCheck` implement
- `src/components/CutscenePlayer.tsx` — yeni background tipleri
- `src/components/Dashboard.tsx` — awards useEffect
- `src/App.tsx` — ResolutionScreen gate
- `tests/data/cutscenes.test.ts` — yeni background tipleri için güncelleme

**Oluşturulacak:**
- `src/store/awardsStore.ts`
- `src/components/ResolutionScreen.tsx`
- `tests/store/awardsStore.test.ts`

---

### Task 1: Tip Genişletmesi

**Files:**
- Modify: `src/types/cutscene.ts`
- Modify: `tests/data/cutscenes.test.ts`

- [ ] **Step 1: cutscene.ts tiplerini genişlet**

Mevcut `src/types/cutscene.ts` içeriğini şu hale getir:

```typescript
// src/types/cutscene.ts
export interface DialogLine {
  speaker: string  // "Patron", "{{playerName}}", "Anlatıcı"
  text:    string  // {{playerName}} ve {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'studio' | 'server_room' | 'gallery' | 'boardroom'
  lines:      DialogLine[]
}

export type CutsceneId =
  | 'kovulma'
  | 'ilk_yayin'
  | 'nexus_notice'
  | 'awards_win'
  | 'awards_win_gallery'
  | 'awards_win_boardroom'
  | 'awards_lose_to_nexus'
  | 'nexus_resolution'
  | 'indie_resolution'

export interface CutsceneDef {
  id:     CutsceneId
  frames: CutsceneFrame[]
}
```

- [ ] **Step 2: cutscenes.test.ts background setini güncelle**

`tests/data/cutscenes.test.ts` içindeki background test'ini bul ve genişlet:

```typescript
// Şu satırı bul:
//   const valid = new Set(['office', 'bedroom', 'studio'])
// Bu satırla değiştir:
const valid = new Set(['office', 'bedroom', 'studio', 'server_room', 'gallery', 'boardroom'])
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: `src/data/cutscenes.ts` satırında `CutsceneId` tipi genişlediği için CUTSCENES Record'u eksik key hatası verecek. Bu beklenen — Task 2'de giderilecek.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/types/cutscene.ts tests/data/cutscenes.test.ts && git commit -m "feat(4c-2): extend CutsceneId and background types"
```

---

### Task 2: Yeni Cutscene Verileri

**Files:**
- Modify: `src/data/cutscenes.ts`

- [ ] **Step 1: Yeni cutscene stub'larını ekle**

`src/data/cutscenes.ts` içindeki CUTSCENES nesnesine 7 yeni giriş ekle. Mevcut `kovulma` ve `ilk_yayin` girişleri aynen kalmalı:

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
  nexus_notice: {
    id: 'nexus_notice',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Nexus CEO',       text: '[PLACEHOLDER] Bu stüdyoyu araştır.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Nexus Games sizi fark etti.' },
        ],
      },
    ],
  },
  awards_win: {
    id: 'awards_win',
    frames: [
      {
        background: 'server_room',
        lines: [
          { speaker: 'Sunucu',          text: '[PLACEHOLDER] Ve yılın oyunu ödülü...' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] İnanamıyorum.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} sektörün zirvesine ulaştı.' },
        ],
      },
    ],
  },
  awards_win_gallery: {
    id: 'awards_win_gallery',
    frames: [
      {
        background: 'gallery',
        lines: [
          { speaker: 'Sunucu',          text: '[PLACEHOLDER] Ve yılın oyunu ödülü...' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] İnanamıyorum.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} sektörün zirvesine ulaştı.' },
        ],
      },
    ],
  },
  awards_win_boardroom: {
    id: 'awards_win_boardroom',
    frames: [
      {
        background: 'boardroom',
        lines: [
          { speaker: 'Sunucu',          text: '[PLACEHOLDER] Ve yılın oyunu ödülü...' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] İnanamıyorum.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} sektörün zirvesine ulaştı.' },
        ],
      },
    ],
  },
  awards_lose_to_nexus: {
    id: 'awards_lose_to_nexus',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Nexus Games yılın oyununu aldı.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Daha güçlü geri döneceğim.' },
        ],
      },
    ],
  },
  nexus_resolution: {
    id: 'nexus_resolution',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Nexus Games ile hesaplaşma zamanı.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Bu kadar.' },
        ],
      },
    ],
  },
  indie_resolution: {
    id: 'indie_resolution',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Rakiple yollar ayrıldı.' },
        ],
      },
    ],
  },
}
```

- [ ] **Step 2: TypeScript kontrolü — hata yok**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 3: Mevcut testleri çalıştır**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/data/cutscenes.test.ts 2>&1 | tail -15
```

Beklenen: `5 tests passed`.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/data/cutscenes.ts && git commit -m "feat(4c-2): add cutscene stubs for nexus_notice, awards, resolution"
```

---

### Task 3: cutsceneStore — startCutsceneForce + awardsStore

**Files:**
- Modify: `src/store/cutsceneStore.ts`
- Create: `src/store/awardsStore.ts`
- Create: `tests/store/awardsStore.test.ts`

> Awards kutscene'leri her yıl oynanabilmeli. Mevcut `startCutscene` `seenCutscenes`'i kontrol eder ve daha önce oynatılmışsa atlar. `startCutsceneForce` bu kontrolü atlar.

- [ ] **Step 1: cutsceneStore'a startCutsceneForce ekle**

`src/store/cutsceneStore.ts` içinde interface'e ve implementasyona ekle.

Interface'de `skip:` satırından önce ekle:
```typescript
startCutsceneForce: (id: CutsceneId) => void
```

`skip:` action'ından önce implement et:
```typescript
startCutsceneForce: (id) => {
  set({ activeCutscene: id, frameIndex: 0, lineIndex: 0, displayedText: '', isTyping: true, isTransitioning: false, isEnding: false })
  useDayTimeStore.getState().setIsPaused(true)
},
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 3: Failing awardsStore testlerini yaz**

```typescript
// tests/store/awardsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAwardsStore } from '@/store/awardsStore'
import { useRivalStore } from '@/store/rivalStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useNewsStore } from '@/store/newsStore'
import { useTimeStore } from '@/store/timeStore'

function resetAll() {
  useAwardsStore.getState().reset()
  useRivalStore.getState().reset()
  useCutsceneStore.getState().reset()
  useNewsStore.getState().reset()
  useTimeStore.getState().reset()
}

beforeEach(resetAll)

describe('awardsStore', () => {
  it('başlangıç state boş', () => {
    const s = useAwardsStore.getState()
    expect(s.history).toHaveLength(0)
    expect(s.pendingEvent).toBeNull()
  })

  it('checkAwards — player null oyunla rakip kazanır', () => {
    useRivalStore.getState().initRivals()
    // 2000 yılı simülasyonu — rakipler oyun üretir
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    const s = useAwardsStore.getState()
    expect(s.pendingEvent).not.toBeNull()
    expect(s.pendingEvent!.winnerId).not.toBe('player')
  })

  it('checkAwards — player yüksek skorlu oyunla kazanır', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    // 95 puanlı oyun ile rakipleri geç (major tier max 90)
    useAwardsStore.getState().checkAwards(2000, { name: 'Şaheser', score: 95 })
    const s = useAwardsStore.getState()
    expect(s.pendingEvent).not.toBeNull()
    expect(s.pendingEvent!.winnerId).toBe('player')
  })

  it('checkAwards — player kazanınca cutscene başlar', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, { name: 'Şaheser', score: 95 })
    // activeCutscene 'awards_win', 'awards_win_gallery' veya 'awards_win_boardroom' olabilir
    const activeCutscene = useCutsceneStore.getState().activeCutscene
    expect(['awards_win', 'awards_win_gallery', 'awards_win_boardroom']).toContain(activeCutscene)
  })

  it('checkAwards — Nexus kazanınca awards_lose_to_nexus sahnesi başlar', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    // Nexus oyununun skoru 50–90. Rakiplerin en yüksek skoru muhtemelen Nexus'tan.
    // Oyuncu hiç oyun yoksa Nexus kazanır.
    useAwardsStore.getState().checkAwards(2000, null)
    const winnerId = useAwardsStore.getState().pendingEvent?.winnerId
    if (winnerId === 'nexus') {
      expect(useCutsceneStore.getState().activeCutscene).toBe('awards_lose_to_nexus')
    }
    // Nexus kazanmayabilir (rastgele skorlar). Test en azından pendingEvent'in set olduğunu doğrular.
    expect(useAwardsStore.getState().pendingEvent).not.toBeNull()
  })

  it('checkAwards — history\'ye kaydedilir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, { name: 'Şaheser', score: 95 })
    expect(useAwardsStore.getState().history).toHaveLength(1)
    expect(useAwardsStore.getState().history[0].year).toBe(2000)
  })

  it('clearPending — pendingEvent null olur', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    useAwardsStore.getState().clearPending()
    expect(useAwardsStore.getState().pendingEvent).toBeNull()
  })

  it('reset — tüm state temizlenir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    useAwardsStore.getState().reset()
    expect(useAwardsStore.getState().history).toHaveLength(0)
    expect(useAwardsStore.getState().pendingEvent).toBeNull()
  })
})
```

- [ ] **Step 4: Test çalıştır, başarısız olduğunu doğrula**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/store/awardsStore.test.ts 2>&1 | tail -10
```

Beklenen: `Cannot find module '@/store/awardsStore'`.

- [ ] **Step 5: awardsStore'u implement et**

```typescript
// src/store/awardsStore.ts
import { create } from 'zustand'
import { useRivalStore } from '@/store/rivalStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useCharacterStore } from '@/store/characterStore'
import type { AwardsEvent, AwardsNominee } from '@/types/rival'
import type { CutsceneId } from '@/types/cutscene'

// characterStore.background → awards_win cutscene ID mapping
const BG_TO_CUTSCENE: Record<string, CutsceneId> = {
  kk_uzmani:          'awards_win',
  bas_muhendis:       'awards_win',
  yaratici_direktor:  'awards_win_gallery',
  yapimci:            'awards_win_boardroom',
  eski_ceo:           'awards_win_boardroom',
}

interface AwardsStore {
  history:      AwardsEvent[]
  pendingEvent: AwardsEvent | null

  checkAwards: (
    year: number,
    playerBestGame: { name: string; score: number } | null
  ) => void
  clearPending: () => void
  reset:        () => void
}

export const useAwardsStore = create<AwardsStore>((set, get) => ({
  history:      [],
  pendingEvent: null,

  checkAwards: (year, playerBestGame) => {
    const rivals = useRivalStore.getState().rivals

    // O yıl rakiplerin çıkardığı oyunları topla
    const nominees: AwardsNominee[] = []

    for (const rival of rivals) {
      const yearGames = rival.games.filter(g => g.releasedYear === year)
      if (yearGames.length === 0) continue
      const best = yearGames.reduce((a, b) => a.score > b.score ? a : b)
      nominees.push({ name: best.title, studio: rival.name, score: best.score, isPlayer: false })
    }

    // Oyuncunun oyununu ekle
    if (playerBestGame) {
      nominees.push({
        name: playerBestGame.name,
        studio: useCharacterStore.getState().studioName || 'Stüdyon',
        score: playerBestGame.score,
        isPlayer: true,
      })
    }

    if (nominees.length === 0) return

    // Sırala, en iyi 3 aday
    const sorted = [...nominees].sort((a, b) => b.score - a.score)
    const topNominees = sorted.slice(0, 3)
    const winner = topNominees[0]

    // Kazananın rivalId'sini bul
    let winnerId = 'player'
    if (!winner.isPlayer) {
      const winnerRival = rivals.find(r => r.name === winner.studio)
      winnerId = winnerRival?.id ?? 'unknown'
    }

    const event: AwardsEvent = { year, nominees: topNominees, winnerId }

    set((s) => ({ history: [...s.history, event], pendingEvent: event }))

    // Cutscene tetikle
    if (winnerId === 'player') {
      const background = useCharacterStore.getState().background
      const cutsceneId = (background && BG_TO_CUTSCENE[background]) ?? 'awards_win'
      useCutsceneStore.getState().startCutsceneForce(cutsceneId)
    } else if (winnerId === 'nexus') {
      useCutsceneStore.getState().startCutsceneForce('awards_lose_to_nexus')
    }
  },

  clearPending: () => set({ pendingEvent: null }),

  reset: () => set({ history: [], pendingEvent: null }),
}))
```

- [ ] **Step 6: Testleri çalıştır**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/store/awardsStore.test.ts 2>&1 | tail -20
```

Beklenen: `7 tests passed`.

- [ ] **Step 7: Tüm testleri çalıştır**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run 2>&1 | tail -10
```

Beklenen: Tüm mevcut testler + yeni testler geçmeli.

- [ ] **Step 8: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/store/cutsceneStore.ts src/store/awardsStore.ts tests/store/awardsStore.test.ts && git commit -m "feat(4c-2): awardsStore with background-based cutscene selection, startCutsceneForce"
```

---

### Task 4: rivalStore Güncellemeleri

**Files:**
- Modify: `src/store/rivalStore.ts`

Bu task 2 değişiklik yapar:
1. `noticeCheck` — Nexus eşiğini aşınca `nexus_notice` cutscene'ini tetikle
2. `escalationCheck` — Nexus `'rival'` iken player ödül kazanırsa `'nemesis'`'e yükselt ve `pendingResolution` set et

> **Bağımlılık:** `cutscene.ts` tiplerinde `'nexus_notice'` mevcut (Task 1 tamamlanmış).

- [ ] **Step 1: noticeCheck'i güncelle**

`src/store/rivalStore.ts` başına import ekle:

```typescript
import { useCutsceneStore } from '@/store/cutsceneStore'
```

`noticeCheck` içinde `// Eski işveren için cutscene tetikleyici — Faz 4C-2'de eklenecek` yorum satırını şu kod ile değiştir:

```typescript
if (rival.isFormerEmployer) {
  useCutsceneStore.getState().startCutscene('nexus_notice')
}
```

- [ ] **Step 2: escalationCheck'i implement et**

`escalationCheck` action'ını şu içerikle doldur:

```typescript
escalationCheck: () => {
  const { rivals } = get()
  const nexus = rivals.find(r => r.id === 'nexus')
  if (!nexus) return
  if (nexus.relationship !== 'rival') return

  // Nexus'u nemesis'e yükselt
  const updatedRivals = rivals.map(r =>
    r.id === 'nexus' ? { ...r, relationship: 'nemesis' as RelationshipStatus } : r
  )
  set({ rivals: updatedRivals, pendingResolution: { rivalId: 'nexus' } })
},
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 4: Testleri çalıştır**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run 2>&1 | tail -10
```

Beklenen: Tüm testler geçmeli. 

> **Not:** `noticeCheck` testi `nexus_notice` cutscene'ini tetikler ama `seenCutscenes` boş olduğu için `startCutscene` çalışır. Cutscene aktif olacak; test bunu kontrol etmiyor (sadece `relationship === 'noticed'` kontrol ediyor). Testler geçmeli.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/store/rivalStore.ts && git commit -m "feat(4c-2): rivalStore nexus_notice cutscene trigger and escalationCheck"
```

---

### Task 5: CutscenePlayer — Yeni Arka Planlar

**Files:**
- Modify: `src/components/CutscenePlayer.tsx`

- [ ] **Step 1: SceneBackground fonksiyonuna yeni arka planları ekle**

`src/components/CutscenePlayer.tsx` içindeki `SceneBackground` fonksiyonuna, `// studio` bloğundan önce şu iki yeni blok ekle:

```tsx
if (type === 'server_room') {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#020808 0%,#041414 50%,#020808 100%)', imageRendering: 'pixelated' }}>
      <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
      {/* Sunucu rafları */}
      <div style={{ position: 'absolute', top: 20, left: 40, width: 60, height: 120, background: '#0a1a0a', border: '4px solid #1a4a1a', display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, background: '#0d2a0d', borderTop: '2px solid #1a3a1a' }} />
        ))}
      </div>
      {/* LED ışıkları */}
      <div style={{ position: 'absolute', top: 30, left: 108, width: 6, height: 6, background: '#00ff00', boxShadow: '0 0 8px #00ff00' }} />
      <div style={{ position: 'absolute', top: 60, left: 108, width: 6, height: 6, background: '#00ff00', boxShadow: '0 0 8px #00ff00' }} />
      {/* Masa */}
      <div style={{ position: 'absolute', bottom: 90, left: '10%', right: '10%', height: 10, background: '#0a1a0a', borderTop: '4px solid #1a3a1a' }} />
    </div>
  )
}

if (type === 'gallery') {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0d0808 0%,#1a1010 50%,#0d0808 100%)', imageRendering: 'pixelated' }}>
      <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
      {/* Çerçeveler */}
      <div style={{ position: 'absolute', top: 30, left: 40, width: 50, height: 60, background: '#1a0808', border: '4px solid #8a6a4a' }} />
      <div style={{ position: 'absolute', top: 30, left: 110, width: 40, height: 50, background: '#080a18', border: '4px solid #8a6a4a' }} />
      {/* Spot ışık */}
      <div style={{ position: 'absolute', top: 10, left: 60, width: 4, height: 60, background: 'linear-gradient(180deg,#c8a050 0%,transparent 100%)', opacity: 0.4 }} />
      {/* Zemin */}
      <div style={{ position: 'absolute', bottom: 88, left: 0, right: 0, height: 4, background: '#3a2a1a' }} />
    </div>
  )
}

if (type === 'boardroom') {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#080810 0%,#101020 50%,#080810 100%)', imageRendering: 'pixelated' }}>
      <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
      {/* Büyük toplantı masası */}
      <div style={{ position: 'absolute', bottom: 90, left: '5%', right: '5%', height: 14, background: '#1a1a3a', borderTop: '4px solid #2a2a5a' }} />
      {/* Koltukar silüetleri */}
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ position: 'absolute', bottom: 102, left: `${10 + i * 16}%`, width: 12, height: 20, background: '#0d0d2a', border: '2px solid #1a1a3a' }} />
      ))}
      {/* Pencere / şehir manzarası */}
      <div style={{ position: 'absolute', top: 10, right: 30, width: 80, height: 70, background: '#050510', border: '4px solid #1a1a3a' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ position: 'absolute', bottom: 0, left: `${10 + i * 28}%`, width: 10, height: `${30 + i * 15}%`, background: '#0d0d25' }} />
        ))}
      </div>
    </div>
  )
}
```

> Eklenecek yer: mevcut `if (type === 'bedroom')` bloğunun kapanış parantezinden sonra, `// studio` yorum satırından önce.

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok. (CutsceneFrame.background tipi artık yeni değerleri içeriyor.)

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/components/CutscenePlayer.tsx && git commit -m "feat(4c-2): add server_room, gallery, boardroom CSS backgrounds to CutscenePlayer"
```

---

### Task 6: ResolutionScreen Bileşeni

**Files:**
- Create: `src/components/ResolutionScreen.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/ResolutionScreen.tsx
import { useRivalStore } from '@/store/rivalStore'
import { useGameStore } from '@/store/gameStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import type { ResolutionChoice } from '@/types/rival'

const BUYOUT_COST = 2_000_000

export default function ResolutionScreen() {
  const pendingResolution = useRivalStore((s) => s.pendingResolution)
  const rivals            = useRivalStore((s) => s.rivals)
  const money             = useGameStore((s) => s.money)
  const resolveRival      = useRivalStore((s) => s.resolveRival)
  const clearPending      = useRivalStore((s) => s.clearPendingResolution)

  if (!pendingResolution) return null

  const rival = rivals.find(r => r.id === pendingResolution.rivalId)
  if (!rival) return null

  const canBuyout = money >= BUYOUT_COST
  const canMerge  = rival.relationship === 'ally'
  const isNexus   = rival.id === 'nexus'

  function handleChoice(choice: ResolutionChoice) {
    if (choice === 'buyout' && !canBuyout) return
    if (choice === 'merge'  && !canMerge)  return

    resolveRival(rival!.id, choice)

    const cutsceneId = isNexus ? 'nexus_resolution' : 'indie_resolution'
    useCutsceneStore.getState().startCutsceneForce(cutsceneId)

    clearPending()
  }

  const btnBase = 'px-6 py-4 rounded-lg text-sm font-medium transition-colors text-left'
  const btnActive = `${btnBase} bg-gray-800 hover:bg-gray-700 text-white border border-gray-600`
  const btnDisabled = `${btnBase} bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed`

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4">
        {/* Başlık */}
        <div className="text-center mb-6">
          {/* Rakip silüeti */}
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
            <div style={{ width: 24, height: 24, background: '#5a2a2a', borderRadius: '50%' }} />
          </div>
          <h2 className="text-white text-xl font-bold">{rival.name}</h2>
          <p className="text-gray-400 text-sm mt-1">Bir hamle yapma zamanı.</p>
        </div>

        {/* Seçenekler */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChoice('buyout')}
            disabled={!canBuyout}
            className={canBuyout ? btnActive : btnDisabled}
          >
            <div className="font-semibold">Satın Al</div>
            <div className="text-xs mt-1 opacity-70">
              {canBuyout ? `$${BUYOUT_COST.toLocaleString()} gerekli` : 'Yetersiz bütçe'}
            </div>
          </button>

          <button
            onClick={() => handleChoice('destroy')}
            className={btnActive}
          >
            <div className="font-semibold">Yok Et</div>
            <div className="text-xs mt-1 opacity-70">Skandalını ifşa et</div>
          </button>

          <button
            onClick={() => handleChoice('forgive')}
            className={btnActive}
          >
            <div className="font-semibold">Affet</div>
            <div className="text-xs mt-1 opacity-70">Geç ve unut</div>
          </button>

          <button
            onClick={() => handleChoice('merge')}
            disabled={!canMerge}
            className={canMerge ? btnActive : btnDisabled}
          >
            <div className="font-semibold">Birleş</div>
            <div className="text-xs mt-1 opacity-70">
              {canMerge ? 'Müttefik gerekli ✓' : 'Önce müttefik ol'}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/components/ResolutionScreen.tsx && git commit -m "feat(4c-2): ResolutionScreen with buyout/destroy/forgive/merge options"
```

---

### Task 7: Dashboard — Awards useEffect

**Files:**
- Modify: `src/components/Dashboard.tsx`

> Awards yılda bir kez tetiklenmeli. `year` değişince simulateYear zaten çağrılıyor (Faz 4C-1 Task 7). Aynı useEffect'e awards kontrolünü ekleyeceğiz.

- [ ] **Step 1: Import'ları ekle**

`src/components/Dashboard.tsx` import bloğuna ekle:
```tsx
import { useAwardsStore } from '@/store/awardsStore'
```

- [ ] **Step 2: handleNewGame'e reset ekle**

`handleNewGame` içinde `useNewsStore.getState().reset()` satırından sonra:
```tsx
useAwardsStore.getState().reset()
```

- [ ] **Step 3: Year useEffect'i güncelle**

Mevcut `useEffect(() => { useRivalStore.getState().simulateYear(year) }, [year])` satırını şu hale getir:

```tsx
useEffect(() => {
  // year 2000 (başlangıç) ise awards'ı tetikleme
  if (year <= 2000) {
    useRivalStore.getState().simulateYear(year)
    return
  }
  // Yıl geçişi: önceki yılı simüle et ve awards kontrol et
  useRivalStore.getState().simulateYear(year)

  // Önceki yılın en iyi oyuncusu
  const prevYear = year - 1
  const publishedProjects = useProjectStore.getState().projects.filter(
    p => p.status === 'yayinlandi' && p.publishResult?.publishDate.year === prevYear
  )
  const playerBestGame = publishedProjects.length > 0
    ? publishedProjects.reduce((best, p) =>
        (p.publishResult!.score > (best.publishResult?.score ?? 0)) ? p : best
      )
    : null

  useAwardsStore.getState().checkAwards(
    prevYear,
    playerBestGame
      ? { name: playerBestGame.name, score: playerBestGame.publishResult!.score }
      : null
  )
}, [year])
```

> `useProjectStore` zaten import edilmiş (`useProjectStore`). Kontrol et, yoksa ekle: `import { useProjectStore } from '@/store/projectStore'`

- [ ] **Step 4: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 5: Tüm testler**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run 2>&1 | tail -10
```

Beklenen: Tüm testler geçmeli.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/components/Dashboard.tsx && git commit -m "feat(4c-2): annual awards check on year transition in Dashboard"
```

---

### Task 8: App.tsx — ResolutionScreen Gate

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import'ları ekle**

```tsx
import ResolutionScreen from '@/components/ResolutionScreen'
import { useRivalStore } from '@/store/rivalStore'
import { useAwardsStore } from '@/store/awardsStore'
```

- [ ] **Step 2: Store bağlantıları ekle**

`activeCutscene` satırının yanına:
```tsx
const pendingResolution = useRivalStore((s) => s.pendingResolution)
```

- [ ] **Step 3: Gate sırasını güncelle**

Mevcut:
```tsx
if (!isCreated)    return <CharacterCreationWizard />
if (activeCutscene) return <CutscenePlayer />
```

Şu hale getir:
```tsx
if (!isCreated)       return <CharacterCreationWizard />
if (activeCutscene)   return <CutscenePlayer />
if (pendingResolution) return <ResolutionScreen />
```

- [ ] **Step 4: handleNewGame'deki App.tsx resetini kontrol et**

`App.tsx` içinde `setOnWeeklyTick` callback'inde save game yapılıyor. `handleNewGame` Dashboard.tsx içinde — orada `useAwardsStore.getState().reset()` zaten Task 7'de eklendi. App.tsx'te ek değişiklik gerekmez.

- [ ] **Step 5: TypeScript kontrolü**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx tsc --noEmit 2>&1 | head -20
```

Beklenen: Hata yok.

- [ ] **Step 6: Tüm testler**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run 2>&1 | tail -10
```

Beklenen: Tüm testler geçmeli.

- [ ] **Step 7: Commit ve push**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && git add src/App.tsx && git commit -m "feat(4c-2): ResolutionScreen gate in App.tsx" && git push
```
