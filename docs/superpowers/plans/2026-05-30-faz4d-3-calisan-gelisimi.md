# Faz 4D-3 — Çalışan Gelişimi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Çalışanlar proje çalışmasıyla XP kazanır, kişilik bazlı tavanlarla büyür; oyuncu Akademi lokasyonundan kurs satın alıp çalışana atayabilir, kurs tamamlandığında trait açılır.

**Architecture:** `src/data/courses.ts` statik kataloğu tutar; `src/engine/employeeEngine.ts`'e saf `tickEmployeeXp`/`applyXpGains` fonksiyonları eklenir; `src/store/trainingStore.ts` kurs envanterini yönetir; `employeeStore.weeklyTick` her hafta XP'yi ve kurs sayacını günceller; `AcademyPanel` yeni lokasyon paneli olarak `App.tsx`'e bağlanır.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest, nanoid

---

## File Map

| Dosya | İşlem | Sorumluluk |
|---|---|---|
| `src/types/employee.ts` | Güncelle | `SkillKey` tipi + `xp`, `activeCourseId`, `traits` alanları |
| `src/data/courses.ts` | Oluştur | `COURSES`, `TRAITS`, `SKILL_CAPS`, `BACKGROUND_AFFINITY` statik veri |
| `src/engine/employeeEngine.ts` | Güncelle | `tickEmployeeXp`, `applyXpGains` ekle; `computeProjectBonus` trait güncellemesi; `generateCandidates` yeni alanlar |
| `src/store/trainingStore.ts` | Oluştur | Kurs envanteri: `buy`, `assign`, `tickCourses`, `reset` |
| `src/store/employeeStore.ts` | Güncelle | `setActiveCourse`, `completeCourse`, `tickXp` + `weeklyTick` güncelleme |
| `src/store/worldStore.ts` | Güncelle | `LocationId`'ye `'akademi'` ekle |
| `src/pixi/TriggerSystem.ts` | Güncelle | `LOCATION_MAP`'e `akademi_door` ekle |
| `src/App.tsx` | Güncelle | `trainingStore.tickCourses` wiring + `AcademyPanel` render |
| `src/components/AcademyPanel.tsx` | Oluştur | Kurs kataloğu + envanter UI |
| `src/components/EmployeeCard.tsx` | Güncelle | XP çubuğu, aktif kurs, trait rozetleri |
| `tests/engine/employeeEngine.test.ts` | Güncelle | `baseEmployee` yeni alanlar + yeni engine testleri |
| `tests/store/trainingStore.test.ts` | Oluştur | 7 test |

---

## Task 1: Tipler + Statik Veri

**Files:**
- Modify: `src/types/employee.ts`
- Create: `src/data/courses.ts`

- [ ] **Step 1: `src/types/employee.ts`'i güncelle**

Dosyayı oku, içeriği şu şekilde değiştir:

```typescript
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
  salary: number
  loyalty: number
  energy: number
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
```

- [ ] **Step 2: `src/data/courses.ts` oluştur**

