import type { RoomId } from '@/pixi/rooms/types'
import type { LocationId } from '@/store/worldStore'
import type { ProjectScope } from '@/types'

export const DEMO_MODE = true

// Demo'da yüksek bütçeli ölçekler kilitli — sadece Küçük açık
export const DEMO_LOCKED_SCOPES = new Set<ProjectScope>([
  'orta',
  'buyuk',
  'iddiali',
])

export const DEMO_BLOCKED_ROOMS = new Set<RoomId>([
  'bridge',
  'city_core',
  'city_culture',
  'city_edge',
  'city_park',
])

export const DEMO_BLOCKED_LOCATIONS = new Set<LocationId>([
  'pub',
  'nehir',
])
