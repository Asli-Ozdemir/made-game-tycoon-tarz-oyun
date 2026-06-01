# Zihin Geliştirme Ağacı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uyku tetikleyicisiyle açılan, fikir tohumlarıyla node açılan, PixiJS nöron görselli beceri ağacı sistemi.

**Architecture:** React panel (SleepOverlay → SkillTreePanel) içine gömülü PixiJS canvas nöronları çizer. Store katmanı (skillTreeStore) unlock mantığını yönetir, ideaSeedStore'dan seed harcar. Yatak trigger'ı worldStore'a 'sleep' location ekler.

**Tech Stack:** PixiJS v8.18.1, React 18, Zustand, Vitest, TypeScript

---

## Dosya Haritası

| Dosya | İşlem | Sorumluluk |
|-------|-------|------------|
| `src/data/skillTree.ts` | Yeni | SkillNode tipleri + 30 node tanımı |
| `src/store/skillTreeStore.ts` | Yeni | Unlock state, canUnlock, getNodeState |
| `src/store/__tests__/skillTreeStore.test.ts` | Yeni | Store logic testleri |
| `src/data/__tests__/skillTree.test.ts` | Yeni | Node tanımı geçerlilik testleri |
| `src/store/worldStore.ts` | Değişiklik | LocationId'ye 'sleep' ekle |
| `src/pixi/TriggerSystem.ts` | Değişiklik | 'yatak' trigger handler |
| `src/pixi/rooms/coastRoom.ts` | Değişiklik | yatak trigger koordinatı |
| `src/components/SleepOverlay.tsx` | Yeni | Siyah fade + SkillTreePanel kapsayıcı |
| `src/components/SkillTreePanel.tsx` | Yeni | React UI (seed sayaçları, tooltip, ESC) |
| `src/components/SkillTreeCanvas.tsx` | Yeni | PixiJS canvas, nöron çizimi, etkileşim |
| `src/App.tsx` | Değişiklik | SleepOverlay import + render |

---

## Task 1: Veri Tipleri ve 30 Node Tanımı

**Files:**
- Create: `src/data/skillTree.ts`
- Create: `src/data/__tests__/skillTree.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/data/__tests__/skillTree.test.ts
import { describe, it, expect } from 'vitest'
import { SKILL_NODES } from '../skillTree'

describe('skillTree node definitions', () => {
  it('30 node tanımlanmış olmalı', () => {
    expect(SKILL_NODES).toHaveLength(30)
  })

  it('her node benzersiz id taşımalı', () => {
    const ids = SKILL_NODES.map(n => n.id)
    expect(new Set(ids).size).toBe(30)
  })

  it('tier dağılımı doğru olmalı', () => {
    const counts = [1,2,3,4,5].map(t => SKILL_NODES.filter(n => n.tier === t).length)
    expect(counts).toEqual([6, 7, 7, 6, 4])
  })

  it('her dependsOn referansı var olan bir node id olmalı', () => {
    const ids = new Set(SKILL_NODES.map(n => n.id))
    for (const node of SKILL_NODES) {
      for (const dep of node.dependsOn) {
        expect(ids.has(dep), `${node.id} → ${dep} yok`).toBe(true)
      }
    }
  })

  it('T1 node bağımlılığı olmamalı', () => {
    const t1 = SKILL_NODES.filter(n => n.tier === 1)
    for (const n of t1) expect(n.dependsOn).toHaveLength(0)
  })

  it('T5 lifePathLock veya undefined olmalı', () => {
    const valid = new Set(['hirs', 'huzur', 'emek', undefined])
    const t5 = SKILL_NODES.filter(n => n.tier === 5)
    for (const n of t5) expect(valid.has(n.lifePathLock)).toBe(true)
  })
})
```

- [ ] **Adım 2: Testi çalıştır — FAIL bekliyoruz**

```bash
cd "C:\Users\umutm\Desktop\mad-game-tarzı-oyun"
npm test -- --run src/data/__tests__/skillTree.test.ts
```

Beklenen: `Cannot find module '../skillTree'`

- [ ] **Adım 3: skillTree.ts yaz**

