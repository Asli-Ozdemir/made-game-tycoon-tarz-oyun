# Faz 4D-2 — Random Event Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyun sırasında haftalık/yıllık/milestone bazlı random eventlerin tetiklenmesi; pasif eventler NewsFeed'e düşer, choice eventleri oyuncudan karar isteyen bir modal açar.

**Architecture:** Saf fonksiyonlardan oluşan `eventEngine` (filtreleme + ağırlıklı seçim) ve state tutan `eventStore` (pending event, cooldownlar) ayrı tutulur. 52-event kataloğu `src/data/events.ts`'te statik veri olarak tanımlanır. `EventModal` bileşeni `App.tsx`'te ResolutionScreen gibi kapı işlevi görür.

**Tech Stack:** TypeScript, Zustand, React, Tailwind CSS, Vitest

---

## File Map

| Dosya | İşlem | Sorumluluk |
|---|---|---|
| `src/types/rival.ts` | Güncelle | NewsType'a `'random_event'` ekle |
| `src/data/events.ts` | Oluştur | 52-event kataloğu, tip tanımları |
| `src/engine/eventEngine.ts` | Oluştur | candidateEvents, pickEvent, isChoiceAvailable saf fonksiyonlar |
| `src/store/projectStore.ts` | Güncelle | `applyEventEffect(qualityBonus, weekDelay)` action'ı ekle |
| `src/store/eventStore.ts` | Oluştur | pendingEvent, cooldowns, tryWeeklyEvent, tryAnnualEvent, checkMilestones, resolveEvent, reset |
| `src/components/EventModal.tsx` | Oluştur | Choice/passive event UI |
| `src/components/Dashboard.tsx` | Güncelle | week useEffect + year useEffect eklentisi + reset |
| `src/App.tsx` | Güncelle | EventModal gating |
| `tests/engine/eventEngine.test.ts` | Oluştur | 8 test |
| `tests/store/eventStore.test.ts` | Oluştur | 8 test |

---

## Task 1: NewsType + Event Kataloğu

**Files:**
- Modify: `src/types/rival.ts`
- Create: `src/data/events.ts`

- [ ] **Step 1: `src/types/rival.ts` içinde NewsType'a `'random_event'` ekle**

Mevcut dosyayı oku, ardından NewsType union'ı şu şekilde güncelle:

```typescript
export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'
  | 'market_trend'
  | 'random_event'
```

- [ ] **Step 2: `src/data/events.ts` oluştur — tip tanımları**

```typescript
export type EventCategory = 'finansal' | 'studyo' | 'sektor' | 'kisisel' | 'rakip'

export interface EventEffect {
  money?:         number   // + veya –
  reputation?:    number   // + veya –
  qualityBonus?:  number   // aktif projelerin qualityPoints toplamına eklenir
  weekDelay?:     number   // aktif projelerin totalWeeks değerine eklenir
  employeeLeave?: boolean  // rastgele bir çalışan işten ayrılır
}

export interface EventChoice {
  text:       string
  condition?: { minMoney?: number; minReputation?: number }
  effect:     EventEffect
}

export interface RandomEvent {
  id:            string
  category:      EventCategory
  title:         string
  description:   string
  type:          'passive' | 'choice'
  weight:        number          // 1–10
  cooldownYears: number
  trigger?: {
    minReputation?: number
    maxReputation?: number
    minMoney?:      number
    maxMoney?:      number
    minPublished?:  number
  }
  effect?:   EventEffect    // type === 'passive' için
  choices?:  EventChoice[]  // type === 'choice' için
}
```

- [ ] **Step 3: `src/data/events.ts`'e EVENTS kataloğunu ekle**

Aşağıdaki içeriği aynı dosyaya (tip tanımlarının altına) ekle:

