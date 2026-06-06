import type { RoomId } from '@/pixi/rooms/types'
import type { LocationId } from '@/store/worldStore'

export const DEMO_MODE = true

export const DEMO_BLOCKED_ROOMS = new Set<RoomId>([
  'bridge',
  'city_core',
  'city_culture',
  'city_edge',
  'city_park',
])

export const DEMO_BLOCKED_LOCATIONS = new Set<LocationId>([
  'pub',
  'balikci',
  'nehir',
])
