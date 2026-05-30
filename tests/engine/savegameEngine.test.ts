import { describe, it, expect, beforeEach } from 'vitest'
import { serialize, deserialize } from '@/engine/savegameEngine'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useTimeStore } from '@/store/timeStore'
import type { CutsceneId } from '@/types/cutscene'

beforeEach(() => {
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useCutsceneStore.getState().reset()
  useDayTimeStore.getState().reset()
  useTimeStore.getState().reset()
})

describe('savegameEngine', () => {
  it('serialize geçerli JSON döndürür ve version: 1 içerir', () => {
    const json = serialize()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(typeof parsed.savedAt).toBe('number')
  })

  it('seenCutscenes Set → Array dönüşümü doğru', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['kovulma', 'ilk_yayin'] as CutsceneId[]) })
    const parsed = JSON.parse(serialize())
    expect(Array.isArray(parsed.seenCutscenes)).toBe(true)
    expect(parsed.seenCutscenes).toContain('kovulma')
    expect(parsed.seenCutscenes).toContain('ilk_yayin')
  })

  it('round-trip: gameStore.money korunur', () => {
    useGameStore.getState().setMoney(123456)
    const json = serialize()
    useGameStore.getState().setMoney(0)
    deserialize(json)
    expect(useGameStore.getState().money).toBe(123456)
  })

  it('round-trip: seenCutscenes Array → Set dönüşümü doğru', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['nexus_meeting'] as CutsceneId[]) })
    const json = serialize()
    useCutsceneStore.getState().reset()
    deserialize(json)
    expect(useCutsceneStore.getState().seenCutscenes.has('nexus_meeting')).toBe(true)
  })

  it('round-trip: projectStore.projects sayısı korunur', async () => {
    // projectStore.addProject ile proje ekle
    const { createProject } = await import('@/engine/projectEngine')
    const p = createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 } })
    useProjectStore.getState().addProject(p)
    const json = serialize()
    useProjectStore.getState().reset()
    deserialize(json)
    expect(useProjectStore.getState().projects.length).toBe(1)
  })

  it('deserialize sonrası dayTimeStore sıfırlanır (ephemeral)', () => {
    useDayTimeStore.setState({ hour: 18, minute: 30 })
    const json = serialize()
    deserialize(json)
    expect(useDayTimeStore.getState().hour).toBe(9)
    expect(useDayTimeStore.getState().minute).toBe(0)
  })
})
