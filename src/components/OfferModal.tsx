import { useMarketStore } from '@/store/marketStore'
import { useProjectStore } from '@/store/projectStore'

const PLATFORM_NAMES: Record<string, string> = {
  pc: 'PC',
  konsol: 'Konsol',
  mobil: 'Mobil',
}

export default function OfferModal() {
  const pendingOffer  = useMarketStore((s) => s.pendingOffer)
  const acceptOffer   = useMarketStore((s) => s.acceptOffer)
  const declineOffer  = useMarketStore((s) => s.declineOffer)
  const projects      = useProjectStore((s) => s.projects)

  if (pendingOffer === null) return null

  const platformName = PLATFORM_NAMES[pendingOffer.platformId] ?? pendingOffer.platformId

  const projectName = pendingOffer.type !== 'price_cut'
    ? (projects.find(p => p.id === pendingOffer.projectId)?.name ?? '(bilinmiyor)')
    : null

  let title = ''
  let description = ''
  let cost = ''
  let benefit = ''

  if (pendingOffer.type === 'featured') {
    title = 'Öne Çıkarma Teklifi'
    description = `${platformName} platformu "${projectName}" oyununu 2 hafta boyunca öne çıkarmak istiyor.`
    cost = '5.000$ anında ödeme'
    benefit = '2 hafta boyunca satışlara ×1.2 çarpan'
  } else if (pendingOffer.type === 'exclusive') {
    title = 'Exclusive Anlaşma Teklifi'
    description = `${platformName} platformu "${projectName}" oyunu için exclusive anlaşma teklif ediyor.`
    cost = 'Oyun yalnızca bu platformda satılır'
    benefit = 'Satışlara kalıcı ×1.4 çarpan'
  } else {
    title = 'Fiyat İndirimi Etkinliği'
    description = `${platformName} platformu sektör genelinde fiyat indirimi etkinliği düzenliyor.`
    cost = 'Bedelsiz'
    benefit = '1 hafta boyunca bu platformdaki yeni yayınlara ×1.5 çarpan'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-yellow-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">{title}</h2>
        <p className="text-gray-200 mb-4">{description}</p>

        <div className="bg-gray-800 rounded-lg p-3 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Bedel:</span>
            <span className="text-red-300">{cost}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Fayda:</span>
            <span className="text-green-300">{benefit}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={acceptOffer}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Kabul Et
          </button>
          <button
            onClick={declineOffer}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Geç
          </button>
        </div>
      </div>
    </div>
  )
}
