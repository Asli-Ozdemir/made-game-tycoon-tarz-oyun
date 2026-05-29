import { useTrainingStore } from '@/store/trainingStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useGameStore } from '@/store/gameStore'
import { useCharacterStore } from '@/store/characterStore'
import { useWorldStore } from '@/store/worldStore'
import { COURSES, TRAITS, BACKGROUND_AFFINITY } from '@/data/courses'

export default function AcademyPanel() {
  const inventory   = useTrainingStore((s) => s.inventory)
  const buy         = useTrainingStore((s) => s.buy)
  const assign      = useTrainingStore((s) => s.assign)
  const employees   = useEmployeeStore((s) => s.employees)
  const money       = useGameStore((s) => s.money)
  const background  = useCharacterStore((s) => s.background)
  const setLocation = useWorldStore((s) => s.setLocation)

  const affinity = background ? BACKGROUND_AFFINITY[background] : null
  const unassigned = inventory.filter(pc => !pc.assignedTo)
  const availableEmployees = employees.filter(e => !e.activeCourseId)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-xl font-bold">🎓 Akademi</h2>
        <button
          onClick={() => setLocation(null)}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-700 hover:border-gray-500"
        >
          Kapat
        </button>
      </div>

      {/* Kurs Kataloğu */}
      <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Kurs Kataloğu</h3>
      <div className="flex flex-col gap-2 mb-8">
        {COURSES.map((course) => {
          const hasAffinity = affinity?.skills.includes(course.targetSkill)
          const canAfford = money >= course.cost
          const inInventory = inventory.some(pc => pc.courseId === course.id && !pc.assignedTo)
          const trait = course.traitId ? TRAITS.find(t => t.id === course.traitId) : null

          return (
            <div
              key={course.id}
              className="bg-gray-800 rounded-lg p-3 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{course.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  +{course.xpBoost} XP · {course.duration} hafta
                  {trait ? ` · 🏅 ${trait.name}` : ''}
                </p>
                {hasAffinity && (
                  <p className="text-yellow-400 text-xs mt-0.5">
                    ★ Arka plan bonusu aktif ({affinity!.multiplier}×)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-green-400 text-sm font-medium">
                  ${course.cost.toLocaleString()}
                </span>
                {inInventory ? (
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    Envanterde
                  </span>
                ) : (
                  <button
                    onClick={() => buy(course.id)}
                    disabled={!canAfford}
                    className={`text-xs px-3 py-1 rounded font-medium ${
                      canAfford
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Al
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Envanter */}
      {unassigned.length > 0 && (
        <>
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
            Envanteriniz ({unassigned.length})
          </h3>
          <div className="flex flex-col gap-2">
            {unassigned.map((pc) => {
              const course = COURSES.find(c => c.id === pc.courseId)!
              return (
                <div
                  key={pc.id}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <p className="text-white text-sm">{course.name}</p>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) assign(pc.id, e.target.value)
                    }}
                    className="bg-gray-700 text-gray-200 text-sm py-1 px-2 rounded border border-gray-600"
                  >
                    <option value="">Çalışana At ▾</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
