import { useEmployeeStore } from '@/store/employeeStore'
import { useProjectStore } from '@/store/projectStore'
import { PERSONALITY_LABELS } from '@/data/employeeNames'
import type { Employee } from '@/types/employee'

interface Props {
  employee: Employee
  isCandidate?: boolean
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-12 text-xs">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-gray-300 text-xs w-4">{value}</span>
    </div>
  )
}

function LoyaltyBar({ value }: { value: number }) {
  const color = value >= 60 ? 'bg-green-500' : value >= 30 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-12 text-xs">Sadakat</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-gray-300 text-xs w-6">{value}</span>
    </div>
  )
}

export default function EmployeeCard({ employee, isCandidate = false }: Props) {
  const hire            = useEmployeeStore((s) => s.hire)
  const fire            = useEmployeeStore((s) => s.fire)
  const assignEmployee  = useEmployeeStore((s) => s.assignEmployee)
  const pendingEvents   = useEmployeeStore((s) => s.pendingEvents)
  const activeProjects  = useProjectStore((s) =>
    s.projects.filter((p) => p.status === 'gelistirme')
  )

  const currentEvent = pendingEvents.find((ev) => ev.employeeId === employee.id)

  const eventColors: Record<string, string> = {
    hasta:        'bg-red-900 text-red-200',
    rakip_teklif: 'bg-orange-900 text-orange-200',
    kisisel_kriz: 'bg-yellow-900 text-yellow-200',
    dogum_gunu:   'bg-green-900 text-green-200',
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white font-semibold text-sm">{employee.name}</p>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
            {PERSONALITY_LABELS[employee.personality]}
          </span>
        </div>
        <span className="text-green-400 text-sm font-medium">${employee.salary.toLocaleString()}/hf</span>
      </div>

      {/* Life event badge */}
      {currentEvent && (
        <div className={`text-xs px-2 py-1 rounded ${eventColors[currentEvent.type] ?? 'bg-gray-700 text-gray-300'}`}>
          {currentEvent.description}
        </div>
      )}

      {/* Skills */}
      <div className="flex flex-col gap-1">
        <SkillBar label="Prog"    value={employee.skills.programming} />
        <SkillBar label="Tasarım" value={employee.skills.design} />
        <SkillBar label="Ses"     value={employee.skills.sound} />
        <SkillBar label="Yönet"   value={employee.skills.management} />
      </div>

      {/* Loyalty (only for hired employees) */}
      {!isCandidate && <LoyaltyBar value={employee.loyalty} />}

      {/* Actions */}
      {isCandidate ? (
        <button
          onClick={() => hire(employee)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded font-medium"
        >
          İşe Al
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <select
            value={employee.assignedProjectId ?? ''}
            onChange={(e) => assignEmployee(employee.id, e.target.value || null)}
            className="w-full bg-gray-700 text-gray-200 text-sm py-1.5 px-2 rounded border border-gray-600"
          >
            <option value="">— Projeye atanmadı —</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => fire(employee.id)}
            className="w-full bg-red-900 hover:bg-red-800 text-red-200 text-sm py-1 rounded"
          >
            İşten Çıkar
          </button>
        </div>
      )}
    </div>
  )
}
