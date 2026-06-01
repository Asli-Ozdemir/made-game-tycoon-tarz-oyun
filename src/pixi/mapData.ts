export const TILE_SIZE = 32

export type ZoneType      = 'coastal_water' | 'coastal_sand' | 'coastal' | 'bridge' | 'city' | 'city_north'
export type BuildingStyle = 'coastal' | 'bridge' | 'city' | 'city_major'

export interface ZoneDef {
  rowStart: number
  rowEnd:   number
  bgColor:  number
  type:     ZoneType
}

export interface BuildingDef {
  id:    string
  col:   number
  row:   number
  cols:  number
  rows:  number
  label: string
  style: BuildingStyle
}

export interface TriggerDef {
  name: string
  x:    number
  y:    number
  w:    number
  h:    number
}

export interface CollisionRect {
  x: number
  y: number
  w: number
  h: number
}
