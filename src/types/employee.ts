export type EmployeePersonality = 'odakli' | 'yaratici' | 'sosyal' | 'rekabetci' | 'sakin'

export type SkillKey = 'programming' | 'design' | 'sound' | 'management'

export interface EmployeeSkillSet {
  programming: number  // 1–10
  design: number       // 1–10
  sound: number        // 1–10
  management: number   // 1–10
}

export interface Employee {
  id: string
  name: string
  skills: EmployeeSkillSet
  salary: number              // weekly cost in $
  loyalty: number             // 0–100
  energy: number              // 0–100 (resets to 100 each week before events apply)
  personality: EmployeePersonality
  assignedProjectId: string | null
  xp:             Record<SkillKey, number>  // birikmiş ham XP, her skill için ayrı
  activeCourseId: string | null             // trainingStore'daki PurchasedCourse id'si
  traits:         string[]                  // açılmış trait id'leri
}

export type LifeEventType = 'hasta' | 'rakip_teklif' | 'kisisel_kriz' | 'dogum_gunu'

export interface LifeEvent {
  id: string
  type: LifeEventType
  employeeId: string
  employeeName: string
  description: string
  loyaltyDelta: number
  energyDelta: number
  quitsJob: boolean
}
