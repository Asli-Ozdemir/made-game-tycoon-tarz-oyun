// src/data/antiquarianShifts.ts

export interface BookRequest {
  id: string
  type: string        // "leather journal", "poetry collection"
  period: string      // "1800s", "early 1900s"
  condition: 'poor' | 'fair' | 'good' | 'excellent'
  extraHint?: string  // "dark cover", "small format"
}

export interface LocationBook {
  id: string
  description: string       // short visible description shown in search phase
  correctCondition: 'poor' | 'fair' | 'good' | 'excellent'
  correctPeriod: string
  isAuthentic: boolean      // used in sessions 7–8 authenticity checks
  matchesRequest?: string   // BookRequest.id this book satisfies, undefined for distractors
}

export interface Location {
  id: string    // 'old_tower' | 'forest_cabin' | 'cave'
  name: string
  books: LocationBook[]
}

export interface AntiquarianShift {
  id: string              // 'antiq_shift_01' ... 'antiq_shift_08'
  briefingNotes: string[]
  requests: BookRequest[]
  locations: Location[]   // sessions 1–3: 1 location; sessions 4–8: 2 locations
  hasAuthenticity: boolean
}

// ─── SESSION 1 — Easy (1 location, 4 requests, clear clues) ──────────────────

const antiqShift01: AntiquarianShift = {
  id: 'antiq_shift_01',
  briefingNotes: [
    'First day. Nothing too complicated — just get familiar with the stock.',
    'Four requests today. The clues in each one should guide you well.',
  ],
  requests: [
    { id: 'req_s1_1', type: 'leather journal',     period: '1800s',      condition: 'good'      },
    { id: 'req_s1_2', type: 'poetry collection',   period: 'early 1900s', condition: 'fair'     },
    { id: 'req_s1_3', type: 'field guide',         period: '1800s',      condition: 'good'      },
    { id: 'req_s1_4', type: 'travel diary',        period: 'late 1800s', condition: 'excellent' },
  ],
  locations: [
    {
      id: 'old_tower',
      name: 'Old Tower',
      books: [
        // Matching books
        { id: 's1_b1', description: 'Worn leather journal, gilded page edges, well-preserved ~1850s',                correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s1_1' },
        { id: 's1_b2', description: 'Small cloth-bound poetry collection, early 1900s imprint on spine',            correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s1_2' },
        { id: 's1_b3', description: 'Illustrated field guide with nature drawings, 1870s date inside cover',        correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s1_3' },
        { id: 's1_b4', description: 'Hardcover travel diary, handwritten notes, near-perfect condition, late 1800s', correctCondition: 'excellent', correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s1_4' },
        // Distractors
        { id: 's1_b5',  description: 'Heavy encyclopedia, volume III, 1920s printing',                              correctCondition: 'fair',      correctPeriod: '1920s',       isAuthentic: true  },
        { id: 's1_b6',  description: 'Religious text with ornate cover, mid-1700s',                                 correctCondition: 'poor',      correctPeriod: '1700s',       isAuthentic: true  },
        { id: 's1_b7',  description: 'Scientific monograph, marbled cover, 1890s',                                  correctCondition: 'good',      correctPeriod: '1890s',       isAuthentic: true  },
        { id: 's1_b8',  description: "Children's illustrated book, colorful binding, 1910s",                        correctCondition: 'excellent', correctPeriod: '1910s',       isAuthentic: true  },
        { id: 's1_b9',  description: 'Legal reference text, black binding, 1930s',                                  correctCondition: 'fair',      correctPeriod: '1930s',       isAuthentic: true  },
        { id: 's1_b10', description: 'Recipe collection, stained pages, 1880s',                                     correctCondition: 'poor',      correctPeriod: '1880s',       isAuthentic: true  },
      ],
    },
  ],
  hasAuthenticity: false,
}

// ─── SESSION 2 — Medium (1 location, 5 requests, some damaged) ───────────────

const antiqShift02: AntiquarianShift = {
  id: 'antiq_shift_02',
  briefingNotes: [
    'Five requests today — a bit busier.',
    'The forest cabin has some water-damaged stock. Condition matters more now.',
  ],
  requests: [
    { id: 'req_s2_1', type: 'memoir',                  period: 'early 1900s', condition: 'good'      },
    { id: 'req_s2_2', type: 'atlas',                   period: '1800s',       condition: 'fair'      },
    { id: 'req_s2_3', type: 'novel',                   period: 'late 1800s',  condition: 'good'      },
    { id: 'req_s2_4', type: 'botanical guide',         period: '1800s',       condition: 'excellent' },
    { id: 'req_s2_5', type: 'correspondence collection', period: 'early 1900s', condition: 'fair'    },
  ],
  locations: [
    {
      id: 'forest_cabin',
      name: 'Forest Cabin',
      books: [
        // Matching books
        { id: 's2_b1',  description: 'Personal memoir, cloth cover, early 1900s, light shelf wear only',          correctCondition: 'good',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s2_1' },
        { id: 's2_b2',  description: 'Folded atlas, hand-colored maps, 1860s, moderately foxed',                  correctCondition: 'fair',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s2_2' },
        { id: 's2_b3',  description: 'Victorian novel, gilt title, late 1800s, minor fading',                     correctCondition: 'good',      correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s2_3' },
        { id: 's2_b4',  description: 'Botanical guide, pressed flower inside, immaculate, 1870s',                 correctCondition: 'excellent', correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s2_4' },
        { id: 's2_b5',  description: 'Bound correspondence, envelopes still inside, early 1900s, somewhat worn', correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s2_5' },
        // Distractors (some damaged)
        { id: 's2_b6',  description: 'Almanac, water-stained cover, 1890s',                                       correctCondition: 'poor',      correctPeriod: '1890s',       isAuthentic: true  },
        { id: 's2_b7',  description: 'Philosophy text, torn spine, 1910s',                                        correctCondition: 'poor',      correctPeriod: '1910s',       isAuthentic: true  },
        { id: 's2_b8',  description: 'Medical handbook, pencil annotations, 1880s',                               correctCondition: 'fair',      correctPeriod: '1880s',       isAuthentic: true  },
        { id: 's2_b9',  description: "Children's primer, colorful but worn, 1920s",                               correctCondition: 'fair',      correctPeriod: '1920s',       isAuthentic: true  },
        { id: 's2_b10', description: 'History of the region, heavy tome, 1850s',                                  correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true  },
        { id: 's2_b11', description: 'Sailor log, salt-damaged cover, late 1800s',                                correctCondition: 'poor',      correctPeriod: 'late 1800s',  isAuthentic: true  },
        { id: 's2_b12', description: 'Sheet music collection, excellent condition, 1930s',                        correctCondition: 'excellent', correctPeriod: '1930s',       isAuthentic: true  },
      ],
    },
  ],
  hasAuthenticity: false,
}

// ─── SESSION 3 — Medium+ (2 locations, 5 requests, some damage) ──────────────

const antiqShift03: AntiquarianShift = {
  id: 'antiq_shift_03',
  briefingNotes: [
    'Two locations available today — the cave and the old tower.',
    'Choose one. Both should have what you need, but the cave tends to hold older finds.',
    'Five requests on the list. Read them carefully before you head out.',
  ],
  requests: [
    { id: 'req_s3_1', type: 'exploration journal', period: '1800s',       condition: 'good',      extraHint: 'likely found in older sites' },
    { id: 'req_s3_2', type: 'poetry anthology',    period: 'early 1900s', condition: 'fair'       },
    { id: 'req_s3_3', type: 'scientific treatise', period: '1800s',       condition: 'good'       },
    { id: 'req_s3_4', type: 'illustrated almanac', period: 'late 1800s',  condition: 'excellent'  },
    { id: 'req_s3_5', type: 'letter collection',   period: 'early 1900s', condition: 'fair'       },
  ],
  locations: [
    {
      id: 'cave',
      name: 'Cave',
      books: [
        // Matching books
        { id: 's3_cave_b1', description: 'Exploration journal, cracked leather, handwritten dates in 1850s',          correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_1' },
        { id: 's3_cave_b2', description: 'Thin poetry anthology, early 1900s, moderately foxed',                      correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_2' },
        { id: 's3_cave_b3', description: 'Scientific treatise on geology, 1880s, readable condition',                 correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_3' },
        { id: 's3_cave_b4', description: 'Illustrated almanac, vibrant plates still crisp, late 1800s',               correctCondition: 'excellent', correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s3_4' },
        { id: 's3_cave_b5', description: 'Bound letters, ink faded but legible, early 1900s',                         correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_5' },
        // Distractors
        { id: 's3_cave_b6',  description: 'Military manual, damp-warped cover, 1870s',         correctCondition: 'poor', correctPeriod: '1800s',   isAuthentic: true },
        { id: 's3_cave_b7',  description: 'Fables collection, missing front board, 1910s',     correctCondition: 'poor', correctPeriod: '1910s',   isAuthentic: true },
        { id: 's3_cave_b8',  description: 'Trade catalogue, thin paper, 1920s',                correctCondition: 'fair', correctPeriod: '1920s',   isAuthentic: true },
        { id: 's3_cave_b9',  description: 'Illustrated biography, red cloth, 1890s',           correctCondition: 'good', correctPeriod: '1890s',   isAuthentic: true },
        { id: 's3_cave_b10', description: 'Agricultural handbook, stiff binding, 1850s',       correctCondition: 'good', correctPeriod: '1800s',   isAuthentic: true },
      ],
    },
    {
      id: 'old_tower',
      name: 'Old Tower',
      books: [
        // Matching books — different flavour, same satisfiability
        { id: 's3_tower_b1', description: "Explorer's field journal, embossed cover, ~1860s",                         correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_1' },
        { id: 's3_tower_b2', description: 'Poetry anthology, slim volume, printed 1905',                              correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_2' },
        { id: 's3_tower_b3', description: 'Natural philosophy treatise, 1875, minor spine crack',                     correctCondition: 'good',      correctPeriod: '1800s',       isAuthentic: true,  matchesRequest: 'req_s3_3' },
        { id: 's3_tower_b4', description: 'Almanac with full-color astronomical charts, pristine, 1890s',             correctCondition: 'excellent', correctPeriod: 'late 1800s',  isAuthentic: true,  matchesRequest: 'req_s3_4' },
        { id: 's3_tower_b5', description: 'Correspondence portfolio, early 1900s, readable though foxed',             correctCondition: 'fair',      correctPeriod: 'early 1900s', isAuthentic: true,  matchesRequest: 'req_s3_5' },
        // Distractors
        { id: 's3_tower_b6',  description: 'Parish register, fragile pages, 1800s',               correctCondition: 'poor',      correctPeriod: '1800s',  isAuthentic: true },
        { id: 's3_tower_b7',  description: 'Travel memoir, water stains, 1920s',                  correctCondition: 'poor',      correctPeriod: '1920s',  isAuthentic: true },
        { id: 's3_tower_b8',  description: 'Grammar textbook, dog-eared, 1930s',                  correctCondition: 'fair',      correctPeriod: '1930s',  isAuthentic: true },
        { id: 's3_tower_b9',  description: 'Illustrated flora, hand-colored plates, 1910s',       correctCondition: 'excellent', correctPeriod: '1910s',  isAuthentic: true },
        { id: 's3_tower_b10', description: 'Historical novel, dark green binding, 1880s',         correctCondition: 'good',      correctPeriod: '1880s',  isAuthentic: true },
      ],
    },
  ],
  hasAuthenticity: false,
}

export const ANTIQUARIAN_SHIFTS: AntiquarianShift[] = [antiqShift01, antiqShift02, antiqShift03]
