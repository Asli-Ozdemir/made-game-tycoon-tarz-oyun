// src/data/interviews.ts
import type { ScoreBand } from '@/data/mediaOutlets'

export type Reporter = 'iris' | 'press'
export const INTERVIEW_CHANCE = 0.35

export interface InterviewAnswer {
  text: string
  reputationDelta: number
  salesBonusPct?: number          // projenin gelirinin oranı kadar lansman buzz parası
  irisRelationshipDelta?: number  // reporter === 'iris' ise uygulanır
  resultLine: string
}
export interface InterviewQuestion {
  reporter: Reporter
  prompt: string
  answers: InterviewAnswer[]
}

export const INTERVIEWS: Record<ScoreBand, InterviewQuestion[]> = {
  acclaim: [
    {
      reporter: 'iris',
      prompt: '"Herkes oyununu konuşuyor. Bunu bekliyor muydun, yoksa sen de mi şaşırdın?"',
      answers: [
        { text: 'Ekibime güvendim, hak ettiler.', reputationDelta: 6, irisRelationshipDelta: 3, resultLine: 'Stüdyo "ekip işi" dedi — basın sıcak baktı.' },
        { text: 'Tabii ki. Ben yaparım, beklenir.', reputationDelta: -2, salesBonusPct: 0.06, irisRelationshipDelta: -2, resultLine: 'Kibirli çıkış manşetlere düştü — konuşuldu ama sevilmedi.' },
        { text: 'Asıl hikâye nehrin karşısında...', reputationDelta: 2, irisRelationshipDelta: 5, resultLine: 'Crane\'e üstü kapalı gönderme dikkat çekti.' },
      ],
    },
  ],
  approval: [
    {
      reporter: 'iris',
      prompt: '"İyi işti ama zirve değil. Eksik kalan neydi sence?"',
      answers: [
        { text: 'Dürüst olayım, vakit yetmedi.', reputationDelta: 4, irisRelationshipDelta: 3, resultLine: 'Samimi itiraf okuyucularda karşılık buldu.' },
        { text: 'Eksik yok, beklentiler fazla.', reputationDelta: -2, irisRelationshipDelta: -1, resultLine: 'Savunmacı ton pek tutmadı.' },
      ],
    },
  ],
  mixed: [
    {
      reporter: 'press',
      prompt: '"Eleştiriler karışık. Yamalar gelecek mi?"',
      answers: [
        { text: 'Evet, dinliyoruz, düzelteceğiz.', reputationDelta: 5, salesBonusPct: 0.03, resultLine: 'Stüdyo yama sözü verdi — topluluk umutlandı.' },
        { text: 'Oyun olması gerektiği gibi.', reputationDelta: -3, resultLine: 'Sert savunma tepki çekti.' },
      ],
    },
  ],
  pan: [
    {
      reporter: 'press',
      prompt: '"Çıkış iyi gitmedi. Şimdi ne olacak?"',
      answers: [
        { text: 'Hatayı kabul ediyorum, ders aldım.', reputationDelta: 4, resultLine: 'Olgun cevap, en azından saygı kazandırdı.' },
        { text: 'Bu oyun yanlış anlaşıldı.', reputationDelta: -4, resultLine: 'İnkâr, durumu daha kötü gösterdi.' },
      ],
    },
  ],
}
