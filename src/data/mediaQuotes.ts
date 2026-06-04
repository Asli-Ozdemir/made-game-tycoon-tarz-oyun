// src/data/mediaQuotes.ts
import type { ScoreBand } from './mediaOutlets'

// Şablon değişkenleri: {oyun} = oyun adı, {tür} = tür
export const OUTLET_QUOTES: Record<ScoreBand, string[]> = {
  acclaim: [
    '"{oyun}" yılın en cesur işlerinden biri.',
    'Kalbi olan bir {tür}. Kaçırmayın.',
    'Nehrin sakin yakasından gelen bir başyapıt.',
    '"{oyun}" türün çıtasını yükseltiyor.',
  ],
  approval: [
    '"{oyun}" sağlam, sıcak, oynaması keyifli.',
    'Kusursuz değil ama gönülden yapılmış bir {tür}.',
    'Küçük stüdyodan beklenmedik bir olgunluk.',
  ],
  mixed: [
    '"{oyun}" parlak bir fikir, kaba kenarlar.',
    'İddialı ama bazen dağınık bir {tür}.',
    'İyi anları var; tutarlılık eksik.',
  ],
  pan: [
    '"{oyun}" fikrini gerçekleştiremiyor.',
    'Hırslı ama pişmemiş bir {tür}.',
    'Daha fırına girmesi gereken bir oyun.',
  ],
}

export const YOUTUBER_QUOTES: Record<ScoreBand, string[]> = {
  acclaim: [
    'Bu {tür} beni şaşırttı, finali konuşulur!',
    '"{oyun}" oynarken saati unuttum dostum.',
    'Yılın indie sürprizi olabilir, izleyin.',
  ],
  approval: [
    '"{oyun}" fena değil, birkaç saat keyif aldım.',
    'Solid bir {tür}, tavsiye ederim ama abartmayın.',
    'Beklemiyordum ama oturup bitirdim.',
  ],
  mixed: [
    '30 dk oynadım, fena değil ama bug var.',
    '"{oyun}" kararsız bıraktı beni açıkçası.',
    'Fikir güzel, uygulama yarım kalmış gibi.',
  ],
  pan: [
    'Dürüst olayım, "{oyun}" beni sıktı.',
    'Yarısında bıraktım, kusura bakmayın.',
    'Bu {tür} için erken çıkmış gibi duruyor.',
  ],
}

export const SOCIAL_QUOTES: Record<ScoreBand, string[]> = {
  acclaim: [
    'gece 3\'e kadar oynadım uyuyamıyorum',
    'finali içime oturdu yaa',
    '"{oyun}" başyapıt demiştim demedim demeyin',
  ],
  approval: [
    'beklediğimden iyiymiş valla',
    '{tür} sevenler bir baksın derim',
    'fiyatına değer bence',
  ],
  mixed: [
    'idare eder işte, indirimde alın',
    'bug yedim ama eğlenceli kısımları var',
    'kararsızım, ne iyi ne kötü',
  ],
  pan: [
    'iade ettim 👎',
    'bu kadar hype neden anlamadım',
    'bekleyin yamaları belki düzelir',
  ],
}

export const SOCIAL_VIRAL: string[] = [
  'herkes "{oyun}" oynuyor, ben de aldım!',
  'akış "{oyun}" klipleriyle doldu 😂',
  'bu oyun nasıl bu kadar patladı ya',
]

export const SOCIAL_BOMB: string[] = [
  'eksi bombardımanı başlattım, hak etti',
  '"{oyun}" yüzünden ekibe kızgınım',
  'bu fiyata bu mu, olmadı',
]

export function fillTemplate(s: string, vars: { oyun: string; tur: string }): string {
  return s.replace(/\{oyun\}/g, vars.oyun).replace(/\{tür\}/g, vars.tur)
}
