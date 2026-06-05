// src/components/EmlakcilikPanel.tsx
import { useState } from 'react'
import { useWorldStore }      from '@/store/worldStore'
import { useDayTimeStore }    from '@/store/dayTimeStore'
import { useEmlakcilikStore } from '@/store/emlakcilikStore'
import { PROPERTY_DEALS }     from '@/data/propertyDeals'
import officeBg      from '@/assets/icons/emlak_office_bg.png'
import negotiationBg from '@/assets/icons/emlak_negotiation_bg.png'
import type { NegotiationSignal } from '@/data/propertyDeals'

const BUYER_LABELS: Record<string, string> = {
  kurumsal_yatirimci: 'Kurumsal Yatırımcı',
  genc_girisimci:     'Genç Girişimci',
  spekulatif_yatirimci: 'Spekülatif Yatırımcı',
}

const SIGNAL_LINES: Record<NegotiationSignal, string> = {
  accepted:  'Kabul etti.',
  hesitated: 'Tereddüt etti.',
  smiled:    'Düşündü, gülümsedi.',
  walked:    'Masayı terk etti.',
}

const SIGNAL_COLORS: Record<NegotiationSignal, string> = {
  accepted:  'text-green-400',
  hesitated: 'text-yellow-400',
  smiled:    'text-blue-400',
  walked:    'text-red-400',
}

