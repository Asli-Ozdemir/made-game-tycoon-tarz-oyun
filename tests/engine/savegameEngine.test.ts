import { describe, it, expect, beforeEach } from 'vitest'
import { serialize, deserialize } from '@/engine/savegameEngine'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useTimeStore } from '@/store/timeStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useCharacterStore } from '@/store/characterStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useAwardsStore } from '@/store/awardsStore'
import { useTrendStore } from '@/store/trendStore'
import { useEventStore } from '@/store/eventStore'
import { useTrainingStore } from '@/store/trainingStore'
import { createProject } from '@/engine/projectEngine'
import type { CutsceneId } from '@/types/cutscene'

beforeEach(() => {
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useEmployeeStore.getState().reset()
  useCutsceneStore.getState().reset()
  useDayTimeStore.getState().reset()
  useTimeStore.getState().reset()
  useCharacterStore.getState().reset()
  useRivalStore.getState().reset()
  useNewsStore.getState().reset()
  useAwardsStore.getState().reset()
  useTrendStore.getState().reset()
  useEventStore.getState().reset()
  useTrainingStore.getState().reset()
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

  it('round-trip: projectStore.projects sayısı korunur', () => {
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

  it('deserialize: geçersiz JSON hata fırlatır', () => {
    expect(() => deserialize('not-json')).toThrow()
  })

  it('deserialize: eksik alanlarda hata fırlatır', () => {
    expect(() => deserialize('{}')).toThrow()
  })

  it("deserialize: gamePhase her zaman 'playing' olur (intro'da kaydedilmiş olsa bile)", () => {
    useGameStore.getState().setGamePhase('intro')
    const json = serialize()
    // JSON'da gamePhase OLMAMALI — serialize etmiyoruz
    const parsed = JSON.parse(json)
    expect(parsed.game?.gamePhase).toBeUndefined()
    // Deserialize sonrası playing olmalı
    useGameStore.getState().setGamePhase('title')
    deserialize(json)
    expect(useGameStore.getState().gamePhase).toBe('playing')
  })
})
