// src/components/BalikciPanel.tsx
import { useEffect } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import DialogueView from '@/components/DialogueView'

export default function BalikciPanel() {
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
    <div className="bg-gray-900/95 border border-blue-900 rounded-xl p-6 w-80 shadow-2xl">
      <DialogueView npcId="remy" onClose={close} />
    </div>
  )
}
