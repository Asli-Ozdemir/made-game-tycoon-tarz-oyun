// src/data/detectiveCases.ts
import type { RoomId } from '@/pixi/rooms/types'

export interface ExamineItem {
  id: string
  label: string
  description: string
  xNorm: number          // position on the object (0–1)
  yNorm: number
  radius: number
  revealsClue?: string
}

export interface EvidenceNode {
  id: string
  label: string
  description: string
  sceneXNorm: number     // position in scene (0–1)
  sceneYNorm: number
  pointsTo: string       // suspect id or next evidence id
  examineItems?: ExamineItem[]
}

export interface DayClue {
  day: number
  text: string
}

export interface Suspect {
  id: string
  name: string
  location: string
  isGuilty: boolean
  dialogue: {
    greeting: string
    accuseCorrect: string
    accuseWrong: string
    detectiveComment: string
  }
}

export interface DetectiveCase {
  id: string
  title: string
  dayLimit: number
  location: RoomId
  evidence: EvidenceNode[]
  suspects: Suspect[]
  culpritId: string
  dayClues: DayClue[]
  detectiveMood: 1 | 2 | 3 | 4
}

// ─── VAKA 1 — Parkta Kayıp Evrak ────────────────────────────────────────────

const case01: DetectiveCase = {
  id: 'case_01',
  title: 'Parkta Kayıp Evrak',
  dayLimit: 4,
  location: 'park',
  detectiveMood: 1,
  culpritId: 'suspect_mete',
  dayClues: [
    { day: 1, text: 'Şehir muhasebecisi kayıp — evraklar parkta bulundu. Olay yerine git.' },
    { day: 2, text: 'Banka yakınında biri şüpheli birini görmüş. Bul ve konuş.' },
    { day: 3, text: 'Sigara izinden parmak izi çıktı. Mete\'nin kaydına bak.' },
    { day: 4, text: 'Son gün. Kanıtlar yeterli, kararını ver.' },
  ],
  evidence: [
    {
      id: 'ev_canta',
      label: 'Deri çanta',
      description: 'Sol cepçiği zorla açılmış izleri var.',
      sceneXNorm: 0.55,
      sceneYNorm: 0.72,
      pointsTo: 'suspect_dilara',
      examineItems: [
        {
          id: 'ev_canta_not',
          label: 'Kırışık not kağıdı',
          description: '"Yarın park — M." yazıyor. M harfi kimin baş harfi?',
          xNorm: 0.3,
          yNorm: 0.4,
          radius: 18,
          revealsClue: 'ev_sigara',
        },
        {
          id: 'ev_canta_kart',
          label: 'Kartvizit',
          description: 'Mete Doğan — Finansal Danışman',
          xNorm: 0.65,
          yNorm: 0.6,
          radius: 16,
        },
      ],
    },
    {
      id: 'ev_sigara',
      label: 'Sigara izmariti',
      description: 'Bank yanında. Pahalı marka — şehirde sadece iki kişi bu markayı içiyor.',
      sceneXNorm: 0.3,
      sceneYNorm: 0.8,
      pointsTo: 'suspect_mete',
    },
  ],
  suspects: [
    {
      id: 'suspect_dilara',
      name: 'Dilara',
      location: 'Parkın kuzey girişinde yürüyor',
      isGuilty: false,
      dialogue: {
        greeting: 'Ben sadece parkta yürüyüş yapıyordum. Çantayı tanımıyorum.',
        accuseCorrect: '',
        accuseWrong: 'Bu nasıl bir suçlama? Benim burada işim yok dedektif bey.',
        detectiveComment: 'Elleri titremiyor — masumiyeti gerçek gibi görünüyor.',
      },
    },
    {
      id: 'suspect_mete',
      name: 'Mete Doğan',
      location: 'Park kulübesinin arkasında',
      isGuilty: true,
      dialogue: {
        greeting: 'Ben... sadece bir müşterimi bekliyordum burada.',
        accuseCorrect: 'Tamam, tamam. Evrakları aldım. Ama beni zorladılar — yemin ederim.',
        accuseWrong: '',
        detectiveComment: 'Bu adam biliyor. Gözlerini kaçırıyor.',
      },
    },
  ],
}

// ─── VAKA 2 — Kuyumcu Soygunu ────────────────────────────────────────────────

