// src/components/CafePanel.tsx
import { useWorldStore } from '@/store/worldStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useEmployeeStore } from '@/store/employeeStore'

const CAFE_NPCS = [
  { id: 1, name: 'Zeynep Arslan',  desc: 'Freelance grafiker, yeni fırsatlar arıyor' },
  { id: 2, name: 'Mert Koçak',    desc: 'Junior programcı, staj sonrası iş arıyor' },
  { id: 3, name: 'Aylin Şahin',   desc: 'Ses tasarımcısı, küçük projelerde çalışmış' },
]

const GOSSIP = [
  'Bu sezon RPG oyunları çok satıyor.',
  'Rakip stüdyo büyük bir oyun duyurusu yapacak.',
  'Mobil platformda puzzle oyunları trend.',
  'Bağımsız yapımcılar ödül törenine hazırlanıyor.',
]

export default function CafePanel() {
  const setLocation       = useWorldStore((s) => s.setLocation)
  const setIsPaused       = useDayTimeStore((s) => s.setIsPaused)
  const advanceTime       = useDayTimeStore((s) => s.advanceRealSeconds)
  const weekNumber        = useDayTimeStore((s) => s.weekNumber)
  const refreshCandidates = useEmployeeStore((s) => s.refreshCandidates)

  function close() {
    setLocation(null)
    setIsPaused(false)
  }

  function handleMeet(npcId: number) {
    advanceTime(120) // 1 game hour = 120 real seconds
    refreshCandidates(weekNumber * 100 + npcId)
    close()
  }

  function handleGossip() {
    advanceTime(120)
    const msg = GOSSIP[Math.floor(Math.random() * GOSSIP.length)]
    console.info(`💬 ${msg}`)
    close()
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96 text-white shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">☕ Kafe</h2>
        <button onClick={close} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
      </div>

      <p className="text-gray-400 text-sm mb-4">Bugün kafede kimler var?</p>

      <div className="space-y-3 mb-6">
        {CAFE_NPCS.map((npc) => (
          <div key={npc.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
            <div>
              <p className="font-medium text-sm">{npc.name}</p>
              <p className="text-gray-400 text-xs">{npc.desc}</p>
            </div>
            <button
              onClick={() => handleMeet(npc.id)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded ml-3 shrink-0"
            >
              Tanış <span className="text-blue-300">1s</span>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleGossip}
        className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
      >
        Dedikodu dinle <span className="text-gray-400 text-xs">1 saat</span>
      </button>
    </div>
  )
}
