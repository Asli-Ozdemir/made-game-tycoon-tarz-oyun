# Faz 6C — Pazarlama Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyunculara yayın öncesi/sonrası pazarlama kampanyaları ve sosyal medya tepkileri (pasif viral/review bomb + aktif dev günlüğü/topluluk etkinliği) mekanizmaları ekler.

**Architecture:** `campaignEngine.ts` saf hesap fonksiyonları + `campaignStore.ts` durum yönetimi. `scoreEngine` pre-launch çarpanını okur. `CampaignPanel` ve `SocialEventToast` yeni UI bileşenleri. `ProjectCard` ve `HUD` güncellenir.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest

---

## Dosya Haritası

| Dosya | İşlem |
|---|---|
| `src/engine/campaignEngine.ts` | Yeni: CAMPAIGN_CONFIGS, computePreLaunchMultiplier, computePostLaunchBonusRevenue, rollSocialEvent |
| `src/store/campaignStore.ts` | Yeni: aktif kampanyalar, sosyal aksiyon cooldown'ları, weeklyTick |
| `src/engine/scoreEngine.ts` | preLaunchMultiplier çarpanı eklenir |
| `src/engine/savegameEngine.ts` | campaignStore snapshot |
| `src/App.tsx` | weeklyTick'e campaignStore.weeklyTick(); SocialEventToast render; SaveLoadPanel reset |
| `src/components/SaveLoadPanel.tsx` | doMainMenu'ya campaignStore.reset() |
| `src/components/SocialEventToast.tsx` | Yeni: viral/review_bomb/dev_diary/community toast bildirimi |
| `src/components/CampaignPanel.tsx` | Yeni: 3 sekmeli panel |
| `src/components/ProjectCard.tsx` | Kampanya başlatma/durdurma butonu eklenir |
| `src/components/HUD.tsx` | 📣 butonu + aktif kampanya rozeti |
| `tests/engine/campaignEngine.test.ts` | Yeni: 8 test |
| `tests/store/campaignStore.test.ts` | Yeni: 5 test |
| `docs/superpowers/DURUM.md` | Faz 6C özeti |

---

### Task 1: campaignEngine.ts — Saf Hesap Fonksiyonları + Testler

**Files:**
- Create: `src/engine/campaignEngine.ts`
- Create: `tests/engine/campaignEngine.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/engine/campaignEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  CAMPAIGN_CONFIGS,
  computePreLaunchMultiplier,
  computePostLaunchBonusRevenue,
  rollSocialEvent,
} from '@/engine/campaignEngine'
import type { ActiveCampaign } from '@/engine/campaignEngine'

function makeCampaign(overrides: Partial<ActiveCampaign> = {}): ActiveCampaign {
  return {
    id: 'c1',
    projectId: 'p1',
    type: 'sosyal',
    startTick: 0,
    endTick: 4,
    isPreLaunch: true,
    isActive: true,
    ...overrides,
  }
}

describe('computePreLaunchMultiplier', () => {
  it('boş dizi → 1.0', () => {
    expect(computePreLaunchMultiplier([])).toBe(1.0)
  })

  it('tek aktif pre-launch kampanya → config salesMultiplier', () => {
    const c = makeCampaign({ type: 'influencer' })
    expect(computePreLaunchMultiplier([c])).toBe(CAMPAIGN_CONFIGS.influencer.salesMultiplier)
  })

  it('iki aktif pre-launch kampanya → max alınır (stack yok)', () => {
    const c1 = makeCampaign({ type: 'sosyal' })
    const c2 = makeCampaign({ id: 'c2', type: 'influencer' })
    expect(computePreLaunchMultiplier([c1, c2])).toBe(
      Math.max(CAMPAIGN_CONFIGS.sosyal.salesMultiplier, CAMPAIGN_CONFIGS.influencer.salesMultiplier)
    )
  })
})

describe('computePostLaunchBonusRevenue', () => {
  it('aktif, süresi geçmemiş → publishRevenue * bonusRate', () => {
    const c = makeCampaign({ type: 'sosyal', endTick: 10, isPreLaunch: false })
    const result = computePostLaunchBonusRevenue(c, 10000, 5)
    expect(result).toBe(Math.round(10000 * CAMPAIGN_CONFIGS.sosyal.postLaunchBonusRate))
  })

  it('currentTick >= endTick → 0', () => {
    const c = makeCampaign({ type: 'sosyal', endTick: 5, isPreLaunch: false })
    expect(computePostLaunchBonusRevenue(c, 10000, 5)).toBe(0)
  })

  it('isActive: false → 0', () => {
    const c = makeCampaign({ isActive: false, endTick: 10, isPreLaunch: false })
    expect(computePostLaunchBonusRevenue(c, 10000, 3)).toBe(0)
  })
})

describe('rollSocialEvent', () => {
  it('score >= 80, hasActiveCampaign → viral veya null (deterministik seed)', () => {
    const result = rollSocialEvent(85, true, 1)
    expect(['viral', null]).toContain(result)
  })

  it('score < 40, hasActiveCampaign yok → review_bomb veya null', () => {
    const result = rollSocialEvent(35, false, 1)
    expect(['review_bomb', null]).toContain(result)
  })

  it('score = 60, herhangi bir kombinasyon → her zaman null (eşik dışı)', () => {
    expect(rollSocialEvent(60, false, 1)).toBeNull()
    expect(rollSocialEvent(60, true, 99)).toBeNull()
  })

  it('score >= 80 ama hasActiveCampaign yok → viral olmaz', () => {
    // viral için hasActiveCampaign zorunlu
    for (let seed = 0; seed < 20; seed++) {
      expect(rollSocialEvent(85, false, seed)).toBeNull()
    }
  })

  it('score < 40 ama hasActiveCampaign var → review_bomb olmaz', () => {
    for (let seed = 0; seed < 20; seed++) {
      expect(rollSocialEvent(35, true, seed)).toBeNull()
    }
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail ettiğini doğrula**

```
npx vitest run tests/engine/campaignEngine.test.ts
```
Beklenen: `Cannot find module '@/engine/campaignEngine'`

- [ ] **Step 3: campaignEngine.ts'i yaz**

`src/engine/campaignEngine.ts`:

```typescript
export type CampaignType = 'sosyal' | 'influencer' | 'billboard'

