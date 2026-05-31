// src/components/SahafPanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEffect } from 'react'

export default function SahafPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="bg-gray-900/95 border border-blue-800 rounded-xl p-8 max-w-sm text-center shadow-2xl">
      <div className="text-3xl mb-3">📚</div>
      <h2 className="text-blue-300 text-lg font-bold mb-4">Sahaf</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-2">
        Eski kitaplar, solmuş mürekkep, deniz kokusu.
      </p>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">
        Birisi buraya çok uğruyor olmalı.
      </p>
      <button
        onClick={close}
        className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
      >
        Çık (ESC)
      </button>
    </div>
  )
}
