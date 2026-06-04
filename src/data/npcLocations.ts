import type { NPCId } from './npcDialogues'
import type { RoomId } from '@/pixi/rooms/types'

export const NPC_HOME_ROOMS: Record<NPCId, RoomId> = {
  // coast_home — Konut, bahçe, deniz feneri
  aldo:    'coast_home',
  liv:     'coast_home',
  cassian: 'coast_home',

  // coast_docks — Balıkçı rıhtımı, su kıyısı
  remy:    'coast_docks',
  soren:   'coast_docks',
  sigrid:  'coast_docks',
  daniel:  'coast_docks',

  // coast_center — Pub, sahaf, fırın, klinik (mevcut coastRoom)
  marcus:  'coast_center',
  theo:    'coast_center',
  marta:   'coast_center',
  rosa:    'coast_center',
  bjorn:   'coast_center',
  nadia:   'coast_center',

  // coast_west — Kafe, atölye, park
  bruno:   'coast_west',
  magnus:  'coast_west',
  elise:   'coast_west',

  // city_core — Stüdyo, hukuk, akademi, basın (mevcut cityRoom)
  clara:   'city_core',
  vivian:  'city_core',
  iris:    'city_core',

  // city_culture — Arcade, atölye, bistro
  rex:     'city_culture',
  yevgeni: 'city_culture',
  matteo:  'city_culture',

  // city_edge — Klinik, havuz
  elias:   'city_edge',
  kai:     'city_edge',
}