export default function EmlakcilikPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const phase              = useEmlakcilikStore((s) => s.phase)
  const activeDealId       = useEmlakcilikStore((s) => s.activeDealId)
  const completedDealIds   = useEmlakcilikStore((s) => s.completedDealIds)
  const rentIndex          = useEmlakcilikStore((s) => s.rentIndex)
  const offerCount         = useEmlakcilikStore((s) => s.offerCount)
  const currentBuyerType   = useEmlakcilikStore((s) => s.currentBuyerType)
  const currentBuyerCeiling = useEmlakcilikStore((s) => s.currentBuyerCeiling)

  const [offerInput, setOfferInput]   = useState('')
  const [lastSignal, setLastSignal]   = useState<NegotiationSignal | null>(null)
  const [dealSuccess, setDealSuccess] = useState<boolean | null>(null)

  const bannerSrc = phase === 'brief' || phase === 'idle'
    ? officeBg
    : negotiationBg

  function close() {
    useEmlakcilikStore.getState().resetDeal()
    setLocation(null)
    setIsPaused(false)
  }

  function handlePickDeal(dealId: string) {
    useEmlakcilikStore.getState().startDeal(dealId)
  }

  function handleConfirmBrief() {
    useEmlakcilikStore.getState().confirmBrief()
    setLastSignal(null)
    setOfferInput('')
  }

  function handleMakeOffer() {
    const price = parseInt(offerInput.replace(/\D/g, ''), 10)
    if (isNaN(price) || price <= 0) return
    const signal = useEmlakcilikStore.getState().makeOffer(price)
    if (!signal) return
    setLastSignal(signal)
    setOfferInput('')
    if (signal === 'accepted') {
      setDealSuccess(true)
    } else if (useEmlakcilikStore.getState().phase === 'result') {
      setDealSuccess(false)
    }
  }

  function handleResetDeal() {
    useEmlakcilikStore.getState().resetDeal()
    setLastSignal(null)
    setDealSuccess(null)
    setOfferInput('')
  }

  const activeDeal = activeDealId ? PROPERTY_DEALS.find(d => d.id === activeDealId) : null

  return (
    <div
      className="bg-gray-950/97 border border-amber-900/40 rounded-xl shadow-2xl flex flex-col font-mono overflow-hidden"
      style={{ width: '440px', minHeight: '200px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-amber-600 tracking-widest">EMLAKÇILIK</span>
        {(phase === 'idle' || phase === 'brief' || phase === 'result') && (
          <button onClick={close} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
        )}
      </div>

      {/* Banner */}
      <div className="relative" style={{ height: '80px', overflow: 'hidden' }}>
        <img
          src={bannerSrc}
          alt=""
          style={{
            width: '100%',
            height: '80px',
            imageRendering: 'pixelated',
            display: 'block',
            transition: 'opacity 300ms ease',
          }}
        />
        {rentIndex > 0 && (
          <div className="absolute bottom-1 right-2 text-xs font-mono text-amber-700/70">
            Kira Endeksi {rentIndex}/100
          </div>
        )}
      </div>

      {/* Phase content */}
      <div className="flex-1 overflow-auto">
        {phase === 'idle' && renderIdle()}
        {phase === 'brief' && renderBrief()}
        {phase === 'negotiation' && renderNegotiation()}
        {phase === 'result' && renderResult()}
      </div>
    </div>
  )

  function renderIdle() {
    const available = PROPERTY_DEALS.filter(d => !completedDealIds.includes(d.id))
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Vivian — Mülk Portföyü</div>
        {available.length === 0 && (
          <div className="text-gray-400 text-sm">Tüm mülkler satıldı.</div>
        )}
        {available.map(deal => (
          <button
            key={deal.id}
            onClick={() => handlePickDeal(deal.id)}
            className="w-full text-left px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-amber-800 rounded text-sm text-gray-200 transition-colors"
          >
            <span className="font-medium">{deal.label}</span>
            <span className="ml-2 text-xs text-gray-500">
              {deal.baseCost.toLocaleString()}₺ maliyet
            </span>
          </button>
        ))}
        <button
          onClick={close}
          className="mt-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded self-start"
        >
          [ESC] Çık
        </button>
      </div>
    )
  }

  function renderBrief() {
    if (!activeDeal) return null
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-amber-600 uppercase tracking-widest">{activeDeal.label}</div>
        <div className="text-sm text-gray-300 italic leading-relaxed">
          "{activeDeal.hint}"
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Tahmini değer:{' '}
          <span className="text-gray-300">
            {activeDeal.buyerCeilingMin.toLocaleString()}₺ – {activeDeal.buyerCeilingMax.toLocaleString()}₺
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleConfirmBrief}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 rounded text-sm text-amber-100"
          >
            Müzakereye Başla
          </button>
          <button
            onClick={() => { useEmlakcilikStore.getState().resetDeal() }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded"
          >
            Geri
          </button>
        </div>
      </div>
    )
  }

  function renderNegotiation() {
    if (!activeDeal) return null
    const offersLeft = 3 - offerCount
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-blue-400 uppercase tracking-widest">{activeDeal.label}</div>
        {currentBuyerType && (
          <div className="text-xs text-gray-500">
            Alıcı: <span className="text-gray-400">{BUYER_LABELS[currentBuyerType]}</span>
            <span className="ml-3 text-gray-600">{offersLeft} teklif hakkı</span>
          </div>
        )}
        {lastSignal && (
          <div className={`text-sm font-medium ${SIGNAL_COLORS[lastSignal]}`}>
            {SIGNAL_LINES[lastSignal]}
          </div>
        )}
        <div className="flex gap-2 items-center mt-1">
          <input
            type="text"
            value={offerInput}
            onChange={e => setOfferInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleMakeOffer()}
            placeholder="Teklif (₺)"
            className="flex-1 bg-gray-900 border border-gray-700 focus:border-blue-700 rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none"
          />
          <button
            onClick={handleMakeOffer}
            disabled={!offerInput}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-blue-100"
          >
            Teklif Ver
          </button>
        </div>
        <div className="text-xs text-gray-700 mt-1">
          Maliyet: {activeDeal.baseCost.toLocaleString()}₺
        </div>
      </div>
    )
  }

  function renderResult() {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Sonuç</div>
        {dealSuccess === true && (
          <div className="text-green-400 text-sm font-medium">Anlaşma kapandı.</div>
        )}
        {dealSuccess === false && (
          <div className="text-red-400 text-sm font-medium">Müzakere başarısız.</div>
        )}
        {lastSignal && (
          <div className={`text-xs ${SIGNAL_COLORS[lastSignal]}`}>
            {SIGNAL_LINES[lastSignal]}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleResetDeal}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
          >
            Portföye Dön
          </button>
          <button
            onClick={close}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded"
          >
            Çık
          </button>
        </div>
      </div>
    )
  }
}