```typescript
import type { SkillKey, EmployeePersonality } from '@/types/employee'
import type { BackgroundId } from '@/data/backgrounds'

export interface Course {
  id:          string
  name:        string
  targetSkill: SkillKey
  xpBoost:     number    // kurs tamamlandığında eklenen XP (arka plan çarpanı öncesi)
  duration:    number    // hafta cinsinden süre
  cost:        number    // $
  traitId?:    string    // tamamlandığında açılan trait id (opsiyonel)
}

export interface Trait {
  id:          string
  name:        string
  description: string
}

export const COURSES: Course[] = [
  { id: 'prog_temel',    name: 'Algoritma Temelleri',     targetSkill: 'programming', xpBoost: 15, duration: 4, cost: 8000 },
  { id: 'prog_ileri',   name: 'İleri Yazılım Mimarisi',  targetSkill: 'programming', xpBoost: 35, duration: 8, cost: 20000, traitId: 'kod_ustasi' },
  { id: 'design_temel', name: 'Temel Tasarım',            targetSkill: 'design',       xpBoost: 15, duration: 4, cost: 7000 },
  { id: 'design_ileri', name: 'UX Uzmanlığı',             targetSkill: 'design',       xpBoost: 35, duration: 8, cost: 18000, traitId: 'gorsel_deha' },
  { id: 'sound_temel',  name: 'Ses Temelleri',             targetSkill: 'sound',        xpBoost: 15, duration: 4, cost: 6000 },
  { id: 'sound_ileri',  name: 'Profesyonel Ses Tasarımı', targetSkill: 'sound',        xpBoost: 35, duration: 8, cost: 16000, traitId: 'ses_buyucusu' },
  { id: 'mgmt_temel',   name: 'Liderlik 101',              targetSkill: 'management',   xpBoost: 15, duration: 4, cost: 7000 },
  { id: 'mgmt_ileri',   name: 'Stratejik Yönetim',        targetSkill: 'management',   xpBoost: 35, duration: 8, cost: 19000, traitId: 'ekip_lideri' },
]

export const TRAITS: Trait[] = [
  { id: 'kod_ustasi',   name: 'Kod Ustası',   description: 'Programlama konusunda usta — programming 1.5× bonus' },
  { id: 'gorsel_deha',  name: 'Görsel Deha',  description: 'Tasarım konusunda derin kavrayış — design 1.5× bonus' },
  { id: 'ses_buyucusu', name: 'Ses Büyücüsü', description: 'Ses tasarımında üstün yetenek — sound 1.5× bonus' },
  { id: 'ekip_lideri',  name: 'Ekip Lideri',  description: 'Takımı motive eden lider — management 1.5× bonus + atanmamış çalışanlara +2 loyalty/hafta' },
]

export const SKILL_CAPS: Record<EmployeePersonality, Record<SkillKey, number>> = {
  odakli:    { programming: 10, design: 6,  sound: 5,  management: 6  },
  yaratici:  { programming: 5,  design: 10, sound: 8,  management: 5  },
  sosyal:    { programming: 5,  design: 7,  sound: 6,  management: 10 },
  rekabetci: { programming: 8,  design: 8,  sound: 5,  management: 7  },
  sakin:     { programming: 7,  design: 7,  sound: 10, management: 7  },
}

export const BACKGROUND_AFFINITY: Record<BackgroundId, { skills: SkillKey[]; multiplier: number }> = {
  kk_uzmani:         { skills: ['sound', 'management'],                             multiplier: 1.5 },
  yaratici_direktor: { skills: ['design'],                                           multiplier: 1.5 },
  bas_muhendis:      { skills: ['programming'],                                      multiplier: 1.5 },
  yapimci:           { skills: ['management'],                                       multiplier: 1.5 },
  eski_ceo:          { skills: ['programming', 'design', 'sound', 'management'],    multiplier: 1.2 },
}
```

- [ ] **Step 3: Mevcut testlerdeki `baseEmployee`'yi güncelle**

`tests/engine/employeeEngine.test.ts` içindeki `baseEmployee` sabiti yeni alanları içermeli:

```typescript
const baseEmployee: Employee = {
  id: 'emp-1',
  name: 'Test Kişi',
  skills: { programming: 5, design: 5, sound: 5, management: 5 },
  salary: 2000,
  loyalty: 80,
  energy: 100,
  personality: 'odakli',
  assignedProjectId: null,
  xp: { programming: 0, design: 0, sound: 0, management: 0 },
  activeCourseId: null,
  traits: [],
}
```

Ayrıca `'generateCandidates'` describe bloğundaki `'her adayın gerekli alanları var'` testine şu satırları ekle:

```typescript
expect(c.xp.programming).toBe(0)
expect(c.activeCourseId).toBeNull()
expect(c.traits).toHaveLength(0)
```

- [ ] **Step 4: Testleri çalıştır (mevcut testler hâlâ geçmeli)**

```
npx vitest run
```

Beklenen: 151 test PASS (yeni alan eklendi ama davranış değişmedi).

- [ ] **Step 5: TypeScript kontrolü**

```
npx tsc --noEmit
```

Beklenen: `generateCandidates` içinde `xp`/`activeCourseId`/`traits` alanları eksik olduğu için hata. Bu hatalar Task 2'de düzeltilecek — şimdilik beklenebilir.

- [ ] **Step 6: Commit**

```bash
git add src/types/employee.ts src/data/courses.ts tests/engine/employeeEngine.test.ts
git commit -m "feat: SkillKey tipi + Employee xp/activeCourseId/traits + kurs/trait/cap statik verisi"
```

---

## Task 2: employeeEngine Güncellemeleri + Testler

**Files:**
- Modify: `src/engine/employeeEngine.ts`
- Modify: `tests/engine/employeeEngine.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/engine/employeeEngine.test.ts` dosyasına şu import'ları ekle (en üste):

```typescript
import { tickEmployeeXp, applyXpGains } from '@/engine/employeeEngine'
import { SKILL_CAPS } from '@/data/courses'
import type { SkillKey } from '@/types/employee'
```

Dosyanın sonuna şu describe bloklarını ekle:

