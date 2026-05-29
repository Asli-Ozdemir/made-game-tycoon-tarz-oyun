import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { generateCandidates, rollLifeEvents } from '@/engine/employeeEngine'
import type { Employee, LifeEvent } from '@/types/employee'

interface EmployeeStoreState {
  employees: Employee[]
  candidates: Employee[]
  pendingEvents: LifeEvent[]
  hire: (candidate: Employee) => void
  fire: (id: string) => void
  assignEmployee: (employeeId: string, projectId: string | null) => void
  unassignFromProject: (projectId: string) => void
  refreshCandidates: (seed: number) => void
  weeklyTick: (seed: number) => { events: LifeEvent[]; quitters: Employee[]; totalSalary: number }
  clearPendingEvents: () => void
  reset: () => void
}

export const useEmployeeStore = create<EmployeeStoreState>((set, get) => ({
  employees: [],
  candidates: generateCandidates(1),
  pendingEvents: [],

  hire: (candidate) => {
    const employee: Employee = { ...candidate, id: nanoid(), assignedProjectId: null }
    set((s) => ({
      employees: [...s.employees, employee],
      candidates: s.candidates.filter((c) => c.id !== candidate.id),
    }))
  },

  fire: (id) => {
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }))
  },

  assignEmployee: (employeeId, projectId) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === employeeId ? { ...e, assignedProjectId: projectId } : e
      ),
    }))
  },

  unassignFromProject: (projectId) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.assignedProjectId === projectId ? { ...e, assignedProjectId: null } : e
      ),
    }))
  },

  refreshCandidates: (seed) => {
    set({ candidates: generateCandidates(seed) })
  },

  weeklyTick: (seed) => {
    const employees = get().employees
    const events = rollLifeEvents(employees, seed)
    const quitters = employees.filter((e) =>
      events.some((ev) => ev.employeeId === e.id && ev.quitsJob)
    )
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0)

    set((s) => ({
      employees: s.employees
        .filter((e) => !quitters.some((q) => q.id === e.id))
        .map((e) => {
          const event = events.find((ev) => ev.employeeId === e.id)
          const newEnergy = Math.max(0, Math.min(100, 100 + (event?.energyDelta ?? 0)))
          const newLoyalty = Math.max(0, Math.min(100, e.loyalty + (event?.loyaltyDelta ?? 0)))
          return { ...e, energy: newEnergy, loyalty: newLoyalty }
        }),
      pendingEvents: events,
    }))

    return { events, quitters, totalSalary }
  },

  clearPendingEvents: () => set({ pendingEvents: [] }),

  reset: () => set({ employees: [], candidates: generateCandidates(1), pendingEvents: [] }),
}))
