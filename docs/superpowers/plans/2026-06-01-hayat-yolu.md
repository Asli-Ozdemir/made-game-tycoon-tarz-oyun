# Hayat Yolu Altyapısı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyuncunun yan işlerle birikim yaparak üç hayat yolundan birini (Hırs/Huzur/Emek) organik olarak kazandığı, T5 skill node'larını açan, yol değiştirmeye ağır NPC cezası getiren altyapı.

**Architecture:** Yeni `lifePathStore` progress tracking ve switchPath mantığını yönetir. `npcStore`'a `gainMultiplier` alanı eklenir. `SkillTreeCanvas`'a dış halka yay göstergesi eklenir. `skillTreeStore.selectedLifePath` lifePathStore tarafından set edilir.

**Tech Stack:** Zustand, TypeScript, PixiJS v8, Vitest

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|------------|
| `src/data/lifePathData.ts` | Yeni | PATH_THRESHOLD sabiti + PATH_NPC_MAP |
| `src/store/lifePathStore.ts` | Yeni | progress, activePathId, addProgress, switchPath |
| `src/store/__tests__/lifePathStore.test.ts` | Yeni | Store logic testleri |
| `src/store/npcStore.ts` | Değişiklik | gainMultipliers alanı + penalizeNpc + completeDialogue güncelleme |
| `src/store/__tests__/npcStore.test.ts` | Yeni | gainMultiplier ve penalizeNpc testleri |
| `src/components/SkillTreeCanvas.tsx` | Değişiklik | Dış halka yay göstergesi + lifePathStore subscribe |

---

## Task 1: lifePathData.ts

**Files:**
- Create: `src/data/lifePathData.ts`

- [ ] **Adım 1: Dosyayı oluştur**

```ts
// src/data/lifePathData.ts
import type { LifePath } from '@/data/skillTree'

export const PATH_THRESHOLD = 100

export const PATH_NPC_MAP: Record<LifePath, string[]> = {
  huzur: ['marcus', 'remy'],
  emek:  ['theo'],
  hirs:  [],   // Vivian ileride eklenecek
}
```

- [ ] **Adım 2: Commit**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun"
git add src/data/lifePathData.ts
git commit -m "feat: lifePathData — PATH_THRESHOLD + PATH_NPC_MAP"
```

> **Uygulama notu:** Task 3 (npcStore) Task 2'den önce çalıştırılmalı — lifePathStore testleri `penalizeNpc`'ye bağımlı. Sıra: **1 → 3 → 2 → 4**

---

## Task 2: lifePathStore

**Files:**
- Create: `src/store/lifePathStore.ts`
- Create: `src/store/__tests__/lifePathStore.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/store/__tests__/lifePathStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useLifePathStore } from '../lifePathStore'
import { useSkillTreeStore } from '../skillTreeStore'
import { useNPCStore } from '../npcStore'

beforeEach(() => {
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
  useSkillTreeStore.setState({ selectedLifePath: null, unlockedNodeIds: [] })
  useNPCStore.setState(s => ({
    npcs: Object.fromEntries(
      Object.keys(s.npcs).map(id => [id, { relationship: 50, seenDialogueIds: [] }])
    ),
    gainMultipliers: Object.fromEntries(Object.keys(s.npcs).map(id => [id, 1.0])),
  }))
})

describe('lifePathStore — serbest faz', () => {
  it('başlangıçta tüm progress sıfır', () => {
    const { progress, activePathId } = useLifePathStore.getState()
    expect(progress).toEqual({ hirs: 0, huzur: 0, emek: 0 })
    expect(activePathId).toBeNull()
  })

  it('serbest fazda tüm yollar birikim yapabilir', () => {
    useLifePathStore.getState().addProgress('huzur', 30)
    useLifePathStore.getState().addProgress('hirs', 20)
    const { progress } = useLifePathStore.getState()
    expect(progress.huzur).toBe(30)
    expect(progress.hirs).toBe(20)
  })
})

