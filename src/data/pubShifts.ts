// src/data/pubShifts.ts

export interface SpecialRequest {
  type: 'alerji' | 'tercih' | 'not'
  description: string               // "Fıstık alerjisi", "Az buzlu", "Vejetaryen"
  revealedOnInteraction: boolean    // false = brifingde bildirildi, true = masaya gidince ortaya çıkar
}

export interface Customer {
  id: string
  name: string
  visualCues: string[]              // "Takım elbise", "Sinirli görünüyor"
  specialRequests: SpecialRequest[]
}

export interface Table {
  id: string                        // 'table_1' ... 'table_4'
  customers: Customer[]
  orderOptions: string[][]          // her müşteri için olası seçenekler; customers[i] → orderOptions[i]
  correctOrder: string[]            // customers[i] için doğru sipariş; correctOrder[i] ↔ customers[i]
  patienceMs: number                // sabır barı dolma süresi (ms)
}

export interface PubShift {
  id: string                        // 'pub_shift_01' ... 'pub_shift_15'
  briefingNotes: string[]           // vardiya başı patron açıklamaları
  tables: Table[]
}

// ─── VARDIYA 1 — Kolay (3 masa, açık istekler) ───────────────────────────────

const pubShift01: PubShift = {
  id: 'pub_shift_01',
  briefingNotes: [
    'İlk gece, sakin olacak.',
    "Masa 2'deki Kemal'in fıstık alerjisi var — dikkat et.",
  ],
  tables: [
    {
      id: 'table_1',
      customers: [
        {
          id: 'c_ayse_01',
          name: 'Ayşe',
          visualCues: ['Rahat giyinmiş', 'Gülümsüyor'],
          specialRequests: [],
        },
        {
          id: 'c_mert_01',
          name: 'Mert',
          visualCues: ['Takım elbise', 'Yorgun görünüyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Bira', 'Şarap', 'Viski'],
        ['Şarap', 'Kola', 'Bira'],
      ],
      correctOrder: ['Bira', 'Şarap'],
      patienceMs: 35000,
    },
    {
      id: 'table_2',
      customers: [
        {
          id: 'c_kemal_01',
          name: 'Kemal',
          visualCues: ['Gözlüklü', 'Kitap okuyor'],
          specialRequests: [
            { type: 'alerji', description: 'Fıstık alerjisi', revealedOnInteraction: false },
          ],
        },
        {
          id: 'c_selin_01',
          name: 'Selin',
          visualCues: ['Kırmızı çanta', 'Arkadaşını bekliyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Meze', 'Fıstıksız Meze', 'Salata'],
        ['Meze', 'Fıstıksız Meze', 'Salata'],
      ],
      correctOrder: ['Fıstıksız Meze', 'Meze'],
      patienceMs: 35000,
    },
    {
      id: 'table_3',
      customers: [
        {
          id: 'c_buse_01',
          name: 'Buse',
          visualCues: ['Arkadaşlarıyla gelmiş', 'Neşeli'],
          specialRequests: [],
        },
      ],
      orderOptions: [['Kola', 'Su', 'Bira']],
      correctOrder: ['Kola'],
      patienceMs: 35000,
    },
  ],
}

// ─── VARDIYA 2 — Orta (3 masa, gizli istek) ──────────────────────────────────

const pubShift02: PubShift = {
  id: 'pub_shift_02',
  briefingNotes: [
    'Bugün biraz hareketli.',
    "Masa 3'teki Zeynep Hanım VIP misafirimiz — öncelik onlarda.",
  ],
  tables: [
    {
      id: 'table_1',
      customers: [
        {
          id: 'c_tarik_02',
          name: 'Tarık',
          visualCues: ['Bıyıklı', 'Sakin'],
          specialRequests: [],
        },
        {
          id: 'c_elif_02',
          name: 'Elif',
          visualCues: ['Renkli şal', 'Çantasına bakıyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Viski', 'Bira', 'Kola'],
        ['Şarap', 'Viski', 'Su'],
      ],
      correctOrder: ['Viski', 'Şarap'],
      patienceMs: 30000,
    },
    {
      id: 'table_2',
      customers: [
        {
          id: 'c_ozan_02',
          name: 'Ozan',
          visualCues: ['Şapkalı', 'Müzik dinliyor'],
          specialRequests: [
            { type: 'tercih', description: 'Az buzlu içecek istiyor', revealedOnInteraction: true },
          ],
        },
      ],
      orderOptions: [['Viski (Normal)', 'Viski (Az Buzlu)', 'Bira']],
      correctOrder: ['Viski (Az Buzlu)'],
      patienceMs: 30000,
    },
    {
      id: 'table_3',
      customers: [
        {
          id: 'c_zeynep_02',
          name: 'Zeynep Hanım',
          visualCues: ['Şık giyinmiş', 'Özgüvenli'],
          specialRequests: [
            { type: 'tercih', description: 'Vejetaryen', revealedOnInteraction: false },
          ],
        },
      ],
      orderOptions: [['Et Tabağı', 'Vejetaryen Tabak', 'Izgara Balık']],
      correctOrder: ['Vejetaryen Tabak'],
      patienceMs: 30000,
    },
  ],
}

// ─── VARDIYA 3 — Orta+ (4 masa, yoğun gece) ──────────────────────────────────

const pubShift03: PubShift = {
  id: 'pub_shift_03',
  briefingNotes: [
    'Dört masa dolu — yoğun gece.',
    "Masa 2'de vejetaryen var.",
    'Dikkatli ol, bekleyenleri unutma.',
  ],
  tables: [
    {
      id: 'table_1',
      customers: [
        {
          id: 'c_can_03',
          name: 'Can',
          visualCues: ['Dizüstü açık', 'Çalışıyor'],
          specialRequests: [],
        },
        {
          id: 'c_deniz_03',
          name: 'Deniz',
          visualCues: ['Kulaklıklı', 'Telefona bakıyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Kola', 'Su', 'Bira'],
        ['Bira', 'Şarap', 'Kola'],
      ],
      correctOrder: ['Kola', 'Bira'],
      patienceMs: 28000,
    },
    {
      id: 'table_2',
      customers: [
        {
          id: 'c_ada_03',
          name: 'Ada',
          visualCues: ['Yeşil çanta', 'Kitap okuyor'],
          specialRequests: [
            { type: 'tercih', description: 'Vejetaryen', revealedOnInteraction: false },
          ],
        },
      ],
      orderOptions: [['Et Tabağı', 'Vejetaryen Tabak', 'Izgara Balık']],
      correctOrder: ['Vejetaryen Tabak'],
      patienceMs: 28000,
    },
    {
      id: 'table_3',
      customers: [
        {
          id: 'c_volkan_03',
          name: 'Volkan',
          visualCues: ['Kravatını gevşetmiş', 'Yorgun'],
          specialRequests: [
            { type: 'not', description: '"Sürpriz bir şey getir" diyor', revealedOnInteraction: true },
          ],
        },
      ],
      orderOptions: [['Viski', 'Gin Tonic', 'Bira']],
      correctOrder: ['Gin Tonic'],
      patienceMs: 28000,
    },
    {
      id: 'table_4',
      customers: [
        {
          id: 'c_irem_03',
          name: 'İrem',
          visualCues: ['Pembe bluz', 'Güler yüzlü'],
          specialRequests: [],
        },
        {
          id: 'c_burak_03',
          name: 'Burak',
          visualCues: ['Spor ayakkabı', 'Maç tartışıyor'],
          specialRequests: [],
        },
      ],
      orderOptions: [
        ['Şarap', 'Bira', 'Su'],
        ['Bira', 'Kola', 'Su'],
      ],
      correctOrder: ['Şarap', 'Bira'],
      patienceMs: 28000,
    },
  ],
}

export const PUB_SHIFTS: PubShift[] = [pubShift01, pubShift02, pubShift03]
