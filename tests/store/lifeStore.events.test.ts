import { describe, it, expect, beforeEach } from 'vitest'
import { useLifeStore } from '@/store/lifeStore'
import { useNPCStore } from '@/store/npcStore'

beforeEach(() => {
  useLifeStore.getState().reset()
})

describe('Spec B — evlilik & ölüm/miras olayları (varsayılan LIFE_EVENTS)', () => {
  it('Daniel & Sigrid yıl 9\'da evlenir (oyuncu romantik değilse)', () => {
    useLifeStore.getState().advanceYear(2009)
    expect(useLifeStore.getState().hasFlag('married_daniel_sigrid')).toBe(true)
  })

  it('oyuncu Daniel ile romantikse evlilik tetiklenmez', () => {
    useLifeStore.setState({ flags: new Set(['player_romance_daniel']) })
    useLifeStore.getState().advanceYear(2009)
    expect(useLifeStore.getState().hasFlag('married_daniel_sigrid')).toBe(false)
  })

  it('Aldo yıl 14\'te vefat eder → retired + devir bayrağı + konuşulamaz', () => {
    useLifeStore.getState().advanceYear(2014)
    expect(useLifeStore.getState().isRetired('aldo')).toBe(true)
    expect(useLifeStore.getState().hasFlag('devir_firin_rosa')).toBe(true)
    expect(useNPCStore.getState().getAvailableDialogues('aldo')).toHaveLength(0)
  })

  it('yıl 8\'de henüz evlilik yok, yıl 13\'te henüz ölüm yok', () => {
    useLifeStore.getState().advanceYear(2008)
    expect(useLifeStore.getState().hasFlag('married_daniel_sigrid')).toBe(false)
    useLifeStore.getState().reset()
    useLifeStore.getState().advanceYear(2013)
    expect(useLifeStore.getState().isRetired('aldo')).toBe(false)
  })
})
