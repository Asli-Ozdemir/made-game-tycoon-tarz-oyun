import { useState } from 'react'
import { useCampaignStore } from '@/store/campaignStore'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useGameStore } from '@/store/gameStore'
import { CAMPAIGN_CONFIGS } from '@/engine/campaignEngine'
import type { CampaignType } from '@/engine/campaignEngine'

type TabType = 'active' | 'actions' | 'history'

const TAB_LABELS: Record<TabType, string> = {
  active:  'Aktif Kampanyalar',
  actions: 'Aksiyonlar',
  history: 'Geçmiş',
}

const CAMPAIGN_TYPE_NAMES: Record<CampaignType, string> = {
  sosyal:     'Sosyal Medya',
  influencer: 'Influencer',
  billboard:  'Billboard',
}

interface Props {
  onClose: () => void
}

function CampaignPanelContent({ onClose }: Props) {
  const [tab, setTab] = useState<TabType>('active')

  const campaigns       = useCampaignStore((s) => s.campaigns)
  const actionCooldowns = useCampaignStore((s) => s.actionCooldowns)
  const stopCampaign    = useCampaignStore((s) => s.stopCampaign)
  const triggerDevDiary   = useCampaignStore((s) => s.triggerDevDiary)
  const triggerCommunity  = useCampaignStore((s) => s.triggerCommunity)

  const projects   = useProjectStore((s) => s.projects)
  const tickCount  = useTimeStore((s) => s.tickCount)
  const money      = useGameStore((s) => s.money)

  const activeCampaigns    = campaigns.filter(c => c.isActive)
  const completedCampaigns = campaigns.filter(c => !c.isActive)
  const publishedProjects  = projects.filter(p => p.status === 'yayinlandi')

  const tabs: TabType[] = ['active', 'actions', 'history']

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">Pazarlama</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'active' && activeCampaigns.length > 0 && (
              <span className="ml-1 bg-yellow-600 text-white text-xs px-1.5 rounded-full">
                {activeCampaigns.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 min-h-[200px] max-h-[400px] overflow-y-auto">

        {tab === 'active' && (
          <div className="space-y-3">
            {activeCampaigns.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">Aktif kampanya yok.</p>
            ) : activeCampaigns.map(c => {
              const project = projects.find(p => p.id === c.projectId)
              const weeksLeft = Math.max(0, c.endTick - tickCount)
              const config = CAMPAIGN_CONFIGS[c.type]
              return (
                <div key={c.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {project?.name ?? c.projectId}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {CAMPAIGN_TYPE_NAMES[c.type]} · {weeksLeft} hafta kaldı
                      {c.isPreLaunch && <span className="ml-1 text-blue-400">(yayın öncesi)</span>}
                    </p>
                    <p className="text-gray-500 text-xs">${config.weeklyBudget.toLocaleString()}/hafta</p>
                  </div>
                  <button
                    onClick={() => stopCampaign(c.id)}
                    className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                  >
                    Durdur
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'actions' && (
          <div className="space-y-4">
            {publishedProjects.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">Yayında proje yok.</p>
            ) : publishedProjects.map(project => {
              const cooldown = actionCooldowns[project.id] ?? 0
              const onCooldown = cooldown > tickCount
              const cooldownWeeks = onCooldown ? cooldown - tickCount : 0
              return (
                <div key={project.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-white text-sm font-semibold mb-2">{project.name}</p>
                  <div className="flex gap-2">
                    <button
                      disabled={onCooldown || money < 2000}
                      onClick={() => triggerDevDiary(project.id)}
                      className="flex-1 text-xs bg-blue-800 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded"
                    >
                      📝 Dev Günlüğü
                      <br />
                      <span className="text-blue-300">2.000$</span>
                      {onCooldown && <span className="text-gray-400 ml-1">({cooldownWeeks}h)</span>}
                    </button>
                    <button
                      disabled={onCooldown || money < 5000}
                      onClick={() => triggerCommunity(project.id)}
                      className="flex-1 text-xs bg-yellow-800 hover:bg-yellow-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded"
                    >
                      🎉 Topluluk Etkinliği
                      <br />
                      <span className="text-yellow-300">5.000$</span>
                      {onCooldown && <span className="text-gray-400 ml-1">({cooldownWeeks}h)</span>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {completedCampaigns.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">Tamamlanmış kampanya yok.</p>
            ) : completedCampaigns.map(c => {
              const project = projects.find(p => p.id === c.projectId)
              const config = CAMPAIGN_CONFIGS[c.type]
              const duration = c.endTick - c.startTick
              const totalSpent = config.openingCost + config.weeklyBudget * duration
              return (
                <div key={c.id} className="bg-gray-800/50 rounded-lg p-2 text-xs text-gray-400 flex justify-between">
                  <span>
                    {project?.name ?? c.projectId} · {CAMPAIGN_TYPE_NAMES[c.type]}
                  </span>
                  <span className="text-red-400">-${totalSpent.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CampaignPanel() {
  const showCampaignPanel  = useCampaignStore((s) => s.showCampaignPanel)
  const closeCampaignPanel = useCampaignStore((s) => s.closeCampaignPanel)

  if (!showCampaignPanel) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <CampaignPanelContent onClose={closeCampaignPanel} />
    </div>
  )
}
