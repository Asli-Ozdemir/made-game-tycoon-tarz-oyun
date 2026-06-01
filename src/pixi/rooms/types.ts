import type { ZoneDef, BuildingDef, TriggerDef, CollisionRect } from '../mapData'

export type RoomId = 'coast' | 'bridge' | 'city'

export interface ExitTriggerDef {
  toRoom: RoomId
  x: number
  y: number
  w: number
  h: number
}

export interface SpawnPoints {
  default?: { x: number; y: number }
  from_bridge?: { x: number; y: number }
  from_coast?: { x: number; y: number }
  from_city?: { x: number; y: number }
}

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
