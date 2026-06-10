# Steam Next Fest Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DEMO_MODE'u uçtan uca oynanabilir Steam Next Fest demosuna dönüştürmek: save/load persist, balıkçılık + sahaf arşivi açık, tier-1 zihin ağacı, demo hedef zinciri, DemoEndScreen.

**Architecture:** Mevcut zustand store + React panel + PixiJS scene mimarisi korunur. Savegame v2'ye yükseltilir (6 RPG store eklenir, v1 geri uyumlu). Demo kapıları `src/config.ts` + ilgili store/bileşenlerde `DEMO_MODE` dallarıyla açılır. Objective zinciri bileşen seviyesinden tetiklenir (store'lara objectiveStore import'u sokulmaz — test kirliliği önlenir).

**Tech Stack:** React 18, zustand, PixiJS v8, vitest (+ jsdom, @testing-library/react), Electron.

**Spec:** `docs/superpowers/specs/2026-06-10-steam-demo-design.md`

**Çalışma kuralları:**
- Her push öncesi: `git pull --rebase --autostash` (paralel makine aktif).
- Doğrulama komutu: `npx vitest run` (`npm run build` typecheck yapmaz).
- Bazı testler jsdom ister: dosya başına `// @vitest-environment jsdom`.
- NPC diyalog **içeriği** yazma (PROJE-BAGLAM "⛔ NPC DİYALOGLARI") — bu plandaki objective/UI metinleri diyalog değildir, serbesttir.
- `vi.mock('@/config', ...)` kullanan her mock üç export'u da vermeli: `DEMO_MODE`, `DEMO_BLOCKED_ROOMS`, `DEMO_BLOCKED_LOCATIONS`.

---

### Task 1: Savegame v2 — RPG store persist

Savegame şu store'ları kaydetmiyor: `ideaSeedStore`, `skillTreeStore`, `npcStore`, `lifePathStore`, `lifeStore`, `romanceStore`. v2'de altısı eklenir; v1 kayıtlar yüklenebilir kalır (eksik bloklar → store reset/default).

**Files:**
- Modify: `src/store/npcStore.ts` (reset() ekle — şu an yok)
- Modify: `src/engine/savegameEngine.ts`
- Test: `tests/engine/savegameEngine.rpg.test.ts` (yeni)

- [ ] **Step 1: Failing test yaz**

`tests/engine/savegameEngine.rpg.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { serialize, deserialize } from '@/engine/savegameEngine'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useNPCStore } from '@/store/npcStore'
import { useLifePathStore } from '@/store/lifePathStore'
import { useLifeStore } from '@/store/lifeStore'
import { useRomanceStore } from '@/store/romanceStore'
import { useCharacterStore } from '@/store/characterStore'

function resetAll() {
  useIdeaSeedStore.getState().reset()
  useSkillTreeStore.getState().reset()
  useNPCStore.getState().reset()
  useLifePathStore.getState().reset()
  useLifeStore.getState().reset()
  useRomanceStore.getState().reset()
}

beforeEach(() => {
  resetAll()
  // serialize() characterStore'u da okur — minimum geçerli durum
  useCharacterStore.setState({ isCreated: true, name: 'Test', studioName: 'Garage' })
})

describe('savegameEngine v2 — RPG store round-trip', () => {
  it('altı RPG store kaydedilip geri yüklenir (Set dönüşümleri dahil)', () => {
    useIdeaSeedStore.getState().addSeed('nostalji', 3)
    useIdeaSeedStore.getState().addKirliSeed('kaos')
    useSkillTreeStore.setState({ unlockedNodeIds: ['nos_t1'], selectedLifePath: 'huzur' })
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 40)
    useNPCStore.getState().capRelationship('remy', 80)
    useLifePathStore.setState({ progress: { hirs: 0, huzur: 55, emek: 10 }, activePathId: null })
    useLifeStore.setState({
      lastProcessedYear: 2003,
      firedEvents: new Set(['ev_1']),
      flags: new Set(['flag_a']),
      retiredNpcs: new Set(['aldo']),
      dialogueOverrides: { marcus: 'yas' },
    })
    useRomanceStore.setState({
      stage: { chloe: 'sevgili' }, dateCount: { chloe: 2 },
      hasBouquet: true, hasRing: false,
    })

    const json = serialize()
    expect(JSON.parse(json).version).toBe(2)

    resetAll()
    deserialize(json)

    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(3)
    expect(useIdeaSeedStore.getState().kirliSeeds.kaos).toBe(1)
    expect(useSkillTreeStore.getState().unlockedNodeIds).toEqual(['nos_t1'])
    expect(useSkillTreeStore.getState().selectedLifePath).toBe('huzur')
    expect(useNPCStore.getState().getRelationship('marcus')).toBeGreaterThan(0)
    expect(useNPCStore.getState().npcs.marcus.seenDialogueIds).toContain('dia_1')
    expect(useNPCStore.getState().relationshipCaps.remy).toBe(80)
    expect(useLifePathStore.getState().progress.huzur).toBe(55)
    expect(useLifeStore.getState().firedEvents.has('ev_1')).toBe(true)
    expect(useLifeStore.getState().flags.has('flag_a')).toBe(true)
    expect(useLifeStore.getState().isRetired('aldo')).toBe(true)
    expect(useLifeStore.getState().dialogueOverrides.marcus).toBe('yas')
    expect(useRomanceStore.getState().getStage('chloe')).toBe('sevgili')
    expect(useRomanceStore.getState().hasBouquet).toBe(true)
  })

  it('v1 kaydı yüklenir — RPG store\'lar default\'a döner, hata fırlatılmaz', () => {
    useIdeaSeedStore.getState().addSeed('hikaye', 5)

    const snapshot = JSON.parse(serialize())
    snapshot.version = 1
    delete snapshot.ideaSeeds; delete snapshot.skillTree; delete snapshot.npc
    delete snapshot.lifePath;  delete snapshot.life;      delete snapshot.romance

    expect(() => deserialize(JSON.stringify(snapshot))).not.toThrow()
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(0)
    expect(useNPCStore.getState().getRelationship('marcus')).toBe(0)
    expect(useRomanceStore.getState().hasBouquet).toBe(false)
  })

  it('desteklenmeyen versiyon hata fırlatır', () => {
    const snapshot = JSON.parse(serialize())
    snapshot.version = 3
    expect(() => deserialize(JSON.stringify(snapshot))).toThrow()
  })
})
```

- [ ] **Step 2: Testin FAIL ettiğini doğrula**

Run: `npx vitest run tests/engine/savegameEngine.rpg.test.ts`
Expected: FAIL — `version` 1 dönüyor, `useNPCStore.getState().reset is not a function`.