```ts
// src/data/skillTree.ts
import type { IdeaSeedType } from '@/data/npcDialogues'

export type LifePath = 'hirs' | 'huzur' | 'emek'

export type SkillEffect =
  | { type: 'tycoon_bonus';  stat: 'hikaye_quality' | 'rpg_quality' | 'sim_quality' | 'action_quality' | 'all_quality' | 'project_speed' | 'income_mult' | 'starting_money'; value: number }
  | { type: 'project_bonus'; genre: string; value: number }
  | { type: 'crisis_reduce'; value: number }
  | { type: 'crisis_duration_reduce'; value: number }
  | { type: 'bug_reduce';    value: number }
  | { type: 'salary_reduce'; value: number }
  | { type: 'social_unlock'; target: string }
  | { type: 'reputation_bonus'; value: number }

export interface SkillNode {
  id: string
  tier: 1 | 2 | 3 | 4 | 5
  name: string
  description: string
  cost: { type: IdeaSeedType; amount: number }[]
  effect: SkillEffect
  dependsOn: string[]
  lifePathLock?: LifePath
}

export const SKILL_NODES: SkillNode[] = [
  // ── T1 (6 node, bağımlılık yok, 1× tek tip) ───────────────────────────
  {
    id: 'nos_t1',
    tier: 1,
    name: 'İlk Kıvılcım',
    description: 'Geçmişin izleri hikayene derinlik katar.',
    cost: [{ type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'hikaye_quality', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'hik_t1',
    tier: 1,
    name: 'Karakter Duygusu',
    description: 'Karakterlerin neden önemsendiğini anlarsın.',
    cost: [{ type: 'hikaye', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'rpg_quality', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'kaos_t1',
    tier: 1,
    name: 'Düzensiz Deha',
    description: 'Kaos içinde yaratıcılık filizlenir.',
    cost: [{ type: 'kaos', amount: 1 }],
    effect: { type: 'crisis_reduce', value: 0.10 },
    dependsOn: [],
  },
  {
    id: 'zmn_t1',
    tier: 1,
    name: 'Odak Anı',
    description: 'Her dakikayı sayarsın.',
    cost: [{ type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'project_speed', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'nos2_t1',
    tier: 1,
    name: 'Köklere Dönüş',
    description: 'Nereden geldiğini bilmek nereye gideceğini netleştirir.',
    cost: [{ type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'starting_money', value: 2000 },
    dependsOn: [],
  },
  {
    id: 'hik2_t1',
    tier: 1,
    name: 'İlk Taslak',
    description: 'Hiçbir şey mükemmel başlamaz, ama bir yerlerde başlar.',
    cost: [{ type: 'hikaye', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.03 },
    dependsOn: [],
  },

  // ── T2 (7 node) ────────────────────────────────────────────────────────
  {
    id: 'nos_t2',
    tier: 2,
    name: 'Geçmişin Sesi',
    description: "Marcus'la daha derin bir bağ kurarsın.",
    cost: [{ type: 'nostalji', amount: 2 }],
    effect: { type: 'social_unlock', target: 'marcus_depth' },
    dependsOn: ['nos_t1'],
  },
  {
    id: 'hik_t2',
    tier: 2,
    name: 'Empati Katmanı',
    description: 'Oyuncunun hislerine daha hassas bakarsın.',
    cost: [{ type: 'hikaye', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'rpg_quality', value: 0.08 },
    dependsOn: ['hik_t1'],
  },
  {
    id: 'kaos_t2',
    tier: 2,
    name: 'Kontrollü Kaos',
    description: 'Ekibini kaosun ortasında bile verimli tutarsın.',
    cost: [{ type: 'kaos', amount: 1 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'project_speed', value: 0.08 },
    dependsOn: ['kaos_t1'],
  },
  {
    id: 'zmn_t2',
    tier: 2,
    name: 'Akış Hali',
    description: 'Zaman senin için akar.',
    cost: [{ type: 'zaman_yonetimi', amount: 2 }],
    effect: { type: 'crisis_duration_reduce', value: 0.25 },
    dependsOn: ['zmn_t1'],
  },
  {
    id: 'nos_hik_t2',
    tier: 2,
    name: 'Hikayeci',
    description: 'Geçmişi hikayeye dönüştürme sanatın var.',
    cost: [{ type: 'nostalji', amount: 1 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'project_bonus', genre: 'Adventure', value: 0.08 },
    dependsOn: ['nos_t1', 'hik_t1'],
  },
  {
    id: 'kaos2_t2',
    tier: 2,
    name: 'Riskli Bahis',
    description: 'Yüksek risk, yüksek ödül. Kalite öngörülmez olur ama tavana çıkabilir.',
    cost: [{ type: 'kaos', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.12 },
    dependsOn: ['kaos_t1'],
  },
  {
    id: 'zmn2_t2',
    tier: 2,
    name: 'Verimli Sabah',
    description: 'Sabahın ilk saatlerini en iyi sen kullanırsın.',
    cost: [{ type: 'zaman_yonetimi', amount: 1 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'project_speed', value: 0.06 },
    dependsOn: ['zmn_t1', 'nos2_t1'],
  },

  // ── T3 (7 node) ────────────────────────────────────────────────────────
  {
    id: 'nos_t3',
    tier: 3,
    name: 'Arşiv Ustası',
    description: "Sahafın arka deposuna erişim kazanırsın.",
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'social_unlock', target: 'sahaf_arsiv' },
    dependsOn: ['nos_t2'],
  },
  {
    id: 'hik_t3',
    tier: 3,
    name: 'Dünya İnşacısı',
    description: 'Simülasyon oyunlarında gerçekçilik çıtasını yükseltirsin.',
    cost: [{ type: 'hikaye', amount: 2 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'sim_quality', value: 0.10 },
    dependsOn: ['hik_t2'],
  },
  {
    id: 'kaos_t3',
    tier: 3,
    name: 'Kaotik Yaratıcı',
    description: 'Aksiyon oyunlarında adrenalin seviyeni maksime çıkarırsın.',
    cost: [{ type: 'kaos', amount: 2 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'action_quality', value: 0.12 },
    dependsOn: ['kaos_t2'],
  },
  {
    id: 'zmn_t3',
    tier: 3,
    name: 'Zaman Mühendisi',
    description: 'Birden fazla projeyi aynı anda yürütebilirsin.',
    cost: [{ type: 'zaman_yonetimi', amount: 3 }],
    effect: { type: 'bug_reduce', value: 0.15 },
    dependsOn: ['zmn_t2'],
  },
  {
    id: 'nos_kaos_t3',
    tier: 3,
    name: 'Nostaljik İsyan',
    description: 'Bağımsız ruhun reklamcılık maliyetini düşürür.',
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'kaos', amount: 1 }],
    effect: { type: 'salary_reduce', value: 0.10 },
    dependsOn: ['nos_t2', 'kaos_t2'],
  },
  {
    id: 'hik_zmn_t3',
    tier: 3,
    name: 'Anlatıcı Disiplin',
    description: 'Hikayeni yazmak kadar kodunu da temiz tutarsın.',
    cost: [{ type: 'hikaye', amount: 2 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'bug_reduce', value: 0.10 },
    dependsOn: ['hik_t2', 'zmn_t2'],
  },
  {
    id: 'mix_t3',
    tier: 3,
    name: 'Denge',
    description: 'Hikaye ve çılgınlık arasındaki dengeyi bulursun.',
    cost: [{ type: 'nostalji', amount: 1 }, { type: 'hikaye', amount: 1 }, { type: 'kaos', amount: 1 }],
    effect: { type: 'reputation_bonus', value: 5 },
    dependsOn: ['nos_hik_t2'],
  },

  // ── T4 (6 node) ────────────────────────────────────────────────────────
  {
    id: 'nos_t4',
    tier: 4,
    name: "Geçmişin Mimarı",
    description: "Remy sana nehrin sırrını anlatır.",
    cost: [{ type: 'nostalji', amount: 3 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'social_unlock', target: 'remy_depth' },
    dependsOn: ['nos_t3'],
  },
  {
    id: 'hik_t4',
    tier: 4,
    name: 'Efsanevi Senaryo',
    description: 'Her türde kalite tavanı yükselir.',
    cost: [{ type: 'hikaye', amount: 3 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.15 },
    dependsOn: ['hik_t3'],
  },
  {
    id: 'kaos_t4',
    tier: 4,
    name: 'Anarşist Vizyon',
    description: 'Bir oyunun viral olmasını sağlayacak kıvılcımı bilirsin.',
    cost: [{ type: 'kaos', amount: 3 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'income_mult', value: 0.20 },
    dependsOn: ['kaos_t3'],
  },
  {
    id: 'zmn_t4',
    tier: 4,
    name: 'Kronos Zihni',
    description: 'Krizler seni eskisi kadar yıpratmaz.',
    cost: [{ type: 'zaman_yonetimi', amount: 3 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'crisis_duration_reduce', value: 0.50 },
    dependsOn: ['zmn_t3'],
  },
  {
    id: 'nos_hik_t4',
    tier: 4,
    name: 'Derin Hafıza',
    description: "Theo sana pubın en karanlık sırrını fısıldar.",
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'hikaye', amount: 2 }],
    effect: { type: 'social_unlock', target: 'theo_depth' },
    dependsOn: ['nos_t3', 'hik_t3'],
  },
  {
    id: 'kaos_zmn_t4',
    tier: 4,
    name: 'Kaotik Verimlilik',
    description: 'Çalışanların seni kaos içinde bile takip eder.',
    cost: [{ type: 'kaos', amount: 2 }, { type: 'zaman_yonetimi', amount: 2 }],
    effect: { type: 'salary_reduce', value: 0.15 },
    dependsOn: ['kaos_t3', 'zmn_t3'],
  },

  // ── T5 (4 node, Hayat Yolu efsanevi) ──────────────────────────────────
  {
    id: 't5_hirs',
    tier: 5,
    name: 'Zirvenin Bedeli',
    description: 'Gelir her şeyin önünde gelir. Hırs Yolu seni burada tamamlar.',
    cost: [{ type: 'kaos', amount: 4 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'income_mult', value: 0.30 },
    dependsOn: ['kaos_t4'],
    lifePathLock: 'hirs',
  },
  {
    id: 't5_huzur',
    tier: 5,
    name: 'Huzurun Kökü',
    description: 'Nehir gibi akar, deniz gibi derin. Huzur Yolu burada meyve verir.',
    cost: [{ type: 'nostalji', amount: 3 }, { type: 'hikaye', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.25 },
    dependsOn: ['nos_t4', 'hik_t4'],
    lifePathLock: 'huzur',
  },
  {
    id: 't5_emek',
    tier: 5,
    name: 'Demir İrade',
    description: 'Hiçbir bug, hiçbir hata geçemez bu zihinsel duvardan. Emek Yolu tamamlanır.',
    cost: [{ type: 'zaman_yonetimi', amount: 3 }, { type: 'kaos', amount: 2 }],
    effect: { type: 'bug_reduce', value: 1.0 },
    dependsOn: ['zmn_t4', 'kaos_t4'],
    lifePathLock: 'emek',
  },
  {
    id: 't5_notr',
    tier: 5,
    name: 'Denge Noktası',
    description: 'Hiçbir yol seçmeden tüm yollara bakmak da bir tercih.',
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'hikaye', amount: 2 }, { type: 'kaos', amount: 1 }],
    effect: { type: 'reputation_bonus', value: 15 },
    dependsOn: ['nos_hik_t4', 'mix_t3'],
  },
]
```

