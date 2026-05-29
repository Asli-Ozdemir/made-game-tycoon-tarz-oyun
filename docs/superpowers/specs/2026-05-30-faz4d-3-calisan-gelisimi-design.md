# Faz 4D-3 — Çalışan Gelişimi: Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Kullanım bazlı XP + kurs sistemi + trait unlock + Akademi lokasyonu
**Önceki faz:** 4D-2 — Random Event Sistemi
**Sonraki faz:** 4D-4 — Sequel & DLC

---

## Genel Bakış

Çalışanlar proje üzerinde çalışarak otomatik XP kazanır (kullanım bazlı büyüme). Oyuncu ayrıca Akademi lokasyonundan kurs satın alabilir, bu kursu bir çalışana atayabilir; kurs tamamlandığında çalışan ilgili skill'de XP kazanır ve opsiyonel bir trait (özellik) açılır. Skill büyümesi her çalışanın kişiliğine göre belirlenen bir tavana (hard cap) tabidir. Oyuncunun seçtiği arka plan, ilgili skill kurslarını daha etkili kılar.

---

## Veri Modeli

### Employee (güncelleme)

`src/types/employee.ts` içindeki `Employee` interface'ine 3 yeni alan eklenir:

```typescript
export interface Employee {
  // ... mevcut alanlar ...
  xp:             Record<SkillKey, number>  // birikmiş ham XP (0–∞), her skill için ayrı
  activeCourseId: string | null             // trainingStore'daki PurchasedCourse id'si
  traits:         string[]                  // açılmış trait id'leri
}

export type SkillKey = 'programming' | 'design' | 'sound' | 'management'
```

`generateCandidates` fonksiyonu yeni çalışanları şu başlangıç değerleriyle üretir:
- `xp: { programming: 0, design: 0, sound: 0, management: 0 }`
- `activeCourseId: null`
- `traits: []`

### Kişilik Bazlı Skill Tavanı

Her `EmployeePersonality` için her skill'in ulaşabileceği maksimum değer:

| Kişilik | programming | design | sound | management |
|---|---|---|---|---|
| odaklı | 10 | 6 | 5 | 6 |
| yaratici | 5 | 10 | 8 | 5 |
| sosyal | 5 | 7 | 6 | 10 |
| rekabetci | 8 | 8 | 5 | 7 |
| sakin | 7 | 7 | 10 | 7 |

`src/data/courses.ts`'te `SKILL_CAPS: Record<EmployeePersonality, Record<SkillKey, number>>` olarak export edilir.

### XP Eşiği

Skill seviyesi `n`'den `n+1`'e çıkmak için gereken XP: `n * 10`.
- Skill 1→2: 10 XP
- Skill 5→6: 50 XP
- Skill 9→10: 90 XP

Kişilik tavanına ulaşmış skill'e XP gelmez.

---

## Kurs Sistemi

### Tip Tanımları (`src/data/courses.ts`)

```typescript
export interface Course {
  id:          string
  name:        string
  targetSkill: SkillKey
  xpBoost:     number        // kurs tamamlandığında eklenen XP (arka plan çarpanı öncesi)
  duration:    number        // hafta cinsinden süre
  cost:        number        // $
  traitId?:    string        // tamamlandığında açılan trait id (opsiyonel)
}

export interface Trait {
  id:          string
  name:        string
  description: string
}
```

### Kurs Kataloğu (8 kurs)

| id | name | targetSkill | xpBoost | duration | cost | traitId |
|---|---|---|---|---|---|---|
| `prog_temel` | Algoritma Temelleri | programming | 15 | 4 | 8.000 | — |
| `prog_ileri` | İleri Yazılım Mimarisi | programming | 35 | 8 | 20.000 | `kod_ustasi` |
| `design_temel` | Temel Tasarım | design | 15 | 4 | 7.000 | — |
| `design_ileri` | UX Uzmanlığı | design | 35 | 8 | 18.000 | `gorsel_deha` |
| `sound_temel` | Ses Temelleri | sound | 15 | 4 | 6.000 | — |
| `sound_ileri` | Profesyonel Ses Tasarımı | sound | 35 | 8 | 16.000 | `ses_buyucusu` |
| `mgmt_temel` | Liderlik 101 | management | 15 | 4 | 7.000 | — |
| `mgmt_ileri` | Stratejik Yönetim | management | 35 | 8 | 19.000 | `ekip_lideri` |

### Trait Kataloğu (4 trait)

| id | name | description | Etki |
|---|---|---|---|
| `kod_ustasi` | Kod Ustası | Programlama konusunda usta | `computeProjectBonus`'ta programming 1.5× sayılır |
| `gorsel_deha` | Görsel Deha | Tasarım konusunda derin kavrayış | design 1.5× sayılır |
| `ses_buyucusu` | Ses Büyücüsü | Ses tasarımında üstün yetenek | sound 1.5× sayılır |
| `ekip_lideri` | Ekip Lideri | Takımı motive eden lider | management 1.5× sayılır + atanmamış çalışanlara her hafta +2 loyalty |