- [ ] **Step 3: npcStore.reset() ekle**

`src/store/npcStore.ts` — interface'e `reset: () => void` ekle; store gövdesine (`getAvailableDialogues`'tan sonra) ekle:

```ts
  reset() {
    set({ npcs: initNpcs(), gainMultipliers: initMultipliers(), relationshipCaps: {} })
  },
```

- [ ] **Step 4: savegameEngine serialize'ı genişlet**

`src/engine/savegameEngine.ts` — import'lara ekle:

```ts
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useNPCStore } from '@/store/npcStore'
import { useLifePathStore } from '@/store/lifePathStore'
import { useLifeStore } from '@/store/lifeStore'
import { useRomanceStore } from '@/store/romanceStore'
```

`serialize()` içinde `version: 1` → `version: 2` yap ve snapshot objesine (mevcut `industryEvent` bloğundan sonra) ekle:

```ts
    ideaSeeds: {
      seeds:      useIdeaSeedStore.getState().seeds,
      kirliSeeds: useIdeaSeedStore.getState().kirliSeeds,
    },
    skillTree: {
      unlockedNodeIds:  useSkillTreeStore.getState().unlockedNodeIds,
      selectedLifePath: useSkillTreeStore.getState().selectedLifePath,
    },
    npc: {
      npcs:             useNPCStore.getState().npcs,
      gainMultipliers:  useNPCStore.getState().gainMultipliers,
      relationshipCaps: useNPCStore.getState().relationshipCaps,
    },
    lifePath: {
      progress:     useLifePathStore.getState().progress,
      activePathId: useLifePathStore.getState().activePathId,
    },
    life: {
      lastProcessedYear: useLifeStore.getState().lastProcessedYear,
      firedEvents:       Array.from(useLifeStore.getState().firedEvents),
      flags:             Array.from(useLifeStore.getState().flags),
      roles:             useLifeStore.getState().roles,
      dialogueOverrides: useLifeStore.getState().dialogueOverrides,
      spawnedNpcs:       useLifeStore.getState().spawnedNpcs,
      retiredNpcs:       Array.from(useLifeStore.getState().retiredNpcs),
    },
    romance: {
      stage:      useRomanceStore.getState().stage,
      dateCount:  useRomanceStore.getState().dateCount,
      hasBouquet: useRomanceStore.getState().hasBouquet,
      hasRing:    useRomanceStore.getState().hasRing,
    },
```

- [ ] **Step 5: deserialize'ı genişlet**

Versiyon kontrolünü değiştir:

```ts
  const v = (s as any).version
  if (v !== 1 && v !== 2) {
    throw new Error(`deserialize: desteklenmeyen save versiyonu: ${v}`)
  }
```