```typescript
export const EVENTS: RandomEvent[] = [
  // ── FİNANSAL (12) ─────────────────────────────────────────────────────────
  {
    id: 'vergi_denetimi', category: 'finansal', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minPublished: 2 },
    title: 'Vergi Denetimi',
    description: 'Maliye müfettişleri stüdyona geldi. Kayıtlarınızı incelemek istiyorlar.',
    choices: [
      { text: 'Kayıtları Düzenle (-$15.000)', effect: { money: -15000 } },
      { text: 'Denetçiyle İşbirliği Yap (-$5.000, -5 itibar)', effect: { money: -5000, reputation: -5 } },
      { text: 'İtiraz Et (min. 40 itibar)', condition: { minReputation: 40 }, effect: { reputation: -10 } },
    ],
  },
  {
    id: 'yatirimci_teklifi', category: 'finansal', type: 'choice',
    weight: 6, cooldownYears: 4,
    trigger: { minReputation: 40 },
    title: 'Yatırımcı Teklifi',
    description: 'Bir risk sermayesi fonu stüdyonuza yatırım yapmak istiyor. Bağımsızlığınızdan ödün vermeniz gerekebilir.',
    choices: [
      { text: 'Yatırımı Kabul Et (+$100.000, -5 itibar)', effect: { money: 100000, reputation: -5 } },
      { text: 'Reddet (+5 itibar)', effect: { reputation: 5 } },
      { text: 'Müzakere Et (min. 60 itibar, +$75.000)', condition: { minReputation: 60 }, effect: { money: 75000 } },
    ],
  },
  {
    id: 'banka_kredisi', category: 'finansal', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Banka Kredi Teklifi',
    description: 'Yerel banka stüdyonuza uygun koşullarla kredi teklif ediyor.',
    choices: [
      { text: 'Krediyi Al (+$50.000)', effect: { money: 50000 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'beklenmedik_gider', category: 'finansal', type: 'passive',
    weight: 7, cooldownYears: 2,
    title: 'Beklenmedik Gider',
    description: 'Ofis ekipmanı bakım ve onarım maliyetleri hesaptan fazla çıktı.',
    effect: { money: -8000 },
  },
  {
    id: 'sponsor_anlasma', category: 'finansal', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 30 },
    title: 'Sponsor Anlaşması',
    description: 'Bir teknoloji şirketi ürününüzü tanıtmanız karşılığında sponsorluk teklif ediyor.',
    choices: [
      { text: 'Anlaşmayı Kabul Et (+$30.000, -3 itibar)', effect: { money: 30000, reputation: -3 } },
      { text: 'Reddet (+3 itibar)', effect: { reputation: 3 } },
    ],
  },
  {
    id: 'sigorta_odemesi', category: 'finansal', type: 'passive',
    weight: 4, cooldownYears: 4,
    trigger: { minPublished: 2 },
    title: 'Sigorta Ödemesi',
    description: 'Geçen yıl yaptığınız sigorta başvurusu onaylandı. Ödeme hesabınıza yatırıldı.',
    effect: { money: 12000 },
  },
  {
    id: 'hisse_kazanci', category: 'finansal', type: 'passive',
    weight: 3, cooldownYears: 3,
    trigger: { minMoney: 50000 },
    title: 'Hisse Senedi Kazancı',
    description: 'Birkaç yıl önce aldığınız teknoloji hisseleri iyi getiri sağladı.',
    effect: { money: 20000 },
  },
  {
    id: 'para_cezasi', category: 'finansal', type: 'passive',
    weight: 5, cooldownYears: 2,
    title: 'Para Cezası',
    description: 'Belediye ruhsat yenileme gecikmeniz nedeniyle idari para cezası uygulandı.',
    effect: { money: -5000, reputation: -3 },
  },
  {
    id: 'muhasebe_hatasi', category: 'finansal', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Muhasebe Hatası',
    description: 'Muhasebecinin fark ettiği bir hata var. Düzeltmek mi, yoksa görmezden mi gelmek?',
    choices: [
      { text: 'Hatayı Düzelt (-$3.000)', effect: { money: -3000 } },
      { text: 'Yoksay (-8 itibar)', effect: { reputation: -8 } },
    ],
  },
  {
    id: 'kredi_karti_dolandiriciligi', category: 'finansal', type: 'choice',
    weight: 3, cooldownYears: 4,
    title: 'Dolandırıcılık Girişimi',
    description: 'Stüdyo hesabına şüpheli bir işlem yapılmaya çalışıldı. Ne yapacaksınız?',
    choices: [
      { text: 'Kartı İptal Et (-$2.000 işlem ücreti)', effect: { money: -2000 } },
      { text: 'Bankayı Ara (ücretsiz, biraz zaman kaybı)', effect: {} },
    ],
  },
  {
    id: 'devlet_destegi', category: 'finansal', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minReputation: 50 },
    title: 'Devlet Destek Hibesi',
    description: 'Kültür Bakanlığı yerli oyun geliştiricilerine hibe açıkladı. Başvurmak ister misiniz?',
    choices: [
      { text: 'Başvur (+$40.000)', effect: { money: 40000 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'beklenmedik_gelir', category: 'finansal', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 3 },
    title: 'Beklenmedik Royalty Geliri',
    description: 'Eski oyunlarınızdan birinin yabancı pazarlardaki satışları beklenmedik gelir sağladı.',
    effect: { money: 25000 },
  },

  // ── STÜDYO (12) ────────────────────────────────────────────────────────────
  {
    id: 'ekipman_arizasi', category: 'studyo', type: 'passive',
    weight: 7, cooldownYears: 2,
    title: 'Ekipman Arızası',
    description: 'Ana geliştirme sunucusu arıza yaptı. Ekip bir hafta yedek makinelerle çalışmak zorunda.',
    effect: { money: -6000, weekDelay: 1 },
  },
  {
    id: 'ofis_su_baskini', category: 'studyo', type: 'choice',
    weight: 3, cooldownYears: 5,
    title: 'Su Baskını',
    description: 'Üst kattaki boru patladı, ofisin bir bölümü zarar gördü.',
    choices: [
      { text: 'Ekibi Geçici Mekâna Taşı (-$10.000)', effect: { money: -10000 } },
      { text: 'Sigorta Talep Et (-$3.000, +2 hafta gecikme)', effect: { money: -3000, weekDelay: 2 } },
    ],
  },
  {
    id: 'buyuk_bug', category: 'studyo', type: 'choice',
    weight: 6, cooldownYears: 2,
    trigger: { minPublished: 1 },
    title: 'Kritik Bug Bulundu',
    description: 'Geliştirme sürecinde oyunun temel sistemini etkileyen kritik bir hata keşfedildi.',
    choices: [
      { text: 'Hemen Düzelt (+1 hafta gecikme)', effect: { weekDelay: 1 } },
      { text: 'Sonraya Bırak (-8 itibar)', effect: { reputation: -8 } },
      { text: 'Dış Kaynak Kullan (min. $15.000)', condition: { minMoney: 15000 }, effect: { money: -15000 } },
    ],
  },
  {
    id: 'viral_sosyal_medya', category: 'studyo', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Viral Sosyal Medya',
    description: 'Stüdyonuzun geliştirme günlüğü sosyal medyada viral oldu. İtibarınız artıyor.',
    effect: { reputation: 10 },
  },
  {
    id: 'ekip_moral_krizi', category: 'studyo', type: 'choice',
    weight: 6, cooldownYears: 3,
    title: 'Ekip Moral Krizi',
    description: 'Ekip yorgun ve motivasyonu düşük. Bir şeyler yapmazsanız proje kalitesi düşebilir.',
    choices: [
      { text: 'Bonus Ver (min. $10.000)', condition: { minMoney: 10000 }, effect: { money: -10000, qualityBonus: 15 } },
      { text: 'Motivasyon Konuşması Yap (+5 kalite)', effect: { qualityBonus: 5 } },
      { text: 'Görmezden Gel (-10 kalite)', effect: { qualityBonus: -10 } },
    ],
  },
  {
    id: 'yeni_yazilim_lisansi', category: 'studyo', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minMoney: 20000 },
    title: 'Yeni Yazılım Lisansı',
    description: 'Bir geliştirme aracı şirketi stüdyonuza özel fiyat teklif etti.',
    choices: [
      { text: 'Satın Al (min. $20.000, +20 kalite)', condition: { minMoney: 20000 }, effect: { money: -20000, qualityBonus: 20 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'yangin_alarmi', category: 'studyo', type: 'passive',
    weight: 4, cooldownYears: 3,
    title: 'Yangın Alarmı',
    description: 'Yanlış alarm nedeniyle ofis tahliye edildi, bir günlük iş kaybı yaşandı.',
    effect: { weekDelay: 1 },
  },
  {
    id: 'internet_kesintisi', category: 'studyo', type: 'passive',
    weight: 6, cooldownYears: 2,
    title: 'İnternet Kesintisi',
    description: 'Sağlayıcı kaynaklı kesinti ekibin verimliliğini ciddi düşürdü.',
    effect: { weekDelay: 1 },
  },
  {
    id: 'basarili_crunch', category: 'studyo', type: 'passive',
    weight: 5, cooldownYears: 2,
    trigger: { minPublished: 1 },
    title: 'Başarılı Crunch Dönemi',
    description: 'Ekip gönüllü olarak fazla mesai yaptı ve beklenmedik kalite artışı sağlandı.',
    effect: { qualityBonus: 20 },
  },
  {
    id: 'ofis_tasinma', category: 'studyo', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minMoney: 30000 },
    title: 'Ofis Taşıma Fırsatı',
    description: 'Daha iyi bir lokasyonda uygun fiyatlı ofis çıktı. Taşınmak ekip üretkenliğini artırabilir.',
    choices: [
      { text: 'Taşın (min. $30.000, +30 kalite)', condition: { minMoney: 30000 }, effect: { money: -30000, qualityBonus: 30 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'veri_kaybi', category: 'studyo', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Veri Kaybı',
    description: 'Disk arızası nedeniyle bir kısım proje verisi kayboldu.',
    choices: [
      { text: 'Yedekten Kurtar (+2 hafta gecikme)', effect: { weekDelay: 2 } },
      { text: 'Yeniden Yaz (+4 hafta, -10 kalite)', effect: { weekDelay: 4, qualityBonus: -10 } },
    ],
  },
  {
    id: 'sosyal_medya_krizi', category: 'studyo', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minReputation: 40 },
    title: 'Sosyal Medya Krizi',
    description: 'Bir çalışanın kişisel paylaşımı stüdyo itibarını zedeliyor.',
    choices: [
      { text: 'Özür Dile (-5 itibar)', effect: { reputation: -5 } },
      { text: 'Sessiz Kal (-15 itibar)', effect: { reputation: -15 } },
      { text: 'PR Ajansı Tut (min. $8.000, -2 itibar)', condition: { minMoney: 8000 }, effect: { money: -8000, reputation: -2 } },
    ],
  },

  // ── SEKTÖR (10) ────────────────────────────────────────────────────────────
  {
    id: 'piyasa_cokusu', category: 'sektor', type: 'passive',
    weight: 3, cooldownYears: 5,
    title: 'Oyun Piyasası Çöküşü',
    description: 'Sektörde genel bir durgunluk yaşanıyor. Gelirler ve itibar etkileniyor.',
    effect: { money: -15000, reputation: -5 },
  },
  {
    id: 'yeni_platform_duyurusu', category: 'sektor', type: 'passive',
    weight: 4, cooldownYears: 4,
    title: 'Yeni Platform Duyurusu',
    description: 'Büyük bir şirket yeni nesil oyun platformunu duyurdu. Sektörde heyecan var.',
    effect: { reputation: 5 },
  },
  {
    id: 'buyuk_firma_iflas', category: 'sektor', type: 'passive',
    weight: 3, cooldownYears: 5,
    title: 'Büyük Firma İflas',
    description: 'Sektörün köklü firmalarından biri kapılarını kapattı. Piyasa yeniden şekilleniyor.',
    effect: { reputation: 3 },
  },
  {
    id: 'endustri_grevi', category: 'sektor', type: 'choice',
    weight: 3, cooldownYears: 5,
    title: 'Endüstri Grevi',
    description: 'Oyun geliştiricileri sendikası genel grev ilan etti. Tutumunuzu belirleyin.',
    choices: [
      { text: 'Grevi Destekle (+8 itibar, +2 hafta gecikme)', effect: { reputation: 8, weekDelay: 2 } },
      { text: 'Çalışmaya Devam Et (-5 itibar)', effect: { reputation: -5 } },
    ],
  },
  {
    id: 'yeni_motor_cikti', category: 'sektor', type: 'choice',
    weight: 5, cooldownYears: 4,
    trigger: { minMoney: 15000 },
    title: 'Yeni Oyun Motoru Çıktı',
    description: 'Devrim niteliğinde bir oyun motoru piyasaya çıktı. Lisans almak ister misiniz?',
    choices: [
      { text: 'Lisans Al (min. $15.000, +25 kalite)', condition: { minMoney: 15000 }, effect: { money: -15000, qualityBonus: 25 } },
      { text: 'Bekle', effect: {} },
    ],
  },
  {
    id: 'oyun_festivali', category: 'sektor', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 35 },
    title: 'Oyun Festivali Daveti',
    description: 'Uluslararası bir oyun fuarına katılım daveti geldi.',
    choices: [
      { text: 'Katıl (-$5.000, +15 itibar)', effect: { money: -5000, reputation: 15 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'medya_ilgisi', category: 'sektor', type: 'passive',
    weight: 6, cooldownYears: 2,
    trigger: { minPublished: 2 },
    title: 'Oyun Medyasının İlgisi',
    description: 'Büyük bir oyun dergisi stüdyonuzu "izlenmesi gereken isimler" listesine ekledi.',
    effect: { reputation: 8 },
  },
  {
    id: 'telif_hukuku_degisikligi', category: 'sektor', type: 'passive',
    weight: 3, cooldownYears: 5,
    title: 'Telif Hukuku Değişikliği',
    description: 'Yeni düzenlemeler bazı mevcut içerik lisanslarını etkiliyor. Hukuki belirsizlik itibarı düşürüyor.',
    effect: { reputation: -3 },
  },
  {
    id: 'konsol_savas', category: 'sektor', type: 'passive',
    weight: 4, cooldownYears: 4,
    title: 'Konsol Savaşı',
    description: 'İki büyük konsol üreticisi arasındaki rekabet bağımsız stüdyolara dikkat çekiyor.',
    effect: { reputation: 3 },
  },
  {
    id: 'indie_dalga', category: 'sektor', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Indie Dalga',
    description: 'Bağımsız oyun geliştiricileri bu dönem sektörde büyük ilgi görüyor.',
    effect: { reputation: 5 },
  },

  // ── KİŞİSEL (8) ────────────────────────────────────────────────────────────
  {
    id: 'konferans_daveti', category: 'kisisel', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 30 },
    title: 'Konferans Daveti',
    description: 'Teknoloji konferansı sizi konuşmacı olarak davet ediyor.',
    choices: [
      { text: 'Katıl (-$3.000, +12 itibar)', effect: { money: -3000, reputation: 12 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'roportaj_talebi', category: 'kisisel', type: 'choice',
    weight: 6, cooldownYears: 2,
    trigger: { minReputation: 25 },
    title: 'Röportaj Talebi',
    description: 'Popüler bir oyun podcast\'i sizi misafir olarak istiyor.',
    choices: [
      { text: 'Kabul Et (+8 itibar)', effect: { reputation: 8 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'mentorlik_teklifi', category: 'kisisel', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minReputation: 50 },
    title: 'Mentörlük Teklifi',
    description: 'Genç bir geliştirici sizi mentor olarak istiyor. Zaman ayırır mısınız?',
    choices: [
      { text: 'Kabul Et (+10 itibar)', effect: { reputation: 10 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'yorgunluk_krizi', category: 'kisisel', type: 'choice',
    weight: 5, cooldownYears: 3,
    title: 'Tükenmişlik Krizi',
    description: 'Aşırı çalışmanın faturasını ödüyorsunuz. Bir adım geri çekilmek gerekiyor.',
    choices: [
      { text: 'Dinlen (+2 hafta gecikme ama sağlıklı çalış)', effect: { weekDelay: 2 } },
      { text: 'Çalışmaya Devam Et (-15 kalite)', effect: { qualityBonus: -15 } },
    ],
  },
  {
    id: 'aile_ziyareti', category: 'kisisel', type: 'passive',
    weight: 5, cooldownYears: 2,
    title: 'Aile Ziyareti',
    description: 'Aileniz şehre geldi. Birkaç günü onlarla geçirmek zorunda kaldınız.',
    effect: { weekDelay: 1 },
  },
  {
    id: 'saglik_sorunu', category: 'kisisel', type: 'choice',
    weight: 4, cooldownYears: 3,
    title: 'Sağlık Sorunu',
    description: 'Hafif bir sağlık sorunu yaşadınız. Doktor dinlenme öneriyor.',
    choices: [
      { text: 'İstirahat Al (+2 hafta gecikme, +10 kalite)', effect: { weekDelay: 2, qualityBonus: 10 } },
      { text: 'Çalışmaya Devam Et (-5 kalite, -2 itibar)', effect: { qualityBonus: -5, reputation: -2 } },
    ],
  },
  {
    id: 'kitap_teklifi', category: 'kisisel', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minReputation: 60 },
    title: 'Kitap Yazma Teklifi',
    description: 'Bir yayınevi oyun geliştirme deneyimlerinizi kitaplaştırmanızı öneriyor.',
    choices: [
      { text: 'Kabul Et (+$15.000, +8 itibar)', effect: { money: 15000, reputation: 8 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'odul_toreni_daveti', category: 'kisisel', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minReputation: 45 },
    title: 'Ödül Töreni Daveti',
    description: 'Sektörün prestijli ödül törenine davet edildiniz.',
    choices: [
      { text: 'Katıl (-$2.000, +10 itibar)', effect: { money: -2000, reputation: 10 } },
      { text: 'Reddet', effect: {} },
    ],
  },

  // ── RAKİP (10) ─────────────────────────────────────────────────────────────
  {
    id: 'rakip_casusluk', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minReputation: 50 },
    title: 'Rakipten Casusluk İddiası',
    description: 'Bir rakip stüdyonun çalışanlarınızı takip ettiği öğrenildi.',
    choices: [
      { text: 'Hukuki Yol (-$8.000, +5 itibar)', effect: { money: -8000, reputation: 5 } },
      { text: 'Basına Sız (-3 itibar)', effect: { reputation: -3 } },
      { text: 'Yoksay', effect: {} },
    ],
  },
  {
    id: 'rakip_calisan_teklifi', category: 'rakip', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 40 },
    title: 'Rakip Çalışan Teklifi',
    description: 'Rakip bir stüdyonun yetenekli çalışanı size geçmek istiyor.',
    choices: [
      { text: 'Teklifi Geri Çevir', effect: {} },
      { text: 'Kabul Et (+5 itibar, +15 kalite)', effect: { reputation: 5, qualityBonus: 15 } },
      { text: 'Contra Teklif (min. $5.000)', condition: { minMoney: 5000 }, effect: { money: -5000, qualityBonus: 20 } },
    ],
  },
  {
    id: 'fikir_hirsizligi_iddiasi', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minPublished: 2 },
    title: 'Fikir Hırsızlığı İddiası',
    description: 'Bir rakip stüdyo oyununuzun kendi fikirlerini çaldığını iddia ediyor.',
    choices: [
      { text: 'Dava Aç (-$10.000, +5 itibar)', effect: { money: -10000, reputation: 5 } },
      { text: 'Uzlaş (-$3.000)', effect: { money: -3000 } },
      { text: 'Yoksay (-5 itibar)', effect: { reputation: -5 } },
    ],
  },
  {
    id: 'rakip_isbirligi', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minReputation: 35 },
    title: 'Rakip İşbirliği Teklifi',
    description: 'Bir rakip stüdyo ortak proje için işbirliği teklif ediyor.',
    choices: [
      { text: 'Kabul Et (+8 itibar, +$20.000)', effect: { reputation: 8, money: 20000 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'rakip_kopyalama', category: 'rakip', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Rakip Oyununu Kopyaladı',
    description: 'Bir rakip stüdyonun oyununuzun mekaniklerini birebir kopyaladığı ortaya çıktı. Topluluk sizi destekliyor.',
    effect: { reputation: 5 },
  },
  {
    id: 'rakip_iflas_firsati', category: 'rakip', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minMoney: 100000 },
    title: 'Rakip İflas Fırsatı',
    description: 'İflas eden rakip stüdyonun varlıklarını satın alma fırsatı doğdu.',
    choices: [
      { text: 'Satın Al (min. $100.000, +15 itibar)', condition: { minMoney: 100000 }, effect: { money: -100000, reputation: 15 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'sektorde_dedikodu', category: 'rakip', type: 'passive',
    weight: 6, cooldownYears: 2,
    title: 'Sektörde Dedikodu',
    description: 'Stüdyonuz hakkında asılsız dedikodular dolaşıyor. İtibarınız hafifçe zarar gördü.',
    effect: { reputation: -3 },
  },
  {
    id: 'rakip_medyada_atakta', category: 'rakip', type: 'passive',
    weight: 5, cooldownYears: 2,
    trigger: { minReputation: 30 },
    title: 'Rakip Medyada Atakta',
    description: 'Rakip stüdyo agresif bir medya kampanyasıyla dikkat çekiyor. Gölgede kaldınız.',
    effect: { reputation: -5 },
  },
  {
    id: 'talent_savasi', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minReputation: 45 },
    title: 'Yetenek Savaşı',
    description: 'Sektörün en iyi geliştiricilerinden biri iş arıyor. Rakipler de peşinde.',
    choices: [
      { text: 'Eleman Kap (min. $15.000, +25 kalite)', condition: { minMoney: 15000 }, effect: { money: -15000, qualityBonus: 25 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'rakip_patent_davasi', category: 'rakip', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minPublished: 3 },
    title: 'Rakip Patent Davası',
    description: 'Rakip bir firma oyununuzdaki bir mekanik için patent ihlali davası açtı.',
    choices: [
      { text: 'Savaş (-$20.000, +3 itibar)', effect: { money: -20000, reputation: 3 } },
      { text: 'Uzlaş (-$8.000)', effect: { money: -8000 } },
      { text: 'Lisansla (-$5.000, -2 itibar)', effect: { money: -5000, reputation: -2 } },
    ],
  },
]
```