describe('lifePathStore — threshold ve kilitleme', () => {
  it('threshold aşılınca activePathId set edilir', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    expect(useLifePathStore.getState().activePathId).toBe('huzur')
  })

  it('threshold aşılınca skillTreeStore.selectedLifePath güncellenir', () => {
    useLifePathStore.getState().addProgress('emek', 100)
    expect(useSkillTreeStore.getState().selectedLifePath).toBe('emek')
  })

  it('kilitli fazda aktif olmayan yol birikim yapamaz', () => {
    useLifePathStore.getState().addProgress('huzur', 100)   // kilitlendi
    useLifePathStore.getState().addProgress('hirs', 50)     // farklı yol → reddedilmeli
    expect(useLifePathStore.getState().progress.hirs).toBe(0)
  })

  it('kilitli fazda aktif yol birikim yapmaya devam eder (max 100)', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().addProgress('huzur', 10)    // max 100
    expect(useLifePathStore.getState().progress.huzur).toBe(100)
  })
})

describe('lifePathStore — switchPath', () => {
  it('switchPath activePathId ve selectedLifePath değiştirir', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    expect(useLifePathStore.getState().activePathId).toBe('emek')
    expect(useSkillTreeStore.getState().selectedLifePath).toBe('emek')
  })

  it('switchPath eski yolun progress kısmını siler (−40)', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    expect(useLifePathStore.getState().progress.huzur).toBe(60)
  })

  it('switchPath eski yol NPC ilişkisini düşürür (−20)', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    // huzur NPC'leri: marcus, remy — relationship 50 → 30
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(30)
    expect(useNPCStore.getState().npcs['remy'].relationship).toBe(30)
  })

  it('switchPath eski yol NPC gainMultiplier 0.5 olur', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.5)
    expect(useNPCStore.getState().gainMultipliers['remy']).toBe(0.5)
  })

  it('switchPath aktif yol ile aynı yola geçmeye izin vermez', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('huzur')          // no-op
    expect(useLifePathStore.getState().activePathId).toBe('huzur')
  })

  it('reset her şeyi sıfırlar', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().reset()
    expect(useLifePathStore.getState().activePathId).toBeNull()
    expect(useSkillTreeStore.getState().selectedLifePath).toBeNull()
  })
})
```

- [ ] **Adım 2: Testi çalıştır — FAIL bekliyoruz**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun"
npm test -- --run src/store/__tests__/lifePathStore.test.ts
```

Beklenen: `Cannot find module '../lifePathStore'`

- [ ] **Adım 3: lifePathStore.ts yaz**

```ts
// src/store/lifePathStore.ts
import { create } from 'zustand'
import type { LifePath } from '@/data/skillTree'
import { PATH_THRESHOLD, PATH_NPC_MAP } from '@/data/lifePathData'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useNPCStore } from '@/store/npcStore'

interface LifePathStore {
  progress: Record<LifePath, number>
  activePathId: LifePath | null
  addProgress(path: LifePath, amount: number): void
  switchPath(newPath: LifePath): void
  reset(): void
}

export const useLifePathStore = create<LifePathStore>((set, get) => ({
  progress: { hirs: 0, huzur: 0, emek: 0 },
  activePathId: null,

  addProgress(path, amount) {
    const { activePathId, progress } = get()

    // Kilitli fazda sadece aktif yol birikim yapabilir
    if (activePathId !== null && activePathId !== path) return

    const newVal = Math.min(progress[path] + amount, PATH_THRESHOLD)
    set(s => ({ progress: { ...s.progress, [path]: newVal } }))

    // Threshold geçildi ve henüz kilitlenmemiş?
    if (newVal >= PATH_THRESHOLD && get().activePathId === null) {
      set({ activePathId: path })
      useSkillTreeStore.setState({ selectedLifePath: path })
    }
  },

  switchPath(newPath) {
    const { activePathId, progress } = get()
    if (!activePathId || activePathId === newPath) return

    // 1. T5 kilitlenir, yeni yol aktif
    useSkillTreeStore.setState({ selectedLifePath: newPath })

    // 2 + 3. Eski yolun NPC'lerini cezalandır
    const oldNpcs = PATH_NPC_MAP[activePathId]
    for (const npcId of oldNpcs) {
      useNPCStore.getState().penalizeNpc(npcId)
    }

    // 4. Eski yolun progressi düşer
    const penalizedProgress = Math.max(0, progress[activePathId] - 40)

    set(s => ({
      activePathId: newPath,
      progress: { ...s.progress, [activePathId]: penalizedProgress },
    }))
  },

  reset() {
    set({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
    useSkillTreeStore.setState({ selectedLifePath: null })
  },
}))
```