- [ ] **Adım 4: Testi çalıştır — PASS bekliyoruz**

```bash
npm test -- --run src/data/__tests__/skillTree.test.ts
```

Beklenen: 6 test PASS

- [ ] **Adım 5: Commit**

```bash
git add src/data/skillTree.ts src/data/__tests__/skillTree.test.ts
git commit -m "feat: skill tree data — 30 node tanımı + testler"
```

---

## Task 2: skillTreeStore

**Files:**
- Create: `src/store/skillTreeStore.ts`
- Create: `src/store/__tests__/skillTreeStore.test.ts`

- [ ] **Adım 1: Test dosyasını yaz**

```ts
// src/store/__tests__/skillTreeStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillTreeStore } from '../skillTreeStore'
import { useIdeaSeedStore } from '../ideaSeedStore'

beforeEach(() => {
  useSkillTreeStore.setState({ unlockedNodeIds: [] })
  useIdeaSeedStore.setState({
    seeds: { nostalji: 10, hikaye: 10, kaos: 10, zaman_yonetimi: 10 },
  })
})

describe('skillTreeStore', () => {
  it('başlangıçta hiçbir node açık değil', () => {
    expect(useSkillTreeStore.getState().unlockedNodeIds).toHaveLength(0)
  })

  it('T1 node canUnlock — seed varsa true döner', () => {
    expect(useSkillTreeStore.getState().canUnlock('nos_t1')).toBe(true)
  })

  it('T1 node canUnlock — seed yoksa false döner', () => {
    useIdeaSeedStore.setState({ seeds: { nostalji: 0, hikaye: 10, kaos: 10, zaman_yonetimi: 10 } })
    expect(useSkillTreeStore.getState().canUnlock('nos_t1')).toBe(false)
  })

  it('T2 node canUnlock — bağımlı T1 açık değilse false döner', () => {
    expect(useSkillTreeStore.getState().canUnlock('nos_t2')).toBe(false)
  })

  it('T2 node canUnlock — bağımlı T1 açılınca true döner', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().canUnlock('nos_t2')).toBe(true)
  })

  it('unlockNode seed harcar', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(9)
  })

  it('unlockNode node id ekler', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().unlockedNodeIds).toContain('nos_t1')
  })

  it('canUnlock false iken unlockNode hiçbir şey yapmaz', () => {
    useIdeaSeedStore.setState({ seeds: { nostalji: 0, hikaye: 10, kaos: 10, zaman_yonetimi: 10 } })
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().unlockedNodeIds).toHaveLength(0)
  })

  it("getNodeState: locked — T2 bağımlılık eksik", () => {
    expect(useSkillTreeStore.getState().getNodeState('nos_t2')).toBe('locked')
  })

  it("getNodeState: unlockable — bağımlılıklar açık, seed yeterli", () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().getNodeState('nos_t2')).toBe('unlockable')
  })

  it("getNodeState: active — node açılmış", () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().getNodeState('nos_t1')).toBe('active')
  })

  it('lifePathLock: hayat yolu null iken T5 locked', () => {
    // Bağımlılıklar açık olsa bile lifePathLock varsa locked döner
    useSkillTreeStore.setState({ unlockedNodeIds: ['kaos_t1','kaos_t2','kaos2_t2','kaos_t3','kaos_t4'] })
    // hayat yolu seçilmemiş (null) → T5 hirs locked
    expect(useSkillTreeStore.getState().getNodeState('t5_hirs')).toBe('locked')
  })
})
```

