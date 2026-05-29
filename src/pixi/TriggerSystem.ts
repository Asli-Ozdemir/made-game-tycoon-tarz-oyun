import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import type { LocationId } from '@/store/worldStore'

export interface TriggerRect {
  name: string
  x: number
  y: number
  width: number
  height: number
}

export function parseTriggers(tmxObjectLayer: Element): TriggerRect[] {
  return Array.from(tmxObjectLayer.querySelectorAll('object')).map((obj) => ({
    name:   obj.getAttribute('name') ?? '',
    x:      parseFloat(obj.getAttribute('x') ?? '0'),
    y:      parseFloat(obj.getAttribute('y') ?? '0'),
    width:  parseFloat(obj.getAttribute('width') ?? '32'),
    height: parseFloat(obj.getAttribute('height') ?? '32'),
  }))
}

export function getActiveTrigger(triggers: TriggerRect[], px: number, py: number): string | null {
  for (const t of triggers) {
    if (px >= t.x && px < t.x + t.width && py >= t.y && py < t.y + t.height) {
      return t.name
    }
  }
  return null
}

const PLACEHOLDER_LOCATIONS = new Set(['rival_door', 'investor_door', 'arcade_door'])
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:      'cafe',
  fair_entrance:  'fair',
  akademi_door:   'akademi',
}

export function handleTrigger(triggerName: string): void {
  const { setGameMode, setLocation } = useWorldStore.getState()
  const { setIsPaused } = useDayTimeStore.getState()

  if (triggerName === 'studio_desk') {
    setGameMode('tycoon')
    setIsPaused(true)
    return
  }

  if (PLACEHOLDER_LOCATIONS.has(triggerName)) {
    console.info(`${triggerName}: Faz 4'te açılacak`)
    return
  }

  const locationId = LOCATION_MAP[triggerName]
  if (locationId) {
    setLocation(locationId)
    setIsPaused(true)
  }
}
