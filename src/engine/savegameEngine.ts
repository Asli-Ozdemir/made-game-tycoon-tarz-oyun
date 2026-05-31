import { useGameStore } from '@/store/gameStore'
import { useEconomyStore } from '@/store/economyStore'
import { useProjectStore } from '@/store/projectStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useTimeStore } from '@/store/timeStore'
import { useCharacterStore } from '@/store/characterStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useAwardsStore } from '@/store/awardsStore'
import { useTrendStore } from '@/store/trendStore'
import { useEventStore } from '@/store/eventStore'
import { useTrainingStore } from '@/store/trainingStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useMarketStore } from '@/store/marketStore'
import { useCampaignStore } from '@/store/campaignStore'

export function serialize(): string {
  const gs  = useGameStore.getState()
  const ps  = useProjectStore.getState()
  const es  = useEmployeeStore.getState()
  const ts  = useTimeStore.getState()
  const cs  = useCharacterStore.getState()
  const rs  = useRivalStore.getState()
  const ns  = useNewsStore.getState()
  const as_ = useAwardsStore.getState()
  const trs = useTrendStore.getState()
  const evs = useEventStore.getState()
  const tns = useTrainingStore.getState()
  const css = useCutsceneStore.getState()

  const snapshot = {
    version: 1,
    savedAt: Date.now(),
    game: {
      money:          gs.money,
      reputation:     gs.reputation,
      totalPublished: gs.totalPublished,
    },
    projects: { projects: ps.projects },
    employees: {
      employees:  es.employees,
      candidates: es.candidates,
    },
    time: {
      date:      ts.date,
      tickCount: ts.tickCount,
    },
    character: {
      background:  cs.background,
      name:        cs.name,
      studioName:  cs.studioName,
      personality: cs.personality,
      profession:  cs.profession,
      isCreated:   cs.isCreated,
    },
    rivals: {
      rivals:            rs.rivals,
      lastSimYear:       rs.lastSimYear,
      pendingResolution: rs.pendingResolution,
    },
    news:    { items: ns.items, unreadCount: ns.unreadCount },
    awards:  { history: as_.history },
    trends:  {
      popularity:         trs.popularity,
      previousPopularity: trs.previousPopularity,
      phase:              trs.phase,
    },
    events:   { cooldowns: evs.cooldowns, lastCategoryYear: evs.lastCategoryYear },
    training: { inventory: tns.inventory },
    seenCutscenes: Array.from(css.seenCutscenes),
    economy: {
      lastWeeklyCost:  useEconomyStore.getState().lastWeeklyCost,
      loan:            useEconomyStore.getState().loan,
      loanWeeksLeft:   useEconomyStore.getState().loanWeeksLeft,
      isInCrisis:      useEconomyStore.getState().isInCrisis,
      crisisWeeksLeft: useEconomyStore.getState().crisisWeeksLeft,
      isBankrupt:      useEconomyStore.getState().isBankrupt,
      saleEvents:      useEconomyStore.getState().saleEvents,
      nextSaleWeek:    useEconomyStore.getState().nextSaleWeek,
    },
    market: {
      platforms:          useMarketStore.getState().platforms,
      offerCooldownUntil: useMarketStore.getState().offerCooldownUntil,
      pendingOffer:       useMarketStore.getState().pendingOffer,
    },
    campaign: {
      campaigns:           useCampaignStore.getState().campaigns,
      actionCooldowns:     useCampaignStore.getState().actionCooldowns,
      devDiaryBonusUntil:  useCampaignStore.getState().devDiaryBonusUntil,
      communityBonusUntil: useCampaignStore.getState().communityBonusUntil,
    },
  }

  return JSON.stringify(snapshot)
}

