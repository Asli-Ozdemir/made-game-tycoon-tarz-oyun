// src/components/WorkSession.tsx
import { useWorkSessionStore } from '@/store/workSessionStore'
import { FOCUS_OPTIONS } from '@/data/workCards'

const STEP_DOTS = ['bug', 'focus', 'spark'] as const

export default function WorkSession() {
  const active     = useWorkSessionStore((s) => s.active)
  const phase      = useWorkSessionStore((s) => s.phase)
  const bugCard    = useWorkSessionStore((s) => s.bugCard)
  const sparkText  = useWorkSessionStore((s) => s.sparkText)
  const chooseBug   = useWorkSessionStore((s) => s.chooseBug)
  const chooseFocus = useWorkSessionStore((s) => s.chooseFocus)
  const chooseSpark = useWorkSessionStore((s) => s.chooseSpark)

  if (!active) return null

  const dotIdx = STEP_DOTS.indexOf(phase as typeof STEP_DOTS[number])

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="bg-[#0e1628] border border-[#1e3a5f] rounded-2xl p-6 w-[420px] font-mono shadow-2xl">
        {/* adım göstergesi */}
        <div className="flex justify-center gap-2 mb-4 text-xs text-gray-500">
          {STEP_DOTS.map((_, i) => (
            <span key={i} className={i === dotIdx ? 'text-white' : ''}>●</span>
          ))}
          <span className="ml-2">Kart {dotIdx + 1}/3</span>
        </div>

        {/* BUG */}
        {phase === 'bug' && bugCard && (
          <div>
            <div className="text-red-400 text-xs uppercase tracking-widest mb-2">🐛 Bug Çıktı</div>
            <p className="text-gray-100 text-sm mb-1">"{bugCard.text}"</p>
            <p className="text-gray-500 text-xs mb-4">Ne yapmak istersin?</p>
            <div className="flex gap-3">
              <button
                onClick={() => chooseBug('fix')}
                className="flex-1 bg-[#0a1a0e] border border-green-800 text-green-300 rounded-lg p-3 text-sm text-left hover:bg-[#0d2412] transition-colors"
              >
                🔧 <strong>Düzelt</strong><br />
                <span className="text-gray-500 text-xs">+1 hafta · +2 heves · kalite korunur</span>
              </button>
              <button
                onClick={() => chooseBug('skip')}
                className="flex-1 bg-[#1a0e0e] border border-red-900 text-red-300 rounded-lg p-3 text-sm text-left hover:bg-[#241010] transition-colors"
              >
                🚀 <strong>Geç</strong><br />
                <span className="text-gray-500 text-xs">−{bugCard.penalty} kalite · sonraki bug ağırlaşır</span>
              </button>
            </div>
          </div>
        )}

        {/* ODAK */}
        {phase === 'focus' && (
          <div>
            <div className="text-purple-400 text-xs uppercase tracking-widest mb-2">🎯 Bugünün Odağı</div>
            <p className="text-gray-100 text-sm mb-1">Bugün en çok neye zaman harcamak istersin?</p>
            <p className="text-gray-500 text-xs mb-4">+15 seçtiğin eksene · −8 eşlenik eksene</p>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.axis}
                  onClick={() => chooseFocus(opt.axis)}
                  className="bg-[#0a0e1a] border border-[#2a3550] text-gray-200 rounded-lg p-3 text-sm hover:border-purple-600 transition-colors"
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KIVILCIM */}
        {phase === 'spark' && sparkText && (
          <div>
            <div className="text-emerald-400 text-xs uppercase tracking-widest mb-2">💡 Kıvılcım</div>
            <p className="text-gray-100 text-sm mb-1">"{sparkText}"</p>
            <p className="text-gray-500 text-xs mb-4">Ne yapmak istersin?</p>
            <div className="flex gap-3">
              <button
                onClick={() => chooseSpark('apply')}
                className="flex-1 bg-[#0a1a0e] border border-emerald-800 text-emerald-300 rounded-lg p-3 text-sm text-left hover:bg-[#0d2412] transition-colors"
              >
                ✨ <strong>Uygula</strong><br />
                <span className="text-gray-500 text-xs">+15 kalite · +2 hafta</span>
              </button>
              <button
                onClick={() => chooseSpark('save')}
                className="flex-1 bg-[#0a0e1a] border border-yellow-900 text-yellow-300 rounded-lg p-3 text-sm text-left hover:bg-[#1a1608] transition-colors"
              >
                📝 <strong>Sonraya Sakla</strong><br />
                <span className="text-gray-500 text-xs">sonraki projeye +10 başlangıç</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