- [ ] **Step 4: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 5: Commit**

```bash
git add src/types/rival.ts src/data/events.ts
git commit -m "feat: random event tipleri ve 52-event kataloğu"
```

---

## Task 2: eventEngine + Testler

**Files:**
- Create: `src/engine/eventEngine.ts`
- Create: `tests/engine/eventEngine.test.ts`

- [ ] **Step 1: Failing test yaz**

`tests/engine/eventEngine.test.ts` oluştur:

```typescript
import { describe, it, expect } from 'vitest'
import { candidateEvents, pickEvent, isChoiceAvailable } from '@/engine/eventEngine'
import type { RandomEvent, EventChoice } from '@/data/events'

const baseGame = { reputation: 50, money: 50000, totalPublished: 2 }

const evA: RandomEvent = {
  id: 'ev_a', category: 'finansal', type: 'passive',
  weight: 5, cooldownYears: 3, title: 'A', description: 'A desc',
  effect: { money: 100 },
}
const evB: RandomEvent = {
  id: 'ev_b', category: 'studyo', type: 'passive',
  weight: 5, cooldownYears: 3, title: 'B', description: 'B desc',
  effect: { money: 100 },
}
const evC: RandomEvent = {
  id: 'ev_c', category: 'finansal', type: 'passive',
  weight: 5, cooldownYears: 3, title: 'C', description: 'C desc',
  trigger: { minReputation: 80 },
  effect: { money: 100 },
}

describe('candidateEvents', () => {
  it('trigger koşulu sağlanmayan event elenir', () => {
    const result = candidateEvents([evA, evC], {}, {}, 2005, { ...baseGame, reputation: 30 })
    expect(result.map(e => e.id)).not.toContain('ev_c')
    expect(result.map(e => e.id)).toContain('ev_a')
  })

  it('bireysel cooldown aktifken event elenir', () => {
    const cooldowns = { ev_a: 2004 } // lastYear=2004, cooldown=3 → 2005-2004=1 < 3 → elenir
    const result = candidateEvents([evA, evB], cooldowns, {}, 2005, baseGame)
    expect(result.map(e => e.id)).not.toContain('ev_a')
    expect(result.map(e => e.id)).toContain('ev_b')
  })

  it('kategori cooldown aktifken o kategoriden event çıkmaz', () => {
    const lastCategoryYear = { finansal: 2005 }
    const result = candidateEvents([evA, evB], {}, lastCategoryYear, 2005, baseGame)
    // evA kategori=finansal, lastCategoryYear.finansal===2005 → elenir
    expect(result.map(e => e.id)).not.toContain('ev_a')
    expect(result.map(e => e.id)).toContain('ev_b')
  })

  it('tüm filtrelerden geçen event listede kalır', () => {
    const result = candidateEvents([evA, evB], {}, {}, 2005, baseGame)
    expect(result).toHaveLength(2)
  })
})

describe('pickEvent', () => {
  it('boş listede null döner', () => {
    expect(pickEvent([])).toBeNull()
  })

  it('ağırlıklı seçim — weight:10 event, weight:1 olandan ~10× daha sık seçilir', () => {
    const heavy: RandomEvent = { ...evA, id: 'heavy', weight: 10 }
    const light: RandomEvent = { ...evB, id: 'light', weight: 1 }
    let heavyCount = 0
    for (let i = 0; i < 1100; i++) {
      if (pickEvent([heavy, light])!.id === 'heavy') heavyCount++
    }
    // weight oranı 10:1, 1100 denemede heavy ~1000 kez çıkmalı. 700-1100 arasında kabul et.
    expect(heavyCount).toBeGreaterThan(700)
    expect(heavyCount).toBeLessThan(1100)
  })
})

describe('isChoiceAvailable', () => {
  it('condition yoksa true döner', () => {
    expect(isChoiceAvailable(undefined, baseGame)).toBe(true)
  })

  it('minMoney koşulu para yeterliyse true', () => {
    expect(isChoiceAvailable({ minMoney: 50000 }, { ...baseGame, money: 50000 })).toBe(true)
  })

  it('minMoney koşulu para yetersizse false', () => {
    expect(isChoiceAvailable({ minMoney: 50001 }, { ...baseGame, money: 50000 })).toBe(false)
  })

  it('minReputation koşulu itibar yeterliyse true', () => {
    expect(isChoiceAvailable({ minReputation: 50 }, { ...baseGame, reputation: 50 })).toBe(true)
  })

  it('minReputation koşulu itibar yetersizse false', () => {
    expect(isChoiceAvailable({ minReputation: 51 }, { ...baseGame, reputation: 50 })).toBe(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır ve fail ettiğini doğrula**

```
npx vitest run tests/engine/eventEngine.test.ts
```

Beklenen: `Cannot find module '@/engine/eventEngine'`

- [ ] **Step 3: `src/engine/eventEngine.ts` oluştur**

```typescript
import type { RandomEvent, EventChoice } from '@/data/events'