export function deserialize(json: string): void {
  let s: Record<string, unknown>
  try {
    s = JSON.parse(json)
  } catch {
    throw new Error('deserialize: geçersiz JSON')
  }

  if ((s as any).version !== 1) {
    throw new Error(`deserialize: desteklenmeyen save versiyonu: ${(s as any).version}`)
  }

  const g = (s.game as any) ?? {}
  useGameStore.setState({
    money:          g.money          ?? 0,
    reputation:     g.reputation     ?? 0,
    totalPublished: g.totalPublished ?? 0,
  })

  useProjectStore.setState({ projects: (s.projects as any)?.projects ?? [] })

  useEmployeeStore.setState({
    employees:  (s.employees as any)?.employees  ?? [],
    candidates: (s.employees as any)?.candidates ?? [],
  })

  useTimeStore.setState({
    date:      (s.time as any)?.date      ?? { year: 2000, season: 'ilkbahar', week: 1 },
    tickCount: (s.time as any)?.tickCount ?? 0,
  })

  const c = (s.character as any) ?? {}
  useCharacterStore.setState({
    isCreated:   c.isCreated   ?? false,
    name:        c.name        ?? '',
    studioName:  c.studioName  ?? '',
    background:  c.background  ?? null,
    profession:  c.profession  ?? { programlama: 0, tasarim: 0, ses: 0, projeyonetimi: 0 },
    personality: c.personality ?? { karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0 },
  })

  useRivalStore.setState({
    rivals:            (s.rivals as any)?.rivals            ?? [],
    lastSimYear:       (s.rivals as any)?.lastSimYear       ?? 0,
    pendingResolution: (s.rivals as any)?.pendingResolution ?? null,
  })

  useNewsStore.setState({
    items:       (s.news as any)?.items       ?? [],
    unreadCount: (s.news as any)?.unreadCount ?? 0,
  })

  useAwardsStore.setState({ history: (s.awards as any)?.history ?? [] })

  useTrendStore.setState({
    popularity:         (s.trends as any)?.popularity         ?? {},
    previousPopularity: (s.trends as any)?.previousPopularity ?? {},
    phase:              (s.trends as any)?.phase              ?? {},
  })

  useEventStore.setState({
    cooldowns:        (s.events as any)?.cooldowns        ?? {},
    lastCategoryYear: (s.events as any)?.lastCategoryYear ?? {},
  })

  useTrainingStore.setState({ inventory: (s.training as any)?.inventory ?? [] })

  useCutsceneStore.setState({ seenCutscenes: new Set((s.seenCutscenes as unknown[]) ?? []) })

  const eco = (s.economy as any) ?? {}
  useEconomyStore.setState({
    lastWeeklyCost:  eco.lastWeeklyCost  ?? 0,
    loan:            eco.loan            ?? 0,
    loanWeeksLeft:   eco.loanWeeksLeft   ?? 0,
    isInCrisis:      eco.isInCrisis      ?? false,
    crisisWeeksLeft: eco.crisisWeeksLeft ?? 0,
    isBankrupt:      eco.isBankrupt      ?? false,
    saleEvents:      eco.saleEvents      ?? [],
    nextSaleWeek:    eco.nextSaleWeek    ?? 13,
  })

  const mkt = (s.market as any) ?? {}
  useMarketStore.setState({
    platforms:          mkt.platforms          ?? { pc: { share: 60, reactiveDelta: 0 }, konsol: { share: 30, reactiveDelta: 0 }, mobil: { share: 10, reactiveDelta: 0 } },
    offerCooldownUntil: mkt.offerCooldownUntil ?? 0,
    pendingOffer:       mkt.pendingOffer       ?? null,
  })

  const camp = (s.campaign as any) ?? {}
  useCampaignStore.setState({
    campaigns:           camp.campaigns           ?? [],
    actionCooldowns:     camp.actionCooldowns     ?? {},
    devDiaryBonusUntil:  camp.devDiaryBonusUntil  ?? {},
    communityBonusUntil: camp.communityBonusUntil ?? {},
  })

  useDayTimeStore.getState().reset()
}
