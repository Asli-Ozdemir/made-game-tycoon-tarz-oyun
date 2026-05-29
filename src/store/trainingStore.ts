import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { COURSES, BACKGROUND_AFFINITY } from '@/data/courses'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useCharacterStore } from '@/store/characterStore'

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
    useEmployeeStore.getState().setActiveCourse(employeeId, purchasedId)
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
        const course = COURSES.find(c => c.id === pc.courseId)!
        const multiplier =
          affinity && affinity.skills.includes(course.targetSkill)
            ? affinity.multiplier
            : 1.0
        const finalXp = Math.round(course.xpBoost * multiplier)
        useEmployeeStore.getState().completeCourse(pc.assignedTo, pc.courseId, finalXp)
      } else {
        remaining.push({ ...pc, weeksLeft: newWeeksLeft })
      }
    }
    set({ inventory: remaining })
  },

  reset: () => set({ inventory: [] }),
}))
