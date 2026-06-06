import { useObjectiveStore } from '@/store/objectiveStore'

export default function ObjectiveBanner() {
  const objective = useObjectiveStore((s) => s.activeObjective)
  if (!objective) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 44,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8,8,24,0.88)',
        border: '1px solid rgba(90,140,255,0.28)',
        color: '#8ab0f0',
        fontFamily: 'monospace',
        fontSize: 11,
        letterSpacing: 1,
        padding: '3px 14px',
        borderRadius: 2,
        zIndex: 15,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      ▶ {objective.title}
    </div>
  )
}