- [ ] **Adım 4: Testi çalıştır — PASS bekliyoruz**

```bash
npm test -- --run src/store/__tests__/lifePathStore.test.ts
```

Beklenen: 11 test PASS

- [ ] **Adım 5: Commit**

```bash
git add src/store/lifePathStore.ts src/store/__tests__/lifePathStore.test.ts
git commit -m "feat: lifePathStore — progress tracking, threshold kilitleme, switchPath"
```

---

## Task 3: npcStore — gainMultiplier

**Files:**
- Modify: `src/store/npcStore.ts`
- Create: `src/store/__tests__/npcStore.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/store/__tests__/npcStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useNPCStore } from '../npcStore'

beforeEach(() => {
  useNPCStore.setState(s => ({
    npcs: Object.fromEntries(
      Object.keys(s.npcs).map(id => [id, { relationship: 0, seenDialogueIds: [] }])
    ),
    gainMultipliers: Object.fromEntries(Object.keys(s.npcs).map(id => [id, 1.0])),
  }))
})

describe('npcStore — gainMultiplier', () => {
  it('başlangıçta tüm NPC gainMultiplier 1.0', () => {
    const { gainMultipliers } = useNPCStore.getState()
    expect(gainMultipliers['marcus']).toBe(1.0)
    expect(gainMultipliers['theo']).toBe(1.0)
  })

  it('completeDialogue multiplier 1.0 iken normal bonus uygular', () => {
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(10)
  })

  it('completeDialogue multiplier 0.5 iken yarı bonus uygular', () => {
    useNPCStore.setState(s => ({
      gainMultipliers: { ...s.gainMultipliers, marcus: 0.5 },
    }))
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(5)
  })

  it('completeDialogue her çağrıda multiplier +0.05 artarak 1.0 yaklaşır', () => {
    useNPCStore.setState(s => ({
      gainMultipliers: { ...s.gainMultipliers, marcus: 0.5 },
    }))
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.55)
  })

  it('completeDialogue multiplier 1.0 üzerine çıkmaz', () => {
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(1.0)
  })

  it('penalizeNpc relationship −20 yapar', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, marcus: { relationship: 60, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().penalizeNpc('marcus')
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(40)
  })

  it('penalizeNpc gainMultiplier 0.5 yapar', () => {
    useNPCStore.getState().penalizeNpc('marcus')
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.5)
  })

  it('penalizeNpc relationship 0 altına inmez', () => {
    useNPCStore.getState().penalizeNpc('marcus')   // relationship 0, -20 → max(0,…)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Adım 2: Testi çalıştır — FAIL bekliyoruz**

```bash
npm test -- --run src/store/__tests__/npcStore.test.ts
```

Beklenen: `gainMultipliers` veya `penalizeNpc` bulunamadı hatası

- [ ] **Adım 3: npcStore.ts'yi güncelle**

`src/store/npcStore.ts` dosyasını şu şekilde güncelle:

```ts
// src/store/npcStore.ts
import { create } from 'zustand'
import { NPC_DEFS, type Dialogue } from '@/data/npcDialogues'

interface NPCState {
  relationship: number
  seenDialogueIds: string[]
}

interface NPCStore {
  npcs: Record<string, NPCState>
  gainMultipliers: Record<string, number>
  getRelationship: (npcId: string) => number
  getTier: (npcId: string) => 1 | 2 | 3
  hasSeenDialogue: (npcId: string, dialogueId: string) => boolean
  completeDialogue: (npcId: string, dialogueId: string, bonus: number) => void
  penalizeNpc: (npcId: string) => void
  getAvailableDialogues: (npcId: string) => Dialogue[]
}

