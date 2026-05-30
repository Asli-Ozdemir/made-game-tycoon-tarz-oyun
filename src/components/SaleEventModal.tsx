import { useState } from 'react'
import { useEconomyStore } from '@/store/economyStore'
import { useProjectStore } from '@/store/projectStore'

type DiscountOption = 0.25 | 0.50 | 0.75

export default function SaleEventModal() {
  const closeSaleEventModal = useEconomyStore((s) => s.closeSaleEventModal)
  const joinSaleEvent       = useProjectStore((s) => s.joinSaleEvent)
  const leaveSaleEvent      = useProjectStore((s) => s.leaveSaleEvent)
  const projects            = useProjectStore((s) =>
    s.projects.filter(p => p.status === 'yayinlandi' && p.contentType !== 'guncelleme')
  )

  const [selections, setSelections] = useState<Record<string, { join: boolean; discount: DiscountOption }>>(
    () => Object.fromEntries(projects.map(p => [p.id, { join: false, discount: 0.25 }]))
  )

  function toggleJoin(id: string) {
    setSelections(s => ({ ...s, [id]: { ...s[id], join: !s[id].join } }))
  }

  function setDiscount(id: string, discount: DiscountOption) {
    setSelections(s => ({ ...s, [id]: { ...s[id], discount } }))
  }

  function handleConfirm() {
    for (const [id, sel] of Object.entries(selections)) {
      if (sel.join) {
        joinSaleEvent(id, sel.discount)
      } else {
        leaveSaleEvent(id)
      }
    }
    closeSaleEventModal()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-white text-lg font-bold mb-1">🏷️ Platform İndirim Etkinliği</h2>
        <p className="text-gray-500 text-sm mb-4">2 hafta sürecek. Oyunlarını katıma açabilirsin.</p>

        {projects.length === 0 ? (
          <p className="text-gray-600 text-sm mb-4">Yayında oyun yok.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {projects.map(p => {
              const sel = selections[p.id]
              return (
                <div key={p.id} className="flex items-center gap-3 bg-gray-900 rounded p-2">
                  <input
                    type="checkbox"
                    checked={sel.join}
                    onChange={() => toggleJoin(p.id)}
                    className="accent-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{p.name}</div>
                    <div className="text-gray-500 text-xs">${p.price}</div>
                  </div>
                  {sel.join && (
                    <div className="flex gap-1">
                      {([0.25, 0.50, 0.75] as DiscountOption[]).map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscount(p.id, d)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            sel.discount === d
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          %{Math.round(d * 100)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white rounded py-2 text-sm font-medium transition-colors"
        >
          Onayla
        </button>
      </div>
    </div>
  )
}