export interface GameStateSnapshot {
  reputation:     number
  money:          number
  totalPublished: number
}

export function candidateEvents(
  catalog:          RandomEvent[],
  cooldowns:        Record<string, number>,
  lastCategoryYear: Record<string, number>,
  currentYear:      number,
  gameState:        GameStateSnapshot
): RandomEvent[] {
  return catalog.filter((event) => {
    // 1. Trigger koşulları
    const t = event.trigger
    if (t) {
      if (t.minReputation !== undefined && gameState.reputation < t.minReputation) return false
      if (t.maxReputation !== undefined && gameState.reputation > t.maxReputation) return false
      if (t.minMoney      !== undefined && gameState.money      < t.minMoney)      return false
      if (t.maxMoney      !== undefined && gameState.money      > t.maxMoney)      return false
      if (t.minPublished  !== undefined && gameState.totalPublished < t.minPublished) return false
    }
    // 2. Bireysel cooldown
    const lastTriggered = cooldowns[event.id]
    if (lastTriggered !== undefined && currentYear - lastTriggered < event.cooldownYears) return false
    // 3. Kategori cooldown
    if (lastCategoryYear[event.category] === currentYear) return false

    return true
  })
}

export function pickEvent(candidates: RandomEvent[]): RandomEvent | null {
  if (candidates.length === 0) return null
  const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0)
  let rand = Math.random() * totalWeight
  for (const event of candidates) {
    rand -= event.weight
    if (rand <= 0) return event
  }
  return candidates[candidates.length - 1]
}