- [ ] **Adım 2: Testi çalıştır — FAIL bekliyoruz**

```bash
npm test -- --run src/store/__tests__/skillTreeStore.test.ts
```

Beklenen: `Cannot find module '../skillTreeStore'`

- [ ] **Adım 3: skillTreeStore.ts yaz**

```ts
// src/store/skillTreeStore.ts
import { create } from 'zustand'
import { SKILL_NODES } from '@/data/skillTree'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'

type NodeState = 'locked' | 'unlockable' | 'active'

interface SkillTreeStore {
  unlockedNodeIds: string[]
  selectedLifePath: 'hirs' | 'huzur' | 'emek' | null
  canUnlock: (id: string) => boolean
  unlockNode: (id: string) => void
  getNodeState: (id: string) => NodeState
  getActiveEffects: () => import('@/data/skillTree').SkillEffect[]
  reset: () => void
}

export const useSkillTreeStore = create<SkillTreeStore>((set, get) => ({
  unlockedNodeIds: [],
  selectedLifePath: null,

  canUnlock(id) {
    const node = SKILL_NODES.find(n => n.id === id)
    if (!node) return false

    const { unlockedNodeIds, selectedLifePath } = get()

    // Zaten açıksa açılamaz
    if (unlockedNodeIds.includes(id)) return false

    // Hayat yolu kilidi: seçilmiş yol yoksa T5 kilitli
    if (node.lifePathLock && node.lifePathLock !== selectedLifePath) return false

    // Bağımlılık kontrolü
    if (!node.dependsOn.every(dep => unlockedNodeIds.includes(dep))) return false

    // Seed kontrolü
    const seeds = useIdeaSeedStore.getState().seeds
    return node.cost.every(c => seeds[c.type] >= c.amount)
  },

  unlockNode(id) {
    if (!get().canUnlock(id)) return
    const node = SKILL_NODES.find(n => n.id === id)!
    // Seed harca
    for (const c of node.cost) {
      useIdeaSeedStore.getState().spendSeed(c.type, c.amount)
    }
    set(s => ({ unlockedNodeIds: [...s.unlockedNodeIds, id] }))
  },

  getNodeState(id): NodeState {
    const { unlockedNodeIds } = get()
    if (unlockedNodeIds.includes(id)) return 'active'
    if (get().canUnlock(id)) return 'unlockable'
    return 'locked'
  },

  getActiveEffects() {
    const { unlockedNodeIds } = get()
    return SKILL_NODES
      .filter(n => unlockedNodeIds.includes(n.id))
      .map(n => n.effect)
  },

  reset() {
    set({ unlockedNodeIds: [], selectedLifePath: null })
  },
}))
```