### Arka Plan Affinitesi

Oyuncunun seçtiği arka plan, ilgili skill kurslarını daha etkili kılar. Kurs tamamlandığında `xpBoost` şu çarpanla uygulanır:

| BackgroundId | Affinite Skill'leri | Çarpan |
|---|---|---|
| `kk_uzmani` | sound, management | 1.5× |
| `yaratici_direktor` | design | 1.5× |
| `bas_muhendis` | programming | 1.5× |
| `yapimci` | management | 1.5× |
| `eski_ceo` | tüm skill'ler | 1.2× |

`BACKGROUND_AFFINITY: Record<BackgroundId, { skills: SkillKey[]; multiplier: number }>` olarak `src/data/courses.ts`'te export edilir.

---

## XP Birikimi (Haftalık)

`employeeEngine.ts`'e yeni fonksiyon eklenir:

```typescript
export function tickEmployeeXp(
  employee: Employee,
  caps: Record<SkillKey, number>
): Record<SkillKey, number>
```

Proje üzerinde çalışan çalışan (`assignedProjectId !== null`) her hafta:
- Dominant skill (mevcut değeri en yüksek olan skill): **+2 XP**
- Diğer skill'ler: **+1 XP**
- Cap'e ulaşmış skill'lere XP gelmez

Proje üzerinde çalışmayan çalışan XP kazanmaz (kurs devam edebilir).

### Skill Seviye Atlama

Her hafta XP güncellendikten sonra, eşiği geçen skill'ler kontrol edilir:

```typescript
export function applyXpGains(
  employee: Employee,
  newXp: Record<SkillKey, number>,
  caps: Record<SkillKey, number>
): { updatedEmployee: Employee; leveledSkills: SkillKey[] }
```

