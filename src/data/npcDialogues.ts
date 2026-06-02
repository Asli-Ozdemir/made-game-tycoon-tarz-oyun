// src/data/npcDialogues.ts

export type IdeaSeedType = 'nostalji' | 'hikaye' | 'kaos' | 'zaman_yonetimi' | 'analiz'

export const IDEA_SEED_META: Record<IdeaSeedType, { label: string; color: string; emoji: string }> = {
  nostalji:       { label: 'Nostalji',       color: '#a78bfa', emoji: '🌙' },
  hikaye:         { label: 'Hikaye',          color: '#60a5fa', emoji: '📖' },
  kaos:           { label: 'Kaos',            color: '#f87171', emoji: '🌪️' },
  zaman_yonetimi: { label: 'Zaman Yönetimi',  color: '#34d399', emoji: '⏳' },
  analiz:         { label: 'Analiz',          color: '#fbbf24', emoji: '🔍' },
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

export interface NPCDef {
  id: 'marcus' | 'remy' | 'theo' | 'bruno' | 'magnus' | 'yevgeni' | 'marta' | 'clara' | 'aldo' | 'rex' | 'vivian' | 'soren'
  name: string
  role: string
  philosophy: string
  emoji: string
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
        { speaker: 'npc',    text: 'Bu limanın, evet. Søren. Sabah üç gemi geç yanaştı, üçü de rüzgârı suçladı. Rüzgâr suçlanmaz; rüzgâr sadece eser.' },
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
          lines: [{ speaker: 'npc', text: 'Her şey sadece bir şeydir, ta ki birine ne anlam verene kadar. Anlamı ben koyarım, deniz değil. İşin zor yanı da bu — kimse senin yerine koymaz.' }],
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
        { speaker: 'npc',    text: 'Hayır. Dümeni tutan da bendim. Sadece kabul etmiyordum, çünkü kabul etmek sorumluluk demek. "Mecbur kaldım" demek, dümeni denize bırakıp suçu suya atmaktır.' },
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
}