- [ ] **Adım 4: Testi çalıştır — PASS bekliyoruz**

```bash
npm test -- --run src/store/__tests__/skillTreeStore.test.ts
```

Beklenen: 12 test PASS

- [ ] **Adım 5: Tüm testlerin hâlâ geçtiğini doğrula**

```bash
npm test -- --run
```

Beklenen: 297+ test PASS (önceki testler bozulmamış)

- [ ] **Adım 6: Commit**

```bash
git add src/store/skillTreeStore.ts src/store/__tests__/skillTreeStore.test.ts
git commit -m "feat: skillTreeStore — canUnlock, unlockNode, getNodeState"
```

---

## Task 3: Uyku Tetikleyicisi Altyapısı

**Files:**
- Modify: `src/store/worldStore.ts`
- Modify: `src/pixi/TriggerSystem.ts`
- Modify: `src/pixi/rooms/coastRoom.ts`

- [ ] **Adım 1: worldStore'a 'sleep' ekle**

`src/store/worldStore.ts` dosyasında:

```ts
// ÖNCE:
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | null

// SONRA:
export type LocationId = 'cafe' | 'fair' | 'akademi' | 'sahaf' | 'balikci' | 'pub' | 'sleep' | null
```

- [ ] **Adım 2: TriggerSystem'e yatak handler ekle**

`src/pixi/TriggerSystem.ts` dosyasında `LOCATION_MAP`'e ve `handleTrigger`'a ekle:

```ts
// LOCATION_MAP'e ekle:
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:     'cafe',
  fair_entrance: 'fair',
  akademi_door:  'akademi',
  sahaf_door:    'sahaf',
  balikci_door:  'balikci',
  pub_door:      'pub',
  yatak:         'sleep',   // ← yeni
}
```

- [ ] **Adım 3: coastRoom'a yatak trigger'ı ekle**

`src/pixi/rooms/coastRoom.ts` dosyasında `triggers` dizisine ekle:

```ts
triggers: [
  { name: 'studio_desk',  x: 768,  y: 384, w: 32, h: 32 },
  { name: 'sahaf_door',   x: 256,  y: 512, w: 32, h: 32 },
  { name: 'balikci_door', x: 1184, y: 480, w: 32, h: 32 },
  { name: 'pub_door',     x: 480,  y: 640, w: 32, h: 32 },
  { name: 'yatak',        x: 832,  y: 448, w: 32, h: 32 },  // ← yeni: sahil evi iç kısım
],
```

- [ ] **Adım 4: Testler hâlâ geçiyor mu kontrol et**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS (tip değişikliği başka dosyayı kırmamış)

- [ ] **Adım 5: Commit**

```bash
git add src/store/worldStore.ts src/pixi/TriggerSystem.ts src/pixi/rooms/coastRoom.ts
git commit -m "feat: uyku trigger — worldStore 'sleep' lokasyon + yatak trigger"
```

---

## Task 4: SleepOverlay + App.tsx Entegrasyonu

**Files:**
- Create: `src/components/SleepOverlay.tsx`
- Modify: `src/App.tsx`

- [ ] **Adım 1: SleepOverlay.tsx yaz**

```tsx
// src/components/SleepOverlay.tsx
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import SkillTreePanel from '@/components/SkillTreePanel'

export default function SleepOverlay() {
  const setLocation = useWorldStore(s => s.setLocation)
  const setIsPaused = useDayTimeStore(s => s.setIsPaused)
  const endDay      = useDayTimeStore(s => s.endDay)
  const [visible, setVisible] = useState(false)

  // Fade-in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  function wake() {
    setVisible(false)
    setTimeout(() => {
      endDay()
      setLocation(null)
      setIsPaused(false)
    }, 600)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') wake()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-600"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0c0820 0%, #050309 70%, #030208 100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <SkillTreePanel onWake={wake} />
    </div>
  )
}
```

- [ ] **Adım 2: App.tsx'e SleepOverlay ekle**

`src/App.tsx` dosyasında import ekle:

```tsx
import SleepOverlay from '@/components/SleepOverlay'
```

`currentLocation === 'pub'` bloğunun hemen altına:

```tsx
{currentLocation === 'sleep' && (
  <SleepOverlay />
)}
```

- [ ] **Adım 3: Testler hâlâ geçiyor mu kontrol et**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS

- [ ] **Adım 4: Commit**

```bash
git add src/components/SleepOverlay.tsx src/App.tsx
git commit -m "feat: SleepOverlay — uyku fade + App.tsx entegrasyonu"
```