`skill_level * 10` XP birikince skill +1 ve XP sıfırlanır (cap'i geçmez).

---

## TrainingStore (`src/store/trainingStore.ts`)

```typescript
interface PurchasedCourse {
  id:         string          // nanoid
  courseId:   string          // COURSES kataloğuna pointer
  weeksLeft:  number          // başlangıçta course.duration, her hafta tick'te -1
  assignedTo: string | null   // employee id
}

interface TrainingStore {
  inventory:      PurchasedCourse[]

  buy:            (courseId: string) => void            // para düşer, envantere girer
  assign:         (purchasedId: string, employeeId: string) => void
  tickCourses:    (year: number) => void                // her hafta çağrılır, weeksLeft--; sıfırda complete
  reset:          () => void
}
```

**`buy`:** `useGameStore.getState().addMoney(-course.cost)` çağrılır; `PurchasedCourse` oluşturulur (`weeksLeft = course.duration`, `assignedTo: null`).

**`assign`:** `PurchasedCourse.assignedTo = employeeId` set edilir; `employee.activeCourseId = purchasedCourse.id` set edilir (`useEmployeeStore` üzerinden). Zaten `activeCourseId !== null` olan çalışana atama yapılamaz — bu çalışanlar AcademyPanel'in atama dropdown'unda listelenmez.

**`tickCourses`:** Her `PurchasedCourse` için `weeksLeft--`. `weeksLeft === 0` olan kurslar için:
1. Arka plan affinitesi çarpanı hesaplanır (`characterStore.background`)
2. `finalXp = course.xpBoost * multiplier` hesaplanır
3. `useEmployeeStore.getState().completeCourse(employeeId, courseId, finalXp)` çağrılır
4. `PurchasedCourse` envanterden silinir

---

## EmployeeStore Güncellemeleri

`employeeStore.ts`'e iki yeni action eklenir:

**`tickXp()`:** Her hafta `tickAllProjects` sonrası çağrılır. Her atanmış çalışan için `tickEmployeeXp` + `applyXpGains` çalıştırır. Skill level atlarsa news item eklemez (sessiz güncelleme).

**`completeCourse(employeeId, courseId, finalXp)`:**
- `employee.xp[targetSkill] += finalXp` (ve level atlama kontrolü)
- `course.traitId` varsa `employee.traits`'e eklenir
- `employee.activeCourseId = null`

**`weeklyTick`** güncellenir: mevcut loyalty/energy güncellemesinin sonuna `tickXp()` çağrısı eklenir.

---

## `computeProjectBonus` Güncellemesi

`employeeEngine.ts`'teki mevcut fonksiyon trait bonuslarını hesaba katar:

```typescript
export function computeProjectBonus(assignedEmployees: Employee[]): number {
  return assignedEmployees.reduce((sum, emp) => {
    const traitMultiplier = (skill: SkillKey) =>
      emp.traits.includes(`${skill === 'programming' ? 'kod_ustasi' : skill === 'design' ? 'gorsel_deha' : skill === 'sound' ? 'ses_buyucusu' : 'ekip_lideri'}`)
        ? 1.5 : 1.0
    const prog    = emp.skills.programming * traitMultiplier('programming')
    const design  = emp.skills.design      * traitMultiplier('design')
    const sound   = emp.skills.sound       * traitMultiplier('sound')
    const skillAvg = (prog + design + sound) / 3
    return sum + (skillAvg / 10) * 2 * (emp.energy / 100)
  }, 0)
}
```

`ekip_lideri` trait'i için haftalık loyalty bonusu `employeeStore.tickXp()` içinde uygulanır: `ekip_lideri` trait'i olan çalışan varsa, `assignedProjectId === null` olan diğer çalışanların `loyalty` değeri +2 artar (max 100).

---

## Akademi Lokasyonu

### worldStore

`LocationId` genişletilir:

```typescript
export type LocationId = 'cafe' | 'fair' | 'akademi' | null
```

### TriggerSystem

`LOCATION_MAP`'e eklenir:

```typescript
akademi_door: 'akademi'
```

Harita dosyasında (`public/assets/map.tmx`) `akademi_door` adında bir trigger nesnesi eklenmelidir.

### App.tsx

```typescript
{currentLocation === 'akademi' && (
  <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
    <AcademyPanel />
  </div>
)}
```

### AcademyPanel (`src/components/AcademyPanel.tsx`)

İki bölüm:

**Kurs Kataloğu:** Tüm 8 kurs listelenir. Her satırda:
- Kurs adı, hedef skill, XP boost, süre, maliyet
- Arka plan affinite bonusu varsa `★ [Arka Plan Adı] bonusu aktif` etiketi
- `[Al]` butonu — para yetmezse disabled
- Kurs zaten envanterdeyse `[Envanterde]` etiketi

**Envanter:** Satın alınmış, henüz atanmamış kurslar listelenir. Her satırda:
- Kurs adı
- `[Çalışana At ▾]` dropdown (işe alınmış çalışanlar + zaten aktif kursu olmayanlar)

---

## EmployeeCard Güncellemeleri

Mevcut skill bar'larının altına eklenir:

1. **XP çubuğu** — her skill için mevcut XP / threshold gösterimi:
   `prog ████████░░ 8  [12/80 XP]`

2. **Aktif kurs** — `activeCourseId` varsa:
   `🎓 Algoritma Temelleri (3 hafta kaldı)`

3. **Trait rozetleri** — `traits` dizisindeki her trait için küçük rozet:
   `🏅 Kod Ustası`

---

## Entegrasyon Noktaları

| Dosya | Değişiklik |
|---|---|
| `src/types/employee.ts` | `SkillKey` tipi + `Employee`'ye `xp`, `activeCourseId`, `traits` |
| `src/data/courses.ts` | Yeni dosya: `COURSES`, `TRAITS`, `SKILL_CAPS`, `BACKGROUND_AFFINITY` |
| `src/engine/employeeEngine.ts` | `tickEmployeeXp`, `applyXpGains`, `computeProjectBonus` güncelleme |
| `src/store/trainingStore.ts` | Yeni dosya: `useTrainingStore` |
| `src/store/employeeStore.ts` | `tickXp`, `completeCourse` action'ları + `weeklyTick` güncelleme |
| `src/store/worldStore.ts` | `LocationId`'ye `'akademi'` eklenir |
| `src/pixi/TriggerSystem.ts` | `LOCATION_MAP`'e `akademi_door` eklenir |
| `src/App.tsx` | `AcademyPanel` render |
| `src/components/AcademyPanel.tsx` | Yeni bileşen |
| `src/components/EmployeeCard.tsx` | XP çubuğu, aktif kurs, trait rozetleri |

---

## Test Stratejisi

### `tests/engine/employeeEngine.test.ts` (eklenti)

1. `tickEmployeeXp` — atanmış çalışan dominant skill'e +2, diğerlerine +1 XP kazanır
2. `tickEmployeeXp` — atanmamış çalışan XP kazanmaz
3. `tickEmployeeXp` — cap'e ulaşmış skill XP kazanmaz
4. `applyXpGains` — eşik aşılınca skill +1, XP sıfırlanır
5. `applyXpGains` — cap aşılmaz
6. `computeProjectBonus` — `kod_ustasi` trait'i programming'i 1.5× katar

### `tests/store/trainingStore.test.ts`

1. `buy` — para düşer, envantere kurs girer
2. `buy` — para yetmezse satın alım gerçekleşmez
3. `assign` — `assignedTo` set edilir, `employee.activeCourseId` güncellenir
4. `tickCourses` — `weeksLeft` azalır
5. `tickCourses` — kurs tamamlandığında XP eklenir, trait açılır, `activeCourseId` temizlenir
6. `tickCourses` — arka plan affinitesi çarpanı doğru uygulanır
7. `reset` — envanter temizlenir

---

## Kapsam Dışı (Faz 4D-3)

- Birden fazla aktif kurs per çalışan
- Kursun iptal edilmesi / geri alınması
- XP veya kurs verilerinin save/load'da persist edilmesi
- Çalışan seviye atlayınca NewsFeed haberi
- Trait bazlı özel animasyon veya efekt
