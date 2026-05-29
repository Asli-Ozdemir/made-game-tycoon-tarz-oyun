import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'

interface Props {
  projectId: string
  onContinue: () => void
}

export default function PublishResult({ projectId, onContinue }: Props) {
  const project   = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const totalPub  = useGameStore((s) => s.totalPublished)

  if (!project?.publishResult) return null
  const { score, sales, revenue } = project.publishResult

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-sm w-full text-center">
        <div className={`text-6xl font-black mb-2 ${
          score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {score}
        </div>
        <p className="text-gray-400 mb-1">Eleştirmen Puanı / 100</p>
        <h2 className="text-white text-xl font-bold mt-4 mb-2">{project.name}</h2>
        <div className="text-gray-300 space-y-1 text-sm mb-6">
          <p>{sales.toLocaleString()} kopya satıldı</p>
          <p className="text-green-400 text-lg font-semibold">${revenue.toLocaleString()}</p>
          <p className="text-gray-500 mt-2">Toplam yayın: {totalPub}</p>
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
        >
          Devam Et
        </button>
      </div>
    </div>
  )
}