---

## Task 5: SkillTreePanel (React UI Shell)

**Files:**
- Create: `src/components/SkillTreePanel.tsx`

- [ ] **Adım 1: SkillTreePanel.tsx yaz**

```tsx
// src/components/SkillTreePanel.tsx
import { useState } from 'react'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { SKILL_NODES, type SkillNode } from '@/data/skillTree'
import { IDEA_SEED_META } from '@/data/npcDialogues'
import SkillTreeCanvas from '@/components/SkillTreeCanvas'

interface Props {
  onWake: () => void
}

export default function SkillTreePanel({ onWake }: Props) {
  const seeds        = useIdeaSeedStore(s => s.seeds)
  const getNodeState = useSkillTreeStore(s => s.getNodeState)
  const [hovered, setHovered] = useState<SkillNode | null>(null)

  const seedTypes = ['nostalji', 'hikaye', 'kaos', 'zaman_yonetimi'] as const

  return (
    <div className="flex flex-col w-full h-full" style={{ maxWidth: 800, maxHeight: 640 }}>

      {/* Üst bar — tohum sayaçları */}
      <div className="flex justify-center gap-6 py-3 border-b border-purple-900/30">
        {seedTypes.map(type => {
          const meta = IDEA_SEED_META[type]
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span className="text-base">{meta.emoji}</span>
              <span className="font-mono text-sm" style={{ color: meta.color }}>
                {seeds[type]}
              </span>
            </div>
          )
        })}
      </div>

      {/* PixiJS canvas alanı */}
      <div className="flex-1 relative">
        <SkillTreeCanvas onHover={setHovered} />
      </div>

      {/* Alt bar — hover tooltip */}
      <div className="h-16 border-t border-purple-900/30 flex items-center px-6 gap-4">
        {hovered ? (
          <>
            <div className="flex-1">
              <p className="text-purple-200 text-sm font-bold">{hovered.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{hovered.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {hovered.cost.map((c, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    color: IDEA_SEED_META[c.type].color,
                    border: `1px solid ${IDEA_SEED_META[c.type].color}44`,
                  }}
                >
                  {IDEA_SEED_META[c.type].emoji} ×{c.amount}
                </span>
              ))}
            </div>
            <div>
              <span className={`text-xs px-2 py-1 rounded ${
                getNodeState(hovered.id) === 'active'     ? 'bg-purple-900/40 text-purple-300' :
                getNodeState(hovered.id) === 'unlockable' ? 'bg-blue-900/40 text-blue-300' :
                'bg-gray-900/40 text-gray-600'
              }`}>
                {getNodeState(hovered.id) === 'active'     ? '✓ Açık' :
                 getNodeState(hovered.id) === 'unlockable' ? 'Aç' : 'Kilitli'}
              </span>
            </div>
          </>
        ) : (
          <p className="text-gray-700 text-xs mx-auto">
            Bir nörona tıkla veya üzerine gel · ESC ile uyan
          </p>
        )}
      </div>

      {/* Uyan butonu */}
      <button
        onClick={onWake}
        className="absolute top-3 right-4 text-gray-700 hover:text-gray-400 text-xs transition-colors"
      >
        Uyan (ESC)
      </button>
    </div>
  )
}
```

- [ ] **Adım 2: Testler geçiyor mu kontrol et**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS

- [ ] **Adım 3: Commit**

```bash
git add src/components/SkillTreePanel.tsx
git commit -m "feat: SkillTreePanel — seed sayaçları, tooltip, ESC"
```

---

## Task 6: SkillTreeCanvas (PixiJS Nöron Rendering)

**Files:**
- Create: `src/components/SkillTreeCanvas.tsx`

- [ ] **Adım 1: SkillTreeCanvas.tsx yaz**

