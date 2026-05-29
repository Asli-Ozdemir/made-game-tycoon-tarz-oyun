import { useEmployeeStore } from '@/store/employeeStore'
import { useTimeStore } from '@/store/timeStore'
import EmployeeCard from './EmployeeCard'

export default function EmployeePanel() {
  const employees          = useEmployeeStore((s) => s.employees)
  const candidates         = useEmployeeStore((s) => s.candidates)
  const pendingEvents      = useEmployeeStore((s) => s.pendingEvents)
  const refreshCandidates  = useEmployeeStore((s) => s.refreshCandidates)
  const clearPendingEvents = useEmployeeStore((s) => s.clearPendingEvents)
  const tickCount          = useTimeStore((s) => s.tickCount)

  return (
    <div className="p-6">
      {/* Weekly events summary */}
      {pendingEvents.length > 0 && (
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-white font-semibold">Bu Hafta Olaylar</h2>
            <button
              onClick={clearPendingEvents}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Temizle
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {pendingEvents.map((ev) => (
              <li key={ev.id} className="text-sm text-gray-300">
                {ev.description}
                {ev.quitsJob && (
                  <span className="ml-2 text-red-400 font-semibold">— Şirketten ayrıldı!</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hired employees */}
      <div className="mb-8">
        <h2 className="text-gray-400 text-sm uppercase mb-3">
          Çalışanlar ({employees.length})
        </h2>
        {employees.length === 0 ? (
          <p className="text-gray-500 text-sm">Henüz çalışan yok. Aşağıdan işe al.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        )}
      </div>

      {/* Candidate pool */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-400 text-sm uppercase">Aday Havuzu</h2>
          <button
            onClick={() => refreshCandidates(tickCount + Date.now())}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded"
          >
            Adayları Yenile
          </button>
        </div>
        {candidates.length === 0 ? (
          <p className="text-gray-500 text-sm">Tüm adaylar işe alındı. "Adayları Yenile" ile yeni adaylar getir.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((c) => (
              <EmployeeCard key={c.id} employee={c} isCandidate />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
