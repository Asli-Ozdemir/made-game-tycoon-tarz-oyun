// src/components/SahafPanel.tsx
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import DialogueView from '@/components/DialogueView'
import AntiquarianView from '@/components/AntiquarianView'

type View = 'dialogue' | 'archive'

export default function SahafPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)
  const [view, setView] = useState<View>('dialogue')

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
    <div className={`bg-gray-900/95 border border-blue-900 rounded-xl p-6 shadow-2xl ${
      view === 'archive' ? 'w-[620px]' : 'w-80'
    }`}>
      {view === 'dialogue' && (
        <>
          <DialogueView npcId="marcus" onClose={close} />
          <button
            onClick={() => setView('archive')}
            className="mt-3 w-full border border-amber-800 rounded-lg py-2 font-mono text-sm text-amber-300 hover:bg-amber-950/40 hover:border-amber-600 transition-colors"
          >
            📚 Arşiv taraması yap
          </button>
        </>
      )}
      {view === 'archive' && (
        <AntiquarianView onBack={() => setView('dialogue')} />
      )}
    </div>
  )
}