```tsx
// src/components/SkillTreeCanvas.tsx
import { useEffect, useRef } from 'react'
import { Application, Graphics, Container } from 'pixi.js'
import { SKILL_NODES, type SkillNode } from '@/data/skillTree'
import { useSkillTreeStore } from '@/store/skillTreeStore'

// Canvas boyutları
const CW = 760
const CH = 560
const CX = CW / 2   // merkez x
const CY = CH / 2   // merkez y

// Tier yarıçapları
const TIER_R = [0, 110, 200, 300, 400, 490]

// Her tier için başlangıç açısı (seed tipine göre kümeleme)
function getNodeAngle(node: SkillNode, allNodes: SkillNode[]): number {
  // Tohum tipine göre açısal bölge
  const zones: Record<string, number> = {
    nos_t1:        -2.4,
    nos2_t1:       -1.8,
    hik_t1:        -0.6,
    hik2_t1:       -1.2,
    kaos_t1:        1.8,
    zmn_t1:         2.4,
    nos_t2:        -2.5,
    hik_t2:        -1.0,
    kaos_t2:        2.0,
    zmn_t2:         2.8,
    nos_hik_t2:    -1.7,
    kaos2_t2:       1.4,
    zmn2_t2:        2.3,
    nos_t3:        -2.6,
    hik_t3:        -0.8,
    kaos_t3:        1.6,
    zmn_t3:         2.6,
    nos_kaos_t3:    1.0,
    hik_zmn_t3:    -0.3,
    mix_t3:        -1.4,
    nos_t4:        -2.4,
    hik_t4:        -0.9,
    kaos_t4:        1.8,
    zmn_t4:         2.5,
    nos_hik_t4:    -1.6,
    kaos_zmn_t4:    2.1,
    t5_hirs:        Math.PI,          // sol
    t5_huzur:      -Math.PI / 2,      // üst
    t5_emek:        0,                 // sağ
    t5_notr:        Math.PI / 2,      // alt
  }
  return zones[node.id] ?? 0
}

function getNodePos(node: SkillNode, allNodes: SkillNode[]): { x: number; y: number } {
  const r = TIER_R[node.tier]
  const a = getNodeAngle(node, allNodes)
  return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r }
}

// ── Nöron çizim fonksiyonları ─────────────────────────────────────────────

function drawBranch(
  g: Graphics,
  x: number, y: number,
  angle: number, len: number, depth: number,
  active: boolean
) {
  if (depth === 0 || len < 3) return
  const ex = x + Math.cos(angle) * len
  const ey = y + Math.sin(angle) * len

  g.moveTo(x, y).lineTo(ex, ey).stroke({
    width: active ? Math.max(0.5, depth * 0.6) : 0.4,
    color: active ? 0x4ab8ff : 0x1a2444,
    alpha: active ? 0.7 - depth * 0.05 : 0.25,
  })

  if (depth === 1) {
    g.circle(ex, ey, active ? 2.5 : 1.5)
      .fill({ color: active ? 0xff9900 : 0x1e2a40, alpha: active ? 1 : 0.4 })
  }

  const sp = 0.35 + depth * 0.05
  drawBranch(g, ex, ey, angle - sp, len * 0.65, depth - 1, active)
  drawBranch(g, ex, ey, angle + sp, len * 0.63, depth - 1, active)
  if (depth > 2) drawBranch(g, ex, ey, angle, len * 0.55, depth - 2, active)
}

function drawNeuron(
  g: Graphics,
  cx: number, cy: number,
  R: number,
  state: 'locked' | 'unlockable' | 'active'
) {
  const active      = state !== 'locked'
  const unlockable  = state === 'unlockable'

  // Dendritler
  const dendAngles = [-2.3, -1.6, -0.8, 0.5, 2.6, 3.4, Math.PI - 0.2, Math.PI + 0.4]
  for (const a of dendAngles) {
    drawBranch(g, cx, cy, a, R * 1.6, 3, active)
  }

  // Soma — 5 loblu yapı
  const lobeAngles = [0, Math.PI*2/5, Math.PI*4/5, Math.PI*6/5, Math.PI*8/5]
  const lobeR      = R * 0.52
  const lobeDist   = R * 0.52

  for (const a of lobeAngles) {
    const lx = cx + Math.cos(a) * lobeDist
    const ly = cy + Math.sin(a) * lobeDist
    g.circle(lx, ly, lobeR)
      .fill({ color: active ? 0x122a50 : 0x060d1a })
      .stroke({ width: active ? 2 : 1, color: active ? (unlockable ? 0x4488cc : 0xe07020) : 0x1e2a44 })
  }

  // Merkez
  g.circle(cx, cy, R * 0.55)
    .fill({ color: active ? 0x112040 : 0x08121e })
    .stroke({ width: active ? 2.5 : 1, color: active ? 0xe07020 : 0x1e2a44 })

  // Çekirdek
  if (active) {
    g.circle(cx, cy, R * 0.22).fill(0xffaa00)
    g.circle(cx - R * 0.08, cy - R * 0.09, R * 0.08).fill(0xffffff)
  } else {
    g.circle(cx, cy, R * 0.22).fill(0x1a2038)
    g.circle(cx, cy, R * 0.10).fill(0x252040)
  }

  // Unlockable: titreyen/parlayan sınır efekti
  if (unlockable) {
    g.circle(cx, cy, R * 0.58)
      .stroke({ width: 1, color: 0x60a5fa, alpha: 0.4 })
  }
}

function drawAxon(
  g: Graphics,
  x1: number, y1: number,
  x2: number, y2: number,
  active: boolean
) {
  const dx  = x2 - x1
  const dy  = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return

  const nx = dy / len  // normal vektör
  const ny = -dx / len

  if (!active) {
    g.moveTo(x1, y1).lineTo(x2, y2)
      .stroke({ width: 1, color: 0x1a1840, alpha: 0.2 })
    return
  }

  // Akson gövde
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 3, color: 0x1a5090, alpha: 0.9 })

  // Myelin segmentleri
  const segCount = Math.max(2, Math.floor(len / 22))
  for (let s = 0; s < segCount; s++) {
    const t0 = (s + 0.08) / segCount
    const t1 = (s + 0.92) / segCount
    const sx0 = x1 + dx * t0, sy0 = y1 + dy * t0
    const sx1 = x1 + dx * t1, sy1 = y1 + dy * t1
    g.moveTo(sx0 + nx * 6, sy0 + ny * 6)
      .lineTo(sx1 + nx * 6, sy1 + ny * 6)
      .lineTo(sx1 - nx * 6, sy1 - ny * 6)
      .lineTo(sx0 - nx * 6, sy0 - ny * 6)
      .fill({ color: s % 2 === 0 ? 0xff8800 : 0x2288cc, alpha: 0.9 })
  }

  // Terminal
  g.circle(x2, y2, 5).fill(0xff8800)
  g.circle(x2, y2, 2).fill(0xffee00)
}

interface Props {
  onHover: (node: SkillNode | null) => void
}

export default function SkillTreeCanvas({ onHover }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const appRef      = useRef<Application | null>(null)

  const getNodeState = useSkillTreeStore.getState().getNodeState
  const unlockNode   = useSkillTreeStore.getState().unlockNode

  useEffect(() => {
    if (!canvasRef.current) return

    const app = new Application()
    appRef.current = app

    app.init({
      canvas:          canvasRef.current,
      width:           CW,
      height:          CH,
      backgroundColor: 0x030208,
      antialias:       true,
    }).then(() => {
      renderTree(app)
    })

    // Store değişince yeniden çiz
    const unsub = useSkillTreeStore.subscribe(() => {
      if (appRef.current) renderTree(appRef.current)
    })

    return () => {
      unsub()
      app.destroy()
    }
  }, [])

  function renderTree(app: Application) {
    app.stage.removeChildren()

    // Arkaplan partiküller
    const bg = new Graphics()
    for (let i = 0; i < 150; i++) {
      const sx = ((i * 4621 + 999) % CW)
      const sy = ((i * 7919 + 333) % CH)
      bg.circle(sx, sy, 0.8).fill({ color: 0xc8d4ff, alpha: ((i * 37) % 40) / 100 + 0.04 })
    }
    app.stage.addChild(bg)

    const positions = new Map<string, { x: number; y: number }>()
    for (const node of SKILL_NODES) {
      positions.set(node.id, getNodePos(node, SKILL_NODES))
    }

    // Axon katmanı (önce çiz)
    const axonLayer = new Graphics()
    for (const node of SKILL_NODES) {
      const pos = positions.get(node.id)!
      for (const depId of node.dependsOn) {
        const depPos = positions.get(depId)
        if (!depPos) continue
        const nodeActive = getNodeState(node.id) === 'active'
        const depActive  = getNodeState(depId) === 'active'
        drawAxon(axonLayer, depPos.x, depPos.y, pos.x, pos.y, nodeActive && depActive)
      }
    }
    app.stage.addChild(axonLayer)

    // Nöron katmanı
    for (const node of SKILL_NODES) {
      const { x, y } = positions.get(node.id)!
      const state = getNodeState(node.id)
      const R     = node.tier === 5 ? 22 : 16 + (5 - node.tier) * 1.5

      const neuronContainer = new Container()
      neuronContainer.x = 0
      neuronContainer.y = 0
      neuronContainer.eventMode = 'static'
      neuronContainer.cursor    = state !== 'locked' ? 'pointer' : 'default'
      neuronContainer.hitArea   = { contains: (hx: number, hy: number) =>
        Math.sqrt((hx - x) ** 2 + (hy - y) ** 2) < R * 2.5
      } as any

      const g = new Graphics()
      drawNeuron(g, x, y, R, state)
      neuronContainer.addChild(g)

      neuronContainer.on('pointerover', () => onHover(node))
      neuronContainer.on('pointerout',  () => onHover(null))
      neuronContainer.on('pointertap',  () => {
        if (state === 'unlockable') {
          unlockNode(node.id)
        }
      })

      app.stage.addChild(neuronContainer)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
```