```typescript
describe('tickEmployeeXp', () => {
  const caps = SKILL_CAPS['odakli'] // prog:10, design:6, sound:5, mgmt:6

  it('atanmış çalışan: dominant skill +2 XP, diğerleri +1 XP', () => {
    const emp = {
      ...baseEmployee,
      skills: { programming: 7, design: 3, sound: 2, management: 4 },
      assignedProjectId: 'proj-1',
    }
    const newXp = tickEmployeeXp(emp, caps)
    expect(newXp.programming).toBe(2)  // dominant
    expect(newXp.design).toBe(1)
    expect(newXp.sound).toBe(1)
    expect(newXp.management).toBe(1)
  })

  it('atanmamış çalışan: XP kazanmaz', () => {
    const emp = { ...baseEmployee, assignedProjectId: null }
    const newXp = tickEmployeeXp(emp, caps)
    expect(newXp.programming).toBe(0)
    expect(newXp.design).toBe(0)
  })

  it('cap\'e ulaşmış skill XP kazanmaz', () => {
    // odakli personality: sound cap = 5
    const emp = {
      ...baseEmployee,
      skills: { programming: 5, design: 3, sound: 5, management: 4 },
      assignedProjectId: 'proj-1',
    }
    const newXp = tickEmployeeXp(emp, caps)
    expect(newXp.sound).toBe(0)  // cap'te, XP gelmez
    expect(newXp.programming).toBe(2)  // dominant
  })
})

describe('applyXpGains', () => {
  const caps = SKILL_CAPS['odakli']

  it('eşik aşılınca skill +1, XP sıfırlanır', () => {
    // skill=3, threshold=30, mevcut xp=29, yeni xp=30 → level up
    const emp = {
      ...baseEmployee,
      skills: { programming: 3, design: 3, sound: 3, management: 3 },
      xp: { programming: 29, design: 0, sound: 0, management: 0 },
    }
    const newXp = { ...emp.xp, programming: 30 }
    const { updatedEmployee, leveledSkills } = applyXpGains(emp, newXp, caps)
    expect(updatedEmployee.skills.programming).toBe(4)
    expect(updatedEmployee.xp.programming).toBe(0)
    expect(leveledSkills).toContain('programming')
  })

  it('cap aşılmaz', () => {
    // odakli sound cap = 5; skill=5 → threshold=50 XP → ama cap'te
    const emp = {
      ...baseEmployee,
      personality: 'odakli' as const,
      skills: { programming: 5, design: 3, sound: 5, management: 3 },
      xp: { programming: 0, design: 0, sound: 60, management: 0 },
    }
    const newXp = { ...emp.xp }
    const { updatedEmployee } = applyXpGains(emp, newXp, caps)
    expect(updatedEmployee.skills.sound).toBe(5)  // cap'te kaldı
  })
})

describe('computeProjectBonus — trait', () => {
  it('kod_ustasi trait\'i programming\'i 1.5× katar', () => {
    const withTrait    = computeProjectBonus([{ ...baseEmployee, traits: ['kod_ustasi'] }])
    const withoutTrait = computeProjectBonus([{ ...baseEmployee, traits: [] }])
    expect(withTrait).toBeGreaterThan(withoutTrait)
    // programming=5, trait → 5*1.5=7.5; design=5, sound=5 → avg=(7.5+5+5)/3=5.833
    // vs. avg=(5+5+5)/3=5. Oran ~1.167 olmalı.
    expect(withTrait / withoutTrait).toBeCloseTo(1.167, 1)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
npx vitest run tests/engine/employeeEngine.test.ts
```

Beklenen: `tickEmployeeXp` ve `applyXpGains` bulunamadı hatası.

- [ ] **Step 3: `src/engine/employeeEngine.ts`'i güncelle**

Mevcut dosyayı oku. Şu değişiklikleri yap:

**a) Import'ları güncelle** — dosyanın en üstüne ekle:

```typescript
import { SKILL_CAPS } from '@/data/courses'
import type { SkillKey } from '@/types/employee'
```

**b) Sabitler ekle** — `PERSONALITIES` sabitinden sonra:

```typescript
const ALL_SKILLS: SkillKey[] = ['programming', 'design', 'sound', 'management']

const TRAIT_FOR_SKILL: Record<SkillKey, string> = {
  programming: 'kod_ustasi',
  design:      'gorsel_deha',
  sound:       'ses_buyucusu',
  management:  'ekip_lideri',
}
```

**c) `generateCandidates` fonksiyonundaki return objesine yeni alanlar ekle:**

