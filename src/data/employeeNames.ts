import type { EmployeePersonality, LifeEventType } from '@/types/employee'

export const FIRST_NAMES = [
  'Ahmet', 'Mehmet', 'Zeynep', 'Ayşe', 'Can', 'Deniz', 'Ece', 'Fatma',
  'Hasan', 'İpek', 'Kemal', 'Leyla', 'Murat', 'Nilüfer', 'Ozan', 'Pınar',
  'Rıza', 'Selin', 'Tamer', 'Ülkü', 'Burak', 'Canan', 'Emre', 'Gizem'
]

export const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız',
  'Arslan', 'Doğan', 'Aydın', 'Özkan', 'Kurt', 'Şimşek'
]

export const PERSONALITY_LABELS: Record<EmployeePersonality, string> = {
  odakli:     'Odaklı',
  yaratici:   'Yaratıcı',
  sosyal:     'Sosyal',
  rekabetci:  'Rekabetçi',
  sakin:      'Sakin',
}

export const LIFE_EVENT_DESCRIPTIONS: Record<LifeEventType, (name: string) => string> = {
  hasta:        (n) => `${n} bu hafta hasta, ofise gelemedi.`,
  rakip_teklif: (n) => `Rakip şirket ${n}'a iş teklifi yaptı.`,
  kisisel_kriz: (n) => `${n} kişisel bir krizle baş etmeye çalışıyor.`,
  dogum_gunu:   (n) => `Bugün ${n}'ın doğum günü! Moral artışı sağladı.`,
}