Fonksiyonun sonuna (`useDayTimeStore.getState().reset()` satırından ÖNCE) ekle. Önce hepsi reset (v1'de blok yok → temiz default), sonra blok varsa uygula. `lifePathStore.reset()` skillTree'nin `selectedLifePath`'ini de sıfırladığı için skillTree bloğu EN SON uygulanır:

```ts
  // ── v2 RPG store'ları — önce reset (v1 kayıtlarında blok yok) ──
  useIdeaSeedStore.getState().reset()
  useNPCStore.getState().reset()
  useLifePathStore.getState().reset()   // skillTree.selectedLifePath'i de sıfırlar
  useLifeStore.getState().reset()
  useRomanceStore.getState().reset()
  useSkillTreeStore.getState().reset()

  const seeds = (s.ideaSeeds as any)
  if (seeds) {
    useIdeaSeedStore.setState((cur) => ({
      seeds:      { ...cur.seeds,      ...(seeds.seeds      ?? {}) },
      kirliSeeds: { ...cur.kirliSeeds, ...(seeds.kirliSeeds ?? {}) },
    }))
  }

  const npc = (s.npc as any)
  if (npc) {
    useNPCStore.setState((cur) => ({
      npcs:             { ...cur.npcs,            ...(npc.npcs            ?? {}) },
      gainMultipliers:  { ...cur.gainMultipliers, ...(npc.gainMultipliers ?? {}) },
      relationshipCaps: npc.relationshipCaps ?? {},
    }))
  }

  const lp = (s.lifePath as any)
  if (lp) {
    useLifePathStore.setState({
      progress:     lp.progress     ?? { hirs: 0, huzur: 0, emek: 0 },
      activePathId: lp.activePathId ?? null,
    })
  }

  const life = (s.life as any)
  if (life) {
    useLifeStore.setState({
      lastProcessedYear: life.lastProcessedYear ?? 0,
      firedEvents:       new Set(life.firedEvents ?? []),
      flags:             new Set(life.flags ?? []),
      roles:             life.roles ?? {},
      dialogueOverrides: life.dialogueOverrides ?? {},
      spawnedNpcs:       life.spawnedNpcs ?? [],
      retiredNpcs:       new Set(life.retiredNpcs ?? []),
    })
  }

  const rom = (s.romance as any)
  if (rom) {
    useRomanceStore.setState({
      stage:      rom.stage      ?? {},
      dateCount:  rom.dateCount  ?? {},
      hasBouquet: rom.hasBouquet ?? false,
      hasRing:    rom.hasRing    ?? false,
    })
  }

  const st = (s.skillTree as any)
  if (st) {
    useSkillTreeStore.setState({
      unlockedNodeIds:  st.unlockedNodeIds  ?? [],
      selectedLifePath: st.selectedLifePath ?? null,
    })
  }
```

Not: `lifeStore.reset()`'in `lastProcessedYear` başlangıç değeri ne ise ona güven; testte sadece set edilen alanları doğruluyoruz.

- [ ] **Step 6: Testlerin geçtiğini doğrula**

Run: `npx vitest run tests/engine/savegameEngine.rpg.test.ts`
Expected: PASS (3 test)

- [ ] **Step 7: Tüm test paketini koş**

Run: `npx vitest run`
Expected: hepsi yeşil. Mevcut savegame testleri varsa (`tests/engine/` altında) `version: 1` bekleyen assert'ler kırılabilir — onları `version: 2` ve yeni davranışa göre güncelle.

- [ ] **Step 8: Commit**

```bash
git add src/store/npcStore.ts src/engine/savegameEngine.ts tests/engine/savegameEngine.rpg.test.ts
git commit -m "feat: savegame v2 — ideaSeed/skillTree/npc/lifePath/life/romance persist (v1 geri uyumlu)"
```

---

### Task 2: Demo gating — balıkçı kilidini aç

**Files:**
- Modify: `src/config.ts`
- Modify: `tests/pixi/triggerSystem.demo-on.test.ts`

- [ ] **Step 1: demo-on testini yeni davranışa göre güncelle (failing)**

`tests/pixi/triggerSystem.demo-on.test.ts` — mock'taki set'ten `'balikci'` çıkar:

```ts
vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(['bridge', 'city_core', 'city_culture', 'city_edge', 'city_park']),
  DEMO_BLOCKED_LOCATIONS: new Set(['pub', 'nehir']),
}))
```

`'balikci_door tetikleyicisini engeller'` testini şununla değiştir:

```ts
  it('balikci_door artık demoda açık — setLocation çağrılır', () => {
    handleTrigger('balikci_door')
    expect(mockSetLocation).toHaveBeenCalledWith('balikci')
  })
```

Not: Bu test mock'lu config kullandığı için config değişmeden de geçer — esas değişiklik Step 3'te. Önce testi koş, geçtiğini gör (mock'a dayanır), sonra config'i güncelle.

- [ ] **Step 2: Testi koş**

Run: `npx vitest run tests/pixi/triggerSystem.demo-on.test.ts`
Expected: PASS

- [ ] **Step 3: Gerçek config'i güncelle**

`src/config.ts`:

```ts
export const DEMO_BLOCKED_LOCATIONS = new Set<LocationId>([
  'pub',
  'nehir',
])
```

- [ ] **Step 4: Köprü girişine flavor mesajı**

`src/pixi/WorldScene.ts` satır ~146-148'deki blokta mesajı özelleştir (oda kilidi köprü/şehir geçişlerinde tetiklenir):

```ts
          if (DEMO_MODE && DEMO_BLOCKED_ROOMS.has(et.toRoom)) {
            console.info('🌉 Şehir merkezi tam sürümde açılıyor — neon ışıklar seni bekliyor')
            break
          }
```

(`console.info` App.tsx'teki interceptor ile toast olarak gösterilir.)

- [ ] **Step 5: Tüm testleri koş**

Run: `npx vitest run`
Expected: hepsi yeşil.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts src/pixi/WorldScene.ts tests/pixi/triggerSystem.demo-on.test.ts
git commit -m "feat(demo): balıkçılık demoda açık + köprü flavor mesajı"
```

---

### Task 3: Zihin ağacı — tier-1 kapısı + Zihin sekmesi + rozet

**Files:**
- Modify: `src/store/skillTreeStore.ts`
- Modify: `src/store/__tests__/skillTreeStore.test.ts` (config mock ekle)
- Modify: `src/components/SleepOverlay.tsx`
- Modify: `src/components/SkillTreePanel.tsx`
- Test: `tests/store/skillTreeStore.demo.test.ts` (yeni)

- [ ] **Step 1: Mevcut skillTreeStore testine config mock'u ekle**

`src/store/__tests__/skillTreeStore.test.ts` — en üste (import'lardan önce) ekle, `vi`'yi vitest import'una dahil et:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/config', () => ({
  DEMO_MODE: false,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))
```

(Gerekçe: Step 4'te store `DEMO_MODE`'a bağlanacak; gerçek config `true` olduğundan mevcut T2+ testleri kırılırdı.)

- [ ] **Step 2: Demo gate için failing test yaz**

`tests/store/skillTreeStore.demo.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))

import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'

beforeEach(() => {
  useSkillTreeStore.setState({ unlockedNodeIds: [], selectedLifePath: null })
  useIdeaSeedStore.setState({
    seeds: { nostalji: 10, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10, hukuk: 10 },
  })
})

describe('DEMO_MODE=true — skillTreeStore tier kapısı', () => {
  it('T1 node açılabilir', () => {
    expect(useSkillTreeStore.getState().canUnlock('nos_t1')).toBe(true)
  })

  it('T2 node bağımlılığı karşılansa bile demoda kilitli', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().canUnlock('nos_t2')).toBe(false)
  })

  it('unlockNode T2 node\'u demoda açmaz', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    useSkillTreeStore.getState().unlockNode('nos_t2')
    expect(useSkillTreeStore.getState().unlockedNodeIds).toEqual(['nos_t1'])
  })
})
```

- [ ] **Step 3: FAIL doğrula**

Run: `npx vitest run tests/store/skillTreeStore.demo.test.ts`
Expected: FAIL — T2 testleri (gate henüz yok).

- [ ] **Step 4: Gate'i implement et**

`src/store/skillTreeStore.ts` — import ekle:

```ts
import { DEMO_MODE } from '@/config'
```

`canUnlock` içinde `if (!node) return false` satırından hemen sonra:

```ts
    if (DEMO_MODE && node.tier > 1) return false
```

- [ ] **Step 5: Testleri koş**

Run: `npx vitest run tests/store/skillTreeStore.demo.test.ts src/store/__tests__/skillTreeStore.test.ts`
Expected: ikisi de PASS.

- [ ] **Step 6: SleepOverlay — Zihin sekmesi demoda görünür**

`src/components/SleepOverlay.tsx`:
- `import { DEMO_MODE } from '@/config'` satırını sil.
- `useState<Tab>(DEMO_MODE ? 'sosyal' : 'zihin')` → `useState<Tab>('zihin')`
- Sekme map'i: `{(DEMO_MODE ? (['sosyal'] as Tab[]) : (['zihin', 'sosyal'] as Tab[])).map(t => (` → `{(['zihin', 'sosyal'] as Tab[]).map(t => (`

- [ ] **Step 7: SkillTreePanel — "Tam sürümde" rozeti**

`src/components/SkillTreePanel.tsx` — import ekle:

```ts
import { DEMO_MODE } from '@/config'
```

Hover durumundaki state rozet span'ini (satır ~67-74) şununla değiştir:

```tsx
            <div>
              {DEMO_MODE && hovered.tier > 1 ? (
                <span className="text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300">
                  🔒 Tam sürümde
                </span>
              ) : (
                <span className={`text-xs px-2 py-1 rounded ${
                  getNodeState(hovered.id) === 'active'     ? 'bg-purple-900/40 text-purple-300' :
                  getNodeState(hovered.id) === 'unlockable' ? 'bg-blue-900/40 text-blue-300' :
                  'bg-gray-900/40 text-gray-600'
                }`}>
                  {getNodeState(hovered.id) === 'active'     ? '✓ Açık' :
                   getNodeState(hovered.id) === 'unlockable' ? 'Aç' : 'Kilitli'}
                </span>
              )}
            </div>
```

- [ ] **Step 8: Tüm testleri koş**

Run: `npx vitest run`
Expected: hepsi yeşil.

- [ ] **Step 9: Commit**

```bash
git add src/store/skillTreeStore.ts src/store/__tests__/skillTreeStore.test.ts src/components/SleepOverlay.tsx src/components/SkillTreePanel.tsx tests/store/skillTreeStore.demo.test.ts
git commit -m "feat(demo): zihin ağacı tier-1 açık — Zihin sekmesi görünür, T2+ 'Tam sürümde' kilidi"
```

---

### Task 4: Antiquarian ödülüne para ekle

`endShift` şu an sadece tohum + huzur progress veriyor. Demoda yan işin para getirmesi gerekir (spec: "fikir tohumları + para").

**Files:**
- Modify: `src/store/antiquarianStore.ts`
- Modify: `src/store/__tests__/antiquarianStore.test.ts`

- [ ] **Step 1: Failing test — mevcut endShift testlerini `pay` bekleyecek şekilde güncelle**

`src/store/__tests__/antiquarianStore.test.ts` içindeki `endShift` describe bloğunda (satır ~262+), `endShift()` dönüşünü doğrulayan assert'leri güncelle. Ödül katmanları:
- 0-1 hata → `{ seeds: 3, progress: 5, pay: 300 }`
- 2-3 hata → `{ seeds: 2, progress: 3, pay: 200 }`
- 4+ hata → `{ seeds: 1, progress: 1, pay: 100 }`

Mevcut `toEqual({ seeds: X, progress: Y })` çağrılarının her birine ilgili `pay` alanını ekle. Ayrıca describe bloğuna yeni test ekle:

```ts
  it('endShift parayı gameStore\'a ekler', () => {
    // bu describe'ın mevcut setup helper'ı ile kusursuz vardiya kur (0 hata)
    const before = useGameStore.getState().money
    useAntiquarianStore.getState().endShift()
    expect(useGameStore.getState().money).toBe(before + 300)
  })
```

Dosyanın import'larına `import { useGameStore } from '@/store/gameStore'` ekle. Vardiya kurulum helper'ı bu dosyada zaten var — kusursuz vardiya kuran mevcut testin setup'ını aynen kullan.

- [ ] **Step 2: FAIL doğrula**

Run: `npx vitest run src/store/__tests__/antiquarianStore.test.ts`
Expected: FAIL — `pay` undefined.

- [ ] **Step 3: Implement**

`src/store/antiquarianStore.ts`:

```ts
import { useGameStore } from '@/store/gameStore'
```

`ShiftResult` tipini güncelle:

```ts
type ShiftResult = { seeds: number; progress: number; pay: number } | null
```

`calcReward`'ı güncelle:

```ts
function calcReward(mistakes: number): { seeds: number; progress: number; pay: number } {
  if (mistakes >= 4) return { seeds: 1, progress: 1, pay: 100 }
  if (mistakes >= 2) return { seeds: 2, progress: 3, pay: 200 }
  return { seeds: 3, progress: 5, pay: 300 }
}
```

`endShift` içinde ödül satırlarını güncelle:

```ts
    const { seeds, progress, pay } = calcReward(mistakes)
    useIdeaSeedStore.getState().addSeed('nostalji', seeds)
    useLifePathStore.getState().addProgress('huzur', progress)
    useGameStore.getState().addMoney(pay)
```

ve `return { seeds, progress }` → `return { seeds, progress, pay }`.

- [ ] **Step 4: PASS doğrula + tüm testler**

Run: `npx vitest run src/store/__tests__/antiquarianStore.test.ts` → PASS
Run: `npx vitest run` → hepsi yeşil.

- [ ] **Step 5: Commit**

```bash
git add src/store/antiquarianStore.ts src/store/__tests__/antiquarianStore.test.ts
git commit -m "feat: antiquarian vardiya ödülüne para eklendi (300/200/100, hataya göre)"
```

---

### Task 5: Sahaf arşivi girişi — AntiquarianView + SahafPanel

`AntiquarianScene` (PixiJS) hazır ama UI girişi yok. `BalikciPanel`'deki canvas-mount kalıbı birebir izlenir.

**Files:**
- Create: `src/components/AntiquarianView.tsx`
- Modify: `src/components/SahafPanel.tsx`

- [ ] **Step 1: AntiquarianView bileşenini yaz**

`src/components/AntiquarianView.tsx`:

```tsx
// src/components/AntiquarianView.tsx
import { useEffect, useRef, useState } from 'react'
import { useAntiquarianStore } from '@/store/antiquarianStore'
import { ANTIQUARIAN_SHIFTS } from '@/data/antiquarianShifts'
import { AntiquarianScene } from '@/pixi/AntiquarianScene'

type ViewPhase = 'select' | 'shift' | 'result'

interface Props {
  onBack: () => void
}

export default function AntiquarianView({ onBack }: Props) {
  const completedShifts = useAntiquarianStore((s) => s.completedShifts)
  const [phase, setPhase] = useState<ViewPhase>('select')
  const [result, setResult] = useState<{ seeds: number; progress: number; pay: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<AntiquarianScene | null>(null)

  // Vardiya fazında AntiquarianScene'i mount/tear-down et (BalikciPanel kalıbı)
  useEffect(() => {
    if (phase !== 'shift') return
    const shift = useAntiquarianStore.getState().activeShift
    const canvas = canvasRef.current
    if (!shift || !canvas) return

    let scene: AntiquarianScene | null = null
    let cancelled = false

    AntiquarianScene.create({
      canvas,
      width: 560,
      height: 420,
      shift,
      onAdvanceFromBriefing: () => useAntiquarianStore.getState().advanceFromBriefing(),
      onSelectLocation:      (id) => useAntiquarianStore.getState().selectLocation(id),
      onCollectBook:         (id) => useAntiquarianStore.getState().collectBook(id),
      onUncollectBook:       (id) => useAntiquarianStore.getState().uncollectBook(id),
      onAdvanceToIdentify:   () => useAntiquarianStore.getState().advanceToIdentify(),
      onIdentifyBook:        (id, data) => useAntiquarianStore.getState().identifyBook(id, data),
      onAdvanceToMatch:      () => useAntiquarianStore.getState().advanceToMatch(),
      onMatchBook:           (rid, bid) => useAntiquarianStore.getState().matchBook(rid, bid),
      onShiftEnd: () => {
        // Stale-closure kuralı: her zaman getState()
        const r = useAntiquarianStore.getState().endShift()
        setResult(r)
        setPhase('result')
        scene?.destroy()
        sceneRef.current = null
      },
    }).then((s) => {
      if (cancelled) { s.destroy(); return }
      scene = s
      sceneRef.current = s
    })

    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [phase])

  function startShift(shiftId: string) {
    useAntiquarianStore.getState().startShift(shiftId)
    setPhase('shift')
  }

  function renderSelect() {
    const available = ANTIQUARIAN_SHIFTS.filter((s) => !completedShifts.includes(s.id))
    return (
      <div className="flex flex-col gap-3">
        <p className="text-amber-300 font-mono text-xs uppercase tracking-widest mb-1">
          Arşiv Vardiyası Seç
        </p>
        {available.length === 0 && (
          <p className="text-amber-600 font-mono text-sm italic">
            Bugünlük iş kalmadı. Yarın yine uğra.
          </p>
        )}
        {available.map((s) => (
          <button
            key={s.id}
            onClick={() => startShift(s.id)}
            className="text-left border border-amber-900 rounded-lg p-3 hover:bg-amber-950/40 hover:border-amber-600 transition-colors"
          >
            <p className="text-amber-100 font-mono text-sm font-semibold">
              Vardiya {s.id.replace('antiq_shift_', '')}
            </p>
            <p className="text-amber-500 font-mono text-xs mt-0.5">
              {s.requests.length} talep · {s.locations.length} lokasyon
              {s.hasAuthenticity ? ' · orijinallik kontrolü' : ''}
            </p>
          </button>
        ))}
        <button
          onClick={onBack}
          className="border border-gray-700 rounded-lg py-2 font-mono text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Marcus'a dön
        </button>
      </div>
    )
  }

  function renderShift() {
    return (
      <canvas
        ref={canvasRef}
        width={560}
        height={420}
        style={{ display: 'block' }}
        className="rounded-lg border border-amber-900"
      />
    )
  }

  function renderResult() {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-amber-300 font-mono text-xs uppercase tracking-widest">
          Vardiya Tamamlandı
        </p>
        {result && (
          <div className="border border-amber-900 rounded-lg p-4 bg-amber-950/20 flex flex-col gap-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-amber-500 text-xs">Nostalji tohumu</span>
              <span className="text-amber-100">+{result.seeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-500 text-xs">Huzur ilerlemesi</span>
              <span className="text-amber-100">+{result.progress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-500 text-xs">Ücret</span>
              <span className="text-amber-100">${result.pay}</span>
            </div>
          </div>
        )}
        <button
          onClick={onBack}
          className="border border-amber-700 rounded-lg py-2 font-mono text-sm text-amber-200 hover:bg-amber-900/30 transition-colors"
        >
          Dükkana dön
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {phase === 'select' && renderSelect()}
      {phase === 'shift'  && renderShift()}
      {phase === 'result' && renderResult()}
    </div>
  )
}
```

Not: Bu bileşendeki demo hedef tetiği (`completeDemoStep('archive_shift')`) bilinçli olarak burada YOK — `completeDemoStep` Task 6'da ekleniyor; Task 6 Step 5 bu dosyaya o çağrıyı ekletecek.

- [ ] **Step 2: SahafPanel'e arşiv girişi ekle**

`src/components/SahafPanel.tsx` dosyasını şununla değiştir:

```tsx
// src/components/SahafPanel.tsx
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import DialogueView from '@/components/DialogueView'
import AntiquarianView from '@/components/AntiquarianView'

type View = 'dialogue' | 'archive'

export default function SahafPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)
  const [view, setView] = useState<View>('dialogue')

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`bg-gray-900/95 border border-blue-900 rounded-xl p-6 shadow-2xl ${
      view === 'archive' ? 'w-[620px]' : 'w-80'
    }`}>
      {view === 'dialogue' && (
        <>
          <DialogueView npcId="marcus" onClose={close} />
          <button
            onClick={() => setView('archive')}
            className="mt-3 w-full border border-amber-800 rounded-lg py-2 font-mono text-sm text-amber-300 hover:bg-amber-950/40 hover:border-amber-600 transition-colors"
          >
            📚 Arşiv taraması yap
          </button>
        </>
      )}
      {view === 'archive' && (
        <AntiquarianView onBack={() => setView('dialogue')} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Testleri + build'i koş**

Run: `npx vitest run` → hepsi yeşil (bu task UI-only; mevcut testler kırılmamalı)
Run: `npm run build` → derleme hatası yok

- [ ] **Step 4: Manuel doğrulama**

Run: `npm run dev` → oyunda Marcus'a git → "Arşiv taraması yap" → vardiya seç → Pixi sahnesi açılır → vardiyayı bitir → sonuç ekranında tohum/progress/ücret görünür.

- [ ] **Step 5: Commit**

```bash
git add src/components/AntiquarianView.tsx src/components/SahafPanel.tsx
git commit -m "feat(demo): sahaf arşiv taraması UI girişi — AntiquarianView + SahafPanel modu"
```

---

### Task 6: Demo hedef zinciri (objectives)

Zincir: masaya otur → proje başlat *(mevcut)* → Marcus'u ziyaret et → balık tut → arşiv taraması → uyu+tohum harca → yayınla. Tetikler **bileşen seviyesinde** (store'lara objectiveStore import'u sokulmaz).

**Files:**
- Modify: `src/store/objectiveStore.ts`
- Modify: mevcut objectiveStore testi (`grep -rln "objectiveStore" tests/` ile bul; muhtemelen `tests/store/objectiveStore.test.ts`) — config mock ekle
- Modify: `src/components/DialogueView.tsx`, `src/components/BalikciPanel.tsx`, `src/components/SkillTreeCanvas.tsx`, `src/components/Dashboard.tsx`, `src/components/AntiquarianView.tsx`
- Test: `tests/store/objectiveStore.demo.test.ts` (yeni)

- [ ] **Step 1: Mevcut objectiveStore testine config mock'u ekle**

Dosyayı bul: `grep -rln "advanceToGameDev" tests/ src/` (test dosyası). En üstüne ekle (jsdom directive'inden sonra, import'lardan önce):

```ts
vi.mock('@/config', () => ({
  DEMO_MODE: false,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))
```

(`vi` import edilmemişse vitest import'una ekle. Gerekçe: Step 3'te `advanceToGameDev` demo dalı kazanacak; gerçek config true.)

- [ ] **Step 2: Failing test yaz**

`tests/store/objectiveStore.demo.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))
vi.mock('@/audio/soundService', () => ({ sfx: vi.fn() }))

import { useObjectiveStore } from '@/store/objectiveStore'

beforeEach(() => {
  useObjectiveStore.getState().reset()
})

describe('DEMO_MODE=true — demo hedef zinciri', () => {
  it('advanceToGameDev demoda zinciri başlatır (visit_marcus)', () => {
    useObjectiveStore.getState().advanceToGameDev()
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('visit_marcus')
  })

  it('completeDemoStep yanlış adımda ilerlemez', () => {
    useObjectiveStore.getState().advanceToGameDev()
    useObjectiveStore.getState().completeDemoStep('fish_pier')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('visit_marcus')
  })

  it('completeDemoStep doğru adımda sıradakine geçer', () => {
    useObjectiveStore.getState().advanceToGameDev()
    useObjectiveStore.getState().completeDemoStep('visit_marcus')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('fish_pier')
    useObjectiveStore.getState().completeDemoStep('fish_pier')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('archive_shift')
    useObjectiveStore.getState().completeDemoStep('archive_shift')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('sleep_spend')
    useObjectiveStore.getState().completeDemoStep('sleep_spend')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('publish_game')
  })

  it('son adım tamamlanınca hedef temizlenir', () => {
    useObjectiveStore.getState().setObjective({ id: 'publish_game', title: 'x', description: 'y' })
    useObjectiveStore.getState().completeDemoStep('publish_game')
    expect(useObjectiveStore.getState().activeObjective).toBeNull()
  })

  it('aktif hedef yokken no-op', () => {
    useObjectiveStore.getState().completeDemoStep('visit_marcus')
    expect(useObjectiveStore.getState().activeObjective).toBeNull()
  })
})
```

- [ ] **Step 3: FAIL doğrula, sonra implement et**

Run: `npx vitest run tests/store/objectiveStore.demo.test.ts` → FAIL (`completeDemoStep` yok).

`src/store/objectiveStore.ts` — import ekle:

```ts
import { DEMO_MODE } from '@/config'
```

`DEVELOP_OBJECTIVE` tanımından sonra ekle:

```ts
const DEMO_CHAIN: ObjectiveDef[] = [
  {
    id: 'visit_marcus',
    title: 'Sahafı ziyaret et',
    description: 'Proje gelişiyor. Bu arada sahile in, sahaf Marcus ile tanış.',
  },
  {
    id: 'fish_pier',
    title: 'İskelede balık tut',
    description: "Remy'nin iskelesinde bir balık seansı tamamla.",
  },
  {
    id: 'archive_shift',
    title: 'Arşiv taraması yap',
    description: "Marcus'un arşivinde bir vardiya tamamla — fikir tohumu kazan.",
  },
  {
    id: 'sleep_spend',
    title: 'Uyu ve zihnini geliştir',
    description: 'Yatağına git, Zihin ağacında bir tohum harca.',
  },
  {
    id: 'publish_game',
    title: 'Oyununu yayınla',
    description: 'İlk oyununu tamamla ve dünyaya sun!',
  },
]
```

Interface'e ekle:

```ts
  completeDemoStep: (stepId: string) => void
```

`advanceToGameDev`'i güncelle:

```ts
  advanceToGameDev: () => {
    sfx('objective')
    if (DEMO_MODE) {
      set({ activeObjective: DEMO_CHAIN[0], showPointer: false })
    } else {
      set({ activeObjective: DEVELOP_OBJECTIVE, showPointer: false })
    }
  },
```

Store gövdesine ekle:

```ts
  completeDemoStep: (stepId) => {
    if (!DEMO_MODE) return
    set((s) => {
      if (s.activeObjective?.id !== stepId) return s
      const idx = DEMO_CHAIN.findIndex((o) => o.id === stepId)
      if (idx === -1) return s
      sfx('objective')
      return { ...s, activeObjective: DEMO_CHAIN[idx + 1] ?? null }
    })
  },
```

Run: `npx vitest run tests/store/objectiveStore.demo.test.ts` → PASS

- [ ] **Step 4: Tetik — DialogueView (Marcus diyaloğu tamamlanınca)**

`src/components/DialogueView.tsx` — import ekle:

```ts
import { useObjectiveStore } from '@/store/objectiveStore'
```

Satır ~66'daki `npcStore.completeDialogue(npcId, activeDialogue.id, totalBonus)` çağrısından hemen sonra ekle:

```ts
    if (npcId === 'marcus') useObjectiveStore.getState().completeDemoStep('visit_marcus')
```

- [ ] **Step 5: Tetik — AntiquarianView**

`src/components/AntiquarianView.tsx` — import ekle:

```ts
import { useObjectiveStore } from '@/store/objectiveStore'
```

`onShiftEnd` callback'inde `setPhase('result')` satırından sonra ekle:

```ts
        useObjectiveStore.getState().completeDemoStep('archive_shift')
```

- [ ] **Step 6: Tetik — BalikciPanel (seans bitince)**

`src/components/BalikciPanel.tsx` — import ekle:

```ts
import { useObjectiveStore } from '@/store/objectiveStore'
```

`onCastResult` içindeki `result` dalında, `setPhase('result')` satırından sonra:

```ts
          useObjectiveStore.getState().completeDemoStep('fish_pier')
```

- [ ] **Step 7: Tetik — SkillTreeCanvas (node açılınca)**

`src/components/SkillTreeCanvas.tsx` — import ekle:

```ts
import { useObjectiveStore } from '@/store/objectiveStore'
```

Satır ~329'daki `if (state === 'unlockable') unlockNode(capturedNode.id)` bloğunu şuna çevir:

```ts
        if (state === 'unlockable') {
          unlockNode(capturedNode.id)
          useObjectiveStore.getState().completeDemoStep('sleep_spend')
        }
```

- [ ] **Step 8: Tetik — Dashboard (yayınlanınca)**

`src/components/Dashboard.tsx` — import ekle:

```ts
import { useObjectiveStore } from '@/store/objectiveStore'
```

Satır ~129'daki `onPublishResult(projectId)` çağrısından hemen önce:

```ts
    useObjectiveStore.getState().completeDemoStep('publish_game')
```

- [ ] **Step 9: Tüm testleri koş**

Run: `npx vitest run`
Expected: hepsi yeşil.

- [ ] **Step 10: Commit**

```bash
git add src/store/objectiveStore.ts src/components/DialogueView.tsx src/components/BalikciPanel.tsx src/components/SkillTreeCanvas.tsx src/components/Dashboard.tsx src/components/AntiquarianView.tsx tests/store/objectiveStore.demo.test.ts
git commit -m "feat(demo): demo hedef zinciri — marcus/balık/arşiv/uyku/yayın adımları"
```

(Step 1'de güncellenen mevcut objectiveStore test dosyasını da `git add`'e dahil et.)

---

### Task 7: NewProjectModal — ikinci proje kilidi

**Files:**
- Modify: `src/components/NewProjectModal.tsx`
- Test: `tests/components/NewProjectModal.demo.test.tsx` (yeni)

- [ ] **Step 1: Failing test yaz**

`tests/components/NewProjectModal.demo.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))
vi.mock('@/audio/soundService', () => ({ sfx: vi.fn() }))