Mevcut return objesi `assignedProjectId: null` ile bitiyor. Bunu şu şekilde güncelle:

```typescript
return {
  id: `candidate-${seed}-${i}`,
  name: `${firstName} ${lastName}`,
  skills,
  salary: Math.round(avgSkill * 200) + 500,
  loyalty: 80,
  energy: 100,
  personality: PERSONALITIES[Math.floor(r(3) * PERSONALITIES.length)],
  assignedProjectId: null,
  xp: { programming: 0, design: 0, sound: 0, management: 0 },
  activeCourseId: null,
  traits: [],
}
```

**d) `computeProjectBonus` fonksiyonunu değiştir:**

```typescript
export function computeProjectBonus(assignedEmployees: Employee[]): number {
  return assignedEmployees.reduce((sum, emp) => {
    const tm = (skill: SkillKey) =>
      emp.traits.includes(TRAIT_FOR_SKILL[skill]) ? 1.5 : 1.0
    const prog   = emp.skills.programming * tm('programming')
    const design = emp.skills.design      * tm('design')
    const sound  = emp.skills.sound       * tm('sound')
    const skillAvg = (prog + design + sound) / 3
    return sum + (skillAvg / 10) * 2 * (emp.energy / 100)
  }, 0)
}
```

**e) Dosyanın sonuna iki yeni fonksiyon ekle:**

```typescript
export function tickEmployeeXp(
  employee: Employee,
  caps: Record<SkillKey, number>
): Record<SkillKey, number> {
  if (!employee.assignedProjectId) return { ...employee.xp }
  const dominantSkill = ALL_SKILLS.reduce((best, s) =>
    employee.skills[s] > employee.skills[best] ? s : best
  )
  const newXp = { ...employee.xp }
  for (const skill of ALL_SKILLS) {
    if (employee.skills[skill] >= caps[skill]) continue
    newXp[skill] += skill === dominantSkill ? 2 : 1
  }
  return newXp
}

export function applyXpGains(
  employee: Employee,
  newXp: Record<SkillKey, number>,
  caps: Record<SkillKey, number>
): { updatedEmployee: Employee; leveledSkills: SkillKey[] } {
  const updatedSkills = { ...employee.skills }
  const updatedXp = { ...newXp }
  const leveledSkills: SkillKey[] = []
  for (const skill of ALL_SKILLS) {
    const currentLevel = employee.skills[skill]
    const threshold = currentLevel * 10
    if (updatedXp[skill] >= threshold && currentLevel < caps[skill]) {
      updatedXp[skill] -= threshold
      updatedSkills[skill] = currentLevel + 1
      leveledSkills.push(skill)
    }
  }
  return {
    updatedEmployee: { ...employee, skills: updatedSkills, xp: updatedXp },
    leveledSkills,
  }
}
```

- [ ] **Step 4: Testleri çalıştır**

```
npx vitest run tests/engine/employeeEngine.test.ts
```

Beklenen: Tüm testler PASS.

- [ ] **Step 5: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: 157+ test PASS (151 mevcut + 6 yeni).

- [ ] **Step 6: Commit**

```bash
git add src/engine/employeeEngine.ts tests/engine/employeeEngine.test.ts
git commit -m "feat: tickEmployeeXp + applyXpGains + computeProjectBonus trait desteği"
```

---

## Task 3: trainingStore + Testler

**Files:**
- Create: `src/store/trainingStore.ts`
- Create: `tests/store/trainingStore.test.ts`

- [ ] **Step 1: Failing testleri yaz**

`tests/store/trainingStore.test.ts` oluştur:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTrainingStore } from '@/store/trainingStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useCharacterStore } from '@/store/characterStore'

function resetAll() {
  useTrainingStore.getState().reset()
  useGameStore.getState().reset()
  useEmployeeStore.getState().reset()
}

beforeEach(resetAll)

describe('trainingStore — buy', () => {
  it('kurs satın alınca para düşer ve envantere girer', () => {
    const before = useGameStore.getState().money  // 50000
    useTrainingStore.getState().buy('sound_temel') // cost: 6000
    expect(useGameStore.getState().money).toBe(before - 6000)
    expect(useTrainingStore.getState().inventory).toHaveLength(1)
    expect(useTrainingStore.getState().inventory[0].courseId).toBe('sound_temel')
    expect(useTrainingStore.getState().inventory[0].weeksLeft).toBe(4)
    expect(useTrainingStore.getState().inventory[0].assignedTo).toBeNull()
  })

  it('para yetmezse satın alım gerçekleşmez', () => {
    useGameStore.setState({ money: 0, reputation: 0, totalPublished: 0 })
    useTrainingStore.getState().buy('sound_temel')
    expect(useTrainingStore.getState().inventory).toHaveLength(0)
  })
})

