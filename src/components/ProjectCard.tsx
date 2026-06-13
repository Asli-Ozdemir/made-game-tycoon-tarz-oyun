import { useState } from 'react'
import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import { useProjectStore } from '@/store/projectStore'
import { useHevesStore } from '@/store/hevesStore'
import type { GameProject, SequelProject, DlcProject, UpdateProject } from '@/types'
import { useCampaignStore } from '@/store/campaignStore'
import { useTimeStore } from '@/store/timeStore'
import { CAMPAIGN_CONFIGS } from '@/engine/campaignEngine'
import type { CampaignType } from '@/engine/campaignEngine'

function hasParent(p: GameProject): p is SequelProject | DlcProject | UpdateProject {
  return p.contentType !== 'standalone'
}

function PriceDropButton({ projectId, currentPrice }: { projectId: string; currentPrice: number }) {
  const [open, setOpen] = useState(false)
  const updateProjectPrice = useProjectStore((s) => s.updateProjectPrice)
  const PRICE_POINTS = [5, 10, 20, 30, 40, 60]
  const lower = PRICE_POINTS.filter(p => p < currentPrice)

  if (lower.length === 0) return null  // already at minimum price

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-gray-500 hover:text-gray-300 underline mt-1"
      >
        Fiyatı Düşür
      </button>
      {open && (
        <div className="absolute top-5 left-0 bg-gray-800 border border-gray-600 rounded p-2 flex gap-1 z-10">
          {lower.map(p => (
            <button
              key={p}
              onClick={() => { updateProjectPrice(projectId, p); setOpen(false) }}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              ${p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  project: GameProject
  onPublish?: (id: string) => void
}

export default function ProjectCard({ project, onPublish }: Props) {
  const allProjects    = useProjectStore((s) => s.projects)
  const workOnProject  = useProjectStore((s) => s.workOnProject)

  const heves    = useHevesStore((s) => s.heves)
  const maxHeves = useHevesStore((s) => s.maxHeves)
  const spend    = useHevesStore((s) => s.spend)

  const campaigns          = useCampaignStore((s) => s.campaigns)
  const startCampaign      = useCampaignStore((s) => s.startCampaign)
  const stopCampaignAction = useCampaignStore((s) => s.stopCampaign)
  const tickCount          = useTimeStore((s) => s.tickCount)

  const activeCampaignsForProject = campaigns.filter(
    c => c.projectId === project.id && c.isActive
  )
  const canStartCampaign = project.status === 'gelistirme' || project.status === 'yayinlandi'

  const progress   = Math.min(100, Math.round((project.weeksElapsed / project.totalWeeks) * 100))
  const isComplete = project.weeksElapsed >= project.totalWeeks && project.status === 'gelistirme'
  const isPublished = project.status === 'yayinlandi'

  function handleWork() {
    if (!spend(1)) return
    workOnProject(project.id)
  }

  // Child projeler (bu projeyi kaynak olarak kullananlar)
  const childProjects = isPublished
    ? allProjects.filter(hasParent).filter(p => p.parentProjectId === project.id)
    : []
  const dlcCount    = childProjects.filter(p => p.contentType === 'dlc').length
  const sequelCount = childProjects.filter(p => p.contentType === 'sequel').length
  const updateCount = childProjects.filter(p => p.contentType === 'guncelleme').length

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border ${
      isComplete ? 'border-green-500' : isPublished ? 'border-gray-600' : 'border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-white font-semibold">{project.name}</h3>
          <p className="text-gray-400 text-sm">
            {GENRES[project.genreId]?.name} · {TOPICS[project.topicId]?.name} · {PLATFORMS[project.platformId]?.name}
          </p>
          {project.contentType !== 'standalone' && (
            <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
              {project.contentType === 'sequel' ? 'Sequel' : project.contentType === 'dlc' ? 'DLC' : 'Güncelleme'}
            </span>
          )}
        </div>
        {isPublished && project.publishResult && (
          <span className={`text-sm font-bold px-2 py-1 rounded ${
            project.publishResult.score >= 75 ? 'bg-green-800 text-green-300' :
            project.publishResult.score >= 50 ? 'bg-yellow-800 text-yellow-300' :
            'bg-red-800 text-red-300'
          }`}>
            {project.publishResult.score}/100
          </span>
        )}
      </div>

      {!isPublished && (
        <>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
            <div
              className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{project.weeksElapsed}/{project.totalWeeks} hafta</span>
            <span>{progress}%</span>
          </div>
        </>
      )}

      {isPublished && project.publishResult && (
        <>
          <p className="text-gray-400 text-sm mt-1">
            {project.publishResult.sales.toLocaleString()} satış ·{' '}
            <span className="text-green-400">${project.publishResult.revenue.toLocaleString()}</span>
          </p>
          {project.status === 'yayinlandi' && (
            <div className="text-xs text-gray-400 mt-1">
              {project.isOnSale && project.discountPct !== null ? (
                <span>
                  <span className="line-through text-gray-600">${project.price}</span>
                  {' '}
                  <span className="text-green-400">${Math.round(project.price * (1 - project.discountPct))} 🏷️</span>
                </span>
              ) : (
                <span>${project.price}</span>
              )}
            </div>
          )}
          {project.status === 'yayinlandi' && !project.isOnSale && (
            <PriceDropButton projectId={project.id} currentPrice={project.price} />
          )}
          {/* Child proje rozeti */}
          {(dlcCount > 0 || sequelCount > 0 || updateCount > 0) && (
            <div className="flex gap-2 mt-2 text-xs text-gray-500">
              {dlcCount    > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded">DLC: {dlcCount}</span>}
              {sequelCount > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded">Sequel: {sequelCount}</span>}
              {updateCount > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded">Güncelleme: {updateCount}</span>}
            </div>
          )}
        </>
      )}

      {!isComplete && !isPublished && (
        <div className="mt-3">
          {heves > 0 ? (
            <button
              onClick={handleWork}
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white rounded py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>🔥 Çalış</span>
              <span className="text-indigo-300 text-xs">({heves}/{maxHeves} heves)</span>
            </button>
          ) : (
            <div className="w-full text-center text-xs text-gray-500 py-2 border border-gray-700 rounded">
              Heves bitti — git doldur 😴
            </div>
          )}
        </div>
      )}

      {isComplete && onPublish && (
        <button
          onClick={() => onPublish(project.id)}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white rounded py-1.5 text-sm font-medium"
        >
          Yayınla!
        </button>
      )}

      {/* Kampanya bölümü */}
      {canStartCampaign && (
        <div className="mt-3 border-t border-gray-700 pt-3">
          {activeCampaignsForProject.length > 0 ? (
            <div className="space-y-1">
              {activeCampaignsForProject.map(c => {
                const weeksLeft = Math.max(0, c.endTick - tickCount)
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-yellow-400">
                      📣 {CAMPAIGN_CONFIGS[c.type].name} — {weeksLeft} hafta kaldı
                    </span>
                    <button
                      onClick={() => stopCampaignAction(c.id)}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Durdur
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {(['sosyal', 'influencer', 'billboard'] as CampaignType[]).map(type => {
                const config = CAMPAIGN_CONFIGS[type]
                return (
                  <button
                    key={type}
                    onClick={() => startCampaign(project.id, type)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded"
                  >
                    📣 {config.name} {(config.openingCost / 1000).toFixed(0)}K$
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
