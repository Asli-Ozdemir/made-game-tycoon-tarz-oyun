import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { COURSES, BACKGROUND_AFFINITY } from '@/data/courses'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useCharacterStore } from '@/store/characterStore'
import { applyXpGains } from '@/engine/employeeEngine'
import { SKILL_CAPS } from '@/data/courses'
import type { SkillKey } from '@/types/employee'

interface PurchasedCourse {
  id:         string
  courseId:   string
  weeksLeft:  number
  assignedTo: string | null
}

interface TrainingStore {
  inventory:   PurchasedCourse[]
  buy:         (courseId: string) => void
  assign:      (purchasedId: string, employeeId: string) => void
  tickCourses: (year: number) => void
  reset:       () => void
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  inventory: [],

  buy: (courseId) => {
    const course = COURSES.find(c => c.id === courseId)
    if (!course) return
    if (useGameStore.getState().money < course.cost) return
    useGameStore.getState().addMoney(-course.cost)
    set((s) => ({
      inventory: [...s.inventory, {
        id: nanoid(),
        courseId,
        weeksLeft: course.duration,
        assignedTo: null,
      }],
    }))
  },

  assign: (purchasedId, employeeId) => {
    set((s) => ({
      inventory: s.inventory.map(pc =>
        pc.id === purchasedId ? { ...pc, assignedTo: employeeId } : pc
      ),
    }))

    // Set activeCourseId on the employee — use setActiveCourse if available (Task 4),
    // otherwise fall back to direct setState.
    const empStore = useEmployeeStore.getState()
    if (typeof (empStore as any).setActiveCourse === 'function') {
      ;(empStore as any).setActiveCourse(employeeId, purchasedId)
    } else {
      useEmployeeStore.setState((s) => ({
        employees: s.employees.map(e =>
          e.id === employeeId ? { ...e, activeCourseId: purchasedId } : e
        ),
      }))
    }
  },

  tickCourses: (_year) => {
    const background = useCharacterStore.getState().background
    const affinity = background ? BACKGROUND_AFFINITY[background] : null

    const remaining: PurchasedCourse[] = []
    for (const pc of get().inventory) {
      if (!pc.assignedTo) {
        remaining.push(pc)
        continue
      }
      const newWeeksLeft = pc.weeksLeft - 1
      if (newWeeksLeft <= 0) {
        // Course completed — apply XP, unlock trait, clear activeCourseId
        const course = COURSES.find(c => c.id === pc.courseId)!
        const multiplier =
          affinity && affinity.skills.includes(course.targetSkill as SkillKey)
            ? affinity.multiplier
            : 1.0
        const finalXp = Math.round(course.xpBoost * multiplier)

        const empStore = useEmployeeStore.getState()
        if (typeof (empStore as any).completeCourse === 'function') {
          ;(empStore as any).completeCourse(pc.assignedTo, pc.courseId, finalXp)
        } else {
          // Fallback: apply XP and trait directly
          useEmployeeStore.setState((s) => ({
            employees: s.employees.map(e => {
              if (e.id !== pc.assignedTo) return e

              // Add XP to the course's target skill
              const newXp = { ...e.xp, [course.targetSkill]: e.xp[course.targetSkill as SkillKey] + finalXp }
              const personality = e.personality
              const caps = SKILL_CAPS[personality]
              const { updatedEmployee } = applyXpGains(e, newXp, caps)

              // Unlock trait if present and not already owned
              const newTraits =
                course.traitId && !updatedEmployee.traits.includes(course.traitId)
                  ? [...updatedEmployee.traits, course.traitId]
                  : updatedEmployee.traits

              return {
                ...updatedEmployee,
                traits: newTraits,
                activeCourseId: null,
              }
            }),
          }))
        }
        // Do NOT push to remaining — course is consumed
      } else {
        remaining.push({ ...pc, weeksLeft: newWeeksLeft })
      }
    }
    set({ inventory: remaining })
  },

  reset: () => set({ inventory: [] }),
}))