- [ ] **Adım 2: Testler geçiyor mu kontrol et**

```bash
npm test -- --run
```

Beklenen: tüm testler PASS

- [ ] **Adım 3: Oyunu başlat ve yatak trigger'ını test et**

```bash
npm run dev
```

1. Oyunda sahil odasına gir
2. Sahil evi içinde `(832, 448)` koordinatına git (tile 26,14)
3. `SleepOverlay` açılmalı
4. Nöronlar canvas'ta görünmeli
5. T1 nöronunun üzerine gelince alt barda isim/maliyet çıkmalı
6. Yeterli seed varsa tıklayarak T1 açılabilmeli
7. ESC ile kapanmalı, zaman ilerlemeli

- [ ] **Adım 4: durum.md güncelle**

`durum.md` dosyasında "Tamamlananlar" bölümüne ekle:

```markdown
### Zihin Geliştirme Ağacı (2026-06-01)
- 30 node, 5 tier, radyal nöron layout
- `src/data/skillTree.ts`: SkillNode tipleri + 30 node tanımı
- `src/store/skillTreeStore.ts`: canUnlock, unlockNode, getNodeState, getActiveEffects
- `src/components/SkillTreeCanvas.tsx`: PixiJS nöron rendering (loblu soma, dendrit, myelin akson)
- `src/components/SkillTreePanel.tsx`: seed sayaçları, hover tooltip
- `src/components/SleepOverlay.tsx`: uyku fade + gün sonu
- Yatak trigger: coastRoom tile (26,14) → 'sleep' location
```

"Sıradaki Büyük Görevler"den "Zihin Geliştirme Ağacı" satırını kaldır.

- [ ] **Adım 5: Commit**

```bash
git add src/components/SkillTreeCanvas.tsx src/components/SkillTreePanel.tsx src/components/SleepOverlay.tsx durum.md
git commit -m "feat: SkillTreeCanvas — PixiJS nöron rendering + tam entegrasyon"
```
