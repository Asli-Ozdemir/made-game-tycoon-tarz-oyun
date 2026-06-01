// src/components/SleepOverlay.tsx
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'

interface Props {
  onWake?: () => void
}

export default function SleepOverlay({ onWake }: Props) {
  const setLocation = useWorldStore(s => s.setLocation)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  function wake() {
    setVisible(false)
    setTimeout(() => {
      setLocation(null)
      if (onWake) onWake()
    }, 600)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') wake()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-[600ms]"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0c0820 0%, #050309 70%, #030208 100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* SkillTreePanel buraya gelecek — Task 5'te */}
      <div className="text-purple-300 text-sm font-mono">Rüya yükleniyor...</div>

      <button
        onClick={wake}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 text-xs transition-colors font-mono"
      >
        Uyan (ESC)
      </button>
    </div>
  )
}
