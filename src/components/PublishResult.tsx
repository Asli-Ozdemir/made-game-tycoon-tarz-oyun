import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { sfx } from '@/audio/soundService'

interface Props {
  projectId: string
  onContinue: () => void
}

function scoreColor(s: number) {
  return s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'
}
function outletColor(s: number) {
  return s >= 8 ? 'text-green-400' : s >= 5 ? 'text-yellow-400' : 'text-red-400'
}

export default function PublishResult({ projectId, onContinue }: Props) {
  const project  = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const totalPub = useGameStore((s) => s.totalPublished)
  const [showReviews, setShowReviews] = useState(true)

  useEffect(() => {
    sfx('publish')
  }, [])

  if (!project?.publishResult) return null
  const { score, sales, revenue, media } = project.publishResult

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        {/* Üst: skor + verdict + özet */}
        <div className="flex items-center gap-4 border-b border-gray-700 pb-4 mb-4">
          <div className={`text-5xl font-black ${scoreColor(score)}`}>{score}</div>
          <div className="flex-1">
            <p className="text-xs tracking-widest text-gray-500">METASKOR</p>
            <p className={`text-lg font-bold ${scoreColor(score)}`}>{media?.verdict ?? 'Eleştirmen Puanı'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>
          </div>
          <div className="text-right text-sm text-gray-300">
            <p>💰 ${revenue.toLocaleString()}</p>
            <p>📦 {sales.toLocaleString()}</p>
          </div>
        </div>

        {media && (
          <>
            {/* Basın incelemeleri (A+B) */}
            <button onClick={() => setShowReviews((v) => !v)} className="text-xs tracking-widest text-gray-500 mb-2">
              BASIN İNCELEMELERİ {showReviews ? '▾' : '▸'}
            </button>
            {showReviews && (
              <div className="space-y-1.5 mb-4 text-sm">
                {media.reviews.map((r) => (
                  <div key={r.outlet} className="flex gap-2">
                    <b className={`w-9 ${outletColor(r.score)}`}>{r.score}/10</b>
                    <b className="w-24 shrink-0">{r.outlet}</b>
                    <span className="text-gray-400">{r.quote}</span>
                  </div>
                ))}
              </div>
            )}

            {/* YouTuber (C) */}
            <p className="text-xs tracking-widest text-gray-500 mb-2">YOUTUBER TEPKİLERİ</p>
            <div className="flex gap-2 mb-4">
              {media.youtubers.map((y) => (
                <div key={y.channel} className="flex-1 bg-white/5 rounded-lg p-2 text-xs">
                  <div className="text-base mb-1">▶️</div>
                  <b>{y.channel}</b> <span className="text-gray-500">· {y.viewsLabel}</span>
                  <p className="text-gray-400 mt-0.5">{y.quote}</p>
                </div>
              ))}
            </div>

            {/* Sosyal (D, hafif) */}
            <p className="text-xs tracking-widest text-gray-500 mb-1">SOSYAL MEDYA</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {media.social.map((s, i) => <span key={i}>💬 {s}{i < media.social.length - 1 ? '  ·  ' : ''}</span>)}
            </p>
          </>
        )}

        <p className="text-gray-500 text-xs mb-4">Toplam yayın: {totalPub}</p>
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
