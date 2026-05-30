import { useGameStore } from '@/store/gameStore'
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
  }

  return JSON.stringify(snapshot)
}

export function deserialize(json: string): void {
  const s = JSON.parse(json)

  useGameStore.setState(s.game)
  useProjectStore.setState({ projects: s.projects.projects })
  useEmployeeStore.setState({ employees: s.employees.employees, candidates: s.employees.candidates })
  useTimeStore.setState({ date: s.time.date, tickCount: s.time.tickCount })
  useCharacterStore.setState(s.character)
  useRivalStore.setState({
    rivals:            s.rivals.rivals,
    lastSimYear:       s.rivals.lastSimYear,
    pendingResolution: s.rivals.pendingResolution ?? null,
  })
  useNewsStore.setState({ items: s.news.items, unreadCount: s.news.unreadCount })
  useAwardsStore.setState({ history: s.awards.history })
  useTrendStore.setState({
    popularity:         s.trends.popularity,
    previousPopularity: s.trends.previousPopularity,
    phase:              s.trends.phase,
  })
  useEventStore.setState({ cooldowns: s.events.cooldowns, lastCategoryYear: s.events.lastCategoryYear })
  useTrainingStore.setState({ inventory: s.training.inventory })
  useCutsceneStore.setState({ seenCutscenes: new Set(s.seenCutscenes) })
  useDayTimeStore.getState().reset()
}
