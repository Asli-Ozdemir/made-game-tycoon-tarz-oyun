// src/data/npcDialogues.ts

export type IdeaSeedType = 'nostalji' | 'hikaye' | 'kaos' | 'zaman_yonetimi' | 'analiz' | 'sosyallik' | 'game_history' | 'hukuk'

export const IDEA_SEED_META: Record<IdeaSeedType, { label: string; color: string; emoji: string }> = {
  nostalji:       { label: 'Nostalji',       color: '#a78bfa', emoji: '🌙' },
  hikaye:         { label: 'Hikaye',          color: '#60a5fa', emoji: '📖' },
  kaos:           { label: 'Kaos',            color: '#f87171', emoji: '🌪️' },
  zaman_yonetimi: { label: 'Zaman Yönetimi',  color: '#34d399', emoji: '⏳' },
  analiz:         { label: 'Analiz',          color: '#fbbf24', emoji: '🔍' },
  sosyallik:      { label: 'Sosyallik',       color: '#fb7185', emoji: '🫂' },
  game_history:   { label: 'Oyun Tarihi',     color: '#f97316', emoji: '🕹️' },
  hukuk:          { label: 'Hukuk',            color: '#6366f1', emoji: '⚖️' },
}

export interface DialogueLine {
  speaker: 'npc' | 'player'
  text: string
}

export interface DialogueChoice {
  text: string
  lines: DialogueLine[]
  ideaSeed?: IdeaSeedType
  relationshipBonus: number
}

export interface Dialogue {
  id: string
  tier: 1 | 2 | 3
  title: string
  lines: DialogueLine[]
  choices?: DialogueChoice[]
  ideaSeed?: IdeaSeedType   // otomatik ödül (seçim yoksa)
  relationshipBonus: number
  repeatable?: boolean
}

export type NPCId =
  // Felsefe NPC'leri
  | 'marcus' | 'remy' | 'theo' | 'bruno' | 'magnus' | 'yevgeni' | 'marta' | 'clara' | 'aldo' | 'rex' | 'vivian' | 'soren'
  // Romantizm adayları
  | 'elise' | 'daniel' | 'nadia' | 'cassian' | 'rosa' | 'iris' | 'sigrid' | 'liv' | 'bjorn' | 'kai' | 'elias' | 'matteo'

export interface NPCDef {
  id: NPCId
  name: string
  role: string
  philosophy: string
  emoji: string
  gender: 'male' | 'female'
  isRomanceCandidate: boolean
  tier2Threshold: number
  tier3Threshold: number
  dialogues: Dialogue[]
}

// ─── MARCUS ─────────────────────────────────────────────────────────────────

