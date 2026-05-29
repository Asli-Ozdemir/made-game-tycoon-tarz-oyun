import { BACKGROUNDS } from '@/data/backgrounds'
import { useCharacterStore } from '@/store/characterStore'
import type { BackgroundId } from '@/data/backgrounds'

interface Props { onNext: () => void }

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-sm ${i < value ? 'bg-blue-500' : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <span className="text-gray-500">{value}</span>
    </div>
  )
}

export default function BackgroundStep({ onNext }: Props) {
  const selected      = useCharacterStore((s) => s.background)
  const setBackground = useCharacterStore((s) => s.setBackground)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white text-center mb-2">Kim olduğunu seç</h1>
      <p className="text-gray-400 text-center mb-6 text-sm">
        Arkaplanın meslek stat'larını ve başlangıç koşullarını belirler.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => setBackground(bg.id as BackgroundId)}
            className={`text-left p-4 rounded-xl border transition-colors ${
              selected === bg.id
                ? 'border-blue-500 bg-blue-950/50'
                : 'border-gray-700 bg-gray-900 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-1">{bg.emoji}</div>
            <div className="font-semibold text-white text-sm mb-1">{bg.title}</div>
            <p className="text-gray-400 text-xs italic mb-3">{bg.story}</p>
            <div className="space-y-1 mb-3">
              <StatBar label="Programlama" value={bg.profession.programlama} />
              <StatBar label="Tasarım"     value={bg.profession.tasarim} />
              <StatBar label="Ses"         value={bg.profession.ses} />
              <StatBar label="Prj.Yön."   value={bg.profession.projeyonetimi} />
            </div>
            <div className="text-green-400 text-xs font-mono">${bg.houseSale.toLocaleString()}</div>
            {bg.startRep > 0 && (
              <div className="text-yellow-400 text-xs">İtibar: {bg.startRep}/100</div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          İleri →
        </button>
      </div>
    </div>
  )
}
