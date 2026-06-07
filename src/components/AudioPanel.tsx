// src/components/AudioPanel.tsx
import { useAudioStore } from '@/store/audioStore'

interface Props { onClose: () => void }

export default function AudioPanel({ onClose }: Props) {
  const { masterVolume, sfxVolume, musicVolume, muted, setMasterVolume, setSfxVolume, setMusicVolume, toggleMute } = useAudioStore()

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="absolute top-12 right-4 bg-gray-900 border border-gray-700 rounded-xl p-4 w-64 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white text-sm font-semibold">Ses Ayarları</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>

        <button
          onClick={toggleMute}
          className={`w-full mb-4 py-1.5 rounded text-sm font-medium transition-colors ${
            muted ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
        >
          {muted ? '🔇 Sesi Aç' : '🔊 Sesi Kapat'}
        </button>

        <div className={muted ? 'space-y-3 opacity-40' : 'space-y-3'}>
          {([
            ['Genel', masterVolume, setMasterVolume],
            ['Efektler', sfxVolume, setSfxVolume],
            ['Müzik', musicVolume, setMusicVolume],
          ] as [string, number, (v: number) => void][]).map(([label, value, setter]) => (
            <label key={label} className="block">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{label}</span>
                <span>{Math.round((value as number) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value as number}
                disabled={muted}
                onChange={(e) => (setter as (v: number) => void)(Number(e.target.value))}
                className="w-full accent-blue-500 disabled:opacity-40"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