import NewProjectModal from '@/components/NewProjectModal'
import { useGameStore } from '@/store/gameStore'

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('DEMO_MODE=true — NewProjectModal ikinci proje kilidi', () => {
  it('totalPublished >= 1 ise kilit mesajı gösterilir', () => {
    useGameStore.setState({ totalPublished: 1 })
    render(<NewProjectModal onClose={() => {}} />)
    expect(screen.getByText(/tam sürümde seni bekliyor/i)).toBeTruthy()
  })

  it('totalPublished 0 ise normal form gösterilir (kilit mesajı yok)', () => {
    render(<NewProjectModal onClose={() => {}} />)
    expect(screen.queryByText(/tam sürümde seni bekliyor/i)).toBeNull()
  })
})
```

- [ ] **Step 2: FAIL doğrula**

Run: `npx vitest run tests/components/NewProjectModal.demo.test.tsx`
Expected: ilk test FAIL (kilit yok).

- [ ] **Step 3: Implement**

`src/components/NewProjectModal.tsx` — bileşen gövdesinin başında (mevcut hook'ların yanına; `useGameStore` import edilmemişse import et):

```tsx
  const totalPublished = useGameStore((s) => s.totalPublished)
```

İlk `return`'den önce erken dönüş ekle (modal'ın mevcut dış sarmalayıcı class'larını birebir kopyala — `onClose` prop'u mevcut):

```tsx
  if (DEMO_MODE && totalPublished >= 1) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full text-center">
          <p className="text-3xl mb-3">🌅</p>
          <p className="text-gray-100 font-semibold mb-2">Demo burada bitiyor</p>
          <p className="text-gray-400 text-sm mb-5">
            İkinci projen tam sürümde seni bekliyor. Macenta Koyu'nu keşfetmeye devam edebilirsin.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    )
  }