export function isChoiceAvailable(
  condition: EventChoice['condition'],
  gameState: GameStateSnapshot
): boolean {
  if (!condition) return true
  if (condition.minMoney      !== undefined && gameState.money      < condition.minMoney)      return false
  if (condition.minReputation !== undefined && gameState.reputation < condition.minReputation) return false
  return true
}
```

- [ ] **Step 4: Testi çalıştır ve geçtiğini doğrula**

```
npx vitest run tests/engine/eventEngine.test.ts
```

Beklenen: 7 testin tümü PASS

- [ ] **Step 5: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: Mevcut testler kırılmamış.

- [ ] **Step 6: Commit**

```bash
git add src/engine/eventEngine.ts tests/engine/eventEngine.test.ts
git commit -m "feat: eventEngine — candidateEvents, pickEvent, isChoiceAvailable"
```

---

## Task 3: projectStore genişletme + eventStore + Testler

**Files:**
- Modify: `src/store/projectStore.ts`
- Create: `src/store/eventStore.ts`
- Create: `tests/store/eventStore.test.ts`

- [ ] **Step 1: `src/store/projectStore.ts`'e `applyEventEffect` ekle**

Mevcut dosyayı oku. `ProjectStoreState` interface'ine şunu ekle:

```typescript
applyEventEffect: (qualityBonus: number, weekDelay: number) => void
```

Ve implementation'a:

```typescript
applyEventEffect: (qualityBonus, weekDelay) => {
  set((s) => ({
    projects: s.projects.map((p) => {
      if (p.status !== 'gelistirme') return p
      return {
        ...p,
        qualityPoints: Math.max(0, p.qualityPoints + qualityBonus),
        totalWeeks: p.totalWeeks + weekDelay,
      }
    }),
  }))
},
```

Mevcut `reset` metodunun hemen öncesine ekle.

- [ ] **Step 2: Failing test yaz**

`tests/store/eventStore.test.ts` oluştur:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEventStore } from '@/store/eventStore'
import { useGameStore } from '@/store/gameStore'
import { useNewsStore } from '@/store/newsStore'
import { EVENTS } from '@/data/events'
import type { RandomEvent } from '@/data/events'

function resetAll() {
  useEventStore.getState().reset()
  useGameStore.getState().reset()
  useNewsStore.getState().reset()
}

beforeEach(resetAll)

// choice event'i bul (vergi_denetimi)
const choiceEvent = EVENTS.find(e => e.id === 'vergi_denetimi')!
// passive event'i bul (beklenmedik_gider)
const passiveEvent = EVENTS.find(e => e.id === 'beklenmedik_gider')!

describe('eventStore — tryWeeklyEvent', () => {
  it('pendingEvent doluysa yeni event seçilmez', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    const before = useEventStore.getState().pendingEvent
    useEventStore.getState().tryWeeklyEvent(2005)
    expect(useEventStore.getState().pendingEvent).toBe(before)
  })
})

describe('eventStore — resolveEvent', () => {
  it('resolveEvent(null) — cooldown güncellenir, pendingEvent temizlenir', () => {
    useEventStore.setState({ pendingEvent: passiveEvent })
    useEventStore.getState().resolveEvent(null, 2005)
    const s = useEventStore.getState()
    expect(s.pendingEvent).toBeNull()
    expect(s.cooldowns[passiveEvent.id]).toBe(2005)
    expect(s.lastCategoryYear[passiveEvent.category]).toBe(2005)
  })

  it('resolveEvent(0) — para etkisi uygulanır (choice event)', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    const before = useGameStore.getState().money
    useEventStore.getState().resolveEvent(0, 2005)
    // choice[0] = "Kayıtları Düzenle", effect: { money: -15000 }
    expect(useGameStore.getState().money).toBe(before - 15000)
  })

  it('resolveEvent(0) — itibar etkisi uygulanır', () => {
    const repEvent: RandomEvent = {
      id: 'test_rep', category: 'sektor', type: 'choice',
      weight: 5, cooldownYears: 1,
      title: 'Test', description: 'test',
      choices: [{ text: 'A', effect: { reputation: 10 } }],
    }
    useEventStore.setState({ pendingEvent: repEvent })
    const before = useGameStore.getState().reputation
    useEventStore.getState().resolveEvent(0, 2005)
    expect(useGameStore.getState().reputation).toBe(before + 10)
  })

  it('resolveEvent(0) — cooldowns ve lastCategoryYear güncellenir', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    useEventStore.getState().resolveEvent(0, 2005)
    const s = useEventStore.getState()
    expect(s.cooldowns[choiceEvent.id]).toBe(2005)
    expect(s.lastCategoryYear[choiceEvent.category]).toBe(2005)
  })

  it('resolveEvent(0) — newsStore\'a random_event haberi eklenir', () => {
    useEventStore.setState({ pendingEvent: choiceEvent })
    useEventStore.getState().resolveEvent(0, 2005)
    const items = useNewsStore.getState().items
    expect(items.some(i => i.type === 'random_event')).toBe(true)
  })
})

describe('eventStore — reset', () => {
  it('reset — tüm state temizlenir', () => {
    useEventStore.setState({
      pendingEvent: choiceEvent,
      cooldowns: { vergi_denetimi: 2004 },
      lastCategoryYear: { finansal: 2004 },
    })
    useEventStore.getState().reset()
    const s = useEventStore.getState()
    expect(s.pendingEvent).toBeNull()
    expect(Object.keys(s.cooldowns)).toHaveLength(0)
    expect(Object.keys(s.lastCategoryYear)).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Testi çalıştır ve fail ettiğini doğrula**

```
npx vitest run tests/store/eventStore.test.ts
```

Beklenen: `Cannot find module '@/store/eventStore'`

- [ ] **Step 4: `src/store/eventStore.ts` oluştur**

```typescript
import { create } from 'zustand'
import { EVENTS } from '@/data/events'
import type { RandomEvent } from '@/data/events'
import { candidateEvents, pickEvent } from '@/engine/eventEngine'
import { useGameStore } from '@/store/gameStore'
import { useNewsStore } from '@/store/newsStore'
import { useProjectStore } from '@/store/projectStore'
import { useEmployeeStore } from '@/store/employeeStore'