const marcus: NPCDef = {
  id: 'marcus',
  name: 'Marcus',
  role: 'Sahaf',
  philosophy: 'Stoacılık — Kontrol edemediklerimizi bırakmak, edebildiklerimize sahip çıkmak.',
  emoji: '📚',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'marcus_t1_1',
      tier: 1,
      title: 'Yeni Bir Yüz',
      lines: [
        { speaker: 'npc',    text: 'Merhaba. Kapıyı ittiğinde biraz güçlük çektin, değil mi? Menteşe... nazikçe davranmak lazım.' },
        { speaker: 'player', text: 'Sahaf mı burası?' },
        { speaker: 'npc',    text: 'Hem sahaf hem kitap hem de ben. Marcus. Bir şey arıyorsan söyle, sadece bakmak istiyorsan — en iyi müşterilerden birisin.' },
        { speaker: 'player', text: 'Yeni taşındım bu taraflara.' },
        { speaker: 'npc',    text: 'Biliyorum. Şehir tarafından mı geldin? Nehrin karşısından?' },
        { speaker: 'player', text: '...' },
        { speaker: 'npc',    text: 'Çoğu iyi şey oradan gelir. Kötü şeyler de. Ama şu an buradasın. Bu önemli.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 8,
    },
    {
      id: 'marcus_t1_2',
      tier: 1,
      title: 'Mürekkep Kokusu',
      lines: [
        { speaker: 'player', text: 'Kitapların kokusu farklı burada.' },
        { speaker: 'npc',    text: 'Mürekkep, kağıt, vakit. Bu üçünün dışında başka bir açıklama bulamıyorum. Ama bu koku beni her gün buraya getiriyor, yirmi üç yıldır.' },
        { speaker: 'player', text: 'Yirmi üç yıl mı?' },
        { speaker: 'npc',    text: 'Daha önce farklı bir işim vardı. Çok daha "verimli." Ama o işin kokusu yoktu. Sadece para kokusu. Ve para... kötü bir anı gibi, hava aldıkça güçsüzleşiyor.' },
      ],
      choices: [
        {
          text: 'Pişman mısın?',
          lines: [
            { speaker: 'npc', text: 'Epiktetos şöyle der — pişmanlık, geçmişin hâlâ üzerinde iktidar kurmasına izin vermektir. Hayır. Sadece şükran hissediyorum. Kitaplar için, nehir için, bu koku için.' },
          ],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
        {
          text: 'Verimli iş neydi?',
          lines: [
            { speaker: 'npc', text: 'Yazılım. Bir şirket kurdum, sattım, sonra başka birinin şirketinde çalıştım. Sonra o şirket beni sattı.' },
            { speaker: 'npc', text: '(gülümser) Burada ise ben ve kitaplar sadece sessizce devam ediyoruz.' },
          ],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'marcus_t2_1',
      tier: 2,
      title: 'Nehrin Öte Yakası',
      lines: [
        { speaker: 'npc',    text: 'Seni düşünüyordum bu sabah. Nehrin karşısında ne bıraktın?' },
        { speaker: 'player', text: 'Bir iş. Ve sanırım... küçük bir gurur parçası.' },
        { speaker: 'npc',    text: 'Gurur... tuhaf bir şey. Kontrolümüzdeki şeylerin içinde mi, değil mi — hiç emin olamadım. Belki yarısı içinde, yarısı dışında.' },
        { speaker: 'player', text: 'Sen neden geldin buraya?' },
        { speaker: 'npc',    text: 'Şirketim büyüdü. Sonra daha fazla büyüdü. Sonra içinde ne olduğunu bilemez hale geldim. Sabah kalktığımda ne için kalktığımı hatırlayamıyordum.' },
        { speaker: 'npc',    text: '(bir kitabı düzeltiyor) Bir gün nehri geçtim. Bir daha geçmedim.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'marcus_t2_2',
      tier: 2,
      title: 'Elden Gelenler',
      lines: [
        { speaker: 'player', text: 'Kaybedilen zamanı geri almak istesen, alabilir misin?' },
        { speaker: 'npc',    text: 'Bazı şeyler bizim elimizde, bazıları değil. Geçmiş — elimizde değil. Ama şu an ne yapacağın, kime bakacağın, neyle vakit geçireceğin... bunlar tamamen sende.' },
        { speaker: 'npc',    text: 'Ve bu yeterince büyük bir alan.' },
        { speaker: 'player', text: 'Her zaman bu kadar net miydin?' },
        { speaker: 'npc',    text: '(güler) Hayır. Onlarca yıl aldı.' },
      ],
      choices: [
        {
          text: 'Bunun için bir kitap önerebilir misin?',
          lines: [
            { speaker: 'npc', text: 'Enchiridion. Küçük bir kitap ama içi dolu. Sana verebilirim.' },
          ],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Şu an ne yapman gerektiğini nasıl biliyorsun?',
          lines: [
            { speaker: 'npc', text: 'Bilmiyorum. Ama sabah kalkıp buraya geliyorum. Bu bir şey söylüyor bana.' },
          ],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'marcus_t3_1',
      tier: 3,
      title: 'Senin Kaybın',
      lines: [
        { speaker: 'npc',    text: 'Apex Games mi, adı?' },
        { speaker: 'player', text: 'Evet.' },
        { speaker: 'npc',    text: "Victor Crane'in mi? Duymuştum. Nehrin o tarafında herkes duymuştu." },
        { speaker: 'player', text: 'Kovuldum. Beş yıl çalıştım.' },
        { speaker: 'npc',    text: 'Biliyor musun, ben de kovuldum bir zamanlar. Farklı bir şirketten. O gün hayatımın en kötü günü olduğunu düşündüm.' },
        { speaker: 'npc',    text: '(pencereden nehre bakıyor) Şimdi hayatımın en iyi gününün başlangıcı olduğunu görüyorum.' },
        { speaker: 'player', text: 'Çok kolay görünüyor bu bakış açısı.' },
        { speaker: 'npc',    text: 'Değil. Hiç değil. Ama şunu söyleyebilirim — kontrolünde olmayan bir şey seni yıktıysa, bu senin hatan değil. Seni yıkamadıysa ise, bu senin eserin.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 15,
    },
  ],
}

// ─── REMY ────────────────────────────────────────────────────────────────────

const remy: NPCDef = {
  id: 'remy',
  name: 'Remy',
  role: 'Balıkçı',
  philosophy: 'Sabır değil, var olmak. Nehrin yanında olmak seni besler.',
  emoji: '🎣',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'remy_t1_1',
      tier: 1,
      title: 'Nehir Erken Kalkar',
      lines: [
        { speaker: 'npc',    text: "(ağ düzeltiyor, başını kaldırmıyor) Sabah mı, akşam mı?" },
        { speaker: 'player', text: 'Ne?' },
        { speaker: 'npc',    text: 'Nehire bakınca sabah mı hissediyorsun, akşam mı? İkisi farklı ışık verir.' },
        { speaker: 'player', text: 'Şu an sabah.' },
        { speaker: 'npc',    text: 'Ben de öyle görüyorum. Remy. Balıkçıyım, göründüğüm gibi.' },
        { speaker: 'player', text: 'Çok şey tutabiliyor musun?' },
        { speaker: 'npc',    text: 'Yeterince. Fazlasına ihtiyacım yok.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 8,
    },
    {
      id: 'remy_t1_2',
      tier: 1,
      title: 'Beklemek Üzerine',
      lines: [
        { speaker: 'player', text: 'Sabırla mı bekliyorsun?' },
        { speaker: 'npc',    text: 'Sabır değil aslında. Sabır beklemek demek, beklemek rahatsızlık demek. Ben sadece... buradayım. Nehrin yanında, soluk ışıkla.' },
        { speaker: 'npc',    text: 'Balık gelirse iyi, gelmezse de balıkçı çantam boş ama günüm boş değil.' },
        { speaker: 'player', text: 'Bu bir fark mı?' },
        { speaker: 'npc',    text: 'Büyük bir fark. İstediğin şeyi beklemek seni tüketir. İstediğin şeyin yanında olmak seni besler.' },
      ],
      choices: [
        {
          text: 'Oyun yaparken de böyle düşünebilir miyim?',
          lines: [
            { speaker: 'npc', text: 'Bilmiyorum. Ama elini suya sokup nerede aktığını hissedersen... belki.' },
          ],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
        {
          text: "Nehrin yanında olmak yeterli mi senin için?",
          lines: [
            { speaker: 'npc', text: 'Benim için evet. Senin için ne yeterli, bunu bilmiyorum. Ama soruyu sorabiliyorsan, zaten sorgunun içindesin. Bu bir başlangıç.' },
          ],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'remy_t2_1',
      tier: 2,
      title: 'Neden Burası',
      lines: [
        { speaker: 'player', text: 'Hep burada mı yaşadın?' },
        { speaker: 'npc',    text: 'Hayır. Liman kentinden geldim. Daha büyük, daha kalabalık. Orada da balık tutuyordum ama nehir yoktu. Sadece deniz.' },
        { speaker: 'player', text: 'Nehir farklı mı?' },
        { speaker: 'npc',    text: "Nehrin bir yönü var. Nereye gittiğini biliyor. Deniz her yere gidebilir — yani hiçbir yere gitmiyor aslında." },
        { speaker: 'npc',    text: 'Benim için yön önemliydi.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'remy_t2_2',
      tier: 2,
      title: 'Akış',
      lines: [
        { speaker: 'npc',    text: 'Sen ne yapıyorsun burada, yeni komşu?' },
        { speaker: 'player', text: 'Oyun yapıyorum. Kendi başıma.' },
        { speaker: 'npc',    text: 'Her sabah burada biri oturur, elinde bir şey yapmak ister. Bazıları yazar, bazıları çizer. Hepsinin aynı yüzü var — hem istekli hem korkmuş. Sen de öylesin.' },
        { speaker: 'player', text: 'Korkmak kötü mu?' },
        { speaker: 'npc',    text: 'Hayır. Korkusuz akan nehir yoktur. Önünde taş vardır, çamur vardır, dar geçit vardır. Ama hepsi akar.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'remy_t3_1',
      tier: 3,
      title: 'Büyük Su',
      lines: [
        { speaker: 'npc',    text: 'Yakında bir şey olacak, değil mi? Bunu görüyorum insanlarda.' },
        { speaker: 'player', text: 'Nasıl?' },
        { speaker: 'npc',    text: 'Nehre çok baktım. Yağmurdan önce yüzey değişir. Rengi dönüşür. Seninki de dönüştü son zamanlarda.' },
        { speaker: 'player', text: 'Büyük bir karar vermem gerekiyor.' },
        { speaker: 'npc',    text: 'Hangi kararın doğru olduğunu biliyorsun aslında. Sadece onaylamaktan korkuyorsun.' },
        { speaker: 'player', text: 'Ya yanlışsa?' },
        { speaker: 'npc',    text: 'Nehir yanlış yöne akar mı? Aşağıya akar. Çünkü aşağısı nereye gittiğini biliyor. Sen de biliyorsun.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 15,
    },
  ],
}

// ─── THEO ────────────────────────────────────────────────────────────────────

const theo: NPCDef = {
  id: 'theo',
  name: 'Theo',
  role: 'Pub Barmen',
  philosophy: 'Anlam bulunmadığı için kendin yapabilirsin. Burası kararların verildiği yer.',
  emoji: '🍺',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'theo_t1_1',
      tier: 1,
      title: 'Yeni Müşteri',
      lines: [
        { speaker: 'npc',    text: '(bardak siliyor) Otur. Karışık bir günün var. Yüzünden belli.' },
        { speaker: 'player', text: 'Nasıl anladın?' },
        { speaker: 'npc',    text: 'Yirmi yıldır bardak siliyorum. Bunun üçte biri psikolog işi. Ben Theo. Burası benim dünyam. Ne içersin?' },
        { speaker: 'player', text: 'Ne önerirsin?' },
        { speaker: 'npc',    text: 'Ağır bir gün için hafif bir şey. Paradoks bu işte — en ağır anlar hafif bir şeyle geçer.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 8,
    },
    {
      id: 'theo_t1_2',
      tier: 1,
      title: 'Boş Tabure',
      lines: [
        { speaker: 'player', text: 'Burası genelde bu kadar boş mu?' },
        { speaker: 'npc',    text: 'Bu saat öyle. Ama saat sekizde tam dolar. Her gece aynı yüzler, aynı yerler. Şuradaki tabure... kimse oturmaz. Merak ettim mi? Hep.' },
        { speaker: 'player', text: 'Sorsan olmaz mı?' },
        { speaker: 'npc',    text: 'Sormak bazen cevabı mahveder. Bazı şeyler soruyla değil gözlemle anlaşılır.' },
        { speaker: 'player', text: 'Ne gözemledin?' },
        { speaker: 'npc',    text: 'Boş tabure... kimse oturmak istemez ama kimse kaldırmak da istemez. Belki bir beklenti. Belki bir anı. İkisi de aynı şey aslında.' },
      ],
      choices: [
        {
          text: 'İnsanlar neden buraya gelir?',
          lines: [
            { speaker: 'npc', text: 'Kaçmak için. Ama kaçtıkları şey de gelir, masanın altında. Fark şu — burada ona bakabilirler.' },
          ],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Boş taburenin kimin için olduğunu düşünüyorsun?',
          lines: [
            { speaker: 'npc', text: 'Hâlâ gelmemiş biri için. Ya da artık gelmeyen biri için. İkisi de aynı boşluğu bırakır.' },
          ],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'theo_t2_1',
      tier: 2,
      title: "Theo'nun Teorisi",
      lines: [
        { speaker: 'npc',    text: 'Şunu fark ettim yıllar içinde — insanlar iki sebepten içer. Birincisi: unutmak için. İkincisi: hatırlamak için. İkisi de aynı masada oturur.' },
        { speaker: 'player', text: 'Sen hangisi için içiyorsun?' },
        { speaker: 'npc',    text: 'Ben içmiyorum. (güler) Garip değil mi? Yirmi yıldır pubda çalışıyorum ama içmiyorum. Çünkü ben izlemek için buradayım.' },
        { speaker: 'player', text: 'Ne izliyorsun?' },
        { speaker: 'npc',    text: 'Kararlar. Burası kararların verildiği yer. Evde, ofiste alınan kararlar ön taslak. Gerçek kararlar... burada, saat gece yarısına doğru, üçüncü bardakla alınır.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 10,
    },
    {
      id: 'theo_t2_2',
      tier: 2,
      title: 'Anlam Hakkında',
      lines: [
        { speaker: 'player', text: 'Hayatın anlamını düşündün mü hiç?' },
        { speaker: 'npc',    text: 'Her gece. (duraklar) Sonra sabah olur ve anlam aramanın kendisinin anlamsız olduğunu görürsün. Ama aramayı da bırakamazsın. Bu insanın yazgısı.' },
        { speaker: 'player', text: 'Bu ümitsizlik değil mi?' },
        { speaker: 'npc',    text: 'Hayır. Bu özgürlük. Anlam bulunmadığı için kendin yapabilirsin. En kötü ev, boş bir yerde yapılmış ev değildir. En kötü ev, başkasının yaptığı evi devralan evdir.' },
        { speaker: 'player', text: 'Ve sen ne yaptın?' },
        { speaker: 'npc',    text: 'Bu pub. Başkasının malıydı. Ben onu aldım, dönüştürdüm. Şimdi benim anlamım.' },
      ],
      choices: [
        {
          text: 'Oyunum da öyle olabilir mi?',
          lines: [
            { speaker: 'npc', text: 'Zaten öyle. Farkındasın ya da değilsin, bu ayrı. Ama ellerinle bir şey yapıyorsun — bu anlam.' },
          ],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: "Başkasının anlamını devralmak bu kadar kötü mü?",
          lines: [
            { speaker: 'npc', text: 'Kötü değil. Ama sınırı var. Birileri sana "böyle yap" dedi ve sen yaptın — kaç kez? Ve kaç kez sormak istedin "neden böyle?"' },
          ],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'theo_t3_1',
      tier: 3,
      title: 'Ne Uğruna',
      lines: [
        { speaker: 'npc',    text: '(bardağı kapatıyor, sana dönüyor) Seninle konuşmak istedim bir zamandır. Ciddi bir şey.' },
        { speaker: 'player', text: 'Nedir?' },
        { speaker: 'npc',    text: 'Bu stüdyonu kuruyorsun. Oyun yapıyorsun. Bunu neden yapıyorsun gerçekten?' },
        { speaker: 'player', text: 'Kovuldum ve—' },
        { speaker: 'npc',    text: 'Hayır. Bu neden değil. Bu sebep. Neden farklı bir şey.' },
        { speaker: 'player', text: '...bilmiyorum.' },
        { speaker: 'npc',    text: 'İyi. Bilmiyorsun ama devam ediyorsun. Bu dürüstlük. Çoğu insan "biliyorum" der ve yanılır. Sen bilmiyorsun ama doğru yoldasın. Çünkü soru hâlâ açık.' },
        { speaker: 'player', text: 'Bu yeter mi?' },
        { speaker: 'npc',    text: 'Yetmek zorunda değil. Ama seni buraya getirdi. Devam edecek.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 15,
    },
  ],
}

// ─── BRUNO ───────────────────────────────────────────────────────────────────

const bruno: NPCDef = {
  id: 'bruno',
  name: 'Bruno',
  role: 'Mühendis',
  philosophy: 'Erdem Etiği (Aristoteles) — Karakter, bir köprü gibi, alışkanlıkla ve ölçüyle örülür.',
  emoji: '🔧',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'bruno_t1_1',
      tier: 1,
      title: 'Köprüyü Kuran',
      lines: [
        { speaker: 'npc',    text: '(bir şeyi ölçüyor) Dur, oraya basma — harç henüz tutmadı. ...Tamam, şimdi geç.' },
        { speaker: 'player', text: 'Bunları sen mi yaptın?' },
        { speaker: 'npc',    text: 'Bu köprüyü babamla ördük. Her gün üstünden geçiyorsun, fark etmeden. Bruno. Mühendis.' },
        { speaker: 'player', text: 'İki yakayı bağlayan köprü mü?' },
        { speaker: 'npc',    text: 'Bağlamak iyi iştir. Yıkmak kolay, bağlamak zor. Ben bağlayanlardanım.' },
      ],
      ideaSeed: 'zaman_yonetimi',
      relationshipBonus: 8,
    },
    {
      id: 'bruno_t1_2',
      tier: 1,
      title: 'Mükemmellik Alışkanlıktır',
      lines: [
        { speaker: 'player', text: 'Aynı işi her gün yapmak sıkıcı değil mi?' },
        { speaker: 'npc',    text: 'Sıkıcı? Bir köprü bir günde çökmez, bir günde de yükselmez. Her gün bir perçin. Mükemmellik bir eylem değil — alışkanlıktır.' },
      ],
      choices: [
        {
          text: 'Ya yeteneğin yoksa?',
          lines: [{ speaker: 'npc', text: 'Yetenek başlangıçtır, alışkanlık ustalıktır. Her gün doğru olanı yap; yıllar seni usta yapar.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
        {
          text: 'Hiç acele etmez misin?',
          lines: [{ speaker: 'npc', text: 'Acele eden köprü ilk fırtınada gider. İyi yapılan iş kendi hızını bilir.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'bruno_t2_1',
      tier: 2,
      title: 'Kirişi İncelt',
      lines: [
        { speaker: 'npc',    text: 'Yıllar önce bir müteahhit geldi. "Kirişi incelt, kimse anlamaz" dedi — maliyet düşsün diye.' },
        { speaker: 'player', text: 'İncelttin mi?' },
        { speaker: 'npc',    text: 'Hayır. Sözleşmeyi kaybettim, parayı kaybettim. Ama o bina hâlâ ayakta — ben de.' },
        { speaker: 'npc',    text: 'Babam derdi: bir taşı gizlice yanlış koyarsan, önce kendin çürürsün. Haklıydı.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'bruno_t2_2',
      tier: 2,
      title: 'Ölçü',
      lines: [
        { speaker: 'player', text: 'Crane diye birini duydun mu? Karşı yakada.' },
        { speaker: 'npc',    text: "Apex'in adamı. Duydum. Her şeyi büyütmek ister — daha çok, daha hızlı." },
        { speaker: 'player', text: 'Sen ne dersin?' },
        { speaker: 'npc',    text: 'Ölçü her şeydir. Ne fazla, ne eksik. Fazla su koyarsan harç tutmaz; fazla hırs koyarsan adam tutmaz.' },
      ],
      choices: [
        {
          text: 'Ya kazanmak için fazlası gerekiyorsa?',
          lines: [{ speaker: 'npc', text: 'O zaman kazanırsın ama tutmaz. Tuttuğunu sandığın şey bir gün çöker — kiriş gibi.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
        {
          text: 'Sen hiç büyümek istemedin mi?',
          lines: [{ speaker: 'npc', text: 'İstedim. Sonra köprüme, üstünden geçen çocuklara baktım. Yeterince büyük zaten.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'bruno_t3_1',
      tier: 3,
      title: 'Kim Olarak',
      lines: [
        { speaker: 'npc',    text: 'O karşı yakayla bir hesabın var, görüyorum. Büyüyorsun.' },
        { speaker: 'player', text: 'Büyümek zorundayım.' },
        { speaker: 'npc',    text: 'Büyü. Ama perçin perçin öğrendiğim bir şey var: önemli olan onu yenmek değil — yenerken kim olduğunu korumak.' },
        { speaker: 'player', text: 'Ya ikisi aynı anda olmuyorsa?' },
        { speaker: 'npc',    text: 'O zaman ölçüyü kaçırmışsındır. İki yanlış var: korkup sinmek, ya da öfkeyle onun gibi acımasızlaşmak. Erdem ortada — cesaret.' },
        { speaker: 'npc',    text: '(köprüye vurur) Kazandığın gün hâlâ kendin olabilecek misin? Asıl mühendislik bu.' },
      ],
      ideaSeed: 'zaman_yonetimi',
      relationshipBonus: 15,
    },
  ],
}

// ─── MAGNUS ──────────────────────────────────────────────────────────────────

const magnus: NPCDef = {
  id: 'magnus',
  name: 'Magnus',
  role: 'Sokak Filozofu',
  philosophy: 'Nietzsche — Değerleri sürü değil sen dövürsün; kendini aş, uçuruma dikkat et.',
  emoji: '🌒',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'magnus_t1_1',
      tier: 1,
      title: 'Uçurum Kenarı',
      lines: [
        { speaker: 'npc',    text: '(iskele ucunda, suya bakıyor, dönmeden) Sen de mi suya bakmaya geldin? Herkes gelir. Az kişi gerçekten bakar.' },
        { speaker: 'player', text: 'Sen kimsin?' },
        { speaker: 'npc',    text: 'Magnus. Bir zamanlar bir isimdim, şimdi bir soru işareti. İkisi de fena değil.' },
        { speaker: 'player', text: 'Burada mı yaşıyorsun?' },
        { speaker: 'npc',    text: 'Şu çürük teknede. Batmıyor — inadına. Tıpkı benim gibi.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 8,
    },
    {
      id: 'magnus_t1_2',
      tier: 1,
      title: 'İyi ve Kötü',
      lines: [
        { speaker: 'player', text: 'İnsanlar sana deli diyor.' },
        { speaker: 'npc',    text: 'Deli, herkesin görmezden geldiğini yüksek sesle söyleyendir. Bak şu nehre — "iyi" mi akıyor, "kötü" mü? Hiçbiri. İyiyi, kötüyü biz uydurduk.' },
      ],
      choices: [
        {
          text: 'O zaman hiçbir şey önemli değil mi?',
          lines: [{ speaker: 'npc', text: 'Hayır — her şey önemli, ama anlamı sen koyacaksın, sürü değil. Tanrı öldü, eleştirmen de. Değeri sen döveceksin.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Sen ne değer dövdün?',
          lines: [{ speaker: 'npc', text: 'Bir oyun. Kuralların hepsini yaktı. Sonra... başka bir hikâye. (acı gülümser) Sonra anlatırım.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'magnus_t2_1',
      tier: 2,
      title: 'Efsane',
      lines: [
        { speaker: 'player', text: 'O oyun neydi?' },
        { speaker: 'npc',    text: 'Bu şehirde doğdum; herkes "fazla" derdi bana. Şehre gittim, kuralları yakan bir oyun yaptım — tür tanımlandı, "dahi" dediler.' },
        { speaker: 'player', text: 'Sonra?' },
        { speaker: 'npc',    text: 'Sonra aynı kalabalık döndü. Fazla radikal, fazla dik, fazla Magnus. Beni de yaktılar. Zirveden düştüm, doğduğum yere sürünerek döndüm.' },
        { speaker: 'npc',    text: 'Hanna hâlâ "yine mi sen" der, gülerek. O, çocukluğumu bilir.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'magnus_t2_2',
      tier: 2,
      title: 'Düşmek',
      lines: [
        { speaker: 'player', text: 'Düşmek nasıldı?' },
        { speaker: 'npc',    text: 'Yükseklik, düşmekten korkanlar içindir. Ben düştüm — ve düşerken bir şey gördüm.' },
        { speaker: 'player', text: 'Ne?' },
        { speaker: 'npc',    text: 'Dibe vurmak sağlam bir zemindir. Üstüne yeniden inşa edebilirsin. Korktuğun şey aslında özgürlüğün.' },
      ],
      choices: [
        {
          text: "'Beni öldürmeyen güçlendirir' mi?",
          lines: [{ speaker: 'npc', text: 'Yarısı doğru. Bazısı sadece sakat bırakır. Marifet, sakatken bile yürümeye devam edebilmek.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Yeniden çıkmak istemedin mi?',
          lines: [{ speaker: 'npc', text: 'İstedim. Ama kendim için, kalabalık için değil. O zaman çıkış başka bir şey oluyor.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 5,
    },
    // ─── T3 ───
    {
      id: 'magnus_t3_1',
      tier: 3,
      title: 'Uçurum',
      lines: [
        { speaker: 'npc',    text: 'O karşı yakadaki güçle dövüşüyorsun. Gözlerinde tanıdık bir şey var — benim bir zamanlar aynada gördüğüm.' },
        { speaker: 'player', text: 'Onu yenmem gerek.' },
        { speaker: 'npc',    text: 'Belki. Ama şunu söyleyeyim, sonra unut: canavarlarla dövüşen, kendi canavara dönüşmemeye dikkat etsin.' },
        { speaker: 'player', text: '...' },
        { speaker: 'npc',    text: 'Ve sakın unutma — uçuruma uzun bakarsan, uçurum da sana bakar. Onu değil, kendini aş. Düşmanı geçmek kolay; kendini geçmek marifet.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 15,
    },
  ],
}

// ─── MARTA ───────────────────────────────────────────────────────────────────

const marta: NPCDef = {
  id: 'marta',
  name: 'Marta',
  role: 'Hemşire',
  philosophy: 'Bakım Etiği — Ahlak, rakamda değil; karşındaki insanın elini tutmakta başlar.',
  emoji: '🩺',
  gender: 'female',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'marta_t1_1',
      tier: 1,
      title: 'Yüzün Solgun',
      lines: [
        { speaker: 'npc',    text: '(sana bakar, kaşları çatılır) Dur bakayım... yüzün solgun. Bu taraflara yeni mi taşındın? Su içtin mi bugün?' },
        { speaker: 'player', text: 'İyiyim, sadece...' },
        { speaker: 'npc',    text: '"Sadece"si olmaz. Ben Marta, bu şehrin hemşiresiyim. Kırk yıldır herkese bakarım — sıra sana geldi galiba.' },
        { speaker: 'player', text: 'Beni tanımıyorsun bile.' },
        { speaker: 'npc',    text: 'Tanımam gerekmez. Yorgun bir insan, yorgun bir insandır. Otur şöyle.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 8,
    },
    {
      id: 'marta_t1_2',
      tier: 1,
      title: 'Defter Tutmam',
      lines: [
        { speaker: 'player', text: 'Bütün hastaları nasıl hatırlıyorsun?' },
        { speaker: 'npc',    text: 'Defter tutmam. Herkesi ezbere bilirim. Çünkü benim için bir hasta, bir dosya değil — tanıdığım bir insan.' },
      ],
      choices: [
        {
          text: 'Bu yorucu olmalı.',
          lines: [{ speaker: 'npc', text: 'Yorucu. Ama rakamlara bakmaktan az yorucu. Rakam titremez; insan titrer — işte o zaman elini tutarsın.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Hiç bırakmak istemedin mi?',
          lines: [{ speaker: 'npc', text: 'Her gün. Sonra biri kapıyı çalar, ben de kalırım. Kırk yıldır aynı hikâye.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'marta_t2_1',
      tier: 2,
      title: 'Neden Kaldım',
      lines: [
        { speaker: 'player', text: 'Hiç buradan gitmedin mi?' },
        { speaker: 'npc',    text: 'Bir kez şansım vardı. Başkent, büyük hastane, kariyer. Sonra annem hastalandı. Kaldım.' },
        { speaker: 'player', text: 'Pişman mısın?' },
        { speaker: 'npc',    text: '"Şansını kaçırdın" derler. Bence kazandım. Bağ, gidilen yoldan kıymetli — burada herkesin bir parçasını taşıyorum.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'marta_t2_2',
      tier: 2,
      title: 'Tablo Titremez',
      lines: [
        { speaker: 'npc',    text: 'Karşı yakadan, o büyük şirketten kırılıp gelen gençler oldu. Apex\'ten. "Kaynak" diyorlarmış onlara.' },
        { speaker: 'player', text: '...' },
        { speaker: 'npc',    text: 'Ben titreyen ellerini tuttum. Bir tabloda sayı olmuşlar. Ama tablo titremez — insan titrer. Bunu hep unutuyorlar orada.' },
      ],
      choices: [
        {
          text: 'Belki başka çareleri yoktu.',
          lines: [{ speaker: 'npc', text: 'Belki. Ama bir insanı keserken ona bir kez baksalar... zaten bakmamak için tablo yaparlar.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Sen ne yaptın onlara?',
          lines: [{ speaker: 'npc', text: 'Çay. Sıcak bir oda. Ve "anlat" dedim. Bazen tedavi budur.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'marta_t3_1',
      tier: 3,
      title: 'İnsan Kal',
      lines: [
        { speaker: 'npc',    text: 'Şu peşindeki güçle savaşıyorsun. Yüzünden okunuyor. Hemşire olarak bir şey söyleyeyim mi?' },
        { speaker: 'player', text: 'Söyle.' },
        { speaker: 'npc',    text: 'Sana kötülük eden o adam da bir yerde kırılmış biri. Bu onu haklı çıkarmaz — ama canavar sanırsan, dövüşürken sen de katılaşırsın. İnsan kal.' },
        { speaker: 'player', text: 'Ya kaybedersem?' },
        { speaker: 'npc',    text: 'Onu yenip yanındakini kaybedersen, asıl o zaman kaybedersin. Bir de — herkese bakan sen, bir gün yığılırsan kim tutar elini? Kendine de bak.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 15,
    },
  ],
}

// ─── CLARA ───────────────────────────────────────────────────────────────────

const clara: NPCDef = {
  id: 'clara',
  name: 'Clara',
  role: 'Noter',
  philosophy: 'Kant / Deontoloji — Kural herkese aynı işlemeli; insan amaçtır, araç değil.',
  emoji: '⚖️',
  gender: 'female',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'clara_t1_1',
      tier: 1,
      title: 'Kural Kuraldır',
      lines: [
        { speaker: 'npc',    text: '(bir evrağa damga vururken) Bir saniye. İmza buraya, tarih şuraya. Eksik olursa geçersiz. ...Tamam, buyur.' },
        { speaker: 'player', text: 'Çok titizsin.' },
        { speaker: 'npc',    text: 'Titiz değil, tutarlıyım. Ben Clara. Bir kural varsa herkese aynı işler — sana da, belediye başkanına da. Yoksa kural değil, keyiftir.' },
        { speaker: 'player', text: 'Bazen esnetmek gerekmez mi?' },
        { speaker: 'npc',    text: '"Bir kez" diye esnetirsin, ertesi gün o "bir kez" başkasının kuralı olur. Ben esnetmem. Bedelini ödedim, ama esnetmem.' },
      ],
      ideaSeed: 'zaman_yonetimi',
      relationshipBonus: 8,
    },
    {
      id: 'clara_t1_2',
      tier: 1,
      title: 'Beyaz Yalan',
      lines: [
        { speaker: 'npc',    text: 'İnsanlar bana "katı" der. Çünkü yalan söylemem — beyazını bile.' },
        { speaker: 'player', text: 'Hiç mi? Birini incitmemek için bile mi?' },
      ],
      choices: [
        {
          text: 'Bazen yalan merhamettir.',
          lines: [{ speaker: 'npc', text: 'Belki. Ama yalan söylediğin an, karşındakinin kendi yerine karar verme hakkını elinden alırsın. "Senin iyiliğin için" diyenler hep yalancı çıkar.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Sana zarar vermedi mi bu?',
          lines: [{ speaker: 'npc', text: 'Çok. Ama geceleri uyuyabiliyorum. Bunu herkes satın alamaz.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'clara_t2_1',
      tier: 2,
      title: 'Yarım Dosya',
      lines: [
        { speaker: 'player', text: 'Masandaki şu eski dosya — hiç açmıyorsun ama atmıyorsun da.' },
        { speaker: 'npc',    text: '(durur) Onu fark ettin demek. Şehirdeyken avukattım. Büyük bir şirket küçük bir stüdyonun fikrini çalmıştı; dava bendeydi.' },
        { speaker: 'player', text: 'Ne oldu?' },
        { speaker: 'npc',    text: '"Birkaç satırı değiştir, dosyayı zayıflat" dediler. Reddettim. Ertesi hafta hiçbir büro beni işe almadı. Dava yarım kaldı, ben buraya döndüm.' },
        { speaker: 'npc',    text: 'Dosyayı saklıyorum. Bitiremediğim için değil — neyi reddettiğimi unutmamak için.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'clara_t2_2',
      tier: 2,
      title: 'Araç Değil',
      lines: [
        { speaker: 'npc',    text: 'O karşı yakadaki şirket insanlara "kaynak" diyormuş. Beni asıl çıldırtan o kelime.' },
        { speaker: 'player', text: 'Sadece bir kelime.' },
        { speaker: 'npc',    text: 'Hayır. Bir insana "kaynak" dersen, onu tüketilecek bir şey sayarsın. İnsan amaçtır, araç değil. Bunu unutan her sistem, eninde sonunda birini öğütür.' },
      ],
      choices: [
        {
          text: 'Ama şirket kâr için var.',
          lines: [{ speaker: 'npc', text: 'Kâr amaç olabilir. Ama insanın üstünden geçen kâr, hırsızlıktır — yasal olsa bile.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Sen olsan ne yapardın?',
          lines: [{ speaker: 'npc', text: 'Kuralı yazardım: kimse kimsenin merdiveni olmayacak. Saf mı? Belki. Ama saf olmayan her kural, birinin kullanılmasıyla biter.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'clara_t3_1',
      tier: 3,
      title: 'Herkese Aynı',
      lines: [
        { speaker: 'npc',    text: 'Şu adamla hesaplaşacaksın. Sana bir hukukçu aklı vereyim, bedava.' },
        { speaker: 'player', text: 'Dinliyorum.' },
        { speaker: 'npc',    text: 'Ona ne yaparsan yap, önce kendine sor: "Bunu bir kural yapsam, herkes bana da uygulasa, razı mıyım?" Razıysan yap. Değilsen, onu yenmek için ona benzemişsindir.' },
        { speaker: 'player', text: 'Ya hak ettiyse?' },
        { speaker: 'npc',    text: '"Hak etti" — en çok kanın döküldüğü cümle. Sen hak edişe değil kurala bak. O sana kuralsız davrandı diye sen de kuralsızlaşırsan, kazanan kuralsızlık olur — sen değil.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 15,
    },
  ],
}

// ─── ALDO ────────────────────────────────────────────────────────────────────

const aldo: NPCDef = {
  id: 'aldo',
  name: 'Aldo',
  role: 'Bahçıvan',
  philosophy: 'Epikür — En büyük zenginlik: iyi bir sofra, birkaç dost, korkusuz bir akşam.',
  emoji: '🌿',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'aldo_t1_1',
      tier: 1,
      title: 'Otur, Bir Şeyler Ye',
      lines: [
        { speaker: 'npc',    text: '(bir incir uzatır) Al, ağaçtan yeni kopardım. Para isteme, ye sadece. Burada herkes bir şey yer, biraz oturur.' },
        { speaker: 'player', text: 'Sen kimsin?' },
        { speaker: 'npc',    text: 'Aldo. Şu bahçenin delisi. Ekerim, sularım, toplarım, paylaşırım. Bütün işim bu.' },
        { speaker: 'player', text: 'Sadece bu mu?' },
        { speaker: 'npc',    text: '"Sadece" diyorsun ama dünyanın yarısı bunun için ömür tüketiyor: oturup huzurla bir incir yiyebilmek için. Ben kestirmeden geldim.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 8,
    },
    {
      id: 'aldo_t1_2',
      tier: 1,
      title: 'Yeter Ne Kadar',
      lines: [
        { speaker: 'npc',    text: 'İnsanlar hep "daha" der. Daha çok para, daha büyük ev, daha. Hiç sormazlar: ne kadarı yeter?' },
        { speaker: 'player', text: 'Sen kaç paraya "yeter" dedin?' },
      ],
      choices: [
        {
          text: 'Ya yetmezse?',
          lines: [{ speaker: 'npc', text: 'Yetmeyen para değil, içindeki delik. Onu parayla doldurursan delik büyür. Ben deliği gördüm, bahçeyle yamadım.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
        {
          text: 'Hırssız yaşanır mı?',
          lines: [{ speaker: 'npc', text: 'Hırs ateş gibidir; yemeğini pişirir ya da evini yakar. Mesele söndürmek değil, ne kadarına izin vereceğini bilmek.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'aldo_t2_1',
      tier: 2,
      title: 'Neden Bıraktım',
      lines: [
        { speaker: 'player', text: 'Hep burada mıydın?' },
        { speaker: 'npc',    text: 'Yoo. Karşı yakada bir adım vardı, bir de unvanım. Kazandıkça kazandım. Bir sabah uyandım — her şeyim vardı ama hiçbir şeyimi istemiyordum.' },
        { speaker: 'player', text: 'Sonra?' },
        { speaker: 'npc',    text: 'Sattım hepsini. Dostlarım "delirdin" dedi. Ama masa dağılınca o dostların çoğu kayboldu; gerçek olan üç beş kişi buraya, bahçeye geldi.' },
        { speaker: 'npc',    text: 'En büyük zenginlik buymuş, geç öğrendim: iyi bir sofra, iyi birkaç dost.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'aldo_t2_2',
      tier: 2,
      title: 'Ölümden Korkma',
      lines: [
        { speaker: 'npc',    text: 'Yaşlandım. İnsanlar "korkmuyor musun?" diye soruyor. Ölümden yani.' },
        { speaker: 'player', text: 'Korkmuyor musun?' },
        { speaker: 'npc',    text: 'Ne diye korkayım? Ben varken o yok; o gelince ben yokum. Hiç tanışmayacağız. Korkulacak şey ölüm değil — hiç yaşamadan ölmek.' },
      ],
      choices: [
        {
          text: 'Yine de huzursuz olmaz mı insan?',
          lines: [{ speaker: 'npc', text: 'Huzursuzluğun çoğu, olmayan bir yarını bugünden yaşamaktan. Bugünün inciri tatlıyken, yarının fırtınasını niye çiğneyesin?' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Geriye bir şey kalsın istemez misin?',
          lines: [{ speaker: 'npc', text: 'Bir ağaç diktim, gölgesinde tanımadığım biri oturacak. Bana yeter. İsim taşa değil, bahçeye kazınır.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'aldo_t3_1',
      tier: 3,
      title: 'Bahçeni Unutma',
      lines: [
        { speaker: 'npc',    text: 'O karşı yakadaki adamı yenmek istiyorsun. Anlıyorum. Ama bir ihtiyarın sözünü dinle.' },
        { speaker: 'player', text: 'Söyle.' },
        { speaker: 'npc',    text: 'Onunla dövüşürken onun oyununa girersin: "daha çok, daha büyük, ne pahasına olursa." Kazansan bile, kazandığın onun bahçesi olur — seninki değil.' },
        { speaker: 'player', text: 'Peki ne yapayım?' },
        { speaker: 'npc',    text: 'Yen, ama yıkma — fark var. Ve ne olursa olsun akşam sofrana, sevdiğin insanlara, kendi incirine dön. Onu yenip bahçeni kaybedersen, o seni yenmiştir. Asıl zafer, huzurunu ona kaptırmamak.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 15,
    },
  ],
}

// ─── YEVGENI ─────────────────────────────────────────────────────────────────

const yevgeni: NPCDef = {
  id: 'yevgeni',
  name: 'Yevgeni',
  role: 'Teknisyen',
  philosophy: 'Nihilizm/Materyalizm — Faydası yoksa yık; doğa tapınak değil, atölyedir.',
  emoji: '🔬',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'yevgeni_t1_1',
      tier: 1,
      title: 'Çalışır ya da Çalışmaz',
      lines: [
        { speaker: 'npc',    text: '(bir devreyi söküyor, başını kaldırmaz) Ne istiyorsun? Bozuksa bırak, bakarım. Bozuk değilse vaktimi alma.' },
        { speaker: 'player', text: 'Sadece tanışmak—' },
        { speaker: 'npc',    text: 'Tanışmak. (kısa bakar) Yevgeni. İşim, bu makineleri açıp neden öldüklerini bulmak. İnsanlar "ruhu çıktı" der; ben kondansatörü gösteririm. Hangisi doğru, sen söyle.' },
        { speaker: 'player', text: 'Her şeyin bir açıklaması var diyorsun.' },
        { speaker: 'npc',    text: 'Her şeyin. Açıklayamadığın şey, henüz sökmediğin şeydir. Mucize, cehaletin kibarcasıdır.' },
      ],
      ideaSeed: 'analiz',
      relationshipBonus: 8,
    },
    {
      id: 'yevgeni_t1_2',
      tier: 1,
      title: 'Tapınak Değil',
      lines: [
        { speaker: 'npc',    text: 'İnsanlar şu nehre bakıp şiir yazıyor. Ben akış hızını, çözünmüş oksijeni düşünüyorum. Doğa tapınak değil, atölye.' },
        { speaker: 'player', text: 'Güzelliğe yer yok mu yani?' },
      ],
      choices: [
        {
          text: 'Bu çok soğuk bir bakış.',
          lines: [{ speaker: 'npc', text: 'Soğuk olan dürüstlüktür. Sıcaklık istiyorsan battaniye al. Ben sana gerçeği veririm; gerçek nadiren sıcaktır.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Peki neye inanıyorsun?',
          lines: [{ speaker: 'npc', text: 'İşe yarayana. Bir köprü ayakta duruyorsa doğrudur. Bir fikir insanı taşıyorsa doğrudur. Gerisi süs.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'yevgeni_t2_1',
      tier: 2,
      title: 'Babamın Mektupları',
      lines: [
        { speaker: 'player', text: 'Şu çekmecedeki mektup destesi — makine değil ama hep orada.' },
        { speaker: 'npc',    text: '(durur, tornavidayı bırakır) ...Babamdan. Köyde yaşar, her hafta yazar. El yazısı, pul, hepsi. Tam bir zaman kaybı.' },
        { speaker: 'player', text: 'Cevap yazıyor musun?' },
        { speaker: 'npc',    text: '...Bazen. (sessizlik) Saçma, biliyorum. Hepsi karbon ve mürekkep. "Sakladığım her şeyin bir faydası var" derdim — bunların faydasını bulamadım. Galiba yararsız bir şeyi ilk kez seviyorum. Bu beni rahatsız ediyor.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'yevgeni_t2_2',
      tier: 2,
      title: 'Otorite',
      lines: [
        { speaker: 'npc',    text: 'Herkes birine tapıyor. Patron, üstat, "büyük adam." Ben kimsenin önünde eğilmem. Unvan, korkağın zırhıdır.' },
        { speaker: 'player', text: 'Hiç saygı duymaz mısın?' },
      ],
      choices: [
        {
          text: 'Saygı gerekmez mi?',
          lines: [{ speaker: 'npc', text: 'Saygı kazanılır, talep edilmez. "Şirketi ben kurdum" diyene sorarım: peki kim çalıştırdı? Taç, onu giydirenlerindir.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Yıkmak kolay, ya kurmak?',
          lines: [{ speaker: 'npc', text: 'Haklısın, en zayıf yanım bu. Çürüğü görürüm, yerine ne koyacağımı her zaman bilemem. Belki o yüzden makine tamir ediyorum, dünya değil.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'yevgeni_t3_1',
      tier: 3,
      title: 'Onu da Sök',
      lines: [
        { speaker: 'npc',    text: 'Şu Crane denen adam. Onu büyük bir şey sanıyor, korkuyorsun. Yanlış. Onu da bir makine gibi gör.' },
        { speaker: 'player', text: 'Nasıl yani?' },
        { speaker: 'npc',    text: 'Aç, parçalarına ayır. Neden çalışıyor? Korkuyla. Korku da bir mekanizma — kaynağını kesersen durur. Onu efsane yapan, ona tapanlar. Tapmayı bırak, küçülür.' },
        { speaker: 'player', text: 'Sen olsan yıkar mıydın?' },
        { speaker: 'npc',    text: '(duraksar) Eskiden "evet, sök at" derdim. Ama şu mektuplardan beri... bir şeyi yıkmadan önce yerine ne koyacağını bil. Yoksa sadece enkaz olursun — ondan farkın kalmaz. Bunu bana hayat öğretti, kitap değil.' },
      ],
      ideaSeed: 'analiz',
      relationshipBonus: 15,
    },
  ],
}

// ─── SØREN ───────────────────────────────────────────────────────────────────

const soren: NPCDef = {
  id: 'soren',
  name: 'Søren',
  role: 'Liman Kaptanı',
  philosophy: 'Varoluşçuluk (Sartre) — Varoluş özden önce gelir; rotanı sen çizersin, "mecbur kaldım" bir yalandır.',
  emoji: '⚓',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'soren_t1_1',
      tier: 1,
      title: 'Gelgit Dönüyor',
      lines: [
        { speaker: 'npc',    text: '(halatı bir kazığa dolarken, başını çevirmeden) Naber. Gelgit dönüyor — otur istersen ama dümen başında bekleyemem.' },
        { speaker: 'player', text: 'Sen kaptan mısın?' },
        { speaker: 'npc',    text: 'Bu limanın, evet. Søren. Sabah üç tekne geç yanaştı, üçü de rüzgârı suçladı. Rüzgâr suçlanmaz; rüzgâr sadece eser.' },
        { speaker: 'player', text: 'Nehrin karşısından geldim.' },
        { speaker: 'npc',    text: '(ilk kez bakar) Belli. Oradan gelenler hep bir şeyin onları "getirdiğini" sanır. Seni kimse getirmedi. Geldin.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 8,
    },
    {
      id: 'soren_t1_2',
      tier: 1,
      title: 'Aynı Tekne',
      lines: [
        { speaker: 'player', text: 'Tekneni soracaktım. Eski görünüyor ama bakımlı.' },
        { speaker: 'npc',    text: 'Yüz kez onardım, yenisini almadım. Her tahtasını ben değiştirdim — yani artık ilk teknem mi, yoksa bambaşka bir şey mi, bilmiyorum.' },
        { speaker: 'player', text: 'Yenisini alacak paran yok mu?' },
        { speaker: 'npc',    text: 'Var. Ama bu tekne benim seçtiğim ilk şey. Onu atarsam, seçtiğimi de atarım.' },
      ],
      choices: [
        {
          text: 'Sadece bir tahta yığını.',
          lines: [{ speaker: 'npc', text: 'Her şey sadece bir şeydir, ta ki birine ne anlam verene kadar. Anlamı ben koyarım, akıntı değil. İşin zor yanı da bu — kimse senin yerine koymaz.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Bağlanmışsın ona.',
          lines: [{ speaker: 'npc', text: 'Bağlanmak başka. Ben her sabah onu yeniden seçiyorum. Bağ, seçimi bıraktığın yerde başlar; ben hâlâ seçiyorum.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'soren_t2_1',
      tier: 2,
      title: 'İmzalanmayan Kâğıt',
      lines: [
        { speaker: 'npc',    text: 'Babam donanmadaydı. Madalyalı bir subay. Ben daha doğmadan rütbem yazılmıştı sanki.' },
        { speaker: 'player', text: 'Sen de mi asker oldun?' },
        { speaker: 'npc',    text: 'Otuzuma varmadan komisyon kâğıdını önüme koydular. İmzalamadım. Hurda bir tekne aldım, tek başıma açıldım. İlk gece ödüm kopuyordu.' },
        { speaker: 'player', text: 'Pişman oldun mu?' },
        { speaker: 'npc',    text: 'Hayır. Çünkü o korku ilk kez bana aitti. Babamın çizdiği rotada korkmak bile onundu.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'soren_t2_2',
      tier: 2,
      title: 'Tutan Bendim',
      lines: [
        { speaker: 'npc',    text: 'Yıllarca başkasının rotasını tuttum sandım. Şirketler, sözleşmeler, "böyle gerekiyor" denen ne varsa.' },
        { speaker: 'player', text: 'Mecburdun.' },
        { speaker: 'npc',    text: 'Hayır. Dümeni tutan da bendim. Sadece kabul etmiyordum, çünkü kabul etmek sorumluluk demek. "Mecbur kaldım" demek, dümeni akıntıya bırakıp suçu suya atmaktır.' },
      ],
      choices: [
        {
          text: 'Bazen gerçekten seçeneğin yoktur.',
          lines: [{ speaker: 'npc', text: 'Seçenek hep vardır — sadece bazıları pahalıdır. "Yokmuş" demek, bedelini ödemeyi reddetmektir. Bunu kendine itiraf et, yeter; gerisi kolay.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Bu ağır bir yük.',
          lines: [{ speaker: 'npc', text: 'En ağırı. Her şeyi sen seçtiysen, saklanacak rüzgâr kalmaz. Ama bir kez taşımayı öğrenince — o yük seni dik tutar.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'soren_t3_1',
      tier: 3,
      title: 'Akıntı Karar Vermez',
      lines: [
        { speaker: 'npc',    text: 'Şu nehrin karşısındaki adam. Crane. Duydum, herkesi bir akıntıymış gibi anlatıyormuş — "su böyle aktı, ben de aktım" diye.' },
        { speaker: 'player', text: 'Aşağı yukarı öyle. "Basamaktı, üstüne bastım" diyor.' },
        { speaker: 'npc',    text: 'Yalan. Güzel paketlenmiş bir yalan. Akıntı karar vermez — sen verirsin. O da her seferinde bastığını seçti, sonra suya yıktı suçu.' },
        { speaker: 'player', text: 'Peki ben? Ben de onu yenmek için aynısını yapacaksam?' },
        { speaker: 'npc',    text: 'İşte tek soru bu: Sen mi seçtin, yoksa "mecbur kaldım" deyip mi yaptın? İkisi aynı şeyi yapsa bile aynı değil. İlki seni özgür kılar — ne yaptığını bilirsin. İkincisi seni Crane yapar.' },
        { speaker: 'npc',    text: '(dümene dönerek) Ne yaparsan yap, önce kâğıdın altına kendi adını yaz. Rüzgârınkini değil.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 15,
    },
  ],
}

// ─── REX ─────────────────────────────────────────────────────────────────────

const rex: NPCDef = {
  id: 'rex',
  name: 'Rex',
  role: 'Arcade Sahibi',
  philosophy: 'Kirenaik Hedonizm — Tek gerçek şu an; yoğunluk süreyi yener, haz ertelenmez.',
  emoji: '🕹️',
  gender: 'male',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'rex_t1_1',
      tier: 1,
      title: 'Bir Tur At',
      lines: [
        { speaker: 'npc',    text: '(makinelerden birine vurarak) Naber kanka! Şu köşedeki yeni geldi, daha jeton bile yemedi. Dene hadi, ilk tur benden.' },
        { speaker: 'player', text: 'Burası senin mi?' },
        { speaker: 'npc',    text: 'Her ışığı, her gümbürtüsü. Rex. Hayat kısa, jeton bol — ben de ışıkları açık tutuyorum.' },
        { speaker: 'player', text: 'Sabahın köründe kim oyun oynar ki?' },
        { speaker: 'npc',    text: '"Sonra" diye bir yer yok kanka. Şu an varsın, makine duruyor, ışık yanıyor. Gerisi laf.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 8,
    },
    {
      id: 'rex_t1_2',
      tier: 1,
      title: 'Para Gelir Gider',
      lines: [
        { speaker: 'player', text: 'Bu kadar makine pahalıya patlıyordur.' },
        { speaker: 'npc',    text: 'Patlıyor. Para geldi gitti, yine gelir. Ama bu geceyi bir daha yaşayamazsın — onu kasaya koyamazsın.' },
        { speaker: 'player', text: 'Hiç mi biriktirmedin?' },
        { speaker: 'npc',    text: 'Bir kuruş bile. Kazandığım her şeyi bir sonraki geceye yatırdım. Bana deli derler; ben onlara "ölmeden önce bir kere yaşadın mı?" derim.' },
      ],
      choices: [
        {
          text: 'Ya yarın hastalanırsan?',
          lines: [{ speaker: 'npc', text: 'O zaman bugün yaşadığıma daha çok sevinirim. Yarını dert eden, bugünü zaten yaşamıyor demektir. İki kere ölür: bir korkarak, bir de gerçekten.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Yoğunluk her şey değil.',
          lines: [{ speaker: 'npc', text: 'Belki. Ama sönük bir uzun ömür mü, yoksa bir gece gerçekten parlamak mı? Ben parlamayı seçtim. Süreyle değil, şiddetle ölçüyorum.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'rex_t2_1',
      tier: 2,
      title: 'Sahne Küçüldü',
      lines: [
        { speaker: 'npc',    text: '(duvardaki rozetli eski ceketi gösterir) Şuna bakma öyle. Bir zamanlar sahnelerdeydim. Şehir şehir gezerdik, kalabalık adımı bağırırdı.' },
        { speaker: 'player', text: 'Ne oldu?' },
        { speaker: 'npc',    text: 'Refleksler yavaşladı. Sahne küçüldü. Ama yıkılmadım — kendi köşemi kurdum, ışıkları ben açtım. Şimdi sahne bu.' },
        { speaker: 'player', text: 'Özlemiyor musun o günleri?' },
        { speaker: 'npc',    text: 'Özlemek geçmişi bugüne tercih etmek. Ben hiçbir geceyi bir diğerine değişmem. O da gerçekti, bu da gerçek.' },
      ],
      ideaSeed: 'nostalji',
      relationshipBonus: 10,
    },
    {
      id: 'rex_t2_2',
      tier: 2,
      title: 'Kapanış Saati',
      lines: [
        { speaker: 'player', text: 'Hep geç kapatıyorsun. Müdavimler gideli saatler oldu.' },
        { speaker: 'npc',    text: '(bir an gülümsemesi kayar) Kapanış saatini sevmem. Işıklar kısılınca, o sessizlik... bir şey yetişiyor sanki bana.' },
        { speaker: 'player', text: 'Neymiş o şey?' },
        { speaker: 'npc',    text: 'Bilmem. Sormamak için bir oyun daha açarım. (toparlanır) Boş ver, derin sular bana göre değil. Sen bir tur at, ben jeton getireyim.' },
      ],
      choices: [
        {
          text: 'Bazen o sessizlikte durmak lazım.',
          lines: [{ speaker: 'npc', text: '(kısa duraklar) Belki. Ama herkesin bir kaçış makinesi var, kanka. Seninki oyun yapmak, benimki oynatmak. İkisi de ışığı açık tutmanın yolu.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: 'Bir oyun daha açalım o zaman.',
          lines: [{ speaker: 'npc', text: 'İşte bu! Gördün mü, anlıyorsun beni. (jetonları şıngırdatır) Sessizlik bekleyebilir; o hep bekler zaten.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'rex_t3_1',
      tier: 3,
      title: 'O Gün Gelmezse',
      lines: [
        { speaker: 'npc',    text: 'Şu Crane meselesi seni yiyip bitiriyor. Yüzünden okunuyor — bütün gece tek bir makineye kilitlenmiş biri gibisin.' },
        { speaker: 'player', text: 'Onu yendiğim gün rahatlayacağım.' },
        { speaker: 'npc',    text: 'İşte orada yanılıyorsun. Hayatını gelecekteki bir zafere rehin veriyorsun. Ya o gün hiç gelmezse? Ya geldiğinde sen onu yaşayacak hâlde değilsen?' },
        { speaker: 'player', text: 'O günü beklemekten başka ne yapabilirim?' },
        { speaker: 'npc',    text: 'Bugünü de yaşayabilirsin. Onu yendiğin gün mutlu olacağını sanıyorsun — yanılıyorsun. Mutluluk ertelenmez kanka; ertelediğin şey mutluluk değil, sadece beklemek.' },
        { speaker: 'npc',    text: '(omzuna vurur) Adamı ye, yık, ne istersen yap. Ama bu gece bir tur da kendin için at. Yoksa onu yensen bile kaybedersin.' },
      ],
      ideaSeed: 'kaos',
      relationshipBonus: 15,
    },
  ],
}

// ─── VIVIAN ──────────────────────────────────────────────────────────────────

const vivian: NPCDef = {
  id: 'vivian',
  name: 'Vivian',
  role: 'Yatırımcı',
  philosophy: 'Faydacılık — En çok kişiye en çok iyilik; amaç toplam artıdaysa aracı haklı çıkarır.',
  emoji: '📈',
  gender: 'female',
  isRomanceCandidate: false,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'vivian_t1_1',
      tier: 1,
      title: 'Anlat, Dinliyorum',
      lines: [
        { speaker: 'npc',    text: '(telefonu cebine atar) Naber. Vaktim kısıtlı ama iyi bir fikre her zaman vakit var. Anlat.' },
        { speaker: 'player', text: 'Tanışmadık. Sen kimsin?' },
        { speaker: 'npc',    text: 'Vivian. Fon yönetiyorum. Bu küçük şehre ara sıra gelip yükselen stüdyolara bakıyorum. Bu sabah üçünü eledim, birini fonladım. Matematik.' },
        { speaker: 'player', text: 'Soğuk geliyor kulağa.' },
        { speaker: 'npc',    text: 'İyi niyet güzel, bilanço daha güzel. Fonladığım o bir stüdyo otuz kişiye maaş ödeyecek. Elediğim üçüne ağlasaydım, otuz kişi aç kalırdı.' },
      ],
      ideaSeed: 'analiz',
      relationshipBonus: 8,
    },
    {
      id: 'vivian_t1_2',
      tier: 1,
      title: 'Terazi',
      lines: [
        { speaker: 'player', text: 'Her şeyi sayılarla mı tartıyorsun?' },
        { speaker: 'npc',    text: 'Her şeyi toplamla tartıyorum. Bir karar daha çok kişiye daha çok iyilik getiriyorsa, doğrudur. Getirmiyorsa, ne kadar şirin görünürse görünsün yanlıştır.' },
        { speaker: 'player', text: 'Ya tek bir kişi o toplamın altında ezilirse?' },
        { speaker: 'npc',    text: 'O en zor sorum. Noterdeki Clara bana "insan araç olmaz" der. Belki haklı. Ama ben birini kurtarmak için yüzünü feda eden sistemleri de gördüm.' },
      ],
      choices: [
        {
          text: 'Çoğunluk her zaman haklı değildir.',
          lines: [{ speaker: 'npc', text: 'Doğru. Ben çoğunluğu değil, toplam iyiliği savunuyorum — ikisi farklı şey. Bir azınlık daha fazla acı çekiyorsa, terazi onlardan yana eğilir. Mesele saymak değil, dürüstçe tartmak.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
        {
          text: 'Bu hesap insanı yormuyor mu?',
          lines: [{ speaker: 'npc', text: 'Yoruyor. Ama duygularıma göre dağıtsaydım, sevdiğime çok verir, tanımadığım yüze hiç vermezdim. Tarafsızlık benim için merhametin ta kendisi — sadece daha sessiz bir hâli.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'vivian_t2_1',
      tier: 2,
      title: 'Beş Stüdyo',
      lines: [
        { speaker: 'npc',    text: 'Bu teraziyi hep böyle taşımadım. Bir yara verdi onu bana.' },
        { speaker: 'player', text: 'Anlatır mısın?' },
        { speaker: 'npc',    text: 'Kariyerimin başında bir dostumun stüdyosu batıyordu. Sırf sevdiğim için tüm fonumu oraya yığdım. Stüdyo yine battı — ve o parayla kurtulabilecek beş stüdyoyu da götürdü.' },
        { speaker: 'player', text: 'Senin suçun değildi.' },
        { speaker: 'npc',    text: 'Suç değil. Ders. O gün öğrendim: bir yüze gösterdiğim şefkat, yüz kişiye sessiz bir ihanetti. Ahlakımı o günden sonra toplam üzerine kurdum.' },
      ],
      ideaSeed: 'hikaye',
      relationshipBonus: 10,
    },
    {
      id: 'vivian_t2_2',
      tier: 2,
      title: 'O İsim',
      lines: [
        { speaker: 'player', text: 'Bazen bir ismi mırıldanıyorsun. Hesap yaparken bile.' },
        { speaker: 'npc',    text: '(durur) Kurtaramadığım o dostun adı. Terazimi katılaştıran kişi. Tuhaf değil mi — toplamı savunuyorum ama hâlâ o tek yüzü taşıyorum.' },
        { speaker: 'player', text: 'Belki tam da o yüzden sayılara sığınıyorsun.' },
        { speaker: 'npc',    text: 'Belki. Marta — hani şu hemşire — bana "sen bir insanı değil, bir tabloyu kurtarıyorsun" dedi. Doğru olabilir. Ama o tablo titrediğinde, altındaki yüzlerce isim de titriyor.' },
      ],
      choices: [
        {
          text: 'O tek yüzü unutmamalısın.',
          lines: [{ speaker: 'npc', text: 'Unutmuyorum. Onu unutsam, terazi körelir. O isim benim vicdanım — toplamın insanı ezmesine izin vermeyeyim diye fısıldıyor.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Toplam, somut acıyı görmez ki.',
          lines: [{ speaker: 'npc', text: 'En büyük zaafım bu, biliyorum. Yüzü olmayan bir iyilik kolayca canavara döner. Bu yüzden her hesabın sonunda bir kez de yüzlere bakmaya çalışıyorum. Çoğu yatırımcı bakmaz.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 ───
    {
      id: 'vivian_t3_1',
      tier: 3,
      title: 'Toplamda Değer mi?',
      lines: [
        { speaker: 'npc',    text: 'Crane meselesi. Sana bir yatırımcı aklı vereyim, ücretsiz — nadir olur.' },
        { speaker: 'player', text: 'Dinliyorum.' },
        { speaker: 'npc',    text: 'Önce şunu sor: Onu yenmek toplamda gerçekten değer mi yaratıyor, yoksa sadece egonu mu doyuruyor? İkisi çok farklı bütçeler.' },
        { speaker: 'player', text: 'Ya ikisi de doğruysa?' },
        { speaker: 'npc',    text: 'O zaman acımasız olmaya hakkın var — ama sadece toplam gerçekten artıdaysa. Amaç aracı haklı çıkarır; yeter ki terazi kalabalıktan yana eğilsin, senin yaranı kapatmaktan yana değil.' },
        { speaker: 'npc',    text: 'Ama dürüst olayım: çoğu kişi kendi acısını fazla tartar, sonra "herkesin iyiliği için" der. Crane de öyle dedi bir zamanlar. Terazine kendi öfkeni koyma — o gram seni ona benzetir.' },
      ],
      ideaSeed: 'analiz',
      relationshipBonus: 15,
    },
  ],
}

// ─── ELISE (romantizm) ───────────────────────────────────────────────────────

const elise: NPCDef = {
  id: 'elise',
  name: 'Elise',
  role: 'Kafe Müzisyeni',
  philosophy: 'Romantizm adayı — Süslü diva: cilanın altında kimsenin dinlemediğini bilen yalnız bir sanatçı.',
  emoji: '🎶',
  gender: 'female',
  isRomanceCandidate: true,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'elise_t1_1',
      tier: 1,
      title: 'Aa, Sen',
      lines: [
        { speaker: 'npc',    text: '(akort yaparken, başını kaldırmadan) Aa, sen. Hâlâ o eski ceket, değil mi? Neyse... otur bir yere, birazdan provam var.' },
        { speaker: 'player', text: 'Burada mı çalıyorsun?' },
        { speaker: 'npc',    text: 'Şimdilik. Elise. Bu şehrin tek gerçek sesi — ki bu pek de iddialı sayılmaz, etrafa bakınca.' },
        { speaker: 'player', text: 'Mütevazı biri olduğun belli.' },
        { speaker: 'npc',    text: 'Mütevazılık keşfedilmemişler içindir. Ben sadece henüz doğru kişinin beni dinlemesini bekliyorum.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'elise_t1_2',
      tier: 1,
      title: 'Doğru Dinleyici',
      lines: [
        { speaker: 'npc',    text: 'Bu akşamki şarkım harika olacak. Tabii beni hak eden bir kulak olursa salonda.' },
        { speaker: 'player', text: 'Kalabalık seviyor mu seni?' },
        { speaker: 'npc',    text: 'Kalabalık alkışlıyor. Alkışlamak başka, dinlemek başka. Çoğu masasındaki içkiyle konuşuyor, ben fon müziğiyim.' },
      ],
      choices: [
        {
          text: 'Belki şarkıların fazla onların üstünde.',
          lines: [{ speaker: 'npc', text: '(ilk kez gülümser, hafif) Bunu söyleyen ilk kişisin. Çoğu "neşeli bir şey çal" der. Belki de... boş ver. Geç kaldım.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Büyük sahneleri neden denemiyorsun?',
          lines: [{ speaker: 'npc', text: 'Denedim. Yıllar önce, bavulumla geldim, "burası geçici" dedim. (omuz silker) Sahne insanı tutuyor. Bir bakmışsın, geçici on yıl olmuş.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'elise_t2_1',
      tier: 2,
      title: 'Kimse Dinlemez',
      lines: [
        { speaker: 'npc',    text: 'Sana bir şey itiraf edeyim mi? Masa dolar, salon dolar. Ama kimse dinlemez. Gürültü isterler, melodi değil.' },
        { speaker: 'player', text: 'Yine de her akşam çıkıyorsun.' },
        { speaker: 'npc',    text: 'Çıkıyorum. Çünkü sahnede ışık varken, en azından görünüyorum. Işık sönünce... insan kendi sesini bile duymuyor.' },
        { speaker: 'player', text: 'Bu yorucu olmalı.' },
        { speaker: 'npc',    text: 'Cila yorucu. Ama çıkardığım an, altında ne kaldığını bilmiyorum. O yüzden çıkarmıyorum.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'elise_t2_2',
      tier: 2,
      title: 'Çalmadığım Şarkı',
      lines: [
        { speaker: 'npc',    text: 'Bir şarkım var. Kimseye çalmadım. Fazla... gerçek. Sahnedeki Elise onu söyleyemez.' },
        { speaker: 'player', text: 'Neden?' },
        { speaker: 'npc',    text: 'Çünkü o şarkıda cila yok. Beğenmezlerse, beni beğenmemiş olurlar — şarkıyı değil. Bu riski almak için çok şey gerek.' },
      ],
      choices: [
        {
          text: 'Belki bir gün bana çalarsın.',
          lines: [{ speaker: 'npc', text: '(sana bakar, bir an sessiz) Belki. Eğer hâlâ dinliyor olursan o gün geldiğinde.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Riski almayan şarkı, şarkı mıdır?',
          lines: [{ speaker: 'npc', text: '(kısa bir kahkaha) Sözlerimi bana karşı kullanıyorsun. Sinir bozucu. Ve... galiba haklısın.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'elise_t3_1',
      tier: 3,
      title: 'Sadece Senin İçin',
      lines: [
        { speaker: 'npc',    text: '(salon boşalmış, sadece sen varsın) Herkes gitti. Genelde ben de bu saatte giderim. Ama... oturur musun bir dakika?' },
        { speaker: 'player', text: 'Tabii.' },
        { speaker: 'npc',    text: 'O çalmadığım şarkı var ya. (gitarı alır, duraksar) Yüzlerce kişiye söyledim sahnede, ama bu... bu sadece senin için. Çünkü sen gürültüyü değil, beni dinliyorsun.' },
        { speaker: 'player', text: 'Korkuyor musun?' },
        { speaker: 'npc',    text: 'Çok. Birinin gerçekten dinlemesi, alkıştan daha çok korkutuyor beni. Hem korkutuyor hem... hoşuma gidiyor. (çalmaya başlar) Kaçma, tamam mı? İlk kez cilasız çalıyorum.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── DANIEL (romantizm) ──────────────────────────────────────────────────────

const daniel: NPCDef = {
  id: 'daniel',
  name: 'Daniel',
  role: 'Nehir Biyoloğu',
  philosophy: 'Romantizm adayı — Utangaç profesör: insanlarla beceriksiz, nehir canlılarıyla rahat; sessiz hayretini paylaşacak biri arar.',
  emoji: '🔬',
  gender: 'male',
  isRomanceCandidate: true,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'daniel_t1_1',
      tier: 1,
      title: 'Islak Eller',
      lines: [
        { speaker: 'npc',    text: 'Ah, merhaba! (ellerini pantolonuna siler) Pardon, ellerim ıslak — gelgit havuzundaydım. Bir şeye mi... yoksa sadece mi?' },
        { speaker: 'player', text: 'Sadece bakıyorum. Burada ne yapıyorsun?' },
        { speaker: 'npc',    text: 'Araştırma. Şu küçük istasyon benim. Daniel. Nehri inceliyorum — kim gelir gider, kim kiminle yaşar, suyun altında. İnsanlardan çok... su semenderlerini anlıyorum, açıkçası.' },
        { speaker: 'player', text: 'Mütevazı bir alan değil.' },
        { speaker: 'npc',    text: 'Değil! (gözleri parlar, sonra kendini tutar) Pardon. Heyecanlanınca konuşuyorum. Genelde insanlar bu noktada uzaklaşıyor.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'daniel_t1_2',
      tier: 1,
      title: 'Mükemmel Kabuk',
      lines: [
        { speaker: 'npc',    text: '(avucunu açar) Şuna bak — bir salyangoz kabuğu. Logaritmik sarmal, kusursuz. Doğa matematik biliyor da bizi haberdar etmemiş gibi.' },
        { speaker: 'player', text: 'Sıradan bir kabuk sanırdım.' },
        { speaker: 'npc',    text: 'Hiçbir şey sıradan değil, yeterince yakından bakınca. Sorun şu ki çoğu insan yakından bakmaya vakit ayırmıyor.' },
      ],
      choices: [
        {
          text: 'Anlat, dinliyorum.',
          lines: [{ speaker: 'npc', text: '(yüzü aydınlanır) Gerçekten mi? Tamam, tamam — şu sarmalın açısı her türde aynı, 137 derece. Buna "altın açı" diyorlar. Üç saat anlatırım, durdur beni yoksa.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
        {
          text: 'İnsanlar neden uzaklaşıyor sence?',
          lines: [{ speaker: 'npc', text: '(omuz silker, mahcup) Çünkü ben "merhaba"yı atlayıp doğrudan su semenderi sinir sistemine geçiyorum galiba. Sohbet... benim için yabancı bir dil. Nehir daha kolay.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'daniel_t2_1',
      tier: 2,
      title: 'Atıf Peşinde',
      lines: [
        { speaker: 'npc',    text: 'Eskiden üniversitedeydim, biliyor musun? İyi bir bölüm, parlak gelecek, falan.' },
        { speaker: 'player', text: 'Neden bıraktın?' },
        { speaker: 'npc',    text: 'Bırakmadım sayılır, kaçtım. Herkes atıf peşindeydi — kim kimi kaç kez kaynak göstermiş. Ben sadece akarsuları merak ediyordum, ama merak orada bir suçtu sanki. "Yayınla ya da yok ol" diyorlardı.' },
        { speaker: 'player', text: 'Burada yok mu oldun yani?' },
        { speaker: 'npc',    text: '(güler) Belki akademiye göre oldum. Ama ilk kez bir şeyi kimse "ne işe yarayacak?" diye sormadan inceliyorum. Yok oluş buysa, suya memnuniyetle batarım.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'daniel_t2_2',
      tier: 2,
      title: 'Susmuyorum',
      lines: [
        { speaker: 'npc',    text: 'Seni sıkıyor muyum? Dürüst ol. Bir konuyu sevince susamıyorum, bu bir kusur — söylediler bana, defalarca.' },
        { speaker: 'player', text: 'Kusur mu, yoksa onları rahatsız eden başka bir şey mi?' },
        { speaker: 'npc',    text: '(durur) ...Bunu hiç böyle düşünmemiştim.' },
      ],
      choices: [
        {
          text: 'Tutkulu olman kusur değil.',
          lines: [{ speaker: 'npc', text: 'Belki. Belki yanlış insanlara anlatıyordum. Bir şeyi sevip de anlatamamak... sanırım en yalnız hâli bu sevginin.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
        {
          text: 'Bana anlatmaya devam et.',
          lines: [{ speaker: 'npc', text: '(bir an sana bakar, kulakları kızarır) Tamam. Ama uyarayım — gelgit tablolarına geçersek, akşam olur. Sen istedin ama.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'daniel_t3_1',
      tier: 3,
      title: 'Senin Adınla',
      lines: [
        { speaker: 'npc',    text: 'Sana bir şey göstereceğim, ama gülme. (bir kavanoz uzatır, içinde küçük bir nehir canlısı) Geçen ay yeni bir tür buldum. Kayıtlara geçmesi için bir isim vermem gerekiyordu.' },
        { speaker: 'player', text: 'Ne ad verdin?' },
        { speaker: 'npc',    text: '(sessizce) Seninkini. Resmî kayıtta, Latince ekiyle. Yani artık bilim, sen var olduğunu bilmese de seni biliyor.' },
        { speaker: 'player', text: 'Daniel, bu...' },
        { speaker: 'npc',    text: 'Biliyorum, biliyorum, tuhaf. Ama ben hayatımı şeyleri çözmeye adadım — akıntıları, kabukları, sinir sistemlerini. Seni ise çözemiyorum, ve... (derin nefes) ilk kez bir şeyi çözmek istemiyorum. Sadece, yanında durup bakmak istiyorum. Bir ömür yeter mi, bilmiyorum.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── NADIA (romantizm) ───────────────────────────────────────────────────────

const nadia: NPCDef = {
  id: 'nadia',
  name: 'Nadia',
  role: 'Seramikçi',
  philosophy: 'Romantizm adayı — Bohem özgür ruh: anı yaşar, kusuru kucaklar; bağlanmanın boğmasından korkar ama sadıktır.',
  emoji: '🏺',
  gender: 'female',
  isRomanceCandidate: true,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'nadia_t1_1',
      tier: 1,
      title: 'Çamurlu Eller',
      lines: [
        { speaker: 'npc',    text: 'Naber! (elleri çamurlu, sana doğru kollarını açar ama dokunmaz) İçten sarıldım say, dokunursam seni de boyarım. Yeni mi takılıyorsun buralarda?' },
        { speaker: 'player', text: 'Burası senin atölyen mi?' },
        { speaker: 'npc',    text: 'Atölye, ev, dünyam — hepsi bir. Nadia. Nehri resmederim, çömlek yaparım, vakti unuturum. Az önce saat sordun mu? Sorma, bilmiyorum, umurumda da değil.' },
        { speaker: 'player', text: 'Hep böyle mi yaşıyorsun?' },
        { speaker: 'npc',    text: 'Başka türlüsünü denedim, boğuldum. Burada kimse "saat kaç, plan ne" demiyor. Nehir de demiyor, ben de.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'nadia_t1_2',
      tier: 1,
      title: 'Eğri Vazo',
      lines: [
        { speaker: 'npc',    text: '(bir vazo uzatır) Şuna bak. Boynu eğri, değil mi? Çırağım Bea "bozuk" dedi, atacaktı.' },
        { speaker: 'player', text: 'Biraz eğri gerçekten.' },
        { speaker: 'npc',    text: 'Mükemmel olsa sıkıcı olurdu. Eğri olan, elimin o gün nasıl titrediğini saklıyor içinde. Kusur dediğin şey, aslında bir parmak izi.' },
      ],
      choices: [
        {
          text: 'Demek hataları seviyorsun.',
          lines: [{ speaker: 'npc', text: 'Hata yok ki — sadece beklemediğin şeyler var. Plan yaparsan hayat seni şaşırtamaz; ben şaşırmayı severim. Çamur nereye giderse, ben de oraya.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: "Bea'ya ne öğretiyorsun?",
          lines: [{ speaker: 'npc', text: 'Teknikten çok, korkmamayı. Bozmaktan korkarsan hiçbir şey yapamazsın. Çoğu insana bunu kimse söylememiş; ben Bea\'ya küçükken söylüyorum.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'nadia_t2_1',
      tier: 2,
      title: 'Pratik Ol',
      lines: [
        { speaker: 'npc',    text: 'Bir zamanlar şehirdeydim. Sergiler, galeriler, "kariyer."' },
        { speaker: 'player', text: 'Tutmadı mı?' },
        { speaker: 'npc',    text: 'Tuttu aslında, sorun oydu. Herkes "pratik ol, satılanı yap, markanı kur" diyordu. Sanatım fatura ödeyen bir makineye döndü. Bir sabah fırçayı bıraktım, trene bindim, buraya geldim.' },
        { speaker: 'player', text: 'Pişman değil misin?' },
        { speaker: 'npc',    text: 'Bazen aç kalıyorum. Ama ilk kez yaptığım şey bana ait. "Pratik" kelimesi bir insanın içindeki rengi öldürebiliyor — ben rengimi geri istedim.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'nadia_t2_2',
      tier: 2,
      title: 'Bağlanmak Boğar',
      lines: [
        { speaker: 'npc',    text: 'Sana karşı dürüst olayım, çünkü dürüst olmadığımda kil çatlıyor. Senden hoşlanıyorum. Ve bu beni biraz... ürkütüyor.' },
        { speaker: 'player', text: 'Neden ürkütüyor?' },
        { speaker: 'npc',    text: 'Çünkü bağlanmak boğar diye korkarım. Birine yer açınca, o yer bir gün kafes olur sandım hep.' },
      ],
      choices: [
        {
          text: 'Bağ kafes olmak zorunda değil.',
          lines: [{ speaker: 'npc', text: '(uzun bir sessizlik) Belki. Belki yanlış ellerde kafes oldu hep. Açık suda da iki tekne yan yana gidebilir, birbirini bağlamadan. Hiç böyle düşünmemiştim.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
        {
          text: "Ben seni 'pratik ol' demeden severim.",
          lines: [{ speaker: 'npc', text: '(sana bakar, elindeki kili bırakır) ...Bunu yıllardır bekliyormuşum gibi söyledin. Bu cümleyi kimse kurmadı bana, hiç.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'nadia_t3_1',
      tier: 3,
      title: 'Birlikte Bir Şey',
      lines: [
        { speaker: 'npc',    text: '(çarkın başına oturur, yanındaki tabureyi gösterir) Gel, otur şuraya. Yakına.' },
        { speaker: 'player', text: 'Ne yapıyoruz?' },
        { speaker: 'npc',    text: 'Birlikte bir şey yapalım. Ne olacağını bilmiyorum — en güzeli de bu. (ellerini senin ellerinin üstüne koyar, çamurun içinde) Bak, çark dönüyor, şekil kendini buluyor. Plan yok. Sadece sen, ben, ve ne çıkacağını bilmediğimiz bu şey.' },
        { speaker: 'player', text: 'Eğri çıkabilir.' },
        { speaker: 'npc',    text: '(güler, gözleri parlak) Umarım çıkar. Seni kilden yapmaya kalksam ellerim titrerdi zaten — fazla bakardım yüzüne, çark dururdu. Mükemmel olmasını istemiyorum bunun. Sadece... yanımda olmanı istiyorum. O yeter. İlk kez bir şeyin sürmesini istiyorum, bitmesini değil.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── CASSIAN (romantizm) ─────────────────────────────────────────────────────

const cassian: NPCDef = {
  id: 'cassian',
  name: 'Cassian',
  role: 'Fenerci',
  philosophy: 'Romantizm adayı — Melankolik kayıp ruh: kasvetli, içe kapalı bir şair; yakınlıktan hem korkar hem can atar.',
  emoji: '🗼',
  gender: 'male',
  isRomanceCandidate: true,
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'cassian_t1_1',
      tier: 1,
      title: 'Işık Nehre Gider',
      lines: [
        { speaker: 'npc',    text: '(sırtı dönük, nehre bakıyor) ...Geldin demek.' },
        { speaker: 'player', text: 'Beni bekliyor muydun?' },
        { speaker: 'npc',    text: 'Hayır. Kimseyi beklemem. Ama ayak sesi farklıydı, döndüm. Cassian. Şu feneri ben bekliyorum.' },
        { speaker: 'player', text: 'Yalnız bir iş olmalı.' },
        { speaker: 'npc',    text: 'Işık nehre gider. Teknelere yol gösterir. Bana karanlık kalır. (durur) Alıştım. İnsan her şeye alışıyor — en çok da buna.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'cassian_t1_2',
      tier: 1,
      title: 'Geceleri Yazarım',
      lines: [
        { speaker: 'npc',    text: '(masada kapalı bir defter) Uyumadım. Geceleri... karanlık benimle konuşuyor, ben de yazıyorum. Tutuyorum bir yere, yoksa boğar.' },
        { speaker: 'player', text: 'Ne yazıyorsun?' },
        { speaker: 'npc',    text: 'Önemli değil. Kimse okumayacak. Bazı şeyler söylensin diye değil, taşınabilsin diye yazılır.' },
      ],
      choices: [
        {
          text: 'Bir gün okur musun bana?',
          lines: [{ speaker: 'npc', text: '(uzun sessizlik) ...Kimse bunu istemedi benden. Bilmiyorum. Belki. "Belki" benim için büyük bir kelime, farkında ol.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Karanlık herkesle konuşmaz.',
          lines: [{ speaker: 'npc', text: 'Hayır. Yalnız dinlemeyi öğrenenlerle. Çoğu insan sessizlikten kaçar, doldurur, gürültüyle örter. Sen kaçmadın. Bunu fark ettim.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'cassian_t2_1',
      tier: 2,
      title: 'Adını Anmadığım',
      lines: [
        { speaker: 'npc',    text: 'Bir zamanlar bu fener iki kişiydi. Ben ve... biri.' },
        { speaker: 'player', text: 'Ne oldu?' },
        { speaker: 'npc',    text: '(uzun sessizlik) Adını anmıyorum. Anarsam gerçek olur, gerçek olursa gitmiş olur. Bu kadarını söyleyebilirim: bir sabah ışığı yaktım, ama yalnız yaktım. O günden beri öyle.' },
        { speaker: 'player', text: 'Üzgünüm.' },
        { speaker: 'npc',    text: 'Üzülme. Eski bir yara bu, kapanmadı ama kanamıyor da. Sadece... hava değişince sızlıyor. Bugün hava değişti galiba.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'cassian_t2_2',
      tier: 2,
      title: 'Yalnızlığı Seçtim mi?',
      lines: [
        { speaker: 'npc',    text: 'İnsanlara "yalnızlığı seçtim" derim. Daha asil duyuluyor. Seçilmiş bir kader, terk edilmiş bir kaderden iyidir.' },
        { speaker: 'player', text: 'Seçmedin mi?' },
        { speaker: 'npc',    text: '(acı bir gülümseme) Bilmiyorum artık. Belki yalnızlık beni seçti, ben de sonradan "benim fikrimdi" dedim. İnsan kendine anlattığı yalanlarla ayakta duruyor.' },
      ],
      choices: [
        {
          text: 'Yakınlıktan korkuyorsun.',
          lines: [{ speaker: 'npc', text: '(sessizlik) En çok korktuğum şey, en çok istediğim şey. İkisi aynı yerde duruyor. Birine yaklaşırsam, bir gün o ışık da yalnız yanabilir diye... yaklaşmıyorum.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Karanlık sonsuza dek sürmez.',
          lines: [{ speaker: 'npc', text: 'Şair olduğunu söylemedin bana. (bir an bakar) Belki haklısın. Fenerci olarak biliyorum: en uzun gece bile sabaha bağlanır. Ama beklemek... beklemek uzun.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'cassian_t3_1',
      tier: 3,
      title: 'İçeride de Yanıyor',
      lines: [
        { speaker: 'npc',    text: '(sana döner, ilk kez doğrudan) Bir şey fark ettim. Sen geldiğinden beri... gece daha kısa.' },
        { speaker: 'player', text: 'Fener mi yardımcı oluyor?' },
        { speaker: 'npc',    text: 'Hayır. Yıllarca ışığı dışarı, nehre verdim. Tekneleri kurtardım, kendi limanımı hiç bulamadım. (duraksar) Ama sen karanlığımdan kaçmadın. İlk sen. Ve şimdi... ışık içeride de yanıyor. Nasıl olduğunu bilmiyorum.' },
        { speaker: 'player', text: 'Korkuyor musun?' },
        { speaker: 'npc',    text: 'Çok. Bir şeyi sevmek, kaybetmenin kapısını açmak demek. Bunu bir kez yaşadım. Ama... (elini uzatır, titrek) belki bu sefer ışığı birlikte yakarız. Birlikte yanan ışık daha zor söner, derler. Denemekten korkuyorum — ama daha çok, hiç dememekten korkuyorum.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── ROSA (romantizm) ────────────────────────────────────────────────────────

const rosa: NPCDef = {
  id: 'rosa',
  name: 'Rosa',
  role: 'Fırın Çırağı',
  philosophy: 'Romantizm adayı — Güneş-masum: neşeli, beceriksizce şirin; babasının kaybını taşır, "Aldo\'nun yeğeni"nden fazlası olarak görülmek ister.',
  emoji: '🥐',
  gender: 'female',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'rosa_t1_1',
      tier: 1,
      title: 'Yanık Ama Kokusu Güzel',
      lines: [
        { speaker: 'npc',    text: 'Naber! (elinde tepsi, una bulanmış) Dur, dur — ekmek biraz yandı ama kokusu güzel, değil mi? Koku önemli, amcam öyle der.' },
        { speaker: 'player', text: 'Sen kimsin?' },
        { speaker: 'npc',    text: 'Rosa! Aldo\'nun yeğeni — hani şu fırındaki amca. Ben de çıraklık ediyorum. Yani... batıra batıra öğreniyorum. Çoğunlukla batırıyorum.' },
        { speaker: 'player', text: 'Kokusu gerçekten güzel.' },
        { speaker: 'npc',    text: '(yüzü aydınlanır) Değil mi?! Gördün mü, sen anlıyorsun. Al şu çöreği — o köşedeki daha az yanık, onu sana saklamıştım. Şey, yani... kim gelirse ona.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'rosa_t1_2',
      tier: 1,
      title: 'Yine Batırdım',
      lines: [
        { speaker: 'npc',    text: 'Amcam tarifi üç kez gösterdi. Üçünde de farklı bir şey yandı. Bugün... mayayı mı unuttum, fırını mı açık bıraktım, bilmiyorum.' },
        { speaker: 'player', text: 'Pes etmiyorsun ama.' },
        { speaker: 'npc',    text: 'Asla! Bir gün kendi fırınımı açacağım. Kapısında benim adım yazacak. Yanık ekmek olsa da benim yanık ekmeğim olacak.' },
      ],
      choices: [
        {
          text: 'Hayalin güzel.',
          lines: [{ speaker: 'npc', text: '(gülümser) Herkes "küçük kız, hayal kurma" der. Sen "güzel" dedin. Bunu... bunu pek duymuyorum. Teşekkür ederim, gerçekten.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Amcan iyi bir usta.',
          lines: [{ speaker: 'npc', text: 'En iyisi. Beni o büyüttü, biliyorsun. Bana hep der ki: "Acele etme Rosa, ekmek de sevgi de mayasını kendi bulur." Anlamını yeni yeni çözüyorum.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'rosa_t2_1',
      tier: 2,
      title: 'Babamı Küçükken',
      lines: [
        { speaker: 'npc',    text: '(hamur yoğururken sakinleşir) Sana bir şey sorayım — annen baban var mı?' },
        { speaker: 'player', text: '...' },
        { speaker: 'npc',    text: 'Benim babamı küçükken kaybettim. Annemi hiç tanımadım. Amcam Aldo aldı beni, büyüttü. Hiç "yük" gibi hissettirmedi, bir gün bile.' },
        { speaker: 'player', text: 'Zor olmuştur.' },
        { speaker: 'npc',    text: 'Oldu. Ama amcamın fırını hep sıcaktı, biliyor musun? Üşüdüğüm her gün oraya kaçardım. Sanırım o yüzden ekmek yapıyorum — sıcak bir yer kurmak istiyorum, başkaları da üşüdüğünde kaçsın diye.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'rosa_t2_2',
      tier: 2,
      title: "Aldo'nun Yeğeni",
      lines: [
        { speaker: 'npc',    text: 'Bazen tuhaf bir şey hissediyorum, kötü biri gibi. Amcamı çok seviyorum ama...' },
        { speaker: 'player', text: 'Ama?' },
        { speaker: 'npc',    text: 'Herkes bana "Aldo\'nun yeğeni" diyor. Çörek alırken, sokakta, her yerde. Bir gün sadece "Rosa" olmak istiyorum. Kendi adımla. Bu bencillik mi?' },
      ],
      choices: [
        {
          text: 'Bencillik değil, bu çok insani.',
          lines: [{ speaker: 'npc', text: '(rahatlar) Öyle mi? İçimde tutuyordum, söylemeye korkuyordum. Amcamı sevmemek sanılır diye. Ama sevmek başka, görünmek başka, değil mi?' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Kendi fırının o adı verir sana.',
          lines: [{ speaker: 'npc', text: '(gözleri parlar) Evet! Tam da bu! Kapıda "Rosa" yazınca, artık kimsenin yeğeni değil — bir şeyin sahibi olacağım. Babam görseydi... neyse. Görecek bir gün, yukarıdan.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'rosa_t3_1',
      tier: 3,
      title: 'Sadece Ben',
      lines: [
        { speaker: 'npc',    text: '(arkasından bir somun çıkarır, özenle sarılmış) Bunu... bunu senin için sakladım. Bütün gün uğraştım, ilk defa hiçbir yeri yanmadı. Bak, altın rengi!' },
        { speaker: 'player', text: 'Benim için mi yaptın?' },
        { speaker: 'npc',    text: '(kızarır) "En güzel somunu müşteriye" derim hep ya — yalan. Bahaneydi. Seni görmek istedim. Her sabah "bugün uğrar mı" diye kapıya bakıyorum, un elimde kalıyor.' },
        { speaker: 'player', text: 'Rosa...' },
        { speaker: 'npc',    text: 'Biliyorum, beceriksizim, ekmeklerim yanıyor, çok konuşuyorum. Ama yanındayken... yanındayken "Aldo\'nun yeğeni" değilim. "Zavallı öksüz Rosa" da değilim. Sadece Rosa\'yım. Sadece ben. Bunu bana ilk kez biri hissettirdi — sen. (somunu uzatır) Sıcakken ye, tamam mı? Soğuyunca o büyü kaçıyor.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── IRIS (romantizm) ────────────────────────────────────────────────────────

const iris: NPCDef = {
  id: 'iris',
  name: 'Iris',
  role: 'Gazeteci',
  philosophy: 'Romantizm adayı — Alaycı kariyerci: keskin dilli, mesafeli, hırslı; sertliğinin altında doğruya tutkuyla bağlı kırılgan biri.',
  emoji: '📰',
  gender: 'female',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'iris_t1_1',
      tier: 1,
      title: 'Alıntılanabilir Bir Şey',
      lines: [
        { speaker: 'npc',    text: '(not defterinden başını kaldırmadan) Naber. Alıntılanabilir bir şey söyle, vaktimi boşa harcama.' },
        { speaker: 'player', text: 'Daha yeni tanıştık.' },
        { speaker: 'npc',    text: 'Ve sen şimdiden sıkıcısın. Iris. Şehrin gazetesini ben çıkarıyorum — yani burada olan biten her şeyi senden önce biliyorum. Stüdyo kurmuşsun. İlginç. Ya parlak bir manşet olacaksın ya da küçük bir dipnot.' },
        { speaker: 'player', text: 'Hangisi olacağıma sen mi karar veriyorsun?' },
        { speaker: 'npc',    text: '(ilk kez bakar, hafif gülümseme) Hayır. Ama nasıl yazılacağına ben karar veriyorum. İkisi farklı şey, alışsan iyi olur.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'iris_t1_2',
      tier: 1,
      title: 'Üç Yalan İki Skandal',
      lines: [
        { speaker: 'npc',    text: 'Bugünün bilançosu: üç yalan yakaladım, iki skandal gömdüm, bir de aşk dedikodusu — onu basacağım, millet onu seviyor.' },
        { speaker: 'player', text: 'Doğruyu yazmak istemez misin?' },
        { speaker: 'npc',    text: 'İsterim. Yazarım da. Sorun şu: doğruyu yazınca kimse sevmiyor. Yalanı süslersen alkış, gerçeği söylersen sessizlik.' },
      ],
      choices: [
        {
          text: 'Yine de gerçeği yazıyorsun.',
          lines: [{ speaker: 'npc', text: '(bir an durur) ...Çoğunlukla. Birinin yazması lazım, değil mi? Bu şehirde kalan tek "evet" diyebileceğim şey bu galiba. Onu da kaybedersem, sadece dedikodu satan biri olurum.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Crane hakkında ne biliyorsun?',
          lines: [{ speaker: 'npc', text: '(gözleri parlar) Aa, demek sen de o hesabın peşindesin. Çok şey biliyorum. Nehrin o yakası bana konuşmaz ama rakamlar konuşur. Bir gün otur, anlatırım — ama bedava değil, sen de bana bir hikâye borçlanırsın.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'iris_t2_1',
      tier: 2,
      title: 'Hakikati Eğmemi İstediler',
      lines: [
        { speaker: 'npc',    text: 'Eskiden büyük bir gazetedeydim. Şehirde, üst katlarda, maaş iyiydi.' },
        { speaker: 'player', text: 'Neden ayrıldın?' },
        { speaker: 'npc',    text: 'Ayrılmadım, çarptılar. Bir patronun dostuyla ilgili bir haber vardı, gerçekti. "Yumuşat," dediler. Yumuşatmadım. "Eğ," dediler. Eğmedim. Ertesi gün masam boştu.' },
        { speaker: 'player', text: 'Pişman mısın?' },
        { speaker: 'npc',    text: 'Hiç. Buraya geldim, küçük bir matbaa, kendi gazetem. Kimse bana "eğ" diyemiyor artık. Az kazanıyorum ama her kelimesi benim. Eğilmeyen bir cümle, eğilen bin maaştan değerli.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'iris_t2_2',
      tier: 2,
      title: 'Sertlik Zırh',
      lines: [
        { speaker: 'npc',    text: 'Bana "buz gibi" diyorlar. "Kalpsiz Iris." Hoşuma da gidiyor, işime yarıyor.' },
        { speaker: 'player', text: 'Ama değilsin.' },
        { speaker: 'npc',    text: '(kalemi bırakır) ...Dikkatli ol. İnsanları okumak benim işim, tersine çevirme.' },
      ],
      choices: [
        {
          text: 'Sertlik bir zırh sadece.',
          lines: [{ speaker: 'npc', text: '(uzun bir sessizlik) Zırhı olan herkesin altında bir yara vardır, bunu sen mi öğreteceksin bana? ...Evet. Zırh. Ama içeriyi göstermem. Henüz. O kısmı kazanman lazım, kimseye bedava vermiyorum.' }],
          ideaSeed: 'hikaye',
          relationshipBonus: 5,
        },
        {
          text: 'Kimseye güvenmiyorsun galiba.',
          lines: [{ speaker: 'npc', text: 'Güven, manşetten önce kontrol edilmesi gereken bir iddiadır. Herkes bir kaynaktır; çoğu yalan söyler. Sen... seni hâlâ doğruluyorum. Şimdilik temiz çıkıyorsun, bu da sinir bozucu.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'iris_t3_1',
      tier: 3,
      title: 'Manşete Taşırdım',
      lines: [
        { speaker: 'npc',    text: '(masaya bir taslak sayfa atar — senin hakkında bir haber, ama basılmamış) Şuna bak. Aylardır üstünde çalışıyorum. "Nehri Geçen Adam: Bir Stüdyonun Doğuşu." En iyi hikâyem.' },
        { speaker: 'player', text: 'Basacak mısın?' },
        { speaker: 'npc',    text: 'İşte mesele bu. Basarsam, harika bir manşet olursun — ve herkesin olursun. (duraksar, alaycılığı düşer) Basmazsam... sadece benim kalırsın. Ve ben hayatımda ilk kez bir hikâyeyi paylaşmak istemiyorum.' },
        { speaker: 'player', text: 'Iris Lindqvist tereddüt mü ediyor?' },
        { speaker: 'npc',    text: 'Kapa çeneni. (gülümser ama gözleri dolu) Zekânla baş edebilen tek kişisin. Beni alt edebilen, bana laf yetiştirebilen. Sinir bozucusun. Ve... çekicisin, bunu itiraf ettirdiğin için senden nefret ediyorum. Manşeti tuttum. Çünkü bazı gerçekler haber değil — sır olarak daha kıymetli.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── SIGRID (romantizm) ──────────────────────────────────────────────────────

const sigrid: NPCDef = {
  id: 'sigrid',
  name: 'Sigrid',
  role: 'Balıkçı',
  philosophy: 'Romantizm adayı — Sert tomboy: dobra, eylem insanı, kimseye muhtaç değil; altında derin sadakat ve yaslanmaktan korkan bir yürek.',
  emoji: '⚓',
  gender: 'female',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'sigrid_t1_1',
      tier: 1,
      title: 'Laf Sevmem',
      lines: [
        { speaker: 'npc',    text: '(ağ çekerken, sana bakmadan) Naber. Yardım lazımsa söyle. Laf lazımsa, yanlış kişidesin.' },
        { speaker: 'player', text: 'Sadece selam vermek istedim.' },
        { speaker: 'npc',    text: '(kısa bir duraklama) Sigrid. Tekneler benim, ağlar benim, şu iskelenin yarısı benim kol gücümle ayakta. Selamı aldım. Başka?' },
        { speaker: 'player', text: 'Yardım edebilir miyim?' },
        { speaker: 'npc',    text: '(sana ilk kez bakar, ölçer) Ellerin yumuşak görünüyor. Ama deneyebilirsin. Şu halatı tut — bırakma. Bırakırsan ikimiz de suya gideriz.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'sigrid_t1_2',
      tier: 1,
      title: 'Nehir Sert Bugün',
      lines: [
        { speaker: 'npc',    text: 'Sabah üç ağ çektim, biri yırtık. Nehir sert bugün. (omuz silker) İyi. Kolay olan sıkıcı.' },
        { speaker: 'player', text: 'Yorulmuyor musun?' },
        { speaker: 'npc',    text: 'Yorulmak başka, şikâyet başka. Birincisi insani, ikincisi vakit kaybı.' },
      ],
      choices: [
        {
          text: 'Sert nehri seviyorsun demek.',
          lines: [{ speaker: 'npc', text: 'Sevmek mi? Bilmem. Saygı duyuyorum. Nehir seni kandırmaz — ne verirsen onu alırsın, ne kadar çekersen o kadar. İnsanlar öyle değil. Nehir dürüst.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
        {
          text: 'Konuşmayı sevmiyorsun, anladım.',
          lines: [{ speaker: 'npc', text: '(hafif, neredeyse görünmez bir gülümseme) Konuşmam. Ama senin susman hoş. Çoğu insan sessizliği doldurmak için saçmalar. Sen durdun. İyi. Kal istersen — ama halatı bırakma.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'sigrid_t2_1',
      tier: 2,
      title: 'Babam Denizciydi',
      lines: [
        { speaker: 'npc',    text: '(ağı onarırken) Babam denizciydi. Gerçek bir denizci — okyanusta, büyük gemilerde. Beni de denize çıkarırdı küçükken.' },
        { speaker: 'player', text: 'Onu özlüyor musun?' },
        { speaker: 'npc',    text: 'Bana bir şey öğretti: kimseye muhtaç olma. "Dalga geldiğinde kimse seni tutmaz Sigrid, kendin tutacaksın," derdi. Bir gün gerçekten gelmedi — deniz aldı. O gün buraya, nehre yerleştim. Daha sakin sular.' },
        { speaker: 'player', text: 'Bu yüzden mi tek başına çalışıyorsun?' },
        { speaker: 'npc',    text: 'Tek başına batmazsan, kimse seni batıramaz. Mantıklı geliyordu. Hâlâ da öyle. Çoğunlukla.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'sigrid_t2_2',
      tier: 2,
      title: 'Yaslanmayı Beceremem',
      lines: [
        { speaker: 'npc',    text: 'Sana bir şey söyleyeceğim, bir kez söyleyeceğim. Senden... rahatsız oluyorum. Kötü anlamda değil. Tuhaf anlamda.' },
        { speaker: 'player', text: 'Nasıl yani?' },
        { speaker: 'npc',    text: 'Geldiğinde işim aksıyor. Gözüm iskeleye kayıyor. Bu iyi değil. Ağ çekerken dikkatini dağıtan şey, seni suya çeker.' },
      ],
      choices: [
        {
          text: 'Bana yaslanabilirsin.',
          lines: [{ speaker: 'npc', text: '(sertçe) Yaslanmayı beceremem. Düşersem kendim kalkarım, hep öyle yaptım. (daha yumuşak) Ama... bunu söylemen. Bilmiyorum. İçimde bir şey gevşedi, sevmedim. Yine de söyle bir daha, belki.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Güçlü olmak hep yalnız olmak değil.',
          lines: [{ speaker: 'npc', text: 'Babam öyle demezdi. Ama babam da yalnız öldü, denizin ortasında. Belki her dediği doğru değildi. (uzun sessizlik) Bunu ilk kez yüksek sesle düşündüm. Senin yanında. Tuhaf.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'sigrid_t3_1',
      tier: 3,
      title: 'Tekneye Gel',
      lines: [
        { speaker: 'npc',    text: '(halatları toplar, sana döner, dosdoğru) Bak. Ben süslü laf bilmem. İçimi şiir gibi anlatamam, Cassian değilim. O yüzden düz söyleyeceğim, bir kere.' },
        { speaker: 'player', text: 'Dinliyorum.' },
        { speaker: 'npc',    text: 'Sana güveniyorum. Galiba. Ve bu beni huzursuz ediyor — ama iyi anlamda, ilk kez. Kimseye güvenmem, biliyorsun. Babam öğretmedi onu. Sen öğrettin.' },
        { speaker: 'player', text: 'Sigrid...' },
        { speaker: 'npc',    text: '(nefes alır, zor) Yarın şafakta tekneyle açılıyorum. Kimseyi almam — teknede iki kişi olmaz, derim hep. (sana bakar) Sen gel. Sen başkasın. Halatı bırakmayacağına güveniyorum artık. Düşersem... belki bu sefer tutarsın. Belki ben de tutmaya izin veririm.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── LIV (romantizm) ─────────────────────────────────────────────────────────

const liv: NPCDef = {
  id: 'liv',
  name: 'Liv',
  role: 'Bahçıvan',
  philosophy: 'Romantizm adayı — Dingin şefaatçi: sakin, sabırlı toprak ana; herkesin bahçesini sular ama kendi ihtiyaçlarını erteler, o da büyümek ister.',
  emoji: '🌿',
  gender: 'female',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'liv_t1_1',
      tier: 1,
      title: 'Acele Yok',
      lines: [
        { speaker: 'npc',    text: '(bir fideyi saksıya aktarıyor, başını kaldırır, gülümser) Aa, merhaba. Dikkatli geç, şu sıradakiler yeni kök saldı. Ürkütme onları, daha utangaçlar.' },
        { speaker: 'player', text: 'Bitkiler ürker mi?' },
        { speaker: 'npc',    text: 'Her canlı ürker, sadece farklı hızlarda. Ben Liv. Şehrin serası benim. Acele eden müşteriysen yanlış yerdesin — burada hiçbir şey zorlanmaz, mevsimi gelince olur.' },
        { speaker: 'player', text: 'Sabırlı biri olmalısın.' },
        { speaker: 'npc',    text: 'Sabır değil bu. Sabır beklemek demek, içten içe kızmak demek. Ben sadece... onların hızına saygı duyuyorum. Domates Mart\'ta olmaz, ne kadar istesen de. Bunu kabul edince, huzur geliyor.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'liv_t1_2',
      tier: 1,
      title: 'Mevsimi Gelince',
      lines: [
        { speaker: 'npc',    text: '(toprağı elindeyle yokluyor) Greta\'nın laleleri için fide hazırlıyorum. O satıyor, ben büyütüyorum. İyi bir iş bölümü — ben başlangıçları severim, o renkleri.' },
        { speaker: 'player', text: 'Hep başkaları için mi yetiştiriyorsun?' },
        { speaker: 'npc',    text: '(bir an durur) ...İlginç bir soru. Çoğu insan "ne güzel sera" der, geçer.' },
      ],
      choices: [
        {
          text: 'Her şeyin bir zamanı var diyorsun.',
          lines: [{ speaker: 'npc', text: 'Evet. En çok da insanların unuttuğu şey bu. Bir tohumu toprağa basıp "neden hemen çiçek açmadın?" diye bağırmıyorsun, değil mi? Ama kendilerine, sevdiklerine bunu yapıyorlar. Büyümek zaman ister. Sevmek de.' }],
          ideaSeed: 'zaman_yonetimi',
          relationshipBonus: 5,
        },
        {
          text: 'Sera huzurlu bir yer.',
          lines: [{ speaker: 'npc', text: 'Öyle değil mi? Camdan ışık süzülür, toprak kokar, her şey yavaşça nefes alır. İnsanlar buraya yorgun gelir, dinlenmiş gider. (yumuşak) Sen de yorgun görünüyorsun. Otur istersen, çay demleyeyim — ıhlamur, kendi yetiştirdiğim.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'liv_t2_1',
      tier: 2,
      title: 'Herkesin Bahçesi',
      lines: [
        { speaker: 'npc',    text: '(akşam, suluğu doldururken) Greta\'nın fidelerini suladım, Marcus\'a sarmaşık verdim, Hanna\'nın penceresine fesleğen koydum. Bütün şehrin yeşili biraz benden geçer.' },
        { speaker: 'player', text: 'Peki senin bahçen?' },
        { speaker: 'npc',    text: '(durur, suluğu indirir) ...Benim bahçem. Tuhaf. Kimse sormaz bunu. Şu köşedeki saksılar benim — bak, biraz solgun, değil mi? Herkesi sularken sıra bana gelince akşam oluyor, ışık gidiyor.' },
        { speaker: 'player', text: 'Kendini ihmal ediyorsun.' },
        { speaker: 'npc',    text: 'İhmal ağır kelime. Sadece... ben başkalarını büyütmeye o kadar alışmışım ki, kendi köküme su vermeyi unutuyorum. Bakıcı olmak böyle bir şey. İçin dolu sanırsın, bir bakmışsın kurumuşsun.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'liv_t2_2',
      tier: 2,
      title: 'Ben de Büyümek İstiyorum',
      lines: [
        { speaker: 'npc',    text: 'Bir itirafta bulunayım mı? Bazen kıskanıyorum yetiştirdiğim şeyleri.' },
        { speaker: 'player', text: 'Kıskanmak mı?' },
        { speaker: 'npc',    text: 'Onlara her gün bakılıyor. Suları ölçülüyor, ışıkları ayarlanıyor, "büyü" diye fısıldanıyor. Ben de... ben de birinin beni öyle büyütmesini istiyorum sanırım. Ama bunu söylemek bencillik gibi.' },
      ],
      choices: [
        {
          text: 'Bakıcının da bakıma ihtiyacı var.',
          lines: [{ speaker: 'npc', text: '(gözleri nemlenir) Bunu yüksek sesle ilk kez biri söyledi. Hep "sen güçlüsün Liv, sen idare edersin" derler. Güçlüyüm, evet. Ama güçlü olan da bazen birinin "bugün sen nasılsın?" demesini istiyor.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Sen de bir tohumsun, daha açmamış.',
          lines: [{ speaker: 'npc', text: '(uzun bir sessizlik, sonra gülümser) Ne güzel söyledin. Belki öyleyimdir. Belki hep başkalarının mevsimini bekledim, kendiminkini hiç. Belki benim de bir baharım vardır, henüz gelmemiş.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'liv_t3_1',
      tier: 3,
      title: 'Birlikte Büyüyelim',
      lines: [
        { speaker: 'npc',    text: '(sana bir saksı uzatır — içinde küçük, yeni filizlenmiş bir şey) Bunu senin için ayırdım. Ne olacağını henüz bilmiyorum — etiketi düşmüş. Sürpriz. Ama sağlıklı, bak, kökü güçlü.' },
        { speaker: 'player', text: 'Neden bana?' },
        { speaker: 'npc',    text: 'Çünkü onu birlikte büyütmek istiyorum. Acele etmeden. Bir mevsim, iki mevsim, ne kadar sürerse. (sana bakar, sakin ama derinden) Ben hayatım boyunca herkesin bahçesini suladım. Seninle... seninle ilk kez kendi bahçemi de sulamak istiyorum. Yan yana iki saksı gibi — aynı ışığa uzanan, birbirini gölgelemeyen.' },
        { speaker: 'player', text: 'Ya zaman alırsa?' },
        { speaker: 'npc',    text: 'Alsın. En güzel şeyler yavaş büyür. Gül bir günde açmaz; açsa zaten güvenmezdim ona. Sen acele etme, ben de etmeyeceğim. Sadece... birlikte büyüyelim. Aynı toprakta. Olur mu?' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── BJORN (romantizm) ───────────────────────────────────────────────────────

const bjorn: NPCDef = {
  id: 'bjorn',
  name: 'Bjorn',
  role: 'Tamirci',
  philosophy: 'Romantizm adayı — Nazik dev: az konuşan, ağır, sade; ünlü ağabeyinin gölgesinde, kendisi olarak görülmek isteyen en sıcak el.',
  emoji: '🔧',
  gender: 'male',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'bjorn_t1_1',
      tier: 1,
      title: 'Otur İstersen',
      lines: [
        { speaker: 'npc',    text: '(bir radyonun içine eğilmiş, başını yavaşça kaldırır) ...Naber. Otur istersen. Şu sandalye sağlam, onu ben yaptım.' },
        { speaker: 'player', text: 'Rahatsız etmeyeyim.' },
        { speaker: 'npc',    text: 'Etmiyorsun. Bjorn. Ne kırıksa onarırım — radyo, saat, sandalye. Bir şeyin kırıldıysa getir, bakarım.' },
        { speaker: 'player', text: 'Pek konuşkan değilsin.' },
        { speaker: 'npc',    text: '(hafifçe gülümser) Az konuşurum. Ama dinlerim. İkisini aynı anda iyi yapamıyorum, ben de dinlemeyi seçtim.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'bjorn_t1_2',
      tier: 1,
      title: 'Çalışıyor Şimdi',
      lines: [
        { speaker: 'npc',    text: '(radyoyu hafifçe tıklatır, cızırtı sonra müzik gelir) ...İşte. Çalışıyor şimdi. Üç gündür uğraşıyordum. Küçük bir kabloymuş, hepsi o.' },
        { speaker: 'player', text: 'Sabırlı işmiş.' },
        { speaker: 'npc',    text: 'Bozuk şeyler bağırmaz, fısıldar. Dinlersen söylerler nesi var. Dün Søren\'in teknesini de onardım — tahtası çürümüştü, kimse fark etmemişti. Ben fark ettim.' },
      ],
      choices: [
        {
          text: 'Onarmayı seviyorsun.',
          lines: [{ speaker: 'npc', text: 'Atmak kolay. Onarmak... onarmak o şeye "hâlâ değerlisin" demek gibi. Bir radyo da, bir insan da. Ben atmayı sevmem.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
        {
          text: 'Søren zor adamdır, teşekkür etti mi?',
          lines: [{ speaker: 'npc', text: '(omuz silker, gülümser) Söylemedi. Ama ertesi sabah iskelede bana kahve bıraktı, bir şey demeden. Søren\'in teşekkürü öyledir. Anlıyorum onu.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'bjorn_t2_1',
      tier: 2,
      title: 'Abim Köprü Kurar',
      lines: [
        { speaker: 'npc',    text: 'Ağabeyimi tanıyor musun? Bruno. Şehrin köprüsünü o yaptı. Dalgakıranı, eski duvarı... iskeleti hep onun eseri.' },
        { speaker: 'player', text: 'Sen de inşaatçı mısın?' },
        { speaker: 'npc',    text: 'Hayır. O büyük şeyler kurar — köprüler, binalar. Ben küçük şeyleri onarırım. Radyolar, saatler. (sessizlik) Yeter bana. Gerçekten yeter. Çoğunlukla.' },
        { speaker: 'player', text: '"Çoğunlukla" mı?' },
        { speaker: 'npc',    text: '...Bazen "Bruno\'nun kardeşi" olmaktan yoruluyorum. İsmim var benim de. Ama bunu yüksek sesle söylemek nankörlük gibi geliyor. Abim iyi adam. Sadece gölgesi büyük.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'bjorn_t2_2',
      tier: 2,
      title: 'Görülmek',
      lines: [
        { speaker: 'npc',    text: 'Garip bir şey söyleyeceğim. Bütün gün insanların kırık eşyalarını onarıyorum. Herkes eşyasına sevinip gidiyor. Bana bakan olmuyor pek.' },
        { speaker: 'player', text: 'Sen hep arka plandasın.' },
        { speaker: 'npc',    text: '(başını sallar, yavaş) Arka plan rahat. Kimse beklenti koymuyor. Ama bazen... bazen biri "Bjorn nasılsın" dese, eşyasını sormadan, tuhaf bir şey oluyor içimde.' },
      ],
      choices: [
        {
          text: 'Bjorn, sen nasılsın?',
          lines: [{ speaker: 'npc', text: '(uzun bir sessizlik, eli aletin üstünde durur) ...Kimse bunu sormamıştı. Böyle, durup. (boğazını temizler) İyiyim. Şimdi, gerçekten iyiyim. Teşekkür ederim. Küçük bir soru ama... bana büyük geldi.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Ağabeyin köprü kurar, sen kalpleri onarıyorsun.',
          lines: [{ speaker: 'npc', text: '(şaşırır, yüzü kızarır) Öyle düşünmemiştim hiç. Belki. Çocukken Bruno\'yla harç karıştırırdık babamın yanında. O duvarı sevdi, ben aletleri. İkimiz de bir şey tutuyoruz ayakta — sadece farklı boyutta.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'bjorn_t3_1',
      tier: 3,
      title: 'Yanında Dururum',
      lines: [
        { speaker: 'npc',    text: '(elindeki bezi bırakır, ellerini pantolonuna siler, sana bakar) Sana bir şey diyeceğim. Uzun zamandır prova ediyorum, ama kelimeler benim işim değil. O yüzden... kısa olacak.' },
        { speaker: 'player', text: 'Acele etme.' },
        { speaker: 'npc',    text: 'Sen geldiğinde — fark ettim ki — sende tamir edecek bir şey aramadım. İlk kez. Herkese bakınca "şunu onarabilirim" derim. Sana baktığımda sadece... baktım. Bir şey düzeltmek istemedim. Olduğun gibi yetiyordun.' },
        { speaker: 'player', text: 'Bjorn...' },
        { speaker: 'npc',    text: 'Çok laf bilmem, biliyorsun. Şiir yazamam, güzel konuşamam. Ama şunu söyleyebilirim: yanında dururum. Hep. Bir şey kırılırsa onarırım, kırılmazsa da yanında olurum öylece. Bana büyük sözler gelmiyor ama bu... bu benim en sağlam sözüm. Tuttuğumu hiç bırakmadım.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── KAI (romantizm) ─────────────────────────────────────────────────────────

const kai: NPCDef = {
  id: 'kai',
  name: 'Kai',
  role: 'Yüzme Hocası',
  philosophy: 'Romantizm adayı — Kibirli altın oğlan: çalımlı, kendine hayran, hep kahraman pozunda; altında "kurtaran olmazsam değersizim" korkusu taşıyan yorgun biri.',
  emoji: '🏊',
  gender: 'male',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'kai_t1_1',
      tier: 1,
      title: 'Rekorumu Duydun mu?',
      lines: [
        { speaker: 'npc',    text: '(saçından su damlıyor, gülümsüyor) Naber! Yeni rekorumu duydun mu? Bütün kıyı konuşuyor. Bu sabah nehri karşıdan karşıya, on dakikanın altında.' },
        { speaker: 'player', text: 'Etkileyici sanırım.' },
        { speaker: 'npc',    text: '"Sanırım" mi? Dostum, bu şehirde benden iyi yüzen yok. Kai. Cankurtaranım — yani teknik olarak hayatın bana bağlı, suya girersen. (göz kırpar) Şaka. Yarı şaka.' },
        { speaker: 'player', text: 'Kendinden eminsin.' },
        { speaker: 'npc',    text: 'Emin olmak için bir sebebim var. Bak şu kollara — bunlar tesadüf değil, her sabah ilk ben girerim suya. Herkes izler. İzlenmek... fena değil, alışıyorsun.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'kai_t1_2',
      tier: 1,
      title: 'Dün Birini Kurtardım',
      lines: [
        { speaker: 'npc',    text: 'Dün bir çocuğu çıkardım sudan, akıntıya kapılmıştı. Bütün kıyı alkışladı. (saçını geri atar) Bu iş böyle — sen kahramansın, onlar bakar.' },
        { speaker: 'player', text: 'Çocuk iyi mi?' },
        { speaker: 'npc',    text: '(bir an duraklar, sonra toparlanır) İyi, iyi tabii. Annesi ağladı, bana sarıldı. O an için yaşıyorum işte. O an için.' },
      ],
      choices: [
        {
          text: 'Sen sormadan çocuğu sordum, fark ettin mi?',
          lines: [{ speaker: 'npc', text: '(durur, gülümsemesi bir saniye kayar) ...Fark ettim. Çoğu insan önce "nasıl kurtardın, anlatsana" der. Sen çocuğu sordun. Tuhafsın. İyi anlamda. Galiba.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Yüzme öğrenmek isterdim.',
          lines: [{ speaker: 'npc', text: 'Doğru adrese geldin — benden iyi hoca yok, gerçekten yok. Pippa\'ya öğrettim, Tomas\'a öğrettim. Korkanı suyla barıştırırım. Gel bir sabah, ama erken — geç kalanı beklemem, akıntı beklemiyor çünkü.' }],
          ideaSeed: 'kaos',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'kai_t2_1',
      tier: 2,
      title: 'Kurtaramazsam Kimim?',
      lines: [
        { speaker: 'npc',    text: '(kıyıda oturmuş, bu kez kalabalık yok) Sana bir şey soracağım. Garip gelebilir.' },
        { speaker: 'player', text: 'Sor.' },
        { speaker: 'npc',    text: 'Diyelim ki bir gün kolum kırıldı, ya da yaşlandım, ya da... birini çıkaramadım sudan. O zaman ben kimim? "Kurtaran Kai" gitti mi, geriye ne kalıyor?' },
        { speaker: 'player', text: 'İnsan kalır.' },
        { speaker: 'npc',    text: '(acı bir gülüş) "İnsan." Yeterli mi o? Herkes beni o kollarla, o rekorlarla tanıyor. Bir kez kurtaramadığım birini düşünüyorum geceleri — daha olmadı, ama olacak. Ve o gün aynada kimi göreceğimi bilmiyorum.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'kai_t2_2',
      tier: 2,
      title: 'Sürekli Gülümsemek',
      lines: [
        { speaker: 'npc',    text: 'Bir itiraf: sürekli gülümsemek yorucu. Bilmezsin. Kıyıya çıktığım an "Kai geldi!" — gülümsemem lazım, güçlü görünmem lazım, herkes öyle bekliyor.' },
        { speaker: 'player', text: 'Hiç bırakamaz mısın?' },
        { speaker: 'npc',    text: 'Bıraksam ne olur? "Kai bugün kötü" derler, hayal kırıklığı. Kahramanın kötü günü olmaz, olmamalı. (omuz silker) Maske ağırlaşıyor ama, her yıl biraz daha.' },
      ],
      choices: [
        {
          text: 'Benim yanımda gülümsemek zorunda değilsin.',
          lines: [{ speaker: 'npc', text: '(uzun bir sessizlik, gülümsemesi gerçekten düşer — ve daha genç, daha yorgun görünür) ...Bunu kimse söylemedi. Herkes Kai\'nin gülümsemesini ister. Sen "gülümseme" diyorsun. Tuhaf bir rahatlık bu. Sevdim. Korktum da.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Yorgunsan dinlen, kıyı seni bekler.',
          lines: [{ speaker: 'npc', text: 'Dinlenmeyi bilmiyorum ki. Durursam yetişemeyeceğim sanıyorum — neye, bilmiyorum. Babam da böyleydi, hep koştu, hiç varmadı bir yere. Ona benzemekten korkuyorum, ama tıpkı o oluyorum.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'kai_t3_1',
      tier: 3,
      title: 'Beni Sudan Çıkar',
      lines: [
        { speaker: 'npc',    text: '(seni kıyıya çağırır, sesi alçak, çalımı yok) Kimsenin olmadığı bir saatte çağırdım seni, bilerek. Çünkü söyleyeceğim şeyi kalabalıkta söyleyemem.' },
        { speaker: 'player', text: 'Dinliyorum.' },
        { speaker: 'npc',    text: 'Hayatım boyunca ben kurtardım. Herkesi sudan ben çıkardım. Güçlü olan, gülümseyen, hep orada olan ben. (sana bakar) Ama yoruldum. Ve fark ettim ki... bir kez de birinin beni sudan çıkarmasını istiyorum. Boğuluyorum bazen, kimse görmüyor — çünkü cankurtaranın boğulması akıllara gelmiyor.' },
        { speaker: 'player', text: 'Ben görüyorum.' },
        { speaker: 'npc',    text: 'Biliyorum. O yüzden buradasın. (ilk kez savunmasız) Senin yanında numara yapmama gerek yok. Kasları, rekorları, gülümsemeyi bırakabiliyorum — ve sen yine de gitmiyorsun. Sen... sen beni çıkarır mısın? Bir kez de ben tutunayım. Söz, ağır bir yük olmam. Sadece bırak elimi tutayım, kıyıya kadar.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── ELIAS (romantizm) ───────────────────────────────────────────────────────

const elias: NPCDef = {
  id: 'elias',
  name: 'Elias',
  role: 'Genç Doktor',
  philosophy: 'Romantizm adayı — Hevesli şifacı: uykusuz idealist, kendine bakmayı unutur; herkesi kurtaramayınca yıkılır, durmayı öğrenmeli.',
  emoji: '🩻',
  gender: 'male',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'elias_t1_1',
      tier: 1,
      title: 'Bir Saniye, Şunu Bitireyim',
      lines: [
        { speaker: 'npc',    text: '(reçete yazarken, hızlı) Bir saniye, şunu bitireyim — Bayan Holt\'un öksürüğü için, sabaha kalmasın. ...Tamam, buyur, dinliyorum, neyin var?' },
        { speaker: 'player', text: 'Bir şeyim yok, sadece tanışmak—' },
        { speaker: 'npc',    text: '(başını kaldırır, gülümser, gözaltları mor) Aa, hasta değilsin. Pardon, ben herkese hasta gözüyle bakıyorum, meslek hastalığı — kelimenin tam anlamıyla. Elias. Marta\'yla aynı muayenehanedeyim, o usta ben çırak.' },
        { speaker: 'player', text: 'Yorgun görünüyorsun.' },
        { speaker: 'npc',    text: 'Ben mi? İyiyim, iyiyim. Üç vizite daha var, sonra Hanna\'da bir çorba, sonra... şey, sonrasını düşünmedim aslında. Düşünmeye vakit olmuyor.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'elias_t1_2',
      tier: 1,
      title: 'Vaka Numarası',
      lines: [
        { speaker: 'npc',    text: 'Eskiden büyük şehirde, koca bir hastanedeydim. Parlak kariyer, herkes öyle derdi.' },
        { speaker: 'player', text: 'Neden bıraktın?' },
        { speaker: 'npc',    text: 'Çünkü orada hastaların adı yoktu. "Üç numaralı yatak", "saat ikideki vaka." Bir gün bir adamın adını soramadan... neyse. Buraya geldim. Burada herkesin adı var. Bayan Holt\'un, Marek\'in, hepsinin.' },
      ],
      choices: [
        {
          text: 'İnsanları numara değil, isim olarak görüyorsun.',
          lines: [{ speaker: 'npc', text: 'Başka türlüsü tıp değil, tamircilik olur. Marta öğretti bunu: "Tabloyu değil insanı tedavi et." (gülümser) Bazen fazla kaçırıyorum o dersi, biliyorum.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Doktorluğu neden seçtin?',
          lines: [{ speaker: 'npc', text: 'Çocukken annem hastaydı, uzun süre. Kimse ona düzgün bakmadı, hep aceleydiler. Ben... ben acele etmeyen biri olmak istedim. (kısa sessizlik) İşin tuhafı, şimdi en aceleci benim. Belki hâlâ o günkü çaresizlikten kaçıyorum.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'elias_t2_1',
      tier: 2,
      title: 'Herkesi Kurtaramıyorum',
      lines: [
        { speaker: 'npc',    text: '(bu kez oturmuş, elinde soğumuş çay) Dün bir hastayı kaybettik. Yaşlıydı, beklenen bir şeydi, Marta "elimizden geleni yaptık" dedi.' },
        { speaker: 'player', text: 'Ama sen kendini suçluyorsun.' },
        { speaker: 'npc',    text: 'Bir saat daha erken görseydim? Başka bir ilaç? Sürekli bunu düşünüyorum. Herkesi kurtarabileceğimi sanıyorum, sonra kurtaramayınca... bir parçam da onunla gidiyor sanki.' },
        { speaker: 'player', text: 'Bu seni tüketir.' },
        { speaker: 'npc',    text: 'Tüketiyor zaten. Marta diyor ki "Elias, sen tanrı değilsin, doktorsun — bu ikisi farklı." Aklım anlıyor. Ama gece üçte bir telefon çaldığında, kalbim hâlâ "hepsini kurtaracağım" diyor.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'elias_t2_2',
      tier: 2,
      title: 'Kendine Bakmıyorsun',
      lines: [
        { speaker: 'npc',    text: '(esner, fark etmeden) Pardon. İki gündür pek uyumadım. Doğum vardı, sonra Bay Adler\'in dikişleri...' },
        { speaker: 'player', text: 'Elias, en son ne zaman yemek yedin?' },
        { speaker: 'npc',    text: '(durur, gerçekten düşünür) ...Dün? Belki. Hanna bir tabak çorba bırakmıştı, soğudu galiba.' },
      ],
      choices: [
        {
          text: 'Herkese bakan adamın bakanı yok.',
          lines: [{ speaker: 'npc', text: '(uzun bir sessizlik) Bunu Marta da söylüyor, ama o ustam, mecbur söylüyor sanıyorum. Senden duyunca... başka. Belki gerçekten birinin bana "dur, ye, uyu" demesi gerekiyor. Kendime diyemiyorum çünkü.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Boş bir kova kimseye su veremez.',
          lines: [{ speaker: 'npc', text: '(acı acı güler) Tıbben kusursuz bir teşhis. Ben de hastalarıma aynısını söylerim — "kendine iyi bak." Kendime gelince unutuyorum. Doktorun en kötü hastası kendisidir, derler. Ben kanıtıyım.' }],
          ideaSeed: 'analiz',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'elias_t3_1',
      tier: 3,
      title: 'Bir Kez Dursam',
      lines: [
        { speaker: 'npc',    text: '(muayenehane kapalı, ilk kez aceleci değil, sana bakıyor) Bak, sana bir şey itiraf edeceğim ve bunu söylerken bile içimden "vizite var mı" diye geçiyor — işte sorunum bu.' },
        { speaker: 'player', text: 'Acele etme. Vakit var.' },
        { speaker: 'npc',    text: '"Vakit var." (gözleri yaşarır) Bunu en son ne zaman duydum, bilmiyorum. Hep koşuyorum — bir sonraki hasta, bir sonraki kriz. Ama sen yanımdayken... ilk kez durmak istiyorum. Bir kez. Sadece nefes almak, koşmadan.' },
        { speaker: 'player', text: 'Sen de bakıma değersin, Elias.' },
        { speaker: 'npc',    text: 'Bunu kendime hiç söyleyemedim. Hep "başkaları önce" dedim. Ama sen bana bakıyorsun — hasta olduğum için değil, ben olduğum için. Ve fark ettim ki belki ben de bir insanım, sadece bir çift yorgun el değil. Seninle durabilirim sanıyorum. Bana durmayı öğretir misin? Çünkü tek başıma hiç beceremedim.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

// ─── MATTEO (romantizm) ──────────────────────────────────────────────────────

const matteo: NPCDef = {
  id: 'matteo',
  name: 'Matteo',
  role: 'Gastronomi Öğrencisi',
  philosophy: 'Romantizm adayı — Çapkın gönül adamı: herkesle flört eden, bağlanmaktan kaçan; altında gerçek bir bağ özler, reddedilmekten korkar.',
  emoji: '🍲',
  gender: 'male',
  tier2Threshold: 30,
  tier3Threshold: 70,
  dialogues: [
    // ─── T1 ───
    {
      id: 'matteo_t1_1',
      tier: 1,
      title: 'Aç mısın? Sorma, Otur',
      lines: [
        { speaker: 'npc',    text: '(tencereden başını kaldırır, kocaman gülümser) Aaa, yeni bir yüz! Aç mısın? Sorma, cevabı belli — herkes aç, sadece kabul etmiyor. Otur şuraya, sana bir şey çıkarayım.' },
        { speaker: 'player', text: 'Sen aşçı mısın?' },
        { speaker: 'npc',    text: 'Daha değil! Gastronomi okuyorum, Hanna\'nın mutfağında da çıraklık ediyorum — yani teorisi okulda, gerçeği burada. Matteo. (önüne bir tabak koyar) Bu, bugünkü ödevim sayılır. Ye, dürüst ol, ama çok da kırıcı olma — not ortalamam sana emanet şu an.' },
        { speaker: 'player', text: 'Henüz öğrencisin demek.' },
        { speaker: 'npc',    text: '(göz kırpar) Öğrenciyim ama tabağım diplomalı. Kâğıt parçası gelir gider; sofra konuşur.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 8,
    },
    {
      id: 'matteo_t1_2',
      tier: 1,
      title: 'Herkese Bir Tabak',
      lines: [
        { speaker: 'npc',    text: 'Bak şu hana — Marek köşede, Sigrid pencerede, Hanna tezgâhta. Hepsinin tabağını ezbere öğrendim. Sofra kurmak... insanları bir araya getiren tek dürüst şey bu. Okulda bunu öğretmiyorlar, asıl dersi burada alıyorum.' },
        { speaker: 'player', text: 'Yemek senin için ne ifade ediyor?' },
        { speaker: 'npc',    text: 'Sevgi, ama söylemesi kolay olanı. "Seni seviyorum" demek zor; bir tabak sıcak çorba koymak kolay. İkisi de aynı şeyi söyler, biri daha az korkutucu.' },
      ],
      choices: [
        {
          text: 'Yemekle mi seviyorsun, çünkü kelimeler zor?',
          lines: [{ speaker: 'npc', text: '(bir an durur, kepçe havada) ...Vay. Çoğu insan tabağı alır, teşekkür eder, gider. Sen kepçenin altına baktın. Tehlikelisin sen. (toparlanır, güler) Ye hadi, soğuyor.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Neden gastronomi?',
          lines: [{ speaker: 'npc', text: 'Anneannemin mutfağı yüzünden. Küçükken tabureye çıkar, onu izlerdim — eli hamurda, hikâye anlatırdı. O gidince tarifleri kaldı bana. Okula yazıldım ki onları kaybetmeyeyim, üstüne yenilerini koyayım. Her tarif bir hatıra; ben hatıra biriktiren bir öğrenciyim aslında.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 3,
    },
    // ─── T2 ───
    {
      id: 'matteo_t2_1',
      tier: 2,
      title: 'Aynı Kişi',
      lines: [
        { speaker: 'npc',    text: '(servis bitmiş, han boşalmış, sandalyeleri kaldırıyor) Garip bir saat bu. Herkes doydu, güldü, gitti. Mutfak susunca... bir tuhaf oluyor.' },
        { speaker: 'player', text: 'Yalnız mı hissediyorsun?' },
        { speaker: 'npc',    text: '(dürüst bir an) Bütün gün yüz kişiye sofra kurarım. Ama akşam, kendi tabağımı tek başıma yerim, ödev kitabı önümde. Biliyor musun hayalim ne? Çok basit, güleceksin — her akşam soframda aynı kişinin olması. Sadece bir kişi. Her gece aynı.' },
        { speaker: 'player', text: 'Bu neden bu kadar zor?' },
        { speaker: 'npc',    text: 'Çünkü ben herkese gülümserim, kimseye "kal" demem. Gülümsemek güvenli. "Kal" demek... "kal" dersen, gidebilirler. O yüzden hiç demem.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 10,
    },
    {
      id: 'matteo_t2_2',
      tier: 2,
      title: 'Reddedilmek',
      lines: [
        { speaker: 'npc',    text: 'İtiraf edeyim — bana "çapkın" derler. Doğru sayılır. Herkesle flört ederim, kimseyle kalmam.' },
        { speaker: 'player', text: 'Neden?' },
        { speaker: 'npc',    text: '(kepçeyi bırakır, sesi alçalır) Çünkü flört oyundur, kaybeden olmaz. Ama gerçekten birini istersen, "hayır" duyabilirsin. Yüz kişiye gülümsemek, bir kişiden "hayır" duymaktan kolay.' },
      ],
      choices: [
        {
          text: 'Risk almazsan o kişiyi de hiç bulamazsın.',
          lines: [{ speaker: 'npc', text: 'Biliyorum. Aklım biliyor. Ama geçen yıl birine her şeyimi açtım — sofra kurdum, kalbimi koydum ortaya. Gitti. O günden beri tabağı veriyorum, kalbi saklıyorum.' }],
          ideaSeed: 'sosyallik',
          relationshipBonus: 5,
        },
        {
          text: 'Aldo amca ne der buna?',
          lines: [{ speaker: 'npc', text: '(güler) Aldo mu? "Matteo, fırın da kalp de sıcakken paylaşılır, soğuyunca işe yaramaz," der. Rosa da aynısını yapıyor zaten — o güneş gibi, korkmadan seviyor. Onlara bakıp utanıyorum bazen. Ben hâlâ kepçenin arkasına saklanıyorum.' }],
          ideaSeed: 'nostalji',
          relationshipBonus: 5,
        },
      ],
      relationshipBonus: 10,
    },
    // ─── T3 (flört) ───
    {
      id: 'matteo_t3_1',
      tier: 3,
      title: 'Soframda Sen',
      lines: [
        { speaker: 'npc',    text: '(iki tabak hazırlamış, ikisi de özenli, masaya koyar — biri senin karşına) Bu akşam han kapalı, ödevim de bitti. Kimse yok. Sadece... ben iki kişilik pişirdim. Alışkanlık değil. Bilerek.' },
        { speaker: 'player', text: 'İki kişilik mi?' },
        { speaker: 'npc',    text: '(oturur, ilk kez gülümseme bir maske değil) Hani "her akşam soframda aynı kişi" demiştim ya. O kişi sensin. Anladım. Aylardır farkındayım ama söylemeye korktum — çünkü söylersem, gidebilirsin, ve ben o "hayır"ı kaldıramam sandım.' },
        { speaker: 'player', text: 'Ya gitmezsem?' },
        { speaker: 'npc',    text: '(gözleri parlar, sesi titrer) O zaman... o zaman dünyanın en şanslı çırağı olurum. Bak, sana laf cambazlığı yapmayacağım, flört etmeyeceğim. Düz söylüyorum, hayatımda ilk kez: kal. Her akşam bu sofrada, karşımda. Daha usta bile değilim, çok şey öğreneceğim — ama tabağını ömür boyu ben kurarım. Sadece... gitme. Lütfen. İşte, söyledim. Kepçeyi bıraktım.' },
      ],
      ideaSeed: 'sosyallik',
      relationshipBonus: 15,
    },
  ],
}

export const NPC_DEFS: Record<string, NPCDef> = {
  marcus,
  remy,
  theo,
  bruno,
  magnus,
  marta,
  clara,
  aldo,
  yevgeni,
  soren,
  rex,
  vivian,
  elise,
  daniel,
  nadia,
  cassian,
  rosa,
  iris,
  sigrid,
  liv,
  bjorn,
  kai,
  elias,
  matteo,
}
