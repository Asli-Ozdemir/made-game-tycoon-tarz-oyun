import { useState } from 'react'
import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { calculatePublishResult } from '@/engine/scoreEngine'
import { useTimeStore } from '@/store/timeStore'

interface Props {
  onPublishResult: (projectId: string) => void
}

export default function Dashboard({ onPublishResult }: Props) {
  const [showModal, setShowModal] = useState(false)

  const projects       = useProjectStore((s) => s.projects)
  const publishProject = useProjectStore((s) => s.publishProject)
  const addMoney       = useGameStore((s) => s.addMoney)
  const gainReputation = useGameStore((s) => s.gainReputation)
  const incrementPub   = useGameStore((s) => s.incrementPublished)
  const reputation     = useGameStore((s) => s.reputation)
  const date           = useTimeStore((s) => s.date)

  function handlePublish(projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const result = calculatePublishResult(project, { reputation, publishDate: date })
    publishProject(projectId, result)
    addMoney(result.revenue)
    gainReputation(Math.round(result.score / 20))
    incrementPub()
    onPublishResult(projectId)
  }

  const active    = projects.filter((p) => p.status === 'gelistirme')
  const published = projects.filter((p) => p.status === 'yayinlandi')

  return (
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
  )
}