interface EventStore {
  pendingEvent:      RandomEvent | null
  cooldowns:         Record<string, number>
  lastCategoryYear:  Record<string, number>

  tryWeeklyEvent:   (year: number) => void
  tryAnnualEvent:   (year: number) => void
  checkMilestones:  (year: number) => void
  resolveEvent:     (choiceIndex: number | null, year: number) => void
  reset:            () => void
}

function getGameSnapshot() {
  const gs = useGameStore.getState()
  return { reputation: gs.reputation, money: gs.money, totalPublished: gs.totalPublished }
}

function applyEffect(event: RandomEvent, choiceIndex: number | null, year: number) {
  const effect = choiceIndex === null
    ? event.effect ?? {}
    : (event.choices ?? [])[choiceIndex]?.effect ?? {}

  if (effect.money)        useGameStore.getState().addMoney(effect.money)
  if (effect.reputation)   useGameStore.getState().gainReputation(effect.reputation)
  if (effect.qualityBonus || effect.weekDelay) {
    useProjectStore.getState().applyEventEffect(
      effect.qualityBonus ?? 0,
      effect.weekDelay ?? 0,
    )
  }
  if (effect.employeeLeave) {
    const emps = useEmployeeStore.getState().employees
    const target = emps.find(e => e.assignedProjectId === null) ?? emps[0]
    if (target) useEmployeeStore.getState().fire(target.id)
  }

  useNewsStore.getState().addItem({
    type: 'random_event',
    rivalId: null,
    text: event.title,
    year,
    season: 0,
  })
}