const case02: DetectiveCase = {
  id: 'case_02',
  title: 'Kuyumcu Soygunu',
  dayLimit: 5,
  location: 'city',
  detectiveMood: 1,
  culpritId: 'suspect_kadir',
  dayClues: [
    { day: 1, text: 'Sabah kuyumcudan yüzük çalınmış. Dükkân sahibi sigorta şirketini arıyor.' },
    { day: 2, text: 'Güvenlik görüntüsünde hoody giyen biri var. Kafedeki tanıkla konuş.' },
    { day: 3, text: 'Tanık o geceyi tam hatırlamıyor ama koku dedi — sigara değil, solvent.' },
    { day: 4, text: 'Kadir tamirci — solvent kullanıyor. Ama ona bağlayan ne var?' },
    { day: 5, text: 'Son gün. Kamerada yakalanan ayak izi boyutu Kadir\'inkiyle uyuşuyor.' },
  ],
  evidence: [
    {
      id: 'ev_cam',
      label: 'Kırık vitrin camı',
      description: 'İçeriden kırılmış. Çekiç izi değil, kesici alet.',
      sceneXNorm: 0.5,
      sceneYNorm: 0.6,
      pointsTo: 'suspect_zehra',
      examineItems: [
        {
          id: 'ev_cam_iz',
          label: 'Kesik izi',
          description: 'Cam kesici — profesyonel alet. Amatör iş değil.',
          xNorm: 0.5,
          yNorm: 0.5,
          radius: 20,
          revealsClue: 'ev_eldiven',
        },
      ],
    },
    {
      id: 'ev_eldiven',
      label: 'Siyah lastik eldiven',
      description: 'Kuyumcu arkasında. Solvent kokusu sinmiş.',
      sceneXNorm: 0.7,
      sceneYNorm: 0.75,
      pointsTo: 'suspect_kadir',
    },
    {
      id: 'ev_ayak',
      label: 'Toz ayak izi',
      description: '44 numara. Büyük beden.',
      sceneXNorm: 0.35,
      sceneYNorm: 0.85,
      pointsTo: 'suspect_kadir',
    },
  ],
  suspects: [
    {
      id: 'suspect_zehra',
      name: 'Zehra Hanım',
      location: 'Kuyumcu önünde bekliyor',
      isGuilty: false,
      dialogue: {
        greeting: 'Ben dükkân sahibiyim! Siz beni mi suçluyorsunuz?',
        accuseCorrect: '',
        accuseWrong: 'Aklınız var mı sizin! Kendi dükkânımı soyacak değilim!',
        detectiveComment: 'Öfkesi gerçek. Bu dışarıdan gelen iş.',
      },
    },
    {
      id: 'suspect_kadir',
      name: 'Kadir Usta',
      location: 'Kafenin yanındaki tamirci dükkanında',
      isGuilty: true,
      dialogue: {
        greeting: 'Ben tam gece buradaydım, kimseyi görmedim.',
        accuseCorrect: 'Nasıl buldunuz... Borca battım, başka çarem yoktu.',
        accuseWrong: '',
        detectiveComment: 'Elleri solventtan sararmış. Gözleri tavana kaçıyor.',
      },
    },
    {
      id: 'suspect_ali',
      name: 'Ali',
      location: 'Kafede oturuyor',
      isGuilty: false,
      dialogue: {
        greeting: 'Ben sadece kahvemi içiyordum. O gece özel bir şey görmedim ki.',
        accuseCorrect: '',
        accuseWrong: 'Beni bırakın, ben hiçbir şey yapmadım!',
        detectiveComment: 'Sinirli ama masum sinirlilik bu.',
      },
    },
  ],
}

// ─── VAKA 3 — Balıkçı Limanı ─────────────────────────────────────────────────

const case03: DetectiveCase = {
  id: 'case_03',
  title: 'Limanın Kayıp Teknesi',
  dayLimit: 5,
  location: 'coast',
  detectiveMood: 2,
  culpritId: 'suspect_nikos',
  dayClues: [
    { day: 1, text: 'Balıkçının teknesi battı — ama hasarın yeri kasıtlı gibi görünüyor.' },
    { day: 2, text: 'Remy bir şey duymuş geceleri. Git onunla konuş.' },
    { day: 3, text: 'Limanda yabancı biri varmış o gece. Tekne sahibiyle anlaşmazlık mı?' },
    { day: 4, text: 'Tekne sigortası — Nikos faydalananlar arasında.' },
    { day: 5, text: 'Son gün. Dalış maskesi izinden parmak izi çıktı.' },
  ],
  evidence: [
    {
      id: 'ev_tekne',
      label: 'Batmış tekne gövdesi',
      description: 'Alt kısımda bilerek açılmış bir delik.',
      sceneXNorm: 0.5,
      sceneYNorm: 0.65,
      pointsTo: 'suspect_remy_witness',
      examineItems: [
        {
          id: 'ev_tekne_delik',
          label: 'Kesik kenar',
          description: 'Alet izi temiz — deneyimli biri yapmış.',
          xNorm: 0.5,
          yNorm: 0.7,
          radius: 22,
          revealsClue: 'ev_maske',
        },
      ],
    },
    {
      id: 'ev_maske',
      label: 'Dalış maskesi',
      description: 'Sahil kayalıklarında bulundu. İç yüzünde yağ izi.',
      sceneXNorm: 0.25,
      sceneYNorm: 0.78,
      pointsTo: 'suspect_nikos',
    },
  ],
  suspects: [
    {
      id: 'suspect_remy_witness',
      name: 'Remy',
      location: 'Balıkçı kulübesinin önünde',
      isGuilty: false,
      dialogue: {
        greeting: 'Geceleri garip sesler duydum limandan. Biri suda hareket ediyordu.',
        accuseCorrect: '',
        accuseWrong: 'Arkadaşım benim! Ben böyle bir şey yapmam!',
        detectiveComment: 'Remy açık yürekli biri. Tanıklığı önemli.',
      },
    },
    {
      id: 'suspect_nikos',
      name: 'Nikos',
      location: 'Limanın en uç noktasında teknesini tamir ediyor',
      isGuilty: true,
      dialogue: {
        greeting: 'Ben o gece evdeydim. Sorma bana limanı.',
        accuseCorrect: 'Sigortayı almak istedim, başka yolum yoktu. Aile borca battı.',
        accuseWrong: '',
        detectiveComment: 'Maskeyi gösterince titredi. Bu adamın işi.',
      },
    },
  ],
}

export const DETECTIVE_CASES: DetectiveCase[] = [case01, case02, case03]
