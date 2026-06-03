// src/components/character/PreferencesStep.tsx
import { useState } from 'react'
import { useCharacterStore } from '@/store/characterStore'

interface Props {
  onBack: () => void
  onNext: () => void
}

export default function PreferencesStep({ onBack, onNext }: Props) {
  const attractedTo    = useCharacterStore((s) => s.attractedTo)
  const setAttractedTo = useCharacterStore((s) => s.setAttractedTo)

  const [selected, setSelected] = useState<('male' | 'female')[]>(attractedTo)

  function toggle(gender: 'male' | 'female') {
    setSelected(prev =>
      prev.includes(gender)
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    )
  }

  function handleNext() {
    setAttractedTo(selected)
    onNext()
  }

  const options: { value: 'male' | 'female'; label: string; desc: string }[] = [
    { value: 'female', label: 'Kadınlar',  desc: 'Kadın NPC\'lerle sosyal bağ daha hızlı gelişir.' },
    { value: 'male',   label: 'Erkekler',  desc: 'Erkek NPC\'lerle sosyal bağ daha hızlı gelişir.' },
  ]

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Tercihler</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Romantik ilgi duyduğun kişileri seç. Çapkınlık yeteneği bu tercihe göre şekillenir.
          İstersen her ikisini de seçebilirsin.
        </p>
      </div>

      <div className="flex gap-4">
        {options.map(opt => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`w-44 p-5 rounded-xl border-2 text-left transition-all ${
                active
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="text-lg font-bold mb-1">{opt.label}</div>
              <div className="text-xs leading-snug opacity-70">{opt.desc}</div>
              {active && (
                <div className="mt-3 text-blue-400 text-xs font-mono">✓ Seçildi</div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-gray-600 text-xs">
        Seçim yapmak zorunda değilsin — boş bırakabilirsin.
      </p>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition text-sm"
        >
          Geri
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-sm"
        >
          Devam
        </button>
      </div>
    </div>
  )
}
