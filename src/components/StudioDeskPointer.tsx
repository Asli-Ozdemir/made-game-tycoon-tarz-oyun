import { useEffect, useState } from 'react'
import { useObjectiveStore } from '@/store/objectiveStore'
import { useWorldStore }     from '@/store/worldStore'
import { getSceneContainerOffset } from '@/pixi/Game'

const DESK_WORLD_X = 512 + 16
const DESK_WORLD_Y = 384 + 16

export default function StudioDeskPointer() {
  const show          = useObjectiveStore((s) => s.showPointer)
  const currentRoomId = useWorldStore((s) => s.currentRoomId)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!show || currentRoomId !== 'coast_home') {
      setPos(null)
      return
    }
    let rafId: number
    function tick() {
      const offset = getSceneContainerOffset()
      if (offset) setPos({ x: DESK_WORLD_X + offset.x, y: DESK_WORLD_Y + offset.y })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [show, currentRoomId])

  if (!show || currentRoomId !== 'coast_home' || !pos) return null

  return (
    <div
      style={{
        position:      'fixed',
        left:          pos.x,
        top:           pos.y,
        transform:     'translate(-50%, -100%) translateY(-4px)',
        pointerEvents: 'none',
        zIndex:        11,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           2,
      }}
    >
      <div
        style={{
          color:        '#ffcc44',
          fontFamily:   'monospace',
          fontSize:     9,
          background:   'rgba(0,0,0,0.65)',
          padding:      '2px 6px',
          borderRadius: 2,
          whiteSpace:   'nowrap',
          letterSpacing: 1,
        }}
      >
        Bilgisayar
      </div>
      <div style={{ color: '#ffcc44', fontSize: 12, lineHeight: 1 }}>▼</div>
    </div>
  )
}
