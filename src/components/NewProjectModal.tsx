import { useState } from 'react'
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS, SCOPE_CONFIG } from '@/data/topics'
import { createProject } from '@/engine/projectEngine'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useTrendStore } from '@/store/trendStore'
import { useObjectiveStore } from '@/store/objectiveStore'
import { useGameStore } from '@/store/gameStore'
import { DEMO_MODE, DEMO_LOCKED_SCOPES } from '@/config'
import { sfx } from '@/audio/soundService'
import type { ProjectScope } from '@/types'

interface Props { onClose: () => void }

type ContentType = 'standalone' | 'sequel' | 'dlc' | 'guncelleme'

const ALLOWED_SCOPES: Record<ContentType, ProjectScope[]> = {
  standalone: ['kucuk', 'orta', 'buyuk', 'iddiali'],
  sequel:     ['kucuk', 'orta', 'buyuk', 'iddiali'],
  dlc:        ['kucuk', 'orta', 'buyuk'],
  guncelleme: ['kucuk', 'orta'],
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  standalone: 'Bağımsız Oyun',
  sequel:     'Sequel',
  dlc:        'DLC',
  guncelleme: 'Ücretsiz Güncelleme',
}

export default function NewProjectModal({ onClose }: Props) {
  const [name, setName]                     = useState('')
  const [genreId, setGenre]                 = useState('aksiyon')
  const [topicId, setTopic]                 = useState('uzay')
  const [platformId, setPlatform]           = useState('pc')
  const [scope, setScope]                   = useState<ProjectScope>(DEMO_MODE ? 'kucuk' : 'orta')
  const [parentProjectId, setParentId]      = useState<string | null>(null)
  const [contentType, setContentType]       = useState<ContentType>('standalone')
  const [dlcPrice, setDlcPrice]             = useState(10)
  const [selectedPrice, setSelectedPrice]   = useState<number | null>(null)

  const date            = useTimeStore((s) => s.date)
  const addProject      = useProjectStore((s) => s.addProject)
  const allProjects     = useProjectStore((s) => s.projects)
  const totalPublished  = useGameStore((s) => s.totalPublished)

  const publishedProjects = allProjects.filter(p => p.status === 'yayinlandi')
  const parentProject     = publishedProjects.find(p => p.id === parentProjectId) ?? null

  const allowedScopes = ALLOWED_SCOPES[contentType]
  const isScopeLocked = (s: ProjectScope) => DEMO_MODE && DEMO_LOCKED_SCOPES.has(s)
  const selectableScopes = allowedScopes.filter((s) => !isScopeLocked(s))
  const effectiveScope =
    allowedScopes.includes(scope) && !isScopeLocked(scope)
      ? scope
      : (selectableScopes[0] ?? allowedScopes[0])

  // DLC fiyat limiti
  const maxDlcPrice = parentProject?.publishResult && parentProject.publishResult.sales > 0
    ? Math.floor(parentProject.publishResult.revenue / parentProject.publishResult.sales)
    : 999999

  // Sequel: fan kitlesi çarpanı önizleme
  const fanBaseMultiplier = parentProject?.publishResult
    ? Math.min(2.0, 1.0 + (parentProject.publishResult.sales / 50000) * 0.5)
    : 1.0

  function handleClose() {
    setSelectedPrice(null)
    onClose()
  }

  function handleParentChange(id: string) {
    setParentId(id || null)
    if (!id) setContentType('standalone')
  }

  function handleContentTypeChange(ct: ContentType) {
    setContentType(ct)
    // Kapsam kısıtına takılıyorsa en yüksek izinli kapsama sıfırla
    if (!ALLOWED_SCOPES[ct].includes(effectiveScope)) {
      const allowed = ALLOWED_SCOPES[ct]
      setScope(allowed[allowed.length - 1])
    }
    // DLC fiyat default'u
    if (ct === 'dlc' && parentProject?.publishResult && parentProject.publishResult.sales > 0) {
      const max = Math.floor(parentProject.publishResult.revenue / parentProject.publishResult.sales)
      setDlcPrice(Math.max(1, Math.floor(max / 2)))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const params = { name: name.trim(), genreId, topicId, platformId, scope: effectiveScope, startDate: date }
    if (contentType === 'sequel' && parentProjectId) {
      addProject({ ...createProject({ ...params, contentType: 'sequel', parentProjectId, fanBaseMultiplier }), price: selectedPrice! })
    } else if (contentType === 'dlc' && parentProjectId) {
      addProject({ ...createProject({ ...params, contentType: 'dlc', parentProjectId, priceOverride: dlcPrice }), price: dlcPrice })
    } else if (contentType === 'guncelleme' && parentProjectId) {
      addProject({ ...createProject({ ...params, contentType: 'guncelleme', parentProjectId }), price: 0 })
    } else {
      addProject({ ...createProject({ ...params }), price: selectedPrice! })
    }
    sfx('project_start')
    useObjectiveStore.getState().advanceToGameDev()
    handleClose()
  }

  function getTrendLabel(gId: string): string | null {
    const multiplier = useTrendStore.getState().getMultiplier(gId)
    if (multiplier >= 1.3) return '🔥 Trendde'
    if (multiplier <= 0.7) return '↓ Düşüş'
    return null
  }

  const cfg = SCOPE_CONFIG[effectiveScope]

  if (DEMO_MODE && totalPublished >= 1) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full text-center">
          <p className="text-3xl mb-3">🌅</p>
          <p className="text-gray-100 font-semibold mb-2">Demo burada bitiyor</p>
          <p className="text-gray-400 text-sm mb-5">
            İkinci projen tam sürümde seni bekliyor. Macenta Koyu'nu keşfetmeye devam edebilirsin.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
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

        {/* Kaynak Oyun (opsiyonel) */}
        {!DEMO_MODE && publishedProjects.length > 0 && (
          <label className="block mb-3">
            <span className="text-gray-400 text-sm">Kaynak Oyun (opsiyonel)</span>
            <select
              value={parentProjectId ?? ''}
              onChange={(e) => handleParentChange(e.target.value)}
              className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
            >
              <option value="">— Seçme (bağımsız oyun) —</option>
              {publishedProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.publishResult?.score}/100)</option>
              ))}
            </select>
          </label>
        )}

        {/* İçerik Tipi (kaynak seçilince görünür) */}
        {!DEMO_MODE && parentProjectId && (
          <label className="block mb-3">
            <span className="text-gray-400 text-sm">İçerik Tipi</span>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['sequel', 'dlc', 'guncelleme'] as ContentType[]).map((ct) => (
                <button
                  type="button"
                  key={ct}
                  onClick={() => handleContentTypeChange(ct)}
                  className={`py-2 rounded text-xs font-medium transition-colors ${
                    contentType === ct ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {CONTENT_TYPE_LABELS[ct]}
                </button>
              ))}
            </div>
            {contentType === 'sequel' && (
              <p className="text-blue-400 text-xs mt-1">Fan kitlesi çarpanı: ×{fanBaseMultiplier.toFixed(2)}</p>
            )}
            {contentType === 'guncelleme' && (
              <p className="text-gray-500 text-xs mt-1">Gelir yok — ana oyunun itibarını artırır</p>
            )}
          </label>
        )}

        {/* DLC Fiyat Input */}
        {!DEMO_MODE && contentType === 'dlc' && parentProjectId && (
          <label className="block mb-3">
            <span className="text-gray-400 text-sm">DLC Fiyatı ($) — max ${maxDlcPrice}</span>
            <input
              type="number"
              min={1}
              max={maxDlcPrice}
              value={dlcPrice}
              onChange={(e) => setDlcPrice(Math.min(maxDlcPrice, Math.max(1, Number(e.target.value))))}
              className="w-full mt-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </label>
        )}

        {/* Tür seçimi */}
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

        {/* Konu ve Platform */}
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

        {/* Ölçek — içerik tipine göre filtrelenmiş */}
        <label className="block mb-4">
          <span className="text-gray-400 text-sm">Ölçek</span>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {(Object.entries(SCOPE_CONFIG) as [ProjectScope, typeof cfg][])
              .filter(([key]) => allowedScopes.includes(key))
              .map(([key, c]) => {
                const locked = isScopeLocked(key)
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => { if (!locked) setScope(key) }}
                    disabled={locked}
                    title={locked ? 'Tam sürümde açılır' : undefined}
                    className={`py-2 rounded text-sm font-medium transition-colors ${
                      locked
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : effectiveScope === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {locked ? `🔒 ${c.label}` : c.label}
                  </button>
                )
              })}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {cfg.weeks} hafta geliştirme süresi
            {DEMO_MODE && selectableScopes.length < allowedScopes.length && (
              <span className="text-gray-600"> · 🔒 büyük ölçekler tam sürümde</span>
            )}
          </p>
        </label>

        {(contentType === 'standalone' || contentType === 'sequel') && (
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Birim Fiyat</label>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 30, 40, 60].map((p) => {
                const suggested = PLATFORMS[platformId]?.suggestedPrice ?? 20
                const isSelected = selectedPrice === p
                const isSuggested = p === suggested
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPrice(p)}
                    className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    ${p}{isSuggested ? ' ★' : ''}
                  </button>
                )
              })}
            </div>
            {selectedPrice === null && (
              <p className="text-xs text-red-400 mt-1">Fiyat seçilmeden başlatılamaz</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={(contentType === 'standalone' || contentType === 'sequel') && selectedPrice === null}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Projeyi Başlat
          </button>
          <button type="button" onClick={handleClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded py-2">
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
