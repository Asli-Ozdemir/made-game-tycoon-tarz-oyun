import { describe, it, expect, beforeEach } from 'vitest'
import { useAwardsStore } from '@/store/awardsStore'
import { useRivalStore } from '@/store/rivalStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useNewsStore } from '@/store/newsStore'
import { useTimeStore } from '@/store/timeStore'

function resetAll() {
  useAwardsStore.getState().reset()
  useRivalStore.getState().reset()
  useCutsceneStore.getState().reset()
  useNewsStore.getState().reset()
  useTimeStore.getState().reset()
}

beforeEach(resetAll)

describe('awardsStore', () => {
  it('başlangıç state boş', () => {
    const s = useAwardsStore.getState()
    expect(s.history).toHaveLength(0)
    expect(s.pendingEvent).toBeNull()
  })

  it('checkAwards — player null oyunla rakip kazanır', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    const s = useAwardsStore.getState()
    expect(s.pendingEvent).not.toBeNull()
    expect(s.pendingEvent!.winnerId).not.toBe('player')
  })

  it('checkAwards — player yüksek skorlu oyunla kazanır', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    // 95 puanlı oyun ile rakipleri geç (major tier max 90)
    useAwardsStore.getState().checkAwards(2000, { name: 'Şaheser', score: 95 })
    const s = useAwardsStore.getState()
    expect(s.pendingEvent).not.toBeNull()
    expect(s.pendingEvent!.winnerId).toBe('player')
  })

  it('checkAwards — player kazanınca cutscene başlar', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, { name: 'Şaheser', score: 95 })
    // activeCutscene 'awards_win', 'awards_win_gallery' veya 'awards_win_boardroom' olabilir
    const activeCutscene = useCutsceneStore.getState().activeCutscene
    expect(['awards_win', 'awards_win_gallery', 'awards_win_boardroom']).toContain(activeCutscene)
  })

  it('checkAwards — Nexus kazanınca awards_lose_to_nexus sahnesi başlar', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    const winnerId = useAwardsStore.getState().pendingEvent?.winnerId
    if (winnerId === 'nexus') {
      expect(useCutsceneStore.getState().activeCutscene).toBe('awards_lose_to_nexus')
    }
    // Nexus kazanmayabilir (rastgele skorlar). Test en azından pendingEvent'in set olduğunu doğrular.
    expect(useAwardsStore.getState().pendingEvent).not.toBeNull()
  })

  it('checkAwards — history\'ye kaydedilir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, { name: 'Şaheser', score: 95 })
    expect(useAwardsStore.getState().history).toHaveLength(1)
    expect(useAwardsStore.getState().history[0].year).toBe(2000)
  })

  it('clearPending — pendingEvent null olur', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    useAwardsStore.getState().clearPending()
    expect(useAwardsStore.getState().pendingEvent).toBeNull()
  })

  it('reset — tüm state temizlenir', () => {
    useRivalStore.getState().initRivals()
    useRivalStore.getState().simulateYear(2000)
    useAwardsStore.getState().checkAwards(2000, null)
    useAwardsStore.getState().reset()
    expect(useAwardsStore.getState().history).toHaveLength(0)
    expect(useAwardsStore.getState().pendingEvent).toBeNull()
  })
})