describe('trainingStore — assign', () => {
  it('atama sonrası assignedTo ve employee.activeCourseId güncellenir', () => {
    // İşe al
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    // Kurs satın al
    useTrainingStore.getState().buy('sound_temel')
    const pc = useTrainingStore.getState().inventory[0]
    // Ata
    useTrainingStore.getState().assign(pc.id, emp.id)
    expect(useTrainingStore.getState().inventory[0].assignedTo).toBe(emp.id)
    expect(useEmployeeStore.getState().employees[0].activeCourseId).toBe(pc.id)
  })
})

describe('trainingStore — tickCourses', () => {
  it('weeksLeft her tick\'te azalır', () => {
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    useTrainingStore.getState().buy('sound_temel') // duration: 4
    const pc = useTrainingStore.getState().inventory[0]
    useTrainingStore.getState().assign(pc.id, emp.id)
    useTrainingStore.getState().tickCourses(2005)
    expect(useTrainingStore.getState().inventory[0].weeksLeft).toBe(3)
  })

  it('kurs tamamlanınca XP eklenir, trait açılır, activeCourseId temizlenir', () => {
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    useTrainingStore.getState().buy('sound_ileri') // xpBoost:35, traitId:'ses_buyucusu'
    const pc = useTrainingStore.getState().inventory[0]
    useTrainingStore.getState().assign(pc.id, emp.id)
    // weeksLeft=8, zorla bitir
    useTrainingStore.setState({
      inventory: [{ ...pc, assignedTo: emp.id, weeksLeft: 1 }],
    })
    useTrainingStore.getState().tickCourses(2005)
    // Kurs envanterde kalmamalı
    expect(useTrainingStore.getState().inventory).toHaveLength(0)
    // Çalışanın activeCourseId temizlenmeli
    const updated = useEmployeeStore.getState().employees.find(e => e.id === emp.id)!
    expect(updated.activeCourseId).toBeNull()
    // trait açılmış olmalı
    expect(updated.traits).toContain('ses_buyucusu')
  })

  it('arka plan affinitesi çarpanı doğru uygulanır (bas_muhendis → programming 1.5×)', () => {
    useCharacterStore.setState({ background: 'bas_muhendis' } as any)
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    const xpBefore = emp.xp.programming
    useTrainingStore.getState().buy('prog_temel') // xpBoost:15, multiplier:1.5 → 22 XP
    const pc = useTrainingStore.getState().inventory[0]
    useTrainingStore.getState().assign(pc.id, emp.id)
    useTrainingStore.setState({
      inventory: [{ ...pc, assignedTo: emp.id, weeksLeft: 1 }],
    })
    useTrainingStore.getState().tickCourses(2005)
    const updated = useEmployeeStore.getState().employees.find(e => e.id === emp.id)!
    // Math.round(15 * 1.5) = 23 XP bekleniyor
    // Ama XP level'a dönüştürülmüş olabilir. XP veya skills arttı kontrol et.
    const totalXpOrSkill = updated.xp.programming + (updated.skills.programming - emp.skills.programming) * emp.skills.programming * 10
    expect(totalXpOrSkill).toBeGreaterThan(xpBefore + 15) // 1.0× ile daha fazla
  })
})

