import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import { useProjectStore } from '@/store/projectStore'
import type { GameProject, SequelProject, DlcProject, UpdateProject } from '@/types'

function hasParent(p: GameProject): p is SequelProject | DlcProject | UpdateProject {
  return p.contentType !== 'standalone'
}

interface Props {
  project: GameProject
  onPublish?: (id: string) => void
}

export default function ProjectCard({ project, onPublish }: Props) {
  const allProjects = useProjectStore((s) => s.projects)

  const progress   = Math.min(100, Math.round((project.weeksElapsed / project.totalWeeks) * 100))
  const isComplete = project.weeksElapsed >= project.totalWeeks && project.status === 'gelistirme'
  const isPublished = project.status === 'yayinlandi'

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

      {isComplete && onPublish && (
        <button
          onClick={() => onPublish(project.id)}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white rounded py-1.5 text-sm font-medium"
        >
          Yayınla!
        </button>
      )}
    </div>
  )
}
