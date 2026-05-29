import { useState } from 'react'
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS, SCOPE_CONFIG } from '@/data/topics'
import { createProject } from '@/engine/projectEngine'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useTrendStore } from '@/store/trendStore'
import type { ProjectScope } from '@/types'

interface Props { onClose: () => void }

export default function NewProjectModal({ onClose }: Props) {
  const [name, setName]           = useState('')
  const [genreId, setGenre]       = useState('aksiyon')
  const [topicId, setTopic]       = useState('uzay')
  const [platformId, setPlatform] = useState('pc')
  const [scope, setScope]         = useState<ProjectScope>('orta')

  const date       = useTimeStore((s) => s.date)
  const addProject = useProjectStore((s) => s.addProject)

  const cfg = SCOPE_CONFIG[scope]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addProject(createProject({ name: name.trim(), genreId, topicId, platformId, scope, startDate: date }))
    onClose()
  }

  function getTrendLabel(gId: string): string | null {
    const multiplier = useTrendStore.getState().getMultiplier(gId)
    if (multiplier >= 1.3) return '🔥 Trendde'
    if (multiplier <= 0.7) return '↓ Düşüş'
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md"
      >
        <h2 className="text-white text-xl font-bold mb-4">Yeni Proje</h2>

        <label className="block mb-3">
          <span className="text-gray-400 text-sm">Oyun Adı</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Oyunun adı..."
            required
          />
        </label>

        {/* Tür seçimi — trend etiketleriyle */}
        <label className="block mb-3">
          <span className="text-gray-400 text-sm">Tür</span>
          <select
            value={genreId}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
          >
            {Object.values(GENRES).map((genre) => {
              const label = getTrendLabel(genre.id)
              return (
                <option key={genre.id} value={genre.id}>
                  {genre.name}{label ? ` ${label}` : ''}
                </option>
              )
            })}
          </select>
        </label>

        {/* Konu ve Platform — generic map */}
        {(
          [
            ['Konu',     Object.values(TOPICS),    topicId,    setTopic    ],
            ['Platform', Object.values(PLATFORMS), platformId, setPlatform ],
          ] as [string, { id: string; name: string }[], string, (v: string) => void][]
        ).map(([label, items, value, setter]) => (
          <label key={label} className="block mb-3">
            <span className="text-gray-400 text-sm">{label}</span>
            <select
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        ))}

        <label className="block mb-4">
          <span className="text-gray-400 text-sm">Ölçek</span>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {(Object.entries(SCOPE_CONFIG) as [ProjectScope, typeof cfg][]).map(([key, c]) => (
              <button
                type="button"
                key={key}
                onClick={() => setScope(key)}
                className={`py-2 rounded text-sm font-medium transition-colors ${
                  scope === key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-1">{cfg.weeks} hafta geliştirme süresi</p>
        </label>

        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium">
            Projeyi Başlat
          </button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2">
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