export interface CampaignConfig {
  type:               CampaignType
  name:               string
  openingCost:        number
  weeklyBudget:       number
  durationWeeks:      number
  salesMultiplier:    number    // pre-launch scoreEngine çarpanı
  reputationPerWeek:  number
  postLaunchBonusRate: number   // publishRevenue'ya uygulanan haftalık oran
}

export interface ActiveCampaign {
  id:          string
  projectId:   string
  type:        CampaignType
  startTick:   number
  endTick:     number
  isPreLaunch: boolean   // başlatıldığında proje 'gelistirme' statüsündeydi
  isActive:    boolean   // false = durduruldu veya süresi bitti
}

export const CAMPAIGN_CONFIGS: Record<CampaignType, CampaignConfig> = {
  sosyal: {
    type:               'sosyal',
    name:               'Sosyal Medya',
    openingCost:        2000,
    weeklyBudget:       500,
    durationWeeks:      4,
    salesMultiplier:    1.15,
    reputationPerWeek:  1,
    postLaunchBonusRate: 0.05,
  },
  influencer: {
    type:               'influencer',
    name:               'Influencer',
    openingCost:        5000,
    weeklyBudget:       1500,
    durationWeeks:      3,
    salesMultiplier:    1.30,
    reputationPerWeek:  3,
    postLaunchBonusRate: 0.08,
  },
  billboard: {
    type:               'billboard',
    name:               'Billboard',
    openingCost:        8000,
    weeklyBudget:       2000,
    durationWeeks:      6,
    salesMultiplier:    1.20,
    reputationPerWeek:  5,
    postLaunchBonusRate: 0.06,
  },
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Yayın öncesi çarpan — aktif pre-launch kampanya varsa max döner (stack yok)
export function computePreLaunchMultiplier(campaigns: ActiveCampaign[]): number {
  const active = campaigns.filter(c => c.isPreLaunch && c.isActive)
  if (active.length === 0) return 1.0
  return Math.max(...active.map(c => CAMPAIGN_CONFIGS[c.type].salesMultiplier))
}

// Yayın sonrası haftalık bonus gelir
export function computePostLaunchBonusRevenue(
  campaign: ActiveCampaign,
  publishRevenue: number,
  currentTick: number
): number {
  if (!campaign.isActive || currentTick >= campaign.endTick) return 0
  return Math.round(publishRevenue * CAMPAIGN_CONFIGS[campaign.type].postLaunchBonusRate)
}

// Pasif sosyal olay üret (deterministik seed)
export function rollSocialEvent(
  score: number,
  hasActiveCampaign: boolean,
  seed: number
): 'viral' | 'review_bomb' | null {
  if (score >= 80 && hasActiveCampaign && seededRandom(seed) < 0.15) return 'viral'
  if (score < 40 && !hasActiveCampaign && seededRandom(seed) < 0.10) return 'review_bomb'
  return null
}
```

- [ ] **Step 4: Testleri çalıştır**

```
npx vitest run tests/engine/campaignEngine.test.ts
```
Beklenen: tüm testler geçer (8+ test)

- [ ] **Step 5: Commit**

```bash
git add src/engine/campaignEngine.ts tests/engine/campaignEngine.test.ts
git commit -m "feat(faz6c): campaignEngine saf hesap fonksiyonları"
```

---

### Task 2: campaignStore.ts + Testler

**Files:**
- Create: `src/store/campaignStore.ts`
- Create: `tests/store/campaignStore.test.ts`

**Önemli not:** `App.tsx`'te `advance()` çağrısı `tickCount`'u artırır, ardından `campaignStore.weeklyTick()` çalışır. Bu nedenle `devDiaryBonusUntil[projectId] = tickCount + 1` olarak set edilir (spec'teki `devDiaryBonusTick` mantığının doğru implementasyonu).

- [ ] **Step 1: Failing testleri yaz**

`tests/store/campaignStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaignStore } from '@/store/campaignStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { CAMPAIGN_CONFIGS } from '@/engine/campaignEngine'

function makePublishedProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1', name: 'Test Oyunu', genreId: 'aksiyon', topicId: 't1',
    platformId: 'pc', scope: 'kucuk',
    startDate: { year: 2001, season: 'ilkbahar', week: 1 },
    totalWeeks: 4, weeksElapsed: 4, qualityPoints: 20, status: 'yayinlandi',
    contentType: 'standalone', price: 20, discountPct: null, isOnSale: false,
    publishTickCount: 5, featuredUntilTick: null, exclusivePlatformId: null,
    publishResult: {
      score: 70, sales: 500, revenue: 10000,
      publishDate: { year: 2001, season: 'ilkbahar', week: 1 },
    },
    ...overrides,
  }
}

function makeDevProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1', name: 'Test Oyunu', genreId: 'aksiyon', topicId: 't1',
    platformId: 'pc', scope: 'kucuk',
    startDate: { year: 2001, season: 'ilkbahar', week: 1 },
    totalWeeks: 4, weeksElapsed: 0, qualityPoints: 0, status: 'gelistirme',
    contentType: 'standalone', price: 20, discountPct: null, isOnSale: false,
    publishTickCount: null, featuredUntilTick: null, exclusivePlatformId: null,
    ...overrides,
  }
}

beforeEach(() => {
  useCampaignStore.getState().reset()
  useGameStore.setState({ money: 50000, reputation: 0, totalPublished: 0 })
  useTimeStore.setState({ date: { year: 2001, season: 'ilkbahar', week: 1 }, tickCount: 10 })
  useProjectStore.setState({ projects: [] })
})

