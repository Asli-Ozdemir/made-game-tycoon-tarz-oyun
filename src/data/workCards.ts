// src/data/workCards.ts
import type { FocusAxis } from '@/engine/qualityAxes'

export interface BugCard {
  id:      string
  text:    string   // senaryo
  penalty: number   // 'geç' seçilirse qualityPoints düşüşü
}

export interface FocusOption {
  axis:  FocusAxis
  label: string
  emoji: string
}

export interface SparkCard {
  id:   string
  text: string
}

// 🐛 Bug kartları — 'düzelt' her zaman +1 hafta & +2 heves; 'geç' aşağıdaki penalty
export const BUG_CARDS: BugCard[] = [
  { id: 'render',  text: 'Üçüncü bölümde karakter duvardan geçiyor.',        penalty: 10 },
  { id: 'audio',   text: 'Ses efektleri rastgele kesiliyor.',                penalty: 5  },
  { id: 'save',    text: 'Kayıt dosyası bazen bozuluyor.',                    penalty: 15 },
  { id: 'collide', text: 'Çarpışma kutuları yanlış hizalanmış.',             penalty: 8  },
  { id: 'dialog',  text: 'Diyaloglar bazen atlanıyor.',                       penalty: 6  },
  { id: 'fps',     text: 'Kalabalık sahnelerde kare hızı düşüyor.',          penalty: 9  },
  { id: 'ui',      text: 'Menü düğmeleri farklı çözünürlüklerde kayıyor.',   penalty: 7  },
  { id: 'loc',     text: 'Bazı metinler ekrana sığmıyor.',                    penalty: 5  },
]

// Daha ağır varyant — önceki seansta 'geç' seçildiyse (harderBug) buradan çekilir
export const HARDER_BUG_CARDS: BugCard[] = [
  { id: 'crash',   text: 'Bıraktığın bug büyüdü: oyun açılışta çöküyor.',    penalty: 18 },
  { id: 'corrupt', text: 'Ertelenen hata yayıldı: ilerleme kaydı silindi.',  penalty: 20 },
]

// 🎯 Odak — sabit 4 seçenek
export const FOCUS_OPTIONS: FocusOption[] = [
  { axis: 'gameplay', label: 'Gameplay', emoji: '🎮' },
  { axis: 'graphics', label: 'Grafik',   emoji: '🎨' },
  { axis: 'audio',    label: 'Ses',      emoji: '🎵' },
  { axis: 'story',    label: 'Hikaye',   emoji: '📖' },
]

// 💡 Kıvılcım havuzu — not yoksa buradan rastgele çekilir
export const SPARK_CARDS: SparkCard[] = [
  { id: 'ending',   text: 'Aklına mükemmel bir son bölüm fikri geldi.' },
  { id: 'secret',   text: 'Gizli bir geçit mekaniği düşündün.' },
  { id: 'twist',    text: 'Hikayeye beklenmedik bir dönüş ekleyebilirsin.' },
  { id: 'combo',    text: 'Yeni bir kombo sistemi kafanda canlandı.' },
  { id: 'ambient',  text: 'Atmosferi güçlendirecek bir ses katmanı fikri.' },
  { id: 'npc',      text: 'Unutulmaz bir yan karakter fikri belirdi.' },
]

export const SPARK_APPLY_QUALITY = 15   // 'uygula' → qualityPoints
export const SPARK_APPLY_WEEKS   = 2    // 'uygula' → ek hafta
export const SPARK_SAVE_CARRY    = 10   // 'sonraya sakla' → sonraki projeye
export const SESSION_BASE_WEEKS  = 2    // her seans temel ilerleme
export const BUG_FIX_WEEKS       = 1    // 'düzelt' ek hafta
export const BUG_FIX_HEVES       = 2    // 'düzelt' iade
