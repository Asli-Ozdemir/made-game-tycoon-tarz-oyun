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
  showCampaignPanel:   boolean

  startCampaign:    (projectId: string, type: CampaignType) => void
  stopCampaign:     (campaignId: string) => void
  weeklyTick:       () => void
  triggerDevDiary:  (projectId: string) => void
  triggerCommunity: (projectId: string) => void
  clearToast:       () => void
  openCampaignPanel:  () => void
  closeCampaignPanel: () => void
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
  showCampaignPanel:   false,

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
      actionCooldowns:    { ...s.actionCooldowns,    [projectId]: tickCount + 4 },
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
  openCampaignPanel:  () => set({ showCampaignPanel: true }),
  closeCampaignPanel: () => set({ showCampaignPanel: false }),

  reset: () => set({
    campaigns:           [],
    actionCooldowns:     {},
    devDiaryBonusUntil:  {},
    communityBonusUntil: {},
    pendingToast:        null,
    showCampaignPanel:   false,
  }),
}))
