import type { Platform } from '@/types'

export const PLATFORMS: Record<string, Platform> = {
  pc:     { id: 'pc',     name: 'PC',     salesMultiplier: 1.0, pricePerUnit: 20, suggestedPrice: 20 },
  konsol: { id: 'konsol', name: 'Konsol', salesMultiplier: 1.2, pricePerUnit: 30, suggestedPrice: 40 },
  mobil:  { id: 'mobil',  name: 'Mobil',  salesMultiplier: 0.8, pricePerUnit: 5,  suggestedPrice: 5  },
}
