// src/data/skillTree.ts
import type { IdeaSeedType } from '@/data/npcDialogues'

export type LifePath = 'hirs' | 'huzur' | 'emek'

export type SkillEffect =
  | { type: 'tycoon_bonus';  stat: 'hikaye_quality' | 'rpg_quality' | 'sim_quality' | 'action_quality' | 'all_quality' | 'project_speed' | 'income_mult' | 'starting_money'; value: number }
  | { type: 'project_bonus'; genre: string; value: number }
  | { type: 'crisis_reduce'; value: number }
  | { type: 'crisis_duration_reduce'; value: number }
  | { type: 'bug_reduce';    value: number }
  | { type: 'salary_reduce'; value: number }
  | { type: 'social_unlock'; target: string }
  | { type: 'reputation_bonus'; value: number }

export interface SkillNode {
  id: string
  tier: 1 | 2 | 3 | 4 | 5
  name: string
  description: string
  cost: { type: IdeaSeedType; amount: number }[]
  effect: SkillEffect
  dependsOn: string[]
  lifePathLock?: LifePath
}

export const SKILL_NODES: SkillNode[] = [
  // ── T1 (6 node, bağımlılık yok, 1× tek tip) ───────────────────────────
  {
    id: 'nos_t1',
    tier: 1,
    name: 'İlk Kıvılcım',
    description: 'Geçmişin izleri hikayene derinlik katar.',
    cost: [{ type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'hikaye_quality', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'hik_t1',
    tier: 1,
    name: 'Karakter Duygusu',
    description: 'Karakterlerin neden önemsendiğini anlarsın.',
    cost: [{ type: 'hikaye', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'rpg_quality', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'kaos_t1',
    tier: 1,
    name: 'Düzensiz Deha',
    description: 'Kaos içinde yaratıcılık filizlenir.',
    cost: [{ type: 'kaos', amount: 1 }],
    effect: { type: 'crisis_reduce', value: 0.10 },
    dependsOn: [],
  },
  {
    id: 'zmn_t1',
    tier: 1,
    name: 'Odak Anı',
    description: 'Her dakikayı sayarsın.',
    cost: [{ type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'project_speed', value: 0.05 },
    dependsOn: [],
  },
  {
    id: 'nos2_t1',
    tier: 1,
    name: 'Köklere Dönüş',
    description: 'Nereden geldiğini bilmek nereye gideceğini netleştirir.',
    cost: [{ type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'starting_money', value: 2000 },
    dependsOn: [],
  },
  {
    id: 'hik2_t1',
    tier: 1,
    name: 'İlk Taslak',
    description: 'Hiçbir şey mükemmel başlamaz, ama bir yerlerde başlar.',
    cost: [{ type: 'hikaye', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.03 },
    dependsOn: [],
  },

  // ── T2 (7 node) ────────────────────────────────────────────────────────
  {
    id: 'nos_t2',
    tier: 2,
    name: 'Geçmişin Sesi',
    description: "Marcus'la daha derin bir bağ kurarsın.",
    cost: [{ type: 'nostalji', amount: 2 }],
    effect: { type: 'social_unlock', target: 'marcus_depth' },
    dependsOn: ['nos_t1'],
  },
  {
    id: 'hik_t2',
    tier: 2,
    name: 'Empati Katmanı',
    description: 'Oyuncunun hislerine daha hassas bakarsın.',
    cost: [{ type: 'hikaye', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'rpg_quality', value: 0.08 },
    dependsOn: ['hik_t1'],
  },
  {
    id: 'kaos_t2',
    tier: 2,
    name: 'Kontrollü Kaos',
    description: 'Ekibini kaosun ortasında bile verimli tutarsın.',
    cost: [{ type: 'kaos', amount: 1 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'project_speed', value: 0.08 },
    dependsOn: ['kaos_t1'],
  },
  {
    id: 'zmn_t2',
    tier: 2,
    name: 'Akış Hali',
    description: 'Zaman senin için akar.',
    cost: [{ type: 'zaman_yonetimi', amount: 2 }],
    effect: { type: 'crisis_duration_reduce', value: 0.25 },
    dependsOn: ['zmn_t1'],
  },
  {
    id: 'nos_hik_t2',
    tier: 2,
    name: 'Hikayeci',
    description: 'Geçmişi hikayeye dönüştürme sanatın var.',
    cost: [{ type: 'nostalji', amount: 1 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'project_bonus', genre: 'Adventure', value: 0.08 },
    dependsOn: ['nos_t1', 'hik_t1'],
  },
  {
    id: 'kaos2_t2',
    tier: 2,
    name: 'Riskli Bahis',
    description: 'Yüksek risk, yüksek ödül. Kalite öngörülmez olur ama tavana çıkabilir.',
    cost: [{ type: 'kaos', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.12 },
    dependsOn: ['kaos_t1'],
  },
  {
    id: 'zmn2_t2',
    tier: 2,
    name: 'Verimli Sabah',
    description: 'Sabahın ilk saatlerini en iyi sen kullanırsın.',
    cost: [{ type: 'zaman_yonetimi', amount: 1 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'project_speed', value: 0.06 },
    dependsOn: ['zmn_t1', 'nos2_t1'],
  },

  // ── T3 (7 node) ────────────────────────────────────────────────────────
  {
    id: 'nos_t3',
    tier: 3,
    name: 'Arşiv Ustası',
    description: "Sahafın arka deposuna erişim kazanırsın.",
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'social_unlock', target: 'sahaf_arsiv' },
    dependsOn: ['nos_t2'],
  },
  {
    id: 'hik_t3',
    tier: 3,
    name: 'Dünya İnşacısı',
    description: 'Simülasyon oyunlarında gerçekçilik çıtasını yükseltirsin.',
    cost: [{ type: 'hikaye', amount: 2 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'sim_quality', value: 0.10 },
    dependsOn: ['hik_t2'],
  },
  {
    id: 'kaos_t3',
    tier: 3,
    name: 'Kaotik Yaratıcı',
    description: 'Aksiyon oyunlarında adrenalin seviyeni maksime çıkarırsın.',
    cost: [{ type: 'kaos', amount: 2 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'action_quality', value: 0.12 },
    dependsOn: ['kaos_t2'],
  },
  {
    id: 'zmn_t3',
    tier: 3,
    name: 'Zaman Mühendisi',
    description: 'Birden fazla projeyi aynı anda yürütebilirsin.',
    cost: [{ type: 'zaman_yonetimi', amount: 3 }],
    effect: { type: 'bug_reduce', value: 0.15 },
    dependsOn: ['zmn_t2'],
  },
  {
    id: 'nos_kaos_t3',
    tier: 3,
    name: 'Nostaljik İsyan',
    description: 'Bağımsız ruhun reklamcılık maliyetini düşürür.',
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'kaos', amount: 1 }],
    effect: { type: 'salary_reduce', value: 0.10 },
    dependsOn: ['nos_t2', 'kaos_t2'],
  },
  {
    id: 'hik_zmn_t3',
    tier: 3,
    name: 'Anlatıcı Disiplin',
    description: 'Hikayeni yazmak kadar kodunu da temiz tutarsın.',
    cost: [{ type: 'hikaye', amount: 2 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'bug_reduce', value: 0.10 },
    dependsOn: ['hik_t2', 'zmn_t2'],
  },
  {
    id: 'mix_t3',
    tier: 3,
    name: 'Denge',
    description: 'Hikaye ve çılgınlık arasındaki dengeyi bulursun.',
    cost: [{ type: 'nostalji', amount: 1 }, { type: 'hikaye', amount: 1 }, { type: 'kaos', amount: 1 }],
    effect: { type: 'reputation_bonus', value: 5 },
    dependsOn: ['nos_hik_t2'],
  },

  // ── T4 (6 node) ────────────────────────────────────────────────────────
  {
    id: 'nos_t4',
    tier: 4,
    name: "Geçmişin Mimarı",
    description: "Remy sana nehrin sırrını anlatır.",
    cost: [{ type: 'nostalji', amount: 3 }, { type: 'hikaye', amount: 1 }],
    effect: { type: 'social_unlock', target: 'remy_depth' },
    dependsOn: ['nos_t3'],
  },
  {
    id: 'hik_t4',
    tier: 4,
    name: 'Efsanevi Senaryo',
    description: 'Her türde kalite tavanı yükselir.',
    cost: [{ type: 'hikaye', amount: 3 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.15 },
    dependsOn: ['hik_t3'],
  },
  {
    id: 'kaos_t4',
    tier: 4,
    name: 'Anarşist Vizyon',
    description: 'Bir oyunun viral olmasını sağlayacak kıvılcımı bilirsin.',
    cost: [{ type: 'kaos', amount: 3 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'income_mult', value: 0.20 },
    dependsOn: ['kaos_t3'],
  },
  {
    id: 'zmn_t4',
    tier: 4,
    name: 'Kronos Zihni',
    description: 'Krizler seni eskisi kadar yıpratmaz.',
    cost: [{ type: 'zaman_yonetimi', amount: 3 }, { type: 'nostalji', amount: 1 }],
    effect: { type: 'crisis_duration_reduce', value: 0.50 },
    dependsOn: ['zmn_t3'],
  },
  {
    id: 'nos_hik_t4',
    tier: 4,
    name: 'Derin Hafıza',
    description: "Theo sana pubın en karanlık sırrını fısıldar.",
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'hikaye', amount: 2 }],
    effect: { type: 'social_unlock', target: 'theo_depth' },
    dependsOn: ['nos_t3', 'hik_t3'],
  },
  {
    id: 'kaos_zmn_t4',
    tier: 4,
    name: 'Kaotik Verimlilik',
    description: 'Çalışanların seni kaos içinde bile takip eder.',
    cost: [{ type: 'kaos', amount: 2 }, { type: 'zaman_yonetimi', amount: 2 }],
    effect: { type: 'salary_reduce', value: 0.15 },
    dependsOn: ['kaos_t3', 'zmn_t3'],
  },

  // ── T5 (4 node, Hayat Yolu efsanevi) ──────────────────────────────────
  {
    id: 't5_hirs',
    tier: 5,
    name: 'Zirvenin Bedeli',
    description: 'Gelir her şeyin önünde gelir. Hırs Yolu seni burada tamamlar.',
    cost: [{ type: 'kaos', amount: 4 }, { type: 'zaman_yonetimi', amount: 1 }],
    effect: { type: 'tycoon_bonus', stat: 'income_mult', value: 0.30 },
    dependsOn: ['kaos_t4'],
    lifePathLock: 'hirs',
  },
  {
    id: 't5_huzur',
    tier: 5,
    name: 'Huzurun Kökü',
    description: 'Nehir gibi akar, deniz gibi derin. Huzur Yolu burada meyve verir.',
    cost: [{ type: 'nostalji', amount: 3 }, { type: 'hikaye', amount: 2 }],
    effect: { type: 'tycoon_bonus', stat: 'all_quality', value: 0.25 },
    dependsOn: ['nos_t4', 'hik_t4'],
    lifePathLock: 'huzur',
  },
  {
    id: 't5_emek',
    tier: 5,
    name: 'Demir İrade',
    description: 'Hiçbir bug, hiçbir hata geçemez bu zihinsel duvardan. Emek Yolu tamamlanır.',
    cost: [{ type: 'zaman_yonetimi', amount: 3 }, { type: 'kaos', amount: 2 }],
    effect: { type: 'bug_reduce', value: 1.0 },
    dependsOn: ['zmn_t4', 'kaos_t4'],
    lifePathLock: 'emek',
  },
  {
    id: 't5_notr',
    tier: 5,
    name: 'Denge Noktası',
    description: 'Hiçbir yol seçmeden tüm yollara bakmak da bir tercih.',
    cost: [{ type: 'nostalji', amount: 2 }, { type: 'hikaye', amount: 2 }, { type: 'kaos', amount: 1 }],
    effect: { type: 'reputation_bonus', value: 15 },
    dependsOn: ['nos_hik_t4', 'mix_t3'],
  },
]
