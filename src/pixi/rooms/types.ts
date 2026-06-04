import type { ZoneDef, BuildingDef, TriggerDef, CollisionRect } from '../mapData'

export type RoomId =
  // Sahil yakası
  | 'coast_home'
  | 'coast_docks'
  | 'coast_center'
  | 'coast_west'
  // Köprü
  | 'bridge'
  // Şehir yakası
  | 'city_core'
  | 'city_culture'
  | 'city_edge'
  | 'city_park'

export interface ExitTriggerDef {
  toRoom: RoomId
  x: number
  y: number
  w: number
  h: number
}

export type SpawnPoints = Partial<
  Record<`from_${RoomId}` | 'default', { x: number; y: number }>
>

export interface RoomDef {
  id: RoomId
  widthTiles: number
  heightTiles: number
  zones: ZoneDef[]
  buildings: BuildingDef[]
  triggers: TriggerDef[]
  exitTriggers: ExitTriggerDef[]
  customCollisionRects: CollisionRect[]
  spawnPoints: SpawnPoints
}
