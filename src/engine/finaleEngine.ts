// src/engine/finaleEngine.ts
// ~30. yıl (arcEnd) kapanış epilogu — oyun durumundan derlenen monolog + "neredeler" kartları.
// Saf fonksiyon: FinaleSnapshot → içerik. Snapshot derlemesi (store okuma) UI katmanındadır.

export type NexusOutcome = 'buyout' | 'destroy' | 'forgive' | 'merge' | 'none'

export interface FinaleSnapshot {
  playerName:       string
  spouseName:       string | null
  childNames:       string[]
  nexusOutcome:     NexusOutcome
  reputation:       number
  topPhilosophyNpc: string | null   // en yüksek kalpli felsefe NPC'sinin id'si
  beaMural:         boolean
  firinDevri:       boolean
  danielSigridEvli: boolean
}

export interface EpilogueLine { speaker: string; text: string }
export interface EpilogueCard { baslik: string; metin: string }

const PHIL_LINE: Record<string, string> = {
  marcus:  'En çok Marcus\'a uğradın; kontrol edemediğini bırakmayı, edebildiğine sahip çıkmayı öğrendin.',
  remy:    'Remy gibi akmayı öğrendin — nehrin yanında olmak yetti.',
  theo:    'Theo\'nun absürt neşesini taşıdın: anlam yoksa, gülüp kendin koydun.',
  bruno:   'Bruno gibi her gün bir perçin çaktın; erdem alışkanlıkta saklıymış.',
  magnus:  'Magnus\'un sesini duydun: ezilirken bile kendi değerini sen yazdın.',
  yevgeni: 'Yevgeni gibi söktün, anladın; ama yıkmadan önce yerine ne koyacağını öğrendin.',
  marta:   'Marta\'nın bakışını aldın: tablo değil, altındaki insan titrer.',
  clara:   'Clara\'nın kuralını taşıdın: kimse kimsenin basamağı olmasın.',
  aldo:    'Aldo\'nun fırınından öğrendin: sıcak ekmek, bir dost — gerisi dipsiz kuyu.',
  rex:     'Rex\'in dersini unutmadın: mutluluk ertelenmez, bu akşamı da yaşa.',
  vivian:  'Vivian\'ın terazisini gördün: toplama bak ama kendi öfkeni o kefeye koyma.',
  soren:   'Søren gibi dümeni kendin tuttun: "mecbur kaldım" demedin, "ben seçtim" dedin.',
}

const NEXUS_CARD: Record<NexusOutcome, string> = {
  buyout:  'Nexus\'u satın aldın. Crane koltuğu bıraktı; sen oturdun. Bazen onun gülümsemesini takınıyorsun — fark etmeden.',
  destroy: 'Crane\'i yıktın. Düsturunu kanıtladın: korku tuttu. Aynaya bakınca bazen onu görüyorsun.',
  forgive: 'Crane\'i affettin. Anlamadı, ama af senin içindi. Yıllar sonra kısa bir mektup geldi: "Hâlâ anlamıyorum. Teşekkürler."',
  merge:   'Nexus\'la birleştin. İki düşman, tek çatı. Kâr yerine ihtiyaç tuttu sizi.',
  none:    'Crane\'le hiç yüzleşmedin. Nexus uzakta, büyük, kayıtsız kaldı — ve sen huzurla küçük kaldın.',
}

export function buildEpilogue(s: FinaleSnapshot): { monolog: EpilogueLine[]; kartlar: EpilogueCard[] } {
  const evli = s.spouseName != null

  const monolog: EpilogueLine[] = [
    { speaker: s.playerName, text: 'Otuz yıl. Kovulmuş, terk edilmiş gelmiştim bu eve. Tuz hâlâ aynı kokuyor.' },
    evli
      ? { speaker: s.playerName, text: `Ama artık yalnız değilim. ${s.spouseName} yan odada; ev artık gerçekten bir ev.` }
      : { speaker: s.playerName, text: 'Hâlâ yalnızım. Ama bu terk edilmişlik değil — seçtiğim bir sükûnet.' },
    { speaker: s.playerName, text: 'Nehir beni buraya getirdi. Bir kısmını ben kürek çektim, bir kısmını bıraktım. İkisi de benim.' },
  ]

  const kartlar: EpilogueCard[] = []

  // 1) Eş & çocuklar
  if (evli) {
    let metin = `${s.spouseName} ile bir ömür.`
    if (s.childNames.length > 0) {
      metin += ` ${s.childNames.join(' ve ')} büyüdü; kimi nehrin bu yakasında, kimi uzaklarda.`
    }
    kartlar.push({ baslik: 'Sevdiklerin', metin })
  } else {
    kartlar.push({ baslik: 'Sevdiklerin', metin: 'Kimseyle evlenmedin. Yine de ev hiç boş olmadı — uğrayan dostlar, gelen mektuplar.' })
  }

  // 2) Crane / Nexus (4C aynası)
  kartlar.push({ baslik: 'Nehrin Karşı Yakası', metin: NEXUS_CARD[s.nexusOutcome] })

  // 3) Stüdyo & kariyer (itibar eşiği)
  const kariyer =
    s.reputation >= 80 ? 'Adın sektöre yazıldı — nehri geçen efsane.' :
    s.reputation >= 40 ? 'Küçük ama sevilen bir iz bıraktın; seni bilenler gülümseyerek anıyor.' :
                         'Büyük olmadı. Ama senindi, baştan sona.'
  kartlar.push({ baslik: 'Stüdyo', metin: kariyer })

  // 4) Yakın felsefe & şehir (dinamik; boşsa atlanır)
  const satirlar: string[] = []
  if (s.topPhilosophyNpc && PHIL_LINE[s.topPhilosophyNpc]) satirlar.push(PHIL_LINE[s.topPhilosophyNpc])
  if (s.danielSigridEvli) satirlar.push('Daniel ile Sigrid evlendi; bilim ve nehir aynı sofrada.')
  if (s.firinDevri)       satirlar.push('Aldo gitti; fırını Rosa devraldı — kapıda artık onun adı.')
  if (s.beaMural)         satirlar.push('Bea\'nın murali hâlâ köprünün ayağında; mavi bir nehir, içinden çıkan insanlar.')
  if (satirlar.length > 0) kartlar.push({ baslik: 'Şehir', metin: satirlar.join(' ') })

  return { monolog, kartlar }
}
