import { useState } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import { BACKGROUNDS } from '@/data/backgrounds'

interface Props {
  onBack:     () => void
  onFinalize: (name: string, studioName: string) => void
}

export default function IdentityStep({ onBack, onFinalize }: Props) {
  const [name,       setName]       = useState('')
  const [studioName, setStudioName] = useState('')
  const backgroundId = useCharacterStore((s) => s.background)
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)!

  const canStart = name.trim().length > 0 && studioName.trim().length > 0

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white text-center mb-2">Son adım</h1>

      <div className="bg-gray-900 rounded-xl p-4 mb-6 text-center">
        <p className="text-gray-300 text-sm italic">{bg.houseStory}</p>
        <p className="text-green-400 font-mono mt-2">${bg.houseSale.toLocaleString()} ile başlıyorsun.</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Adın</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            placeholder="Karakterin adı"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Stüdyo adın</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value.slice(0, 40))}
            placeholder="Stüdyo adı"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
          ← Geri
        </button>
        <button
          onClick={() => onFinalize(name.trim(), studioName.trim())}
          disabled={!canStart}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          Oyuna Başla
        </button>
      </div>
    </div>
  )
}
