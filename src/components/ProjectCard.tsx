import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import type { GameProject } from '@/types'

interface Props {
  project: GameProject
  onPublish?: (id: string) => void
}

export default function ProjectCard({ project, onPublish }: Props) {
  const progress   = Math.min(100, Math.round((project.weeksElapsed / project.totalWeeks) * 100))
  const isComplete = project.weeksElapsed >= project.totalWeeks && project.status === 'gelistirme'
  const isPublished = project.status === 'yayinlandi'

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
        <p className="text-gray-400 text-sm mt-1">
          {project.publishResult.sales.toLocaleString()} satış ·{' '}
          <span className="text-green-400">${project.publishResult.revenue.toLocaleString()}</span>
        </p>
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
