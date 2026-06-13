import type { Topic } from '@/types'
import type { ProjectScope } from '@/types'

export const TOPICS: Record<string, Topic> = {
  uzay:    { id: 'uzay',    name: 'Uzay',    genreAffinity: ['aksiyon', 'strateji']      },
  fantezi: { id: 'fantezi', name: 'Fantezi', genreAffinity: ['rpg', 'aksiyon']           },
  spor:    { id: 'spor',    name: 'Spor',    genreAffinity: ['simulasyon', 'aksiyon']    },
  korku:   { id: 'korku',   name: 'Korku',   genreAffinity: ['aksiyon', 'rpg']           },
  sehir:   { id: 'sehir',   name: 'Şehir',   genreAffinity: ['simulasyon', 'strateji']  },
}

export const SCOPE_CONFIG: Record<ProjectScope, { weeks: number; qualityPerWeek: number; label: string }> = {
  kucuk:   { weeks: 12, qualityPerWeek: 6, label: 'Küçük'   },
  orta:    { weeks: 16, qualityPerWeek: 5, label: 'Orta'    },
  buyuk:   { weeks: 24, qualityPerWeek: 4, label: 'Büyük'   },
  iddiali: { weeks: 36, qualityPerWeek: 3, label: 'İddalı'  },
}
