// src/store/workSessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkSessionStore } from './workSessionStore'
import { useProjectStore } from './projectStore'
import { useHevesStore } from './hevesStore'
import { useSparkStore } from './sparkStore'
import { createProject } from '@/engine/projectEngine'

function setupProject() {
  useProjectStore.getState().reset()
  const p = createProject({
    name: 'P', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
    scope: 'orta', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  })
  useProjectStore.getState().addProject(p)
  return p
}

describe('workSessionStore durum makinesi', () => {
  beforeEach(() => {
    useWorkSessionStore.getState().reset()
    useHevesStore.setState({ heves: 8, maxHeves: 8 })
    useSparkStore.getState().reset()
  })

  it('heves yoksa seans başlamaz', () => {
    const p = setupProject()
    useHevesStore.setState({ heves: 0, maxHeves: 8 })
    const ok = useWorkSessionStore.getState().start(p.id)
    expect(ok).toBe(false)
    expect(useWorkSessionStore.getState().active).toBe(false)
  })

  it('gün kilidi varken seans başlamaz', () => {
    const p = setupProject()
    useWorkSessionStore.setState({ sessionDoneToday: true })
    const ok = useWorkSessionStore.getState().start(p.id)
    expect(ok).toBe(false)
  })

  it('start: 1 heves harcar, bug fazına geçer', () => {
    const p = setupProject()
    const ok = useWorkSessionStore.getState().start(p.id)
    expect(ok).toBe(true)
    expect(useHevesStore.getState().heves).toBe(7)
    expect(useWorkSessionStore.getState().phase).toBe('bug')
  })

  it('tam akış: bug-düzelt → odak → kıvılcım-uygula projeyi ilerletir ve kilitler', () => {
    const p = setupProject()
    useWorkSessionStore.getState().start(p.id)
    useWorkSessionStore.getState().chooseBug('fix')   // +1 hafta, +2 heves
    expect(useWorkSessionStore.getState().phase).toBe('focus')
    expect(useHevesStore.getState().heves).toBe(8)     // 7 + 2, max 8
    useWorkSessionStore.getState().chooseFocus('gameplay')
    expect(useWorkSessionStore.getState().phase).toBe('spark')
    useWorkSessionStore.getState().chooseSpark('apply') // +2 base +2 spark = +4 hafta, +15 kalite
    expect(useWorkSessionStore.getState().phase).toBe('done')
    expect(useWorkSessionStore.getState().sessionDoneToday).toBe(true)
    const proj = useProjectStore.getState().projects[0]
    expect(proj.weeksElapsed).toBe(5)        // fix1 + base2 + sparkApply2
    expect(proj.qualityPoints).toBe(30)      // focus +15, spark +15
  })

  it('bug-geç kalite düşürür ve sonraki seansı zorlaştırır', () => {
    const p = setupProject()
    useWorkSessionStore.getState().start(p.id)
    useWorkSessionStore.getState().chooseBug('skip')
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(0) // penalty clamp
    expect(useWorkSessionStore.getState().nextHarderBug).toBe(true)
  })

  it('kıvılcım-sakla carry bırakır, bu projeye kalite eklemez', () => {
    const p = setupProject()
    useWorkSessionStore.getState().start(p.id)
    useWorkSessionStore.getState().chooseBug('fix')
    useWorkSessionStore.getState().chooseFocus('story')
    const qBefore = useProjectStore.getState().projects[0].qualityPoints
    useWorkSessionStore.getState().chooseSpark('save')
    expect(useProjectStore.getState().pendingCarryQuality).toBe(10)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(qBefore) // değişmedi
  })

  it('resetDailyLock kilidi açar', () => {
    useWorkSessionStore.setState({ sessionDoneToday: true })
    useWorkSessionStore.getState().resetDailyLock()
    expect(useWorkSessionStore.getState().sessionDoneToday).toBe(false)
  })
})
