import { describe, it, expect, beforeEach } from 'vitest'
import { useNewsStore } from '@/store/newsStore'

beforeEach(() => useNewsStore.getState().reset())

describe('newsStore', () => {
  it('başlangıç state boş', () => {
    const s = useNewsStore.getState()
    expect(s.items).toHaveLength(0)
    expect(s.unreadCount).toBe(0)
  })

  it('addItem — item eklenir ve unreadCount artar', () => {
    useNewsStore.getState().addItem({
      type: 'rival_release', rivalId: 'nexus',
      text: 'Test haberi', year: 2000, season: 0,
    })
    const s = useNewsStore.getState()
    expect(s.items).toHaveLength(1)
    expect(s.unreadCount).toBe(1)
    expect(s.items[0].seen).toBe(false)
    expect(s.items[0].id).toBeTruthy()
  })

  it('addItem — yeni item listenin başına gelir', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'İlk', year: 2000, season: 0 })
    useNewsStore.getState().addItem({ type: 'rival_scandal', rivalId: 'nexus', text: 'İkinci', year: 2000, season: 1 })
    expect(useNewsStore.getState().items[0].text).toBe('İkinci')
  })

  it('markSeen — tek item okunur, unreadCount düşer', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'Test', year: 2000, season: 0 })
    const id = useNewsStore.getState().items[0].id
    useNewsStore.getState().markSeen(id)
    const s = useNewsStore.getState()
    expect(s.items[0].seen).toBe(true)
    expect(s.unreadCount).toBe(0)
  })

  it('markAllSeen — hepsi okunur, unreadCount 0', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'A', year: 2000, season: 0 })
    useNewsStore.getState().addItem({ type: 'rival_scandal', rivalId: 'nexus', text: 'B', year: 2000, season: 0 })
    useNewsStore.getState().markAllSeen()
    const s = useNewsStore.getState()
    expect(s.items.every(i => i.seen)).toBe(true)
    expect(s.unreadCount).toBe(0)
  })

  it('max 50 limit — 51. item eklenince en eski düşer', () => {
    for (let i = 0; i < 51; i++) {
      useNewsStore.getState().addItem({ type: 'rival_release', rivalId: null, text: `Haber ${i}`, year: 2000, season: 0 })
    }
    const s = useNewsStore.getState()
    expect(s.items).toHaveLength(50)
    // En yeni başa ekleniyor, 50. item (indeks 49) en eski
    expect(s.items[0].text).toBe('Haber 50')
  })

  it('reset — tüm state temizlenir', () => {
    useNewsStore.getState().addItem({ type: 'rival_release', rivalId: 'nexus', text: 'Test', year: 2000, season: 0 })
    useNewsStore.getState().reset()
    expect(useNewsStore.getState().items).toHaveLength(0)
    expect(useNewsStore.getState().unreadCount).toBe(0)
  })
})
