import { describe, it, expect, beforeEach } from 'vitest'
import { useIdeaSeedStore } from '../ideaSeedStore'

beforeEach(() => {
  useIdeaSeedStore.getState().reset()
})

describe('ideaSeedStore — kirliSeeds', () => {
  it('kirliSeeds başlangıçta tüm tipler sıfır', () => {
    const { kirliSeeds } = useIdeaSeedStore.getState()
    expect(kirliSeeds.analiz).toBe(0)
    expect(kirliSeeds.nostalji).toBe(0)
  })

  it('addKirliSeed verilen tipi 1 artırır', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(1)
  })

  it('addKirliSeed birden fazla çağrıda birikir', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(2)
  })

  it('addKirliSeed farklı tipler birbirini etkilemez', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    useIdeaSeedStore.getState().addKirliSeed('hikaye')
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(1)
    expect(useIdeaSeedStore.getState().kirliSeeds.hikaye).toBe(1)
    expect(useIdeaSeedStore.getState().kirliSeeds.nostalji).toBe(0)
  })

  it('addKirliSeed normal seeds\'i etkilemez', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(0)
  })

  it('reset() kirliSeeds\'i de sıfırlar', () => {
    useIdeaSeedStore.getState().addKirliSeed('analiz')
    useIdeaSeedStore.getState().reset()
    expect(useIdeaSeedStore.getState().kirliSeeds.analiz).toBe(0)
  })
})