function initNpcs(): Record<string, NPCState> {
  const result: Record<string, NPCState> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = { relationship: 0, seenDialogueIds: [] }
  }
  return result
}

function initMultipliers(): Record<string, number> {
  const result: Record<string, number> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = 1.0
  }
  return result
}

export const useNPCStore = create<NPCStore>((set, get) => ({
  npcs: initNpcs(),
  gainMultipliers: initMultipliers(),

  getRelationship(npcId) {
    return get().npcs[npcId]?.relationship ?? 0
  },

  getTier(npcId) {
    const rel = get().getRelationship(npcId)
    const def = NPC_DEFS[npcId]
    if (!def) return 1
    if (rel >= def.tier3Threshold) return 3
    if (rel >= def.tier2Threshold) return 2
    return 1
  },

  hasSeenDialogue(npcId, dialogueId) {
    return get().npcs[npcId]?.seenDialogueIds.includes(dialogueId) ?? false
  },

  completeDialogue(npcId, dialogueId, bonus) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      const alreadySeen = prev.seenDialogueIds.includes(dialogueId)
      const multiplier = s.gainMultipliers[npcId] ?? 1.0
      const effectiveBonus = alreadySeen ? 0 : bonus * multiplier
      const newMultiplier = Math.min(1.0, multiplier + 0.05)

      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            relationship: Math.min(100, prev.relationship + effectiveBonus),
            seenDialogueIds: alreadySeen
              ? prev.seenDialogueIds
              : [...prev.seenDialogueIds, dialogueId],
          },
        },
        gainMultipliers: {
          ...s.gainMultipliers,
          [npcId]: newMultiplier,
        },
      }
    })
  },

  penalizeNpc(npcId) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            ...prev,
            relationship: Math.max(0, prev.relationship - 20),
          },
        },
        gainMultipliers: {
          ...s.gainMultipliers,
          [npcId]: 0.5,
        },
      }
    })
  },

  getAvailableDialogues(npcId) {
    const def = NPC_DEFS[npcId]
    if (!def) return []
    const tier = get().getTier(npcId)
    return def.dialogues.filter((d) => d.tier <= tier)
  },
}))
```

- [ ] **Adım 4: Testi çalıştır — PASS bekliyoruz**

```bash
npm test -- --run src/store/__tests__/npcStore.test.ts
```

Beklenen: 8 test PASS

- [ ] **Adım 5: Tüm testlerin hâlâ geçtiğini doğrula**

```bash
npm test -- --run
```

Beklenen: 315+ test PASS (mevcut testler bozulmamış — multiplier 1.0 başladığı için eski davranış korunur)

- [ ] **Adım 6: Commit**

```bash
git add src/store/npcStore.ts src/store/__tests__/npcStore.test.ts
git commit -m "feat: npcStore — gainMultiplier + penalizeNpc"
```

---

## Task 4: SkillTreeCanvas — Yol Yayları

**Files:**
- Modify: `src/components/SkillTreeCanvas.tsx`

- [ ] **Adım 1: SkillTreeCanvas.tsx'i oku**

`src/components/SkillTreeCanvas.tsx` dosyasını oku. `useEffect` içindeki `unsub` değişkenini ve `renderTree` fonksiyonunun başını not al — yay çizimi buralara eklenecek.

- [ ] **Adım 2: Import ekle**

Dosyanın en üstüne import ekle:

```ts
import { useLifePathStore } from '@/store/lifePathStore'
import { PATH_THRESHOLD } from '@/data/lifePathData'
import type { LifePath } from '@/data/skillTree'
```

- [ ] **Adım 3: drawPathArcs fonksiyonunu ekle**

`drawAxon` fonksiyonunun hemen altına (interface Props'tan önce) şu fonksiyonu ekle:

```ts
const ARC_R = 345