export const useEventStore = create<EventStore>((set, get) => ({
  pendingEvent:     null,
  cooldowns:        {},
  lastCategoryYear: {},

  tryWeeklyEvent: (year) => {
    if (get().pendingEvent) return
    if (Math.random() >= 0.15) return
    const { cooldowns, lastCategoryYear } = get()
    const candidates = candidateEvents(EVENTS, cooldowns, lastCategoryYear, year, getGameSnapshot())
    const event = pickEvent(candidates)
    if (!event) return
    if (event.type === 'passive') {
      applyEffect(event, null, year)
      set((s) => ({
        cooldowns: { ...s.cooldowns, [event.id]: year },
        lastCategoryYear: { ...s.lastCategoryYear, [event.category]: year },
      }))
    } else {
      set({ pendingEvent: event })
    }
  },

  tryAnnualEvent: (year) => {
    if (get().pendingEvent) return
    const { cooldowns, lastCategoryYear } = get()
    const candidates = candidateEvents(EVENTS, cooldowns, lastCategoryYear, year, getGameSnapshot())
    const event = pickEvent(candidates)
    if (!event) return
    if (event.type === 'passive') {
      applyEffect(event, null, year)
      set((s) => ({
        cooldowns: { ...s.cooldowns, [event.id]: year },
        lastCategoryYear: { ...s.lastCategoryYear, [event.category]: year },
      }))
    } else {
      set({ pendingEvent: event })
    }
  },

  checkMilestones: (year) => {
    if (get().pendingEvent) return
    const { cooldowns, lastCategoryYear } = get()
    const candidates = candidateEvents(EVENTS, cooldowns, lastCategoryYear, year, getGameSnapshot())
    const event = pickEvent(candidates)
    if (!event) return
    if (event.type === 'passive') {
      applyEffect(event, null, year)
      set((s) => ({
        cooldowns: { ...s.cooldowns, [event.id]: year },
        lastCategoryYear: { ...s.lastCategoryYear, [event.category]: year },
      }))
    } else {
      set({ pendingEvent: event })
    }
  },

  resolveEvent: (choiceIndex, year) => {
    const { pendingEvent } = get()
    if (!pendingEvent) return
    applyEffect(pendingEvent, choiceIndex, year)
    set((s) => ({
      pendingEvent: null,
      cooldowns: { ...s.cooldowns, [pendingEvent.id]: year },
      lastCategoryYear: { ...s.lastCategoryYear, [pendingEvent.category]: year },
    }))
  },

  reset: () => set({ pendingEvent: null, cooldowns: {}, lastCategoryYear: {} }),
}))
```

- [ ] **Step 5: Testi çalıştır ve geçtiğini doğrula**

```
npx vitest run tests/store/eventStore.test.ts
```

Beklenen: 7 testin tümü PASS

- [ ] **Step 6: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 7: Commit**

```bash
git add src/store/projectStore.ts src/store/eventStore.ts tests/store/eventStore.test.ts
git commit -m "feat: eventStore + projectStore.applyEventEffect"
```

---

## Task 4: EventModal Bileşeni

**Files:**
- Create: `src/components/EventModal.tsx`

- [ ] **Step 1: `src/components/EventModal.tsx` oluştur**

```typescript
import { useEventStore } from '@/store/eventStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { isChoiceAvailable } from '@/engine/eventEngine'

