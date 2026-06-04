import { describe, it, expect } from 'vitest'
import { NPC_HOME_ROOMS } from '../npcLocations'

const ALL_NPC_IDS = [
  // Felsefe
  'marcus', 'remy', 'theo', 'bruno', 'magnus', 'yevgeni',
  'marta', 'clara', 'aldo', 'rex', 'vivian', 'soren',
  // Romantizm
  'elise', 'daniel', 'nadia', 'cassian', 'rosa', 'iris',
  'sigrid', 'liv', 'bjorn', 'kai', 'elias', 'matteo',
] as const

const VALID_ROOM_IDS = [
  'coast_home', 'coast_docks', 'coast_center', 'coast_west',
  'bridge',
  'city_core', 'city_culture', 'city_edge', 'city_park',
] as const

describe('NPC_HOME_ROOMS', () => {
  it('her NPCId için bir oda tanımlı', () => {
    for (const id of ALL_NPC_IDS) {
      expect(NPC_HOME_ROOMS[id], `${id} için oda eksik`).toBeDefined()
    }
  })

  it('atanan her oda geçerli bir RoomId', () => {
    for (const [id, room] of Object.entries(NPC_HOME_ROOMS)) {
      expect(VALID_ROOM_IDS, `${id} → "${room}" geçersiz RoomId`).toContain(room)
    }
  })

  it('marcus coast_center\'da yaşıyor', () => {
    expect(NPC_HOME_ROOMS['marcus']).toBe('coast_center')
  })

  it('clara city_core\'da yaşıyor', () => {
    expect(NPC_HOME_ROOMS['clara']).toBe('city_core')
  })

  it('remy coast_docks\'ta yaşıyor', () => {
    expect(NPC_HOME_ROOMS['remy']).toBe('coast_docks')
  })

  it('rex city_culture\'da yaşıyor', () => {
    expect(NPC_HOME_ROOMS['rex']).toBe('city_culture')
  })

  it('tam olarak 24 NPC var', () => {
    expect(Object.keys(NPC_HOME_ROOMS).length).toBe(24)
  })
})