```

- [ ] **Step 4: PASS + tüm testler**

Run: `npx vitest run tests/components/NewProjectModal.demo.test.tsx` → PASS
Run: `npx vitest run` → hepsi yeşil.

- [ ] **Step 5: Commit**

```bash
git add src/components/NewProjectModal.tsx tests/components/NewProjectModal.demo.test.tsx
git commit -m "feat(demo): ikinci proje kilidi — yayın sonrası NewProjectModal kilit ekranı"
```

---

### Task 8: DemoEndScreen + App.tsx bağlantısı

**Files:**
- Create: `src/components/DemoEndScreen.tsx`
- Modify: `src/App.tsx`
- Test: `tests/components/DemoEndScreen.test.tsx` (yeni)

- [ ] **Step 1: Failing test yaz**

`tests/components/DemoEndScreen.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/audio/soundService', () => ({ sfx: vi.fn() }))

import DemoEndScreen from '@/components/DemoEndScreen'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useNPCStore } from '@/store/npcStore'

beforeEach(() => {
  useGameStore.getState().reset()
  useGameStore.setState({ gamePhase: 'playing', money: 62_000 })
  useIdeaSeedStore.getState().reset()
  useIdeaSeedStore.getState().addSeed('nostalji', 4)
  useNPCStore.getState().reset()
})