export default function EventModal() {
  const pendingEvent = useEventStore((s) => s.pendingEvent)
  const resolveEvent = useEventStore((s) => s.resolveEvent)
  const money        = useGameStore((s) => s.money)
  const reputation   = useGameStore((s) => s.reputation)
  const year         = useTimeStore((s) => s.date.year)

  if (!pendingEvent) return null

  const gameState = { reputation, money, totalPublished: 0 }

  const btnBase     = 'w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left'
  const btnActive   = `${btnBase} bg-gray-800 hover:bg-gray-700 text-white border border-gray-600`
  const btnDisabled = `${btnBase} bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50`

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-950 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4">
        <div className="mb-2 text-gray-400 text-xs uppercase tracking-wider">🎲 Beklenmedik Olay</div>
        <h2 className="text-white text-xl font-bold mb-3">{pendingEvent.title}</h2>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">{pendingEvent.description}</p>

        <div className="flex flex-col gap-3">
          {pendingEvent.type === 'passive' ? (
            <button
              onClick={() => resolveEvent(null, year)}
              className={btnActive}
            >
              Tamam
            </button>
          ) : (
            (pendingEvent.choices ?? []).map((choice, i) => {
              const available = isChoiceAvailable(choice.condition, gameState)
              return (
                <button
                  key={i}
                  onClick={() => available && resolveEvent(i, year)}
                  disabled={!available}
                  className={available ? btnActive : btnDisabled}
                >
                  {choice.text}
                  {choice.condition?.minMoney && !available && (
                    <span className="block text-xs mt-1 opacity-70">
                      Gerekli: ${choice.condition.minMoney.toLocaleString()}
                    </span>
                  )}
                  {choice.condition?.minReputation && !available && (
                    <span className="block text-xs mt-1 opacity-70">
                      Gerekli: {choice.condition.minReputation} itibar
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 3: Testlerin kırılmadığını doğrula**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventModal.tsx
git commit -m "feat: EventModal — choice/passive event UI"
```

---

## Task 5: Dashboard + App.tsx Entegrasyonu

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Mevcut Dashboard.tsx'i oku**

`src/components/Dashboard.tsx` oku. Şu 3 değişiklik yapılacak:

**1.** Import ekle (mevcut importların altına):
```typescript
import { useEventStore } from '@/store/eventStore'
```

**2.** Mevcut `year` useEffect içinde (year > 2000 bloğunun sonuna, `checkAwards` çağrısından sonra) ekle:
```typescript
useEventStore.getState().tryAnnualEvent(year)
useEventStore.getState().checkMilestones(year)
```

**3.** Yeni `week` useEffect ekle (`year` useEffect'in hemen altına):
```typescript
const week = useTimeStore((s) => s.date.week)
useEffect(() => {
  if (year <= 2000) return
  useEventStore.getState().tryWeeklyEvent(year)
}, [week])
```

**4.** `handleNewGame` içine `useTrendStore.getState().reset()` sonrasına ekle:
```typescript
useEventStore.getState().reset()
```

- [ ] **Step 2: Dashboard.tsx değişikliklerini uygula**

Mevcut `year` useEffect bloğu şu şekilde güncellenmeli (tüm useEffect):

```typescript
const year = useTimeStore((s) => s.date.year)
useEffect(() => {
  if (year <= 2000) {
    useRivalStore.getState().simulateYear(year)
    return
  }
  useRivalStore.getState().simulateYear(year)

  const allRivalGames = useRivalStore.getState().rivals.flatMap(r => r.games)
  const thisYearGames = allRivalGames.filter(g => g.releasedYear === year)
  useTrendStore.getState().simulateYear(year, thisYearGames)

  const prevYear = year - 1
  const publishedProjects = useProjectStore.getState().projects.filter(
    p => p.status === 'yayinlandi' && p.publishResult?.publishDate.year === prevYear
  )
  const playerBestGame = publishedProjects.length > 0
    ? publishedProjects.reduce((best, p) =>
        (p.publishResult!.score > (best.publishResult?.score ?? 0)) ? p : best
      )
    : null

  useAwardsStore.getState().checkAwards(
    prevYear,
    playerBestGame
      ? { name: playerBestGame.name, score: playerBestGame.publishResult!.score }
      : null
  )

  useEventStore.getState().tryAnnualEvent(year)
  useEventStore.getState().checkMilestones(year)
}, [year])

const week = useTimeStore((s) => s.date.week)
useEffect(() => {
  if (year <= 2000) return
  useEventStore.getState().tryWeeklyEvent(year)
}, [week])
```

`handleNewGame` içinde son reset satırı olarak:
```typescript
useEventStore.getState().reset()
```

- [ ] **Step 3: App.tsx'i güncelle**

Mevcut `src/App.tsx`'i oku. Şu 2 değişiklik yap:

**1.** Import ekle:
```typescript
import EventModal from '@/components/EventModal'
import { useEventStore } from '@/store/eventStore'
```

**2.** `pendingResolution` satırının hemen altına:
```typescript
const pendingEvent = useEventStore((s) => s.pendingEvent)
```

**3.** Gating bloğuna (satır 95 civarı, `if (pendingResolution)` sonrasına):
```typescript
if (pendingEvent) return <EventModal />
```

Sonuç:
```typescript
if (!isCreated)        return <CharacterCreationWizard />
if (activeCutscene)    return <CutscenePlayer />
if (pendingResolution) return <ResolutionScreen />
if (pendingEvent)      return <EventModal />
```

- [ ] **Step 4: TypeScript derleme kontrolü**

```
npx tsc --noEmit
```

Beklenen: Hatasız çıkış.

- [ ] **Step 5: Tüm testleri çalıştır**

```
npx vitest run
```

Beklenen: Tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard.tsx src/App.tsx
git commit -m "feat: Dashboard + App.tsx event entegrasyonu — weekly/annual tetikleme + EventModal gate"
```

---

## Self-Review

### Spec Coverage

| Spec gereksinimi | Plan görevi |
|---|---|
| EventCategory, EventEffect, EventChoice, RandomEvent tipleri | Task 1 Step 2 |
| 52-event kataloğu (finansal×12, stüdyo×12, sektör×10, kişisel×8, rakip×10) | Task 1 Step 3 |
| NewsType'a 'random_event' eklendi | Task 1 Step 1 |
| eventEngine: candidateEvents (trigger + bireysel cooldown + kategori cooldown) | Task 2 Step 3 |
| eventEngine: pickEvent (ağırlıklı seçim) | Task 2 Step 3 |
| eventEngine: isChoiceAvailable | Task 2 Step 3 |
| 8 eventEngine testi | Task 2 Step 1 |
| projectStore.applyEventEffect | Task 3 Step 1 |
| eventStore: pendingEvent, cooldowns, lastCategoryYear | Task 3 Step 4 |
| tryWeeklyEvent (%15 şans, passive/choice ayrımı) | Task 3 Step 4 |
| tryAnnualEvent (garantili yıllık) | Task 3 Step 4 |
| checkMilestones | Task 3 Step 4 |
| resolveEvent (para/rep/qualityBonus/weekDelay/employeeLeave + cooldown + news) | Task 3 Step 4 |
| reset | Task 3 Step 4 |
| 8 eventStore testi | Task 3 Step 2 |
| EventModal: başlık + açıklama + butonlar | Task 4 |
| EventModal: disabled koşul gösterimi | Task 4 |
| EventModal: passive için "Tamam" butonu | Task 4 |
| Dashboard: week useEffect → tryWeeklyEvent | Task 5 |
| Dashboard: year useEffect → tryAnnualEvent + checkMilestones | Task 5 |
| Dashboard: handleNewGame → reset | Task 5 |
| App.tsx: pendingEvent gate | Task 5 |

Tüm gereksinimler kapsandı.

### Placeholder Scan

Placeholder yok. Tüm 52 event tam içerikle yazılmış, tüm adımlarda eksiksiz kod mevcut.

### Type Consistency

- `resolveEvent(choiceIndex: number | null, year: number)` — Task 3 store'da tanımlandı, Task 4 modal'da ve Task 5'te aynı imzayla kullanıldı. ✓
- `applyEventEffect(qualityBonus: number, weekDelay: number)` — Task 3'te tanımlandı ve store'da kullanıldı. ✓
- `candidateEvents` ve `pickEvent` — Task 2'de tanımlandı, Task 3 store'da import edilerek kullanıldı. ✓
- `GameStateSnapshot` — Task 2'de tanımlandı (`reputation, money, totalPublished`), Task 4 modal'da `totalPublished: 0` ile kullanıldı (modal'da published sayısı gerekmez). ✓
