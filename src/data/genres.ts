import type { Genre } from '@/types'

export const GENRES: Record<string, Genre> = {
  aksiyon:    { id: 'aksiyon',    name: 'Aksiyon',    baseSales: 1000 },
  rpg:        { id: 'rpg',        name: 'RPG',         baseSales: 800  },
  strateji:   { id: 'strateji',   name: 'Strateji',   baseSales: 600  },
  simulasyon: { id: 'simulasyon', name: 'Simülasyon', baseSales: 500  },
  bulmaca:    { id: 'bulmaca',    name: 'Bulmaca',    baseSales: 700  },
}