describe('trainingStore — reset', () => {
  it('reset sonrası envanter boşalır', () => {
    useTrainingStore.getState().buy('sound_temel')
    useTrainingStore.getState().reset()
    expect(useTrainingStore.getState().inventory).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
npx vitest run tests/store/trainingStore.test.ts
```

Beklenen: `Cannot find module '@/store/trainingStore'`

- [ ] **Step 3: `src/store/trainingStore.ts` oluştur**

```typescript
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
```

- [ ] **Step 4: Testleri çalıştır**

```
npx vitest run tests/store/trainingStore.test.ts
```

Beklenen: `setActiveCourse` ve `completeCourse` bulunamadı (Task 4'te eklenecek) — kısmi hata bekleniyor. Eğer tüm hata bu ise devam et.

**NOT:** Bu adımda `employeeStore`'da `setActiveCourse` ve `completeCourse` eksik olduğu için testler fail olacak. Bu beklenen durum — Task 4'te düzeltilecek.

- [ ] **Step 5: Commit**

```bash
git add src/store/trainingStore.ts tests/store/trainingStore.test.ts
git commit -m "feat: trainingStore — buy, assign, tickCourses, reset"
```

---

## Task 4: employeeStore Güncellemeleri + App.tsx Wiring

**Files:**
- Modify: `src/store/employeeStore.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/store/employeeStore.ts`'i oku**

Mevcut içeriği gör. Şu değişiklikleri yapacaksın.

- [ ] **Step 2: employeeStore import'larını güncelle**

Dosyanın üstündeki mevcut import'lara ekle:

```typescript
import { COURSES, SKILL_CAPS } from '@/data/courses'
import { tickEmployeeXp, applyXpGains } from '@/engine/employeeEngine'
```

- [ ] **Step 3: `EmployeeStoreState` interface'ine yeni action'lar ekle**

```typescript
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
  setActiveCourse: (employeeId: string, courseId: string | null) => void
  completeCourse: (employeeId: string, courseId: string, finalXp: number) => void
  tickXp: () => void
  reset: () => void
}
```

- [ ] **Step 4: Yeni action implementasyonlarını ekle**

`clearPendingEvents` satırından sonra, `reset` satırından önce şu üç action'ı ekle:

```typescript
  setActiveCourse: (employeeId, courseId) => {
    set((s) => ({
      employees: s.employees.map(e =>
        e.id === employeeId ? { ...e, activeCourseId: courseId } : e
      ),
    }))
  },

  completeCourse: (employeeId, courseId, finalXp) => {
    const course = COURSES.find(c => c.id === courseId)
    if (!course) return
    set((s) => ({
      employees: s.employees.map((emp) => {
        if (emp.id !== employeeId) return emp
        const caps = SKILL_CAPS[emp.personality]
        const newXp = {
          ...emp.xp,
          [course.targetSkill]: emp.xp[course.targetSkill] + finalXp,
        }
        const { updatedEmployee } = applyXpGains(emp, newXp, caps)
        const updatedTraits =
          course.traitId && !updatedEmployee.traits.includes(course.traitId)
            ? [...updatedEmployee.traits, course.traitId]
            : updatedEmployee.traits
        return { ...updatedEmployee, traits: updatedTraits, activeCourseId: null }
      }),
    }))
  },

  tickXp: () => {
    set((s) => {
      let updatedEmployees = s.employees.map((emp) => {
        const caps = SKILL_CAPS[emp.personality]
        const newXp = tickEmployeeXp(emp, caps)
        const { updatedEmployee } = applyXpGains(emp, newXp, caps)
        return updatedEmployee
      })
      // ekip_lideri: bu trait'e sahip çalışan varsa atanmamış çalışanlara +2 loyalty
      const hasLeader = updatedEmployees.some(e => e.traits.includes('ekip_lideri'))
      if (hasLeader) {
        updatedEmployees = updatedEmployees.map(e =>
          e.assignedProjectId === null
            ? { ...e, loyalty: Math.min(100, e.loyalty + 2) }
            : e
        )
      }
      return { employees: updatedEmployees }
    })
  },
```

- [ ] **Step 5: `weeklyTick` içinde `tickXp()` çağır**

Mevcut `weeklyTick` implementasyonunda `set(...)` çağrısının hemen sonrasına (return satırından önce) şu satırı ekle:

```typescript
    get().tickXp()

    return { events, quitters, totalSalary }
```

- [ ] **Step 6: `src/App.tsx`'i güncelle**

Mevcut `App.tsx`'i oku. `setOnWeeklyTick` callback'ine `tickAllProjects()` satırından sonra şu satırları ekle:

```typescript
import { useTrainingStore } from '@/store/trainingStore'
```

(import'u diğer import'larla birlikte dosyanın üstüne ekle)

`setOnWeeklyTick` callback'inde `tickAllProjects()` çağrısından sonra ekle:

```typescript
      const year = useTimeStore.getState().date.year
      useTrainingStore.getState().tickCourses(year)
```

Sonuç:

```typescript
  useEffect(() => {
    setOnWeeklyTick(() => {
      advance()
      const tickCount = useTimeStore.getState().tickCount
      const { totalSalary } = weeklyTick(tickCount)
      if (totalSalary > 0) addMoney(-totalSalary)
      tickAllProjects()
      const year = useTimeStore.getState().date.year
      useTrainingStore.getState().tickCourses(year)
      window.electronAPI?.saveGame({
        game:      useGameStore.getState(),
        time:      useTimeStore.getState(),
        projects:  useProjectStore.getState().projects,
        employees: useEmployeeStore.getState().employees,
      })
    })
  }, [advance, tickAllProjects, addMoney, weeklyTick, setOnWeeklyTick])
```

- [ ] **Step 7: Testleri çalıştır**

```
npx vitest run
```

Beklenen: Tüm testler PASS (trainingStore testleri de dahil).

- [ ] **Step 8: Commit**

```bash
git add src/store/employeeStore.ts src/App.tsx
git commit -m "feat: employeeStore setActiveCourse/completeCourse/tickXp + App.tsx tickCourses wiring"
```

---

## Task 5: Akademi Lokasyonu + AcademyPanel

**Files:**
- Modify: `src/store/worldStore.ts`
- Modify: `src/pixi/TriggerSystem.ts`
- Modify: `src/App.tsx`
- Create: `src/components/AcademyPanel.tsx`

- [ ] **Step 1: `src/store/worldStore.ts`'i güncelle**

`LocationId` tipini güncelle:

```typescript
export type LocationId = 'cafe' | 'fair' | 'akademi' | null
```

- [ ] **Step 2: `src/pixi/TriggerSystem.ts`'i güncelle**

`LOCATION_MAP`'e `akademi_door` ekle:

```typescript
const LOCATION_MAP: Record<string, LocationId> = {
  cafe_door:      'cafe',
  fair_entrance:  'fair',
  akademi_door:   'akademi',
}
```

- [ ] **Step 3: `src/components/AcademyPanel.tsx` oluştur**

```typescript
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
```

- [ ] **Step 4: `src/App.tsx`'e AcademyPanel ekle**

Mevcut App.tsx'i oku. `FairPanel` import'unun hemen altına ekle:

```typescript
import AcademyPanel from '@/components/AcademyPanel'
```

`{currentLocation === 'fair' && ...}` bloğunun hemen altına ekle:

```typescript
      {currentLocation === 'akademi' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <AcademyPanel />
        </div>
      )}
```

- [ ] **Step 5: Testleri çalıştır**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/worldStore.ts src/pixi/TriggerSystem.ts src/components/AcademyPanel.tsx src/App.tsx
git commit -m "feat: Akademi lokasyonu — worldStore + TriggerSystem + AcademyPanel + App.tsx"
```

---

## Task 6: EmployeeCard UI Güncellemeleri

**Files:**
- Modify: `src/components/EmployeeCard.tsx`

- [ ] **Step 1: `src/components/EmployeeCard.tsx`'i oku**

Mevcut içeriği gör.

- [ ] **Step 2: EmployeeCard'ı güncelle**

Dosyanın tamamını şu içerikle değiştir:

```typescript
import { useEmployeeStore } from '@/store/employeeStore'
import { useProjectStore } from '@/store/projectStore'
import { useTrainingStore } from '@/store/trainingStore'
import { PERSONALITY_LABELS } from '@/data/employeeNames'
import { SKILL_CAPS, COURSES, TRAITS } from '@/data/courses'
import type { Employee } from '@/types/employee'
import type { SkillKey } from '@/types/employee'

interface Props {
  employee: Employee
  isCandidate?: boolean
}

const SKILL_LABELS: Record<SkillKey, string> = {
  programming: 'Prog',
  design:      'Tasarım',
  sound:       'Ses',
  management:  'Yönet',
}

const ALL_SKILLS: SkillKey[] = ['programming', 'design', 'sound', 'management']

function SkillBar({
  label,
  value,
  xp,
  threshold,
  atCap,
}: {
  label: string
  value: number
  xp?: number
  threshold?: number
  atCap?: boolean
}) {
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
      {xp !== undefined && threshold !== undefined && (
        <span className="text-gray-500 text-xs w-14 text-right">
          {atCap ? 'MAX' : `${xp}/${threshold}`}
        </span>
      )}
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
  const inventory = useTrainingStore((s) => s.inventory)

  const currentEvent = pendingEvents.find((ev) => ev.employeeId === employee.id)

  const activePurchasedCourse = employee.activeCourseId
    ? inventory.find(pc => pc.id === employee.activeCourseId)
    : null
  const activeCourseData = activePurchasedCourse
    ? COURSES.find(c => c.id === activePurchasedCourse.courseId)
    : null

  const caps = SKILL_CAPS[employee.personality]

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
        {isCandidate ? (
          <>
            <SkillBar label="Prog"    value={employee.skills.programming} />
            <SkillBar label="Tasarım" value={employee.skills.design} />
            <SkillBar label="Ses"     value={employee.skills.sound} />
            <SkillBar label="Yönet"   value={employee.skills.management} />
          </>
        ) : (
          ALL_SKILLS.map((skill) => {
            const cap       = caps[skill]
            const atCap     = employee.skills[skill] >= cap
            const threshold = employee.skills[skill] * 10
            return (
              <SkillBar
                key={skill}
                label={SKILL_LABELS[skill]}
                value={employee.skills[skill]}
                xp={employee.xp[skill]}
                threshold={threshold}
                atCap={atCap}
              />
            )
          })
        )}
      </div>

      {/* Loyalty (only for hired employees) */}
      {!isCandidate && <LoyaltyBar value={employee.loyalty} />}

      {/* Active course */}
      {!isCandidate && activeCourseData && (
        <div className="text-xs text-blue-400 bg-blue-900/30 rounded px-2 py-1">
          🎓 {activeCourseData.name} ({activePurchasedCourse!.weeksLeft} hafta kaldı)
        </div>
      )}

      {/* Trait badges */}
      {!isCandidate && employee.traits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {employee.traits.map((traitId) => {
            const trait = TRAITS.find(t => t.id === traitId)
            return (
              <span
                key={traitId}
                className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full"
                title={trait?.description}
              >
                🏅 {trait?.name}
              </span>
            )
          })}
        </div>
      )}

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
```

- [ ] **Step 3: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/EmployeeCard.tsx
git commit -m "feat: EmployeeCard — XP çubuğu, aktif kurs, trait rozetleri"
```

---

## Self-Review

### Spec Coverage

| Spec gereksinimi | Plan görevi |
|---|---|
| `SkillKey` tipi + Employee'ye `xp`, `activeCourseId`, `traits` | Task 1 |
| `generateCandidates` yeni alanlar | Task 2 Step 3 |
| `SKILL_CAPS` kişilik bazlı tavan tablosu | Task 1 |
| `COURSES` (8 kurs), `TRAITS` (4 trait), `BACKGROUND_AFFINITY` | Task 1 |
| `tickEmployeeXp` — dominant +2, diğer +1, cap koruması | Task 2 |
| `applyXpGains` — eşik aşılınca level up, XP sıfır | Task 2 |
| `computeProjectBonus` trait çarpanı | Task 2 |
| `trainingStore.buy` — para düşer, envanter | Task 3 |
| `trainingStore.assign` — assignedTo + employee.activeCourseId | Task 3 + Task 4 |
| `trainingStore.tickCourses` — weeksLeft--, complete | Task 3 |
| Arka plan affinitesi çarpanı | Task 3 |
| `employeeStore.setActiveCourse` | Task 4 |
| `employeeStore.completeCourse` — XP, trait, activeCourseId clear | Task 4 |
| `employeeStore.tickXp` + `ekip_lideri` loyalty bonus | Task 4 |
| `weeklyTick` içinde `tickXp` çağrısı | Task 4 |
| App.tsx'te `tickCourses` wiring | Task 4 |
| `LocationId`'ye `'akademi'` | Task 5 |
| `TriggerSystem LOCATION_MAP`'e `akademi_door` | Task 5 |
| `AcademyPanel` — katalog + envanter + atama | Task 5 |
| `App.tsx` AcademyPanel render | Task 5 |
| `EmployeeCard` XP çubuğu | Task 6 |
| `EmployeeCard` aktif kurs gösterimi | Task 6 |
| `EmployeeCard` trait rozetleri | Task 6 |
| 7 trainingStore testi | Task 3 |
| 6 engine testi | Task 2 |

### Placeholder Scan

Placeholder yok. Her adımda eksiksiz kod mevcut.

### Type Consistency

- `SkillKey` → Task 1'de tanımlandı, Task 2'de `employeeEngine`'de import edildi, Task 3'te `trainingStore`'da kullanıldı, Task 6'da `EmployeeCard`'da import edildi. ✓
- `SKILL_CAPS[emp.personality]` → Task 1'de tanımlandı, Task 2'de ve Task 4'te aynı imzayla kullanıldı. ✓
- `completeCourse(employeeId, courseId, finalXp)` → Task 4'te interface'e ve impl'e eklendi, Task 3'te `trainingStore.tickCourses` içinden aynı imzayla çağrıldı. ✓
- `setActiveCourse(employeeId, courseId)` → Task 4'te tanımlandı, Task 3'te `trainingStore.assign` içinden çağrıldı. ✓
- `PurchasedCourse` tipi → Task 3'te `trainingStore.ts` içinde tanımlandı (yerel tip, export edilmiyor). Task 6'da `EmployeeCard`'da `inventory.find(pc => pc.id === ...)` ile kullanılıyor — tip `useTrainingStore`'dan otomatik çıkarılıyor. ✓
