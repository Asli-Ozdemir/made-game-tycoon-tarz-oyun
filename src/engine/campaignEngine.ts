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
