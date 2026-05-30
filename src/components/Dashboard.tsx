import { useState, useEffect } from 'react'
import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'
import EmployeePanel from './EmployeePanel'
import NewsFeed from './NewsFeed'
import RivalsPanel from './RivalsPanel'
import MarketPanel from './MarketPanel'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { useTimeStore } from '@/store/timeStore'
import { useCharacterStore } from '@/store/characterStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useRivalStore } from '@/store/rivalStore'
import { useNewsStore } from '@/store/newsStore'
import { useAwardsStore } from '@/store/awardsStore'
import { useTrendStore } from '@/store/trendStore'
import { BACKGROUNDS } from '@/data/backgrounds'
import { useEventStore } from '@/store/eventStore'
import type { GameProject, PublishResult, SequelProject } from '@/types'

interface Props {
  onPublishResult: (projectId: string) => void
}

type Tab = 'studyo' | 'calisanlar' | 'rakipler' | 'piyasa'

export default function Dashboard({ onPublishResult }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('studyo')

  const projects            = useProjectStore((s) => s.projects)
  const publishProject      = useProjectStore((s) => s.publishProject)
  const addMoney            = useGameStore((s) => s.addMoney)
  const gainReputation      = useGameStore((s) => s.gainReputation)
  const incrementPub        = useGameStore((s) => s.incrementPublished)
  const reputation          = useGameStore((s) => s.reputation)
  const date                = useTimeStore((s) => s.date)
  const unassignFromProject = useEmployeeStore((s) => s.unassignFromProject)

  const year = useTimeStore((s) => s.date.year)
  useEffect(() => {
    // year 2000 (başlangıç) ise awards ve trend'i tetikleme
    if (year <= 2000) {
      useRivalStore.getState().simulateYear(year)
      return
    }
    // Yıl geçişi: rakipleri ve trendleri simüle et
    useRivalStore.getState().simulateYear(year)

    // Rakiplerin bu yılki oyunlarını topla (tür doygunluğu için)
    const allRivalGames = useRivalStore.getState().rivals.flatMap(r => r.games)
    const thisYearGames = allRivalGames.filter(g => g.releasedYear === year)
    useTrendStore.getState().simulateYear(year, thisYearGames)

    // Önceki yılın en iyi oyuncusu
    const prevYear = year - 1
    const publishedProjects = useProjectStore.getState().projects.filter(
      p => p.status === 'yayinlandi' && p.publishResult?.publishDate.year === prevYear
    )
    const playerBestGame = publishedProjects.length > 0
      ? publishedProjects.reduce((best, p) =>
          (p.publishResult!.score > (best.publishResult?.score ?? 0)) ? p : best
        )
      : null

    useAwardsStore.getState().checkAwards(
      prevYear,
      playerBestGame
        ? { name: playerBestGame.name, score: playerBestGame.publishResult!.score }
        : null
    )
    useEventStore.getState().tryAnnualEvent(year)
    useEventStore.getState().checkMilestones(year)
  }, [year])

  const week = useTimeStore((s) => s.date.week)
  useEffect(() => {
    if (year <= 2000) return
    useEventStore.getState().tryWeeklyEvent(year)
  }, [week])

  function handlePublish(projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const playerSkillBonus = useCharacterStore.getState().getPlayerSkillBonus()
    const parentProject = project.contentType === 'sequel'
      ? useProjectStore.getState().projects.find(
          (p): p is GameProject & { publishResult: PublishResult } =>
            p.id === (project as SequelProject).parentProjectId && p.publishResult !== undefined
        )
      : undefined
    const result = calculatePublishResult(project, { reputation, publishDate: date }, playerSkillBonus, parentProject)

    publishProject(projectId, result)

    // Trend çarpanı yalnızca gelire uygulanır (skor değişmez)
    const trendMultiplier = useTrendStore.getState().getMultiplier(project.genreId)
    const adjustedRevenue = Math.round(result.revenue * trendMultiplier)
    addMoney(adjustedRevenue)

    gainReputation(Math.round(result.score / 20))

    // CEO özel: başarısız projede 2× itibar kaybı
    if (result.score < 50) {
      const bgId = useCharacterStore.getState().background
      const bg   = BACKGROUNDS.find((b) => b.id === bgId)
      const multiplier = bg?.special?.type === 'rep_loss_multiplier' ? bg.special.multiplier : 1
      gainReputation(-10 * multiplier)
    }

    incrementPub()
    if (useGameStore.getState().totalPublished === 1) {
      useCutsceneStore.getState().startCutscene('ilk_yayin')
    }
    unassignFromProject(projectId)
    useRivalStore.getState().noticeCheck(useGameStore.getState().reputation)
    onPublishResult(projectId)
  }

  function handleNewGame() {
    if (!window.confirm('Mevcut oyun silinecek. Devam etmek istiyor musun?')) return
    useCharacterStore.getState().reset()
    useGameStore.getState().reset()
    useProjectStore.getState().reset()
    useEmployeeStore.getState().reset()
    useTimeStore.getState().reset()
    useDayTimeStore.getState().reset()
    useCutsceneStore.getState().reset()
    useRivalStore.getState().reset()
    useNewsStore.getState().reset()
    useAwardsStore.getState().reset()
    useTrendStore.getState().reset()
    useEventStore.getState().reset()
  }

  const active    = projects.filter((p) => p.status === 'gelistirme')
  const published = projects.filter((p) => p.status === 'yayinlandi')

  const TAB_LABELS: Record<Tab, string> = {
    studyo: 'Stüdyo',
    calisanlar: 'Çalışanlar',
    rakipler: 'Rakipler',
    piyasa: 'Piyasa',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 px-6 pt-4">
        {(['studyo', 'calisanlar', 'rakipler', 'piyasa'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
        <button
          onClick={handleNewGame}
          className="ml-auto text-xs text-gray-500 hover:text-gray-300 px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors self-center"
        >
          Yeni Oyun
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab === 'studyo' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-white text-2xl font-bold">Stüdyo</h1>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  + Yeni Proje
                </button>
              </div>

              {active.length === 0 && published.length === 0 && (
                <p className="text-gray-500 text-center mt-20">
                  Henüz proje yok. İlk oyununu başlat!
                </p>
              )}

              {active.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-gray-400 text-sm uppercase mb-3">Geliştirme Aşamasında</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {active.map((p) => (
                      <ProjectCard key={p.id} project={p} onPublish={handlePublish} />
                    ))}
                  </div>
                </section>
              )}

              {published.length > 0 && (
                <section>
                  <h2 className="text-gray-400 text-sm uppercase mb-3">Yayınlananlar</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {published.map((p) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                </section>
              )}

              {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
            </div>
          )}
          {activeTab === 'calisanlar' && <EmployeePanel />}
          {activeTab === 'rakipler' && <RivalsPanel />}
          {activeTab === 'piyasa' && <MarketPanel />}
        </div>
        <div className="p-4 border-l border-gray-800">
          <NewsFeed />
        </div>
      </div>
    </div>
  )
}
