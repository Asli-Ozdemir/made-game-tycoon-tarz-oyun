// src/pixi/TriggerSystem.ts
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import type { LocationId } from '@/store/worldStore'
import type { TriggerDef } from './mapData'

// TriggerRect artık TriggerDef ile aynı yapıda — re-export et
export type { TriggerDef as TriggerRect }

export function getActiveTrigger(triggers: TriggerDef[], px: number, py: number): string | null {
  for (const t of triggers) {
    if (px >= t.x && px < t.x + t.w && py >= t.y && py < t.y + t.h) {
      return t.name
    }
  }
  return null
}

const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:     'cafe',
  fair_entrance: 'fair',
  akademi_door:  'akademi',
  sahaf_door:    'sahaf',
  balikci_door:  'balikci',
  pub_door:      'pub',
  yatak:         'sleep',
}

const PLACEHOLDER_TRIGGERS = new Set([
  'cicekci_door', 'kuyumcu_door', 'han_door',
  'nexus_building', 'investor_office',
])

export function handleTrigger(triggerName: string): void {
  const { setGameMode, setLocation } = useWorldStore.getState()
  const { setIsPaused } = useDayTimeStore.getState()

  if (triggerName === 'studio_desk') {
    setGameMode('tycoon')
    setIsPaused(true)
    return
  }

  if (PLACEHOLDER_TRIGGERS.has(triggerName)) {
    console.info('Yakında açılacak...')
    return
  }

  const locationId = LOCATION_MAP[triggerName]
  if (locationId) {
    setLocation(locationId)
    setIsPaused(true)
  }
}
