import { create } from 'zustand'
import type { NewsItem } from '@/types/rival'

interface NewsStore {
  items: NewsItem[]
  unreadCount: number
  addItem: (item: Omit<NewsItem, 'id' | 'seen'>) => void
  markSeen: (id: string) => void
  markAllSeen: () => void
  reset: () => void
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  items: [],
  unreadCount: 0,

  addItem: (item) => {
    const newItem: NewsItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      seen: false,
    }
    const items = [newItem, ...get().items].slice(0, 50)
    set({ items, unreadCount: items.filter(i => !i.seen).length })
  },

  markSeen: (id) => {
    const items = get().items.map(i => i.id === id ? { ...i, seen: true } : i)
    set({ items, unreadCount: items.filter(i => !i.seen).length })
  },

  markAllSeen: () => {
    const items = get().items.map(i => ({ ...i, seen: true }))
    set({ items, unreadCount: 0 })
  },

  reset: () => set({ items: [], unreadCount: 0 }),
}))