describe('startCampaign', () => {
  it('peşin maliyet düşer ve kampanya eklenir', () => {
    useProjectStore.setState({ projects: [makeDevProject()] })

    useCampaignStore.getState().startCampaign('p1', 'sosyal')

    expect(useGameStore.getState().money).toBe(50000 - CAMPAIGN_CONFIGS.sosyal.openingCost)
    const campaigns = useCampaignStore.getState().campaigns
    expect(campaigns).toHaveLength(1)
    expect(campaigns[0].isActive).toBe(true)
    expect(campaigns[0].isPreLaunch).toBe(true)
    expect(campaigns[0].type).toBe('sosyal')
  })
})

describe('stopCampaign', () => {
  it('kampanya isActive: false olur', () => {
    useProjectStore.setState({ projects: [makeDevProject()] })
    useCampaignStore.getState().startCampaign('p1', 'sosyal')
    const campaignId = useCampaignStore.getState().campaigns[0].id
    useCampaignStore.getState().stopCampaign(campaignId)
    expect(useCampaignStore.getState().campaigns[0].isActive).toBe(false)
  })
})

describe('weeklyTick — post-launch bonus', () => {
  it('aktif post-launch kampanya → haftalık gider düşer, bonus gelir eklenir', () => {
    useProjectStore.setState({ projects: [makePublishedProject()] })
    useCampaignStore.setState({
      campaigns: [{
        id: 'c1', projectId: 'p1', type: 'sosyal',
        startTick: 5, endTick: 20,
        isPreLaunch: false, isActive: true,
      }],
    })

    const moneyBefore = useGameStore.getState().money
    useCampaignStore.getState().weeklyTick()

    const expectedCost  = CAMPAIGN_CONFIGS.sosyal.weeklyBudget
    const expectedBonus = Math.round(10000 * CAMPAIGN_CONFIGS.sosyal.postLaunchBonusRate)
    const netChange     = expectedBonus - expectedCost
    expect(useGameStore.getState().money).toBe(moneyBefore + netChange)
  })
})

describe('triggerDevDiary', () => {
  it('para düşer, itibar artar, cooldown set edilir', () => {
    useProjectStore.setState({ projects: [makePublishedProject()] })
    const tick = useTimeStore.getState().tickCount

    useCampaignStore.getState().triggerDevDiary('p1')

    expect(useGameStore.getState().money).toBe(50000 - 2000)
    expect(useGameStore.getState().reputation).toBe(5)
    expect(useCampaignStore.getState().actionCooldowns['p1']).toBe(tick + 4)
  })
})