const PATH_ARC_CONFIGS: { path: LifePath; startAngle: number; endAngle: number; color: number }[] = [
  { path: 'huzur', startAngle: -2.8, endAngle: -0.3, color: 0x4488cc },
  { path: 'hirs',  startAngle:  1.2, endAngle:  3.6, color: 0xff6644 },
  { path: 'emek',  startAngle:  0.2, endAngle:  1.1, color: 0x88cc44 },
]

function drawPathArcs(
  g: Graphics,
  progress: Record<LifePath, number>,
  activePathId: LifePath | null
) {
  for (const arc of PATH_ARC_CONFIGS) {
    const pct      = Math.min(1, (progress[arc.path] ?? 0) / PATH_THRESHOLD)
    const isActive = activePathId === arc.path
    const span     = arc.endAngle - arc.startAngle

    // Boş track
    g.arc(CX, CY, ARC_R, arc.startAngle, arc.endAngle)
      .stroke({ width: 5, color: 0x1a1a2e, alpha: 0.5 })

    if (pct > 0) {
      const fillEnd = arc.startAngle + span * pct
      g.arc(CX, CY, ARC_R, arc.startAngle, fillEnd)
        .stroke({
          width: isActive ? 7 : 5,
          color: arc.color,
          alpha: isActive ? 1.0 : 0.65,
        })

      // Aktif yol: threshold noktasında parlak işaret
      if (isActive && pct >= 1) {
        const tx = CX + Math.cos(arc.endAngle) * ARC_R
        const ty = CY + Math.sin(arc.endAngle) * ARC_R
        g.circle(tx, ty, 5).fill({ color: arc.color, alpha: 0.9 })
        g.circle(tx, ty, 8).stroke({ width: 1.5, color: arc.color, alpha: 0.4 })
      }
    }
  }
}
```

- [ ] **Adım 4: lifePathStore'a subscribe et**

`useEffect` içinde `unsub` satırının hemen altına şunu ekle:

```ts
const unsubPath = useLifePathStore.subscribe(() => {
  if (appRef.current && !destroyed) renderTree(appRef.current)
})
```

Ve cleanup fonksiyonunu güncelle:

```ts
return () => {
  destroyed = true
  unsub()
  unsubPath()
  app.destroy()
}
```

- [ ] **Adım 5: renderTree içinde yay çiz**

`renderTree` fonksiyonunda `app.stage.addChild(bg)` satırının hemen altına şunu ekle:

```ts
// Yol yayları (arkaplan üstü, nöronların altı)
const arcLayer = new Graphics()
const { progress, activePathId } = useLifePathStore.getState()
drawPathArcs(arcLayer, progress, activePathId)
app.stage.addChild(arcLayer)
```

- [ ] **Adım 6: Testleri çalıştır**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun"
npm test -- --run
```

Beklenen: 323+ test PASS

- [ ] **Adım 7: durum.md güncelle**

`durum.md` dosyasına "Tamamlananlar" bölümüne ekle:

```markdown
### Hayat Yolu Altyapısı (2026-06-01)
- `src/data/lifePathData.ts`: PATH_THRESHOLD=100, PATH_NPC_MAP
- `src/store/lifePathStore.ts`: serbest/kilitli faz, addProgress, switchPath (NPC cezası + progress reset)
- `src/store/npcStore.ts`: gainMultiplier + penalizeNpc — yol değiştirince ilişki zayıflar
- `src/components/SkillTreeCanvas.tsx`: dış halka yay göstergesi (Huzur/Hırs/Emek)
- T5 node'ları artık lifePathStore üzerinden açılıyor
```

"Sıradaki Büyük Görevler"e şunu ekle:
```markdown
- Yan işler — mini oyun brainstorming (Hırs/Emek/Huzur per iş)
```

- [ ] **Adım 8: Commit + push**

```bash
git add src/components/SkillTreeCanvas.tsx durum.md
git commit -m "feat: SkillTreeCanvas yol yayları + hayat yolu altyapısı tamamlandı"
git push
```
