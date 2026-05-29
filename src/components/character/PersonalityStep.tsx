import { useState } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import type { PersonalityStats } from '@/data/backgrounds'

const TOTAL_POINTS = 5

const STAT_LABELS: { key: keyof PersonalityStats; label: string; desc: string }[] = [
  { key: 'karisma',      label: 'Karisma',      desc: 'İlişki kurma, ikna, NPC bonusu' },
  { key: 'odak',         label: 'Odak',          desc: 'Solo verimlilik, crunch dayanıklılığı' },
  { key: 'rekabetcilik', label: 'Rekabetçilik',  desc: 'Rakip diyalogları, gerilim artışı' },
  { key: 'yaraticilik',  label: 'Yaratıcılık',   desc: 'Konsept özgünlüğü, eleştirmen bonusu' },
  { key: 'isZekasi',     label: 'İş Zekası',     desc: 'Para yönetimi, yatırımcı ikna' },
]

interface Props { onBack: () => void; onNext: () => void }

export default function PersonalityStep({ onBack, onNext }: Props) {
  const setPersonality = useCharacterStore((s) => s.setPersonality)
  const [stats, setStats] = useState<PersonalityStats>({
    karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0,
  })

  const used = Object.values(stats).reduce((a, b) => a + b, 0)
  const remaining = TOTAL_POINTS - used

  function adjust(key: keyof PersonalityStats, delta: number) {
    const next = stats[key] + delta
    if (next < 0 || next > TOTAL_POINTS) return
    if (delta > 0 && remaining === 0) return
    setStats((s) => ({ ...s, [key]: next }))
  }

  function handleNext() {
    setPersonality(stats)
    onNext()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white text-center mb-2">Sen kimsin?</h1>
      <p className="text-gray-400 text-center mb-2 text-sm">
        5 puan, 5 stat arasında dağıt.
      </p>
      <div className={`text-center text-sm font-mono mb-6 ${remaining === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
        {remaining} puan kaldı
      </div>

      <div className="max-w-lg mx-auto space-y-4 mb-8">
        {STAT_LABELS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center gap-4 bg-gray-900 rounded-xl p-4">
            <div className="flex-1">
              <div className="text-white font-medium text-sm">{label}</div>
              <div className="text-gray-400 text-xs">{desc}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjust(key, -1)}
                disabled={stats[key] === 0}
                className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white font-bold"
              >
                −
              </button>
              <span className="text-white font-mono w-4 text-center">{stats[key]}</span>
              <button
                onClick={() => adjust(key, 1)}
                disabled={remaining === 0 || stats[key] === TOTAL_POINTS}
                className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white font-bold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
          ← Geri
        </button>
        <button
          onClick={handleNext}
          disabled={remaining !== 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          İleri →
        </button>
      </div>
    </div>
  )
}