describe('triggerDevDiary — cooldown engeli', () => {
  it('cooldown içindeyken tekrar triggerDevDiary → para değişmez', () => {
    useProjectStore.setState({ projects: [makePublishedProject()] })

    useCampaignStore.getState().triggerDevDiary('p1')
    const moneyAfterFirst = useGameStore.getState().money

    useCampaignStore.getState().triggerDevDiary('p1')  // cooldown içinde
    expect(useGameStore.getState().money).toBe(moneyAfterFirst)
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail ettiğini doğrula**

```
npx vitest run tests/store/campaignStore.test.ts
```
Beklenen: `Cannot find module '@/store/campaignStore'`

- [ ] **Step 3: campaignStore.ts'i yaz**

`src/store/campaignStore.ts`:

```typescript
import { create } from 'zustand'
import {
  CAMPAIGN_CONFIGS,
  computePostLaunchBonusRevenue,
  rollSocialEvent,
} from '@/engine/campaignEngine'
import type { ActiveCampaign, CampaignType } from '@/engine/campaignEngine'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useNewsStore } from '@/store/newsStore'

interface SocialToast {
  type:        'viral' | 'review_bomb' | 'dev_diary' | 'community_event'
  projectName: string
  message:     string
}

interface CampaignStore {
  campaigns:           ActiveCampaign[]
  actionCooldowns:     Record<string, number>   // projectId → cooldownUntilTick
  devDiaryBonusUntil:  Record<string, number>   // projectId → untilTick (bu tick'e kadar ×1.5)
  communityBonusUntil: Record<string, number>   // projectId → untilTick (bu tick'e kadar ×1.3)
  pendingToast:        SocialToast | null

  startCampaign:    (projectId: string, type: CampaignType) => void
  stopCampaign:     (campaignId: string) => void
  weeklyTick:       () => void
  triggerDevDiary:  (projectId: string) => void
  triggerCommunity: (projectId: string) => void
  clearToast:       () => void
  reset:            () => void
}

const SEASON_INDEX: Record<string, number> = {
  ilkbahar: 0, yaz: 1, sonbahar: 2, kis: 3,
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns:           [],
  actionCooldowns:     {},
  devDiaryBonusUntil:  {},
  communityBonusUntil: {},
  pendingToast:        null,

  startCampaign: (projectId, type) => {
    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    if (!project) return
    if (project.status !== 'gelistirme' && project.status !== 'yayinlandi') return

    const config = CAMPAIGN_CONFIGS[type]
    const { tickCount } = useTimeStore.getState()
    useGameStore.getState().addMoney(-config.openingCost)

    const campaign: ActiveCampaign = {
      id:          `${projectId}-${type}-${tickCount}`,
      projectId,
      type,
      startTick:   tickCount,
      endTick:     tickCount + config.durationWeeks,
      isPreLaunch: project.status === 'gelistirme',
      isActive:    true,
    }

    set(s => ({ campaigns: [...s.campaigns, campaign] }))
  },

  stopCampaign: (campaignId) => {
    set(s => ({
      campaigns: s.campaigns.map(c =>
        c.id === campaignId ? { ...c, isActive: false } : c
      ),
    }))
  },

  weeklyTick: () => {
    const { campaigns, devDiaryBonusUntil, communityBonusUntil } = get()
    const { tickCount, date } = useTimeStore.getState()
    const gameStore  = useGameStore.getState()
    const projects   = useProjectStore.getState().projects
    const newsStore  = useNewsStore.getState()
    const season     = SEASON_INDEX[date.season] ?? 0

    // 1. Haftalık gider + itibar bonusu (aktif kampanyalar)
    for (const c of campaigns) {
      if (!c.isActive) continue
      const config = CAMPAIGN_CONFIGS[c.type]
      gameStore.addMoney(-config.weeklyBudget)
      gameStore.gainReputation(config.reputationPerWeek)
    }

    // 2. Post-launch bonus gelir
    const publishedProjects = projects.filter(p => p.status === 'yayinlandi' && p.publishResult)
    for (const project of publishedProjects) {
      const activeCampaigns = campaigns.filter(
        c => c.projectId === project.id && c.isActive && !c.isPreLaunch
      )
      for (const campaign of activeCampaigns) {
        let bonus = computePostLaunchBonusRevenue(campaign, project.publishResult!.revenue, tickCount)
        if (tickCount <= (devDiaryBonusUntil[project.id] ?? -1)) {
          bonus = Math.round(bonus * 1.5)
        }
        if (tickCount < (communityBonusUntil[project.id] ?? -1)) {
          bonus = Math.round(bonus * 1.3)
        }
        if (bonus > 0) gameStore.addMoney(bonus)
      }
    }

    // 3. Süresi biten kampanyalar → isActive: false
    const updatedCampaigns = campaigns.map(c =>
      c.isActive && tickCount >= c.endTick ? { ...c, isActive: false } : c
    )
    set({ campaigns: updatedCampaigns })

    // 4. Pasif sosyal olaylar (sadece yayındaki projeler)
    for (const project of publishedProjects) {
      if (!project.publishResult) continue
      const score = project.publishResult.score
      const hasActiveCampaign = updatedCampaigns.some(
        c => c.projectId === project.id && c.isActive
      )
      const seed = project.id.charCodeAt(0) + tickCount
      const event = rollSocialEvent(score, hasActiveCampaign, seed)

      if (event === 'viral') {
        // Bonus geliri bir kez daha ekle (×2 etkisi)
        const activeCampaigns = updatedCampaigns.filter(
          c => c.projectId === project.id && c.isActive && !c.isPreLaunch
        )
        for (const campaign of activeCampaigns) {
          const bonus = computePostLaunchBonusRevenue(campaign, project.publishResult.revenue, tickCount)
          if (bonus > 0) gameStore.addMoney(bonus)
        }
        set({
          pendingToast: {
            type: 'viral',
            projectName: project.name,
            message: `"${project.name}" viral oldu! Bu hafta bonus gelir ×2`,
          },
        })
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `"${project.name}" sosyal medyada viral oldu!`,
          year: date.year,
          season,
        })
      } else if (event === 'review_bomb') {
        gameStore.gainReputation(-8)
        set({
          pendingToast: {
            type: 'review_bomb',
            projectName: project.name,
            message: `"${project.name}" eleştiri bombardımanına uğradı. İtibar -8`,
          },
        })
        newsStore.addItem({
          type: 'market_trend',
          rivalId: null,
          text: `"${project.name}" oyunculardan yoğun eleştiri aldı.`,
          year: date.year,
          season,
        })
      }
    }
  },

  triggerDevDiary: (projectId) => {
    const { actionCooldowns } = get()
    const { tickCount, date } = useTimeStore.getState()

    if ((actionCooldowns[projectId] ?? 0) > tickCount) return

    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    if (!project || project.status !== 'yayinlandi') return

    useGameStore.getState().addMoney(-2000)
    useGameStore.getState().gainReputation(5)

    set(s => ({
      actionCooldowns:  { ...s.actionCooldowns,  [projectId]: tickCount + 4 },
      devDiaryBonusUntil: { ...s.devDiaryBonusUntil, [projectId]: tickCount + 1 },
      pendingToast: {
        type: 'dev_diary',
        projectName: project.name,
        message: `Dev günlüğü yayınlandı — topluluk memnun. İtibar +5`,
      },
    }))

    useNewsStore.getState().addItem({
      type: 'market_trend',
      rivalId: null,
      text: `"${project.name}" için dev günlüğü yayınlandı.`,
      year: date.year,
      season: SEASON_INDEX[date.season] ?? 0,
    })
  },

  triggerCommunity: (projectId) => {
    const { actionCooldowns } = get()
    const { tickCount, date } = useTimeStore.getState()

    if ((actionCooldowns[projectId] ?? 0) > tickCount) return

    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    if (!project || project.status !== 'yayinlandi') return

    useGameStore.getState().addMoney(-5000)
    useGameStore.getState().gainReputation(10)

    set(s => ({
      actionCooldowns:     { ...s.actionCooldowns,     [projectId]: tickCount + 6 },
      communityBonusUntil: { ...s.communityBonusUntil, [projectId]: tickCount + 2 },
      pendingToast: {
        type: 'community_event',
        projectName: project.name,
        message: `Topluluk etkinliği düzenlendi. İtibar +10`,
      },
    }))

    useNewsStore.getState().addItem({
      type: 'market_trend',
      rivalId: null,
      text: `"${project.name}" için topluluk etkinliği düzenlendi.`,
      year: date.year,
      season: SEASON_INDEX[date.season] ?? 0,
    })
  },

  clearToast: () => set({ pendingToast: null }),

  reset: () => set({
    campaigns:           [],
    actionCooldowns:     {},
    devDiaryBonusUntil:  {},
    communityBonusUntil: {},
    pendingToast:        null,
  }),
}))
```

- [ ] **Step 4: Build kontrol**

```
npx tsc --noEmit
```
Beklenen: 0 yeni hata (pre-existing JSX/tsconfig hataları normal)

- [ ] **Step 5: Testleri çalıştır**

```
npx vitest run tests/store/campaignStore.test.ts
```
Beklenen: 5/5 passed

- [ ] **Step 6: Tüm testler**

```
npx vitest run
```
Beklenen: tüm testler geçiyor

- [ ] **Step 7: Commit**

```bash
git add src/store/campaignStore.ts tests/store/campaignStore.test.ts
git commit -m "feat(faz6c): campaignStore — kampanya ve sosyal aksiyon yönetimi"
```

---

### Task 3: scoreEngine — preLaunchMultiplier Entegrasyonu

**Files:**
- Modify: `src/engine/scoreEngine.ts`

Mevcut `scoreEngine.ts`'te `priceCutMultiplier` sonrası, `const sales = Math.round(...)` satırından önce ekleme yapılacak.

- [ ] **Step 1: `src/engine/scoreEngine.ts`'i oku**

Mevcut import listesi ve `const sales = Math.round(...)` bloğunu gör.

- [ ] **Step 2: Import ekle**

`scoreEngine.ts` dosyasının başına, mevcut import'ların altına:
```typescript
import { computePreLaunchMultiplier } from '@/engine/campaignEngine'
import { useCampaignStore } from '@/store/campaignStore'
```

- [ ] **Step 3: priceCutMultiplier hesabından hemen sonra preLaunchMultiplier ekle**

`priceCutMultiplier` tanımından sonra, `const salesMultiplier` satırından önce:
```typescript
  // Pre-launch kampanya bonusu
  const preLaunchCampaigns = useCampaignStore.getState().campaigns
    .filter(c => c.projectId === project.id && c.isPreLaunch && c.isActive)
  const preLaunchMultiplier = computePreLaunchMultiplier(preLaunchCampaigns)
```

- [ ] **Step 4: `const sales = Math.round(...)` bloğunu güncelle**

Mevcut:
```typescript
  const sales = Math.round(
    baseSales
    * salesMultiplier
    * fanBaseMultiplier
    * trendMultiplier
    * platformShareMultiplier
    * featuredMultiplier
    * exclusiveMultiplier
    * priceCutMultiplier
    * (score / 50)
    * (1 + opts.reputation / 100)
  )
```

Yeni (`priceCutMultiplier`'dan sonra `preLaunchMultiplier` eklendi):
```typescript
  const sales = Math.round(
    baseSales
    * salesMultiplier
    * fanBaseMultiplier
    * trendMultiplier
    * platformShareMultiplier
    * featuredMultiplier
    * exclusiveMultiplier
    * priceCutMultiplier
    * preLaunchMultiplier
    * (score / 50)
    * (1 + opts.reputation / 100)
  )
```

- [ ] **Step 5: Build + testler**

```
npx tsc --noEmit
npx vitest run
```
Beklenen: 0 yeni hata, tüm testler geçiyor

- [ ] **Step 6: Commit**

```bash
git add src/engine/scoreEngine.ts
git commit -m "feat(faz6c): scoreEngine preLaunchMultiplier çarpanı"
```

---

### Task 4: App.tsx + savegameEngine + SaveLoadPanel Entegrasyonu

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/engine/savegameEngine.ts`
- Modify: `src/components/SaveLoadPanel.tsx`

- [ ] **Step 1: Her üç dosyayı oku**

`src/App.tsx`, `src/engine/savegameEngine.ts`, `src/components/SaveLoadPanel.tsx` dosyalarını oku.

- [ ] **Step 2: App.tsx'e import'lar ekle**

Mevcut import listesinin sonuna:
```typescript
import { useCampaignStore } from '@/store/campaignStore'
import SocialEventToast from '@/components/SocialEventToast'
import CampaignPanel    from '@/components/CampaignPanel'
```
> NOT: `SocialEventToast` ve `CampaignPanel` henüz yok. Build hatası verirse geçici placeholder oluştur:
> ```typescript
> // src/components/SocialEventToast.tsx
> export default function SocialEventToast() { return null }
> // src/components/CampaignPanel.tsx
> export default function CampaignPanel() { return null }
> ```

- [ ] **Step 3: weeklyTick callback'ine campaignStore.weeklyTick() ekle**

`setOnWeeklyTick` callback'inde `useMarketStore.getState().schedulerTick()` satırından hemen sonra:
```typescript
      useCampaignStore.getState().weeklyTick()
```

- [ ] **Step 4: pendingToast selector ekle**

Diğer `useXxxStore` selector'larının yanına:
```typescript
  const pendingToast = useCampaignStore((s) => s.pendingToast)
```

- [ ] **Step 5: JSX'e SocialEventToast ve CampaignPanel render ekle**

`{showSavePanel && <SaveLoadPanel />}` satırından hemen önce:
```typescript
      {pendingToast !== null && <SocialEventToast />}
      <CampaignPanel />
```

- [ ] **Step 6: savegameEngine.ts'e import ve snapshot ekle**

**a) Import:**
```typescript
import { useCampaignStore } from '@/store/campaignStore'
```

**b) `serialize()` içinde `market: { ... }` bloğunun hemen ardına:**
```typescript
    campaign: {
      campaigns:           useCampaignStore.getState().campaigns,
      actionCooldowns:     useCampaignStore.getState().actionCooldowns,
      devDiaryBonusUntil:  useCampaignStore.getState().devDiaryBonusUntil,
      communityBonusUntil: useCampaignStore.getState().communityBonusUntil,
    },
```

**c) `deserialize()` içinde `useDayTimeStore.getState().reset()` satırından önce:**
```typescript
  const camp = (s.campaign as any) ?? {}
  useCampaignStore.setState({
    campaigns:           camp.campaigns           ?? [],
    actionCooldowns:     camp.actionCooldowns     ?? {},
    devDiaryBonusUntil:  camp.devDiaryBonusUntil  ?? {},
    communityBonusUntil: camp.communityBonusUntil ?? {},
  })
```

- [ ] **Step 7: SaveLoadPanel.tsx'e reset ekle**

`doMainMenu` fonksiyonunda, `useMarketStore.getState().reset()` satırının hemen ardına:
```typescript
    useCampaignStore.getState().reset()
```

Dosyanın başına import ekle (mevcut import'lar varsa onların yanına):
```typescript
import { useCampaignStore } from '@/store/campaignStore'
```

- [ ] **Step 8: Build + testler**

```
npx tsc --noEmit
npx vitest run
```
Beklenen: 0 yeni hata, tüm testler geçiyor

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/engine/savegameEngine.ts src/components/SaveLoadPanel.tsx
git add src/components/SocialEventToast.tsx src/components/CampaignPanel.tsx 2>/dev/null || true
git commit -m "feat(faz6c): App.tsx + savegameEngine + SaveLoadPanel kampanya entegrasyonu"
```

---

### Task 5: SocialEventToast.tsx

**Files:**
- Modify/Create: `src/components/SocialEventToast.tsx`

`pendingToast !== null` iken render edilir, 4 saniye sonra `clearToast()`.

- [ ] **Step 1: Dosyayı oku**

Eğer placeholder ise (`return null`), replace et. Eğer tam bileşen ise gözden geçir.

- [ ] **Step 2: Bileşeni yaz**

`src/components/SocialEventToast.tsx`:

```typescript
import { useEffect } from 'react'
import { useCampaignStore } from '@/store/campaignStore'

const TOAST_ICONS: Record<string, string> = {
  viral:           '🚀',
  review_bomb:     '💢',
  dev_diary:       '📝',
  community_event: '🎉',
}

const TOAST_COLORS: Record<string, string> = {
  viral:           'border-green-500 bg-green-900/80',
  review_bomb:     'border-red-500 bg-red-900/80',
  dev_diary:       'border-blue-500 bg-blue-900/80',
  community_event: 'border-yellow-500 bg-yellow-900/80',
}

export default function SocialEventToast() {
  const pendingToast = useCampaignStore((s) => s.pendingToast)
  const clearToast   = useCampaignStore((s) => s.clearToast)

  useEffect(() => {
    if (!pendingToast) return
    const timer = setTimeout(clearToast, 4000)
    return () => clearTimeout(timer)
  }, [pendingToast, clearToast])

  if (!pendingToast) return null

  const icon  = TOAST_ICONS[pendingToast.type] ?? '📣'
  const color = TOAST_COLORS[pendingToast.type] ?? 'border-gray-500 bg-gray-900/80'

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 border rounded-xl px-5 py-3 shadow-2xl pointer-events-none ${color}`}>
      <p className="text-white text-sm font-medium">
        {icon} {pendingToast.message}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Build + testler**

```
npx tsc --noEmit
npx vitest run
```
Beklenen: 0 yeni hata, tüm testler geçiyor

- [ ] **Step 4: Commit**

```bash
git add src/components/SocialEventToast.tsx
git commit -m "feat(faz6c): SocialEventToast — viral/review_bomb/dev_diary bildirim toast"
```

---

### Task 6: CampaignPanel.tsx — 3 Sekmeli Panel

**Files:**
- Modify/Create: `src/components/CampaignPanel.tsx`

Eğer placeholder ise replace et.

- [ ] **Step 1: Dosyayı oku**

- [ ] **Step 2: Tam bileşeni yaz**

`src/components/CampaignPanel.tsx`:

```typescript
import { useCampaignStore } from '@/store/campaignStore'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useGameStore } from '@/store/gameStore'
import { CAMPAIGN_CONFIGS } from '@/engine/campaignEngine'
import type { CampaignType } from '@/engine/campaignEngine'

type TabType = 'active' | 'actions' | 'history'

const TAB_LABELS: Record<TabType, string> = {
  active:  'Aktif Kampanyalar',
  actions: 'Aksiyonlar',
  history: 'Geçmiş',
}

const CAMPAIGN_TYPE_NAMES: Record<CampaignType, string> = {
  sosyal:     'Sosyal Medya',
  influencer: 'Influencer',
  billboard:  'Billboard',
}

// Zustand içinde tab state tutmak yerine lokal state
import { useState } from 'react'

interface Props {
  onClose: () => void
}

export function CampaignPanelContent({ onClose }: Props) {
  const [tab, setTab] = useState<TabType>('active')

  const campaigns      = useCampaignStore((s) => s.campaigns)
  const actionCooldowns = useCampaignStore((s) => s.actionCooldowns)
  const stopCampaign   = useCampaignStore((s) => s.stopCampaign)
  const triggerDevDiary  = useCampaignStore((s) => s.triggerDevDiary)
  const triggerCommunity = useCampaignStore((s) => s.triggerCommunity)

  const projects    = useProjectStore((s) => s.projects)
  const tickCount   = useTimeStore((s) => s.tickCount)
  const money       = useGameStore((s) => s.money)

  const activeCampaigns   = campaigns.filter(c => c.isActive)
  const completedCampaigns = campaigns.filter(c => !c.isActive)
  const publishedProjects  = projects.filter(p => p.status === 'yayinlandi')

  const tabs: TabType[] = ['active', 'actions', 'history']

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">Pazarlama</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'active' && activeCampaigns.length > 0 && (
              <span className="ml-1 bg-yellow-600 text-white text-xs px-1.5 rounded-full">
                {activeCampaigns.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 min-h-[200px] max-h-[400px] overflow-y-auto">

        {tab === 'active' && (
          <div className="space-y-3">
            {activeCampaigns.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">Aktif kampanya yok.</p>
            ) : activeCampaigns.map(c => {
              const project = projects.find(p => p.id === c.projectId)
              const weeksLeft = Math.max(0, c.endTick - tickCount)
              const config = CAMPAIGN_CONFIGS[c.type]
              return (
                <div key={c.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {project?.name ?? c.projectId}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {CAMPAIGN_TYPE_NAMES[c.type]} · {weeksLeft} hafta kaldı
                      {c.isPreLaunch && <span className="ml-1 text-blue-400">(yayın öncesi)</span>}
                    </p>
                    <p className="text-gray-500 text-xs">${config.weeklyBudget.toLocaleString()}/hafta</p>
                  </div>
                  <button
                    onClick={() => stopCampaign(c.id)}
                    className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                  >
                    Durdur
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'actions' && (
          <div className="space-y-4">
            {publishedProjects.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">Yayında proje yok.</p>
            ) : publishedProjects.map(project => {
              const cooldown = actionCooldowns[project.id] ?? 0
              const onCooldown = cooldown > tickCount
              const cooldownWeeks = onCooldown ? cooldown - tickCount : 0
              return (
                <div key={project.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-white text-sm font-semibold mb-2">{project.name}</p>
                  <div className="flex gap-2">
                    <button
                      disabled={onCooldown || money < 2000}
                      onClick={() => triggerDevDiary(project.id)}
                      className="flex-1 text-xs bg-blue-800 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded"
                    >
                      📝 Dev Günlüğü
                      <br />
                      <span className="text-blue-300">2.000$</span>
                      {onCooldown && <span className="text-gray-400 ml-1">({cooldownWeeks}h)</span>}
                    </button>
                    <button
                      disabled={onCooldown || money < 5000}
                      onClick={() => triggerCommunity(project.id)}
                      className="flex-1 text-xs bg-yellow-800 hover:bg-yellow-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded"
                    >
                      🎉 Topluluk Etkinliği
                      <br />
                      <span className="text-yellow-300">5.000$</span>
                      {onCooldown && <span className="text-gray-400 ml-1">({cooldownWeeks}h)</span>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {completedCampaigns.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">Tamamlanmış kampanya yok.</p>
            ) : completedCampaigns.map(c => {
              const project = projects.find(p => p.id === c.projectId)
              const config = CAMPAIGN_CONFIGS[c.type]
              const duration = c.endTick - c.startTick
              const totalSpent = config.openingCost + config.weeklyBudget * duration
              return (
                <div key={c.id} className="bg-gray-800/50 rounded-lg p-2 text-xs text-gray-400 flex justify-between">
                  <span>
                    {project?.name ?? c.projectId} · {CAMPAIGN_TYPE_NAMES[c.type]}
                  </span>
                  <span className="text-red-400">-${totalSpent.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// CampaignPanel state: showCampaignPanel useMarketStore'a paralel olarak
// App.tsx'te <CampaignPanel /> render edilir, showPanel state HUD'dan yönetilir
// Basit yaklaşım: campaignStore'a showCampaignPanel eklemek yerine App.tsx'te useState

// NOT: Bu bileşen useCampaignStore'dan show/hide state alacak şekilde değil,
// App.tsx'te show/hide state'i tutulacak şekilde implement edildi.
// App.tsx'te useState([showCampaignPanel, setShowCampaignPanel]) + HUD callback kullanılır.
// HUD'daki 📣 butonu App.tsx'ten prop ile gelir.

export default function CampaignPanel() {
  // Bu export default bir wrapper — App.tsx'ten prop almak yerine
  // campaignStore'a showCampaignPanel field'ı ekleyelim (en temiz çözüm)
  // Bu task'ta bileşeni placeholder'dan tam hale getiriyoruz.
  // Show/hide App.tsx + HUD entegrasyonu Task 8'de yapılacak.
  return null
}
```

> **ÖNEMLİ NOT:** `CampaignPanel` show/hide state'ini `campaignStore`'a eklemek en temiz çözüm. Aşağıdaki adımda bunu uygulayın.

- [ ] **Step 3: campaignStore.ts'e show/hide ekle**

`src/store/campaignStore.ts`'i oku ve interface + implementation'a ekle:

**Interface'e:**
```typescript
  showCampaignPanel: boolean
  openCampaignPanel: () => void
  closeCampaignPanel: () => void
```

**Initial state'e:**
```typescript
  showCampaignPanel: false,
```

**Implementation'a (mevcut `clearToast` action'ının yanına):**
```typescript
  openCampaignPanel:  () => set({ showCampaignPanel: true }),
  closeCampaignPanel: () => set({ showCampaignPanel: false }),
```

**`reset` action'ında:**
```typescript
  showCampaignPanel: false,
```

- [ ] **Step 4: CampaignPanel.tsx'i show/hide bağla**

`CampaignPanel.tsx`'in default export'unu güncelle:

```typescript
export default function CampaignPanel() {
  const showCampaignPanel  = useCampaignStore((s) => s.showCampaignPanel)
  const closeCampaignPanel = useCampaignStore((s) => s.closeCampaignPanel)

  if (!showCampaignPanel) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <CampaignPanelContent onClose={closeCampaignPanel} />
    </div>
  )
}
```

- [ ] **Step 5: Build + testler**

```
npx tsc --noEmit
npx vitest run
```
Beklenen: 0 yeni hata, tüm testler geçiyor

- [ ] **Step 6: Commit**

```bash
git add src/components/CampaignPanel.tsx src/store/campaignStore.ts
git commit -m "feat(faz6c): CampaignPanel 3 sekme + campaignStore show/hide"
```

---

### Task 7: ProjectCard.tsx — Kampanya Başlatma/Durdurma

**Files:**
- Modify: `src/components/ProjectCard.tsx`

`gelistirme` veya `yayinlandi` statüsündeki projelerin kartında kampanya butonları eklenir.

- [ ] **Step 1: `src/components/ProjectCard.tsx`'i oku**

- [ ] **Step 2: Import'lar ekle**

Mevcut import listesinin sonuna:
```typescript
import { useCampaignStore } from '@/store/campaignStore'
import { useTimeStore } from '@/store/timeStore'
import { CAMPAIGN_CONFIGS } from '@/engine/campaignEngine'
import type { CampaignType } from '@/engine/campaignEngine'
```

- [ ] **Step 3: ProjectCard fonksiyon içine kampanya data ekle**

`ProjectCard` fonksiyonunun içine, mevcut `const progress` satırından önce:
```typescript
  const campaigns          = useCampaignStore((s) => s.campaigns)
  const startCampaign      = useCampaignStore((s) => s.startCampaign)
  const stopCampaignAction = useCampaignStore((s) => s.stopCampaign)
  const tickCount          = useTimeStore((s) => s.tickCount)

  const activeCampaignsForProject = campaigns.filter(
    c => c.projectId === project.id && c.isActive
  )
  const canStartCampaign = project.status === 'gelistirme' || project.status === 'yayinlandi'
```

- [ ] **Step 4: Kampanya butonlarını render'a ekle**

`ProjectCard` return'ünde, son `</div>` kapanışından hemen önce:

```tsx
      {/* Kampanya bölümü */}
      {canStartCampaign && (
        <div className="mt-3 border-t border-gray-700 pt-3">
          {activeCampaignsForProject.length > 0 ? (
            <div className="space-y-1">
              {activeCampaignsForProject.map(c => {
                const weeksLeft = Math.max(0, c.endTick - tickCount)
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-yellow-400">
                      📣 {CAMPAIGN_CONFIGS[c.type].name} — {weeksLeft} hafta kaldı
                    </span>
                    <button
                      onClick={() => stopCampaignAction(c.id)}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Durdur
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {(['sosyal', 'influencer', 'billboard'] as CampaignType[]).map(type => {
                const config = CAMPAIGN_CONFIGS[type]
                return (
                  <button
                    key={type}
                    onClick={() => startCampaign(project.id, type)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded"
                  >
                    📣 {config.name} {(config.openingCost / 1000).toFixed(0)}K$
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 5: Build + testler**

```
npx tsc --noEmit
npx vitest run
```
Beklenen: 0 yeni hata, tüm testler geçiyor

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "feat(faz6c): ProjectCard kampanya başlatma/durdurma butonları"
```

---

### Task 8: HUD.tsx — 📣 Butonu + Aktif Kampanya Rozeti

**Files:**
- Modify: `src/components/HUD.tsx`

- [ ] **Step 1: `src/components/HUD.tsx`'i oku**

- [ ] **Step 2: Import ekle**

Mevcut import'ların altına:
```typescript
import { useCampaignStore } from '@/store/campaignStore'
```

- [ ] **Step 3: Aktif kampanya sayısını hesapla**

Fonksiyon içine, mevcut `const popularity` satırının yanına:
```typescript
  const campaigns          = useCampaignStore((s) => s.campaigns)
  const openCampaignPanel  = useCampaignStore((s) => s.openCampaignPanel)
  const activeCampaignCount = campaigns.filter(c => c.isActive).length
```

- [ ] **Step 4: 📣 butonu ekle**

HUD render'ında, `📊` butonundan hemen ÖNCE:
```tsx
        <button
          onClick={openCampaignPanel}
          title="Pazarlama"
          className="relative text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          📣
          {activeCampaignCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {activeCampaignCount}
            </span>
          )}
        </button>
```

- [ ] **Step 5: Build + testler**

```
npx tsc --noEmit
npx vitest run
```
Beklenen: 0 yeni hata, tüm testler geçiyor

- [ ] **Step 6: Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat(faz6c): HUD 📣 pazarlama butonu + aktif kampanya rozeti"
```

---

### Task 9: DURUM.md Güncellemesi

**Files:**
- Modify: `docs/superpowers/DURUM.md`

- [ ] **Step 1: Gerçek test sayısını al**

```
npx vitest run 2>&1 | tail -5
```

- [ ] **Step 2: `docs/superpowers/DURUM.md`'yi güncelle**

**a) Tamamlanan fazlar tablosuna satır ekle** (`Faz 6B` satırından sonra):
```
| **Faz 6C — Pazarlama** | ✅ Bitti | `specs/2026-05-31-faz6c-pazarlama-design.md` | `plans/2026-05-31-faz6c-pazarlama.md` |
```

**b) Test sayısını güncelle** (gerçek sayıyı kullan):
```
**Testler:** X/X geçiyor (`npx vitest run`). Build çalışıyor (`npm run build`).
```

**c) "Devam Edilecek" bölümünü güncelle:**
```markdown
## Devam Edilecek: Sıradaki Faz

**Faz 7 — Oyun Polisajı**: UI iyileştirmeleri, balans tweaks, müzik/ses efektleri.
```

**d) Faz 6C özet bölümü ekle** (Faz 6B özetinin altına):
```markdown
---

### Faz 6C — Pazarlama Özeti

`campaignEngine.ts`: `CAMPAIGN_CONFIGS` (sosyal/influencer/billboard — peşin+haftalık+süre+çarpan), `computePreLaunchMultiplier` (max, stack yok), `computePostLaunchBonusRevenue` (publishRevenue × oran, süresi bitince 0), `rollSocialEvent` (viral: score≥80+kampanya+%15, review_bomb: score<40+kampanyasız+%10). `campaignStore`: `startCampaign` (peşin ödeme+isPreLaunch detect), `weeklyTick` (gider+itibar+bonus gelir+süresi biten+pasif olaylar), `triggerDevDiary` (2K$+itibar+5+cooldown 4h), `triggerCommunity` (5K$+itibar+10+cooldown 6h+2h bonus). `scoreEngine`'e `preLaunchMultiplier` eklendi. `ProjectCard`'a kampanya başlatma/durdurma butonları. `CampaignPanel` 3 sekme (aktif/aksiyonlar/geçmiş). `SocialEventToast` 4s bildirim. HUD'a 📣 butonu + aktif kampanya rozeti.
```

- [ ] **Step 3: Final build**

```
npm run build
```
Beklenen: 0 kritik hata

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/DURUM.md
git commit -m "docs: DURUM.md Faz 6C özeti güncellendi"
```
