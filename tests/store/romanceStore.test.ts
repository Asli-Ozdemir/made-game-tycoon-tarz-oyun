import { describe, it, expect, beforeEach } from 'vitest'
import { useRomanceStore, BOUQUET_COST, RING_COST } from '@/store/romanceStore'
import { useCharacterStore } from '@/store/characterStore'
import { useNPCStore } from '@/store/npcStore'
import { useLifeStore } from '@/store/lifeStore'
import { useGameStore } from '@/store/gameStore'

beforeEach(() => {
  useRomanceStore.getState().reset()
  useCharacterStore.getState().reset()
  useLifeStore.getState().reset()
  useGameStore.setState({ money: 100000 })
  // Daniel (romantizm adayı, male) yüksek kalp
  useNPCStore.setState({
    npcs: { daniel: { relationship: 80, seenDialogueIds: [] } },
    gainMultipliers: { daniel: 1.0 },
  })
})

describe('romanceStore — tam ark', () => {
  it('itiraf → buluşma → teklif → evlilik → çocuk', () => {
    expect(useRomanceStore.getState().confess('daniel')).toBe(false) // demet yok
    useRomanceStore.getState().buyBouquet()
    expect(useRomanceStore.getState().confess('daniel')).toBe(true)
    expect(useRomanceStore.getState().getStage('daniel')).toBe('sevgili')
    expect(useCharacterStore.getState().partnerId).toBe('daniel')
    expect(useLifeStore.getState().hasFlag('player_romance_daniel')).toBe(true)

    useRomanceStore.getState().goOnDate('daniel')
    useRomanceStore.getState().goOnDate('daniel')
    useRomanceStore.getState().goOnDate('daniel')
    expect(useRomanceStore.getState().propose('daniel')).toBe(false) // yüzük yok
    useRomanceStore.getState().buyRing()
    expect(useRomanceStore.getState().propose('daniel')).toBe(true)
    expect(useRomanceStore.getState().getStage('daniel')).toBe('nisanli')

    expect(useRomanceStore.getState().marry('daniel')).toBe(true)
    expect(useCharacterStore.getState().spouseId).toBe('daniel')
    expect(useLifeStore.getState().hasFlag('player_married_daniel')).toBe(true)

    expect(useRomanceStore.getState().haveChild('Mira')).toBe(true)
    expect(useRomanceStore.getState().haveChild('Eda')).toBe(true)
    expect(useRomanceStore.getState().haveChild('Fazla')).toBe(false) // max 2
    expect(useCharacterStore.getState().childIds).toHaveLength(2)
  })
})

describe('romanceStore — kapı (gating)', () => {
  it('cinsiyet tercihi: female isteyen, male adayı romantize edemez', () => {
    useCharacterStore.setState({ attractedTo: ['female'] })
    useRomanceStore.getState().buyBouquet()
    expect(useRomanceStore.getState().canRomance('daniel')).toBe(false)
    expect(useRomanceStore.getState().confess('daniel')).toBe(false)
  })

  it('B evlendirdiyse (married_daniel_sigrid) romantize edilemez', () => {
    useLifeStore.getState().setFlag('married_daniel_sigrid')
    expect(useRomanceStore.getState().canRomance('daniel')).toBe(false)
  })

  it('düşük kalp itirafı engeller', () => {
    useNPCStore.setState({ npcs: { daniel: { relationship: 40, seenDialogueIds: [] } }, gainMultipliers: { daniel: 1.0 } })
    useRomanceStore.getState().buyBouquet()
    expect(useRomanceStore.getState().confess('daniel')).toBe(false)
  })

  it('romantizm adayı olmayan (minör/felsefe) romantize edilemez', () => {
    expect(useRomanceStore.getState().canRomance('tessa')).toBe(false)
    expect(useRomanceStore.getState().canRomance('marcus')).toBe(false)
  })

  it('jestler para harcar; para yetmezse alınmaz', () => {
    useGameStore.setState({ money: 100000 })
    expect(useRomanceStore.getState().buyBouquet()).toBe(true)
    expect(useGameStore.getState().money).toBe(100000 - BOUQUET_COST)
    expect(useRomanceStore.getState().buyRing()).toBe(true)
    expect(useGameStore.getState().money).toBe(100000 - BOUQUET_COST - RING_COST)
    // para bitince
    useGameStore.setState({ money: 10 })
    useRomanceStore.getState().reset()
    expect(useRomanceStore.getState().buyBouquet()).toBe(false)
  })
})
