import { useInterviewStore } from '@/store/interviewStore'

export default function InterviewModal() {
  const pending = useInterviewStore((s) => s.pending)
  const answer  = useInterviewStore((s) => s.answer)
  const dismiss = useInterviewStore((s) => s.dismiss)

  if (!pending) return null
  const isIris = pending.reporter === 'iris'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
               style={{ background: isIris ? '#7a3b5e' : '#3b4a7a' }}>📰</div>
          <div className="text-sm">
            <b>{isIris ? 'Iris' : 'Basın'}</b> <span className="text-gray-500">· Şehir Gazetesi</span>
            <p className="text-gray-200 mt-1">{pending.prompt}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {pending.answers.map((a, i) => (
            <button key={i} onClick={() => answer(i)}
              className="text-left text-sm bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg px-3 py-2.5">
              {a.text}
            </button>
          ))}
        </div>
        <button onClick={dismiss} className="text-gray-500 text-xs mt-4 hover:text-gray-300">
          Şimdi değil
        </button>
      </div>
    </div>
  )
}
