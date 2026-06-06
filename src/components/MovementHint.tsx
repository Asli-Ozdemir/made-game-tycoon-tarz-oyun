import { useObjectiveStore } from '@/store/objectiveStore'

export default function MovementHint() {
  const show    = useObjectiveStore((s) => s.showMovementHint)
  const dismiss = useObjectiveStore((s) => s.dismissMovementHint)
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8,8,24,0.82)',
        border: '1px solid rgba(90,140,255,0.2)',
        color: '#7080a0',
        fontFamily: 'monospace',
        fontSize: 11,
        padding: '5px 16px',
        borderRadius: 2,
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        whiteSpace: 'nowrap',
      }}
    >
      <span>↑ ↓ ← →  veya  W A S D  ile hareket et</span>
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#445',
          cursor: 'pointer',
          fontSize: 13,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
