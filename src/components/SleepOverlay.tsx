// src/components/SleepOverlay.tsx
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'
import SkillTreePanel   from '@/components/SkillTreePanel'
import SocialSkillPanel from '@/components/SocialSkillPanel'
import { DEMO_MODE } from '@/config'

type Tab = 'zihin' | 'sosyal'

interface Props {
  onWake?: () => void
}

export default function SleepOverlay({ onWake }: Props) {
  const setLocation = useWorldStore(s => s.setLocation)
  const [visible, setVisible] = useState(false)
  const [tab, setTab]         = useState<Tab>(DEMO_MODE ? 'sosyal' : 'zihin')

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
      className="absolute inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-[600ms]"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0c0820 0%, #050309 70%, #030208 100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Sekme çubuğu */}
      <div className="flex gap-1 mb-3">
        {(DEMO_MODE ? (['sosyal'] as Tab[]) : (['zihin', 'sosyal'] as Tab[])).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase transition-colors ${
              tab === t
                ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {t === 'zihin' ? 'Zihin' : 'Sosyal'}
          </button>
        ))}
      </div>

      {/* Panel içeriği */}
      <div style={{ width: 800, height: 640 }}>
        {tab === 'zihin'  && <SkillTreePanel   onWake={wake} />}
        {tab === 'sosyal' && <SocialSkillPanel onWake={wake} />}
      </div>
    </div>
  )
}
