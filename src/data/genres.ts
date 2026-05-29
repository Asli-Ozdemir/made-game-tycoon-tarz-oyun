import type { Genre } from '@/types'

export const GENRES: Record<string, Genre> = {
  aksiyon:    { id: 'aksiyon',    name: 'Aksiyon',    baseSales: 1000, cycleLength: 6, startPhase: 0.0 },
  rpg:        { id: 'rpg',        name: 'RPG',         baseSales: 800,  cycleLength: 8, startPhase: 1.0 },
  strateji:   { id: 'strateji',   name: 'Strateji',   baseSales: 600,  cycleLength: 5, startPhase: 2.5 },
  simulasyon: { id: 'simulasyon', name: 'Simülasyon', baseSales: 500,  cycleLength: 7, startPhase: 4.2 },
  bulmaca:    { id: 'bulmaca',    name: 'Bulmaca',    baseSales: 700,  cycleLength: 6, startPhase: 3.1 },
}
