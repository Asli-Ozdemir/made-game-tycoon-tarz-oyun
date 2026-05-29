import { useRivalStore } from '@/store/rivalStore'
import type { RelationshipStatus } from '@/types/rival'

const RELATIONSHIP_LABELS: Record<RelationshipStatus, string> = {
  unknown:   'Bilinmiyor',
  noticed:   'Fark Etti',
  rival:     'Rakip',
  nemesis:   'Düşman',
  ally:      'Müttefik',
  merged:    'Birleşildi',
  destroyed: 'Yok Edildi',
}

const RELATIONSHIP_COLORS: Record<RelationshipStatus, string> = {
  unknown:   'text-gray-500',
  noticed:   'text-yellow-400',
  rival:     'text-orange-400',
  nemesis:   'text-red-500',
  ally:      'text-green-400',
  merged:    'text-gray-500 italic',
  destroyed: 'text-gray-500 italic',
}

const TIER_STARS: Record<string, string> = {
  indie: '★',
  mid:   '★★',
  major: '★★★',
}

export default function RivalsPanel() {
  const rivals = useRivalStore((s) => s.rivals)

  return (
    <div className="p-6">
      <h2 className="text-white text-xl font-bold mb-4">Rakip Şirketler</h2>

      {rivals.length === 0 && (
        <p className="text-gray-500 text-center mt-20">
          Henüz rakip yok.
        </p>
      )}

      {rivals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                <th className="text-left pb-2 pr-4">Şirket</th>
                <th className="text-left pb-2 pr-4">Tier</th>
                <th className="text-right pb-2 pr-4">Şöhret</th>
                <th className="text-left pb-2 pr-4">İlişki</th>
                <th className="text-left pb-2">Hamle</th>
              </tr>
            </thead>
            <tbody>
              {rivals.map(rival => {
                const canHamle =
                  rival.tier === 'indie' &&
                  rival.relationship !== 'merged' &&
                  rival.relationship !== 'destroyed'

                return (
                  <tr key={rival.id} className="border-b border-gray-800">
                    <td className="py-2 pr-4 text-white font-medium">{rival.name}</td>
                    <td className="py-2 pr-4 text-yellow-500 tracking-tight">{TIER_STARS[rival.tier]}</td>
                    <td className="py-2 pr-4 text-gray-300 text-right font-mono text-xs">
                      {rival.fame.toLocaleString()}
                    </td>
                    <td className={`py-2 pr-4 text-xs ${RELATIONSHIP_COLORS[rival.relationship]}`}>
                      {RELATIONSHIP_LABELS[rival.relationship]}
                    </td>
                    <td className="py-2">
                      {canHamle ? (
                        <button
                          className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2 py-0.5 rounded transition-colors"
                          title="Hamle Yap"
                        >
                          Hamle
                        </button>
                      ) : rival.tier !== 'indie' ? (
                        <span className="text-xs text-gray-700" title="Henüz zamanı değil">—</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