describe('DemoEndScreen', () => {
  it('istatistikleri ve wishlist çağrısını gösterir', () => {
    render(<DemoEndScreen onClose={() => {}} />)
    expect(screen.getByText(/hikaye daha yeni başlıyor/i)).toBeTruthy()
    expect(screen.getByText(/wishlist/i)).toBeTruthy()
    expect(screen.getByText(/62.000|62,000/)).toBeTruthy()
  })

  it('"Keşfe devam et" onClose çağırır', () => {
    const onClose = vi.fn()
    render(<DemoEndScreen onClose={onClose} />)
    fireEvent.click(screen.getByText(/keşfe devam et/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('"Ana menü" gamePhase\'i title yapar', () => {
    render(<DemoEndScreen onClose={() => {}} />)
    fireEvent.click(screen.getByText(/ana menü/i))
    expect(useGameStore.getState().gamePhase).toBe('title')
  })
})
```

- [ ] **Step 2: FAIL doğrula**

Run: `npx vitest run tests/components/DemoEndScreen.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: DemoEndScreen'i yaz**

`src/components/DemoEndScreen.tsx`:

```tsx
// src/components/DemoEndScreen.tsx
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useNPCStore } from '@/store/npcStore'

interface Props {
  onClose: () => void
}

export default function DemoEndScreen({ onClose }: Props) {
  const money        = useGameStore((s) => s.money)
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const tickCount    = useTimeStore((s) => s.tickCount)
  const totalSeeds   = useIdeaSeedStore((s) => Object.values(s.seeds).reduce((a, b) => a + b, 0))
  const marcusRel    = useNPCStore((s) => s.npcs.marcus?.relationship ?? 0)

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-purple-800 rounded-xl p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-3">🌆</p>
        <h2 className="text-xl font-bold text-purple-200 mb-2">İlk oyunun dünyaya açıldı</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Garajdan yükselen ilk ışık buydu. Köprünün ötesinde neon şehir, Apex'in gölgesi
          ve seçeceğin hayat yolu seni bekliyor.{' '}
          <span className="text-purple-300">Macenta Koyu'nda hikaye daha yeni başlıyor.</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Geçen hafta</p>
            <p className="text-gray-100 font-bold">{tickCount}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Kasa</p>
            <p className="text-gray-100 font-bold">${money.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Fikir tohumu</p>
            <p className="text-gray-100 font-bold">{totalSeeds}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Marcus dostluğu</p>
            <p className="text-gray-100 font-bold">{Math.round(marcusRel)}</p>
          </div>
        </div>

        <p className="text-amber-300 text-sm mb-5">
          ⭐ Beğendiysen Steam'de <b>wishlist</b>'e eklemeyi unutma!
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white rounded-lg py-2.5 font-medium"
          >
            Keşfe devam et
          </button>
          <button
            onClick={() => setGamePhase('title')}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-300 rounded-lg py-2.5 font-medium"
          >
            Ana menü
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: PASS doğrula**

Run: `npx vitest run tests/components/DemoEndScreen.test.tsx`
Expected: PASS (3 test)

- [ ] **Step 5: App.tsx'e bağla**

`src/App.tsx`:

Import'lara ekle:

```ts
import DemoEndScreen from '@/components/DemoEndScreen'
import { DEMO_MODE } from '@/config'
```

`const [resultProjectId, setResultProjectId] = useState<string | null>(null)` satırının altına:

```ts
  const [showDemoEnd, setShowDemoEnd] = useState(false)
  const demoEndShownRef = useRef(false)
```

PublishResult bloğunu (satır ~299-306) şununla değiştir:

```tsx
      {resultProjectId && (
        <div className="absolute inset-0 z-30">
          <PublishResult
            projectId={resultProjectId}
            onContinue={() => {
              setResultProjectId(null)
              if (
                DEMO_MODE &&
                useGameStore.getState().totalPublished === 1 &&
                !demoEndShownRef.current
              ) {
                demoEndShownRef.current = true
                setShowDemoEnd(true)
              }
            }}
          />
        </div>
      )}

      {showDemoEnd && <DemoEndScreen onClose={() => setShowDemoEnd(false)} />}
```

- [ ] **Step 6: Tüm testler + build**

Run: `npx vitest run` → hepsi yeşil
Run: `npm run build` → hata yok

- [ ] **Step 7: Manuel doğrulama (uçtan uca demo akışı)**

Run: `npm run dev` → yeni oyun → ilk projeyi geliştir → yayınla → PublishResult "Devam Et" → DemoEndScreen görünür → "Keşfe devam et" → dünya gezilebilir; masaya oturup yeni proje → kilit ekranı.

- [ ] **Step 8: Commit**

```bash
git add src/components/DemoEndScreen.tsx src/App.tsx tests/components/DemoEndScreen.test.tsx
git commit -m "feat(demo): DemoEndScreen — ilk yayın sonrası epilog, istatistik, wishlist; serbest dolaşım"
```

---

### Task 9: Asset manifest + son doğrulama

**Files:**
- Create: `docs/asset-manifest.md`

- [ ] **Step 1: Asset manifest dokümanını yaz**

`docs/asset-manifest.md` — aşağıdaki yapıyla oluştur. Stil çapası: iki yaka esteti (sahil = sıcak/lo-fi pastel; UI bu demoda sahil paleti). Tile boyutu 32×32 (mevcut `blank_32x32.aseprite` ile uyumlu).

```markdown
# Asset Manifest — Steam Demo

_Öncelik: P1 = demo için zorunlu · P2 = demo kalitesini yükseltir · P3 = lüks._
_Stil: sahil yakası lo-fi pixel art, 32×32 tile grid, sıcak pastel palet._
_Teslim formatı: .aseprite kaynak + .png export → `src/assets/` veya `public/`._

## P1 — Kahraman varlıklar
| Varlık | Boyut | Kullanım | Not |
|---|---|---|---|
| Oyuncu sprite sheet | 32×48, 4 yön × 4 kare | WorldScene/Player.ts | İlk öğrenme projesi olarak ideal |
| Garaj iç tileset | 32×32 | coast_home odası | Masa, PC, yatak, duvar/zemin |
| Marcus portresi | 96×96 | DialogueView | Tek kare, büst |
| Stüdyo masası + PC | 32×32 ×2-3 tile | Masa trigger görseli | Onboarding'in odak noktası |
| İskele + deniz tile'ları | 32×32 | coast odası | Balıkçılık girişi |

## P2 — Dünya dokusu
| Varlık | Boyut | Kullanım | Not |
|---|---|---|---|
| Sahil binaları (sahaf, fırın, ev) | 64×64+ | coast odası | Dış cepheler |
| Demo NPC sprite'ları (Marcus, Remy) | 32×48 | WorldScene | Idle 2 kare yeterli |
| Balıkçılık sahne görselleri | 480×300 | FishingScene | Su, şamandıra, balık silüetleri |
| UI ikonları (para, tohum, hedef) | 16×16 / 24×24 | HUD | Tutarlı piksel yoğunluğu |
| Arşiv sahnesi dokuları | 560×420 | AntiquarianScene | Kitap sırtları, raf |

## P3 — Atmosfer
| Varlık | Boyut | Kullanım | Not |
|---|---|---|---|
| Dalga/martı animasyonları | 32×32 | coast odası | 2-4 kare loop |
| Hava/ışık overlay'leri | ekran | WorldScene | Gün döngüsü tonlaması |
| Dekoratif detaylar (saksı, tabela) | 32×32 | odalar | Doluluk hissi |

## Ses (fal-ai üretimi)
| Varlık | Süre | Kullanım |
|---|---|---|
| Sahil ambiyans loop | 60-90 sn | playing fazı müziği (mevcut placeholder değişir) |
| Menü teması | 30-60 sn | StartScreen loop |
| SFX seti: click/publish/objective/sleep | <1 sn | soundService mevcut anahtarlar |

## Çalışma akışı
1. P1'den başla, her varlık bitince oyuna entegre edilir (placeholder değişir).
2. Palet/stil ilk P1 varlıkta kilitlenir; sonrakiler ona uyar.
3. Kaynak .aseprite dosyaları repo'da tutulur.
```

- [ ] **Step 2: DevTools durumunu doğrula (kod değişikliği beklenmez)**

`electron/main.ts` satır ~21-24'ü kontrol et: `openDevTools` çağrısı `if (process.env.ELECTRON_RENDERER_URL)` (yalnızca dev server) içinde — **production'da zaten açılmıyor**. Değişiklik gerekmez; `durum.md`'deki "DevTools production'dan kaldır" maddesi bu doğrulamayla kapanır.

- [ ] **Step 3: Tam doğrulama**

Run: `npx vitest run` → tüm testler yeşil
Run: `npm run build` → hata yok

- [ ] **Step 4: durum.md güncelle**

`durum.md`'ye "Tamamlananlar" altına yeni bölüm ekle: "Steam Demo Hattı (2026-06-XX)" — bu planda yapılanları 5-6 maddede özetle (savegame v2, balıkçı açık, tier-1 zihin, arşiv girişi, hedef zinciri, DemoEndScreen). "Yarın Yapılacaklar" bölümündeki kapanan maddeleri işaretle.

- [ ] **Step 5: Commit + push**

```bash
git add docs/asset-manifest.md durum.md
git commit -m "docs: asset manifest (P1/P2/P3 + ses) + durum güncellemesi"
git pull --rebase --autostash
git push
```

---

## Kapsam Dışı Hatırlatması

Pub garsonluğu, nehir/sal, şehir odaları, romantizm UI, cutscene içeriği, çocuk yaşlanması bu plana DAHİL DEĞİL (`ERTELENEN-ISLER.md`). Pixel art üretimi manifest üzerinden paralel ilerler — bu planın kod görevlerini bloklamaz.
