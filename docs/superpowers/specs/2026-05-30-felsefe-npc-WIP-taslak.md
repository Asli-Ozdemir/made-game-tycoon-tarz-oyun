# Felsefe NPC Sistemi — ÇALIŞMA TASLAĞI (WIP, brainstorming devam ediyor)

> ⚠️ **Bu final spec DEĞİL.** Brainstorming sürerken kaybolmamak için ara kayıt. Final spec onaylanınca `2026-05-30-felsefe-npc-...-design.md` olarak yazılacak.

**Durum:** Sistem tasarımı + karakter İncili büyük ölçüde hazır. Kalan: **daha çok sıradan NPC** (işsizler, işi olanlar, başta tanışılan genç yazılımcılar) eklenecek. ~06:00'da devam.

---

## Dekompozisyon (üç katman)

- **Spec A (bu) — NPC etkileşim sistemi + felsefe/sıradan NPC diyalogları.** Servis yok.
- **Spec B, C… (sonra) — gerçek servisler:** Avukat (Kant, sözleşme/IP), Yatırımcı (Fayda, fon/ROI), Arcade (Kirenaik, ilham/yaratıcılık), [Fırıncı/Sahaf servisleri ops.]. Her biri NPC sistemine binen ayrı mekanik + spec.

## Sistem Tasarımı (Spec A) — onaylı kararlar

- **Mod:** Keşif modunda; masaya oturunca tycoon (mevcut çift mod).
- **NPC'ler sabit** noktalarda (gezme ileri faza). Yaklaş + `E`/Space → konuş.
- **Günlük değişen replik:** `dayIndex = weekNumber*7 + dayOfWeek` → havuzdan seç.
- **Kalp/yakınlık sistemi** (hafif): her NPC'yle konuştukça artar. **3 diyalog katmanı:**
  - **T1** yüzeysel/günlük flavor · **T2** kişisel (arka plan açılır) · **T3** yüksek kalp.
  - **Felsefe NPC'leri T3:** oyuncunun *taşıdığı yük/peşindeki güce* dair **isimsiz** felsefi öğüt (Crane adını anmazlar; onu sadece namıyla bilirler).
  - **Sıradan NPC'ler öğüt vermez:** kendi dertlerini anlatır, dostça konuşur; **karşı cins → flörtöz** (oyuncu cinsiyeti bağımlılığı — teyit edilecek).
- **Mektuplar:** max kalpte NPC'nin **imza mektubu** ayrı bir **"Mektuplar" kutusuna** düşer (NewsFeed'den ayrı). Postacı (sıradan NPC) meta olarak getirir.
- **Bileşenler:** `npcStore`, `src/data/npcs.ts`, `NpcDialog.tsx`, `Mektuplar` inbox; `WorldScene` NPC çizimi + yakınlık; `Game.ts` E tuşu; `App.tsx` render. Cutscene sistemine dokunmaz.
- **İsimler:** İngilizce/Avrupai.

## Tema bağı
NPC ağı, oyuncunun asıl sorusuna (Crane / nehir / kendini aşma) **çok sesli koro**: her felsefe Crane'e/9mücadeleye farklı bakar. 4C finalinin (Satın Al/Yok Et = canavarlaş · Affet/Birleş = aş) ahlaki aynasını besler.

**Üç su felsefesi:** Crane = akıntıya bırak (güç için → Sartre'a göre kötü niyet) · Theo = akışla uyum (wu wei) · Søren = kendi rotanı çiz (özgürlük).

---

## KARAKTER İNCİLİ (yazıldı)

### Felsefe NPC'leri

**📚 Marcus Thorne — Sahaf — Stoacılık**
Çekirdek: tek iyi erdem; kontrolüne odaklan (Epiktetos ikilemi), yargı senin; apatheia; memento mori. Arka plan: eski ünlü tasarımcı, çöküş+ihanet sonrası sadeleşmiş.
- T1: "Övgü de yergi de rüzgâr. Sen kayanı sağlam tut."
- T1: "Satışlar elinde değildi. Yargın, çaban senindi; onları koru, gerisini bırak."
- T2: "Ben de zirvedeydim. Bir çöküş, bir ihanet... Kırılmadım, sadeleştim."
- T3: "Şu taşıdığın yük ne iyidir ne kötü. Hiçbir şey, üzerine anlam yüklenmedikçe iyi ya da kötü değildir — sadece bir deneyim. Yargıyı sen koyuyorsun, geri de alabilirsin."
- T3: "Peşindekinden nefret etmek, zincirini kendi boynuna takmaktır. Öfke seni yakar, onu değil."
- T3: "Onu düşman say, sana hükmeder. Bir hava durumu say, geçer gider."

**🪶 Theo Vance — Balıkçı — Taoizm (wu wei)** *(Crane'in zıttı)*
Çekirdek: akışla uyumlu eylem, zorlamama (wu wei), ziran; su yumuşaktır ama dağı deler; teslimiyet değil ustalık. Arka plan: bir megakurumun zirvesinde**ken kendi isteğiyle** çıktı.
- T1: "Didinme. Nehrin nereye gittiğini dinle, sonra bırak taşısın."
- T1: "En yumuşak şey en sertini yener. Su zorlamaz, yine de dağı deler."
- T2: "Bir kulede oturdum, zirvede. Bir gün kalemi bıraktım, çıktım. Sadece aktım."
- T3: "Seni sıkıştıran o güce kürekle karşılık verme. Su zorlamaz ama dağı deler — yumuşaklıkla aş."

**🌒 Magnus Hale — Yıkık efsane (dev) — Nietzsche**
Çekirdek: ahlakın ötesi, sürü/ressentiment, güç istenci, kendini aşma (Übermensch), bengi dönüş/amor fati, uçurum (BGE §146). Arka plan: devrimci bir efsaneydi, aynı kalabalık onu yaktı.
- T1: "İyi oyun, kötü oyun... bu etiketleri kim koydu? Sürü. Kendi değerini döv."
- T1: "Çoğu beğenilmek için yapıyor. Sen var olmak için mi yapıyorsun?"
- T2: "Bir oyun yaptım, kuralları yaktı. 'Efsane' dediler, sonra aynı ağız beni yaktı. Yükseklik düşmekten korkanlar içindir."
- T3 (imza): "Canavarlarla dövüşen, kendi canavara dönüşmesin. Uçuruma uzun bakarsan, uçurum da sana bakar."
- T3: "Onu değil, kendini aş. Düşmanı geçmek kolay; kendini geçmek marifet."
- T3: "Bu acıyı sonsuza dek tekrar yaşamaya razı mısın? Razıysan — özgürlük işte o."
- ✉️ Mektup: "...Canavarlarla dövüşen kendi canavara dönüşmesin. Uçuruma uzun bakarsan, uçurum da sana bakar. Geç yazdım belki, ya da tam vaktinde. — M."

**🎭 Remy Vail — İndie geliştirici (dev) — Absürdizm (Camus)**
Çekirdek: absürt (anlam ihtiyacı vs evrenin sessizliği), kaçış yok (fiziksel/felsefi intihar), isyan-özgürlük-tutku, "Sisifos'u mutlu hayal et." Arka plan: 10 oyun battı, 11.'ye başlıyor.
- T1: "On oyun çıkardım, kimse oynamadı. Yarın on birinciye başlıyorum. Saçma — gülmemin sebebi de bu."
- T1: "Evren cevap vermiyor; inadına bir oyun daha yapıyorum."
- T2: "İlk batışta bir hafta yataktan çıkmadım, onuncuda gülüyordum. Alışmıyorsun — isyan ediyorsun."
- T3: "Seni ezeni yenemeyebilirsin. Önemi yok. Ezilirken bile oyununu yapmaya devam et — asıl isyan bu."
- T3: "Zafer aramaktan vazgeç, o da kandırmaca. Sisifos kayayı tepede tutamaz; yine de iter, iterken mutludur."
- ✉️ Mektup: "...bugün yine bir oyunum battı, sana yazıyorum çünkü artık bunu kutluyorum. Kayayı ittik, geri yuvarlandı; yarın yine iteceğiz. Sisifos'u mutlu hayal et. — R."

**🕳️ Nina Vex — Tükenmiş geliştirici — Nihilizm** *(cazip boşluk / folyo)*
Çekirdek: nesnel anlam/değer/ahlak yok; absürdizm isyan eder, Nietzsche aşar — nihilizm durur. Sakin, yorgun, ürkütücü huzurlu. Arka plan: inandığı her şeyin tabloya dönüşmesini izledi, inanmayı bıraktı.
- T1: "Yeni oyun mu? Çıkar, satar ya da satmaz, unutulur. Her şey gibi."
- T1: "İyi iş, kötü iş... fark eder mi? Sonunda hepsi aynı sessizlik."
- T2: "On yıl inandım, hepsi tabloya döndü. İnanmayı bıraktım — daha hafifim."
- T3 (cazip): "O güçle niye uğraşıyorsun? Yensen de yenilsen de aynı hiçliğe akıyor. Bırak gitsin."
- T3 (tehlikeli): "Madem hiçbir şey önemli değil, istediğini yapabilirsin. Acımasız ol ya da iyi — fark yok."
- ✉️ Mektup: "...Hâlâ savaşıyorsun. Bir gün duracaksın; herkes durur. Durduğunda dediklerim kötü değil, sadece sessiz gelecek. — N."
- Bağ: "acımasız ol, fark yok" → Crane yoluna/pes etmeye iter; diğerleri ona karşı konuşur.

**🔧 Bruno Adler — Mühendis — Erdem Etiği (Aristoteles)**
Çekirdek: eudaimonia, erdem alışkanlıkla kurulur ("mükemmellik bir eylem değil alışkanlıktır"), altın orta, phronesis. Arka plan: "kirişi incelt" denince reddetti, atıldı; köprü hâlâ ayakta.
- T1: "Köprü bir günde çökmez, bir günde yükselmez. Her gün bir perçin. Karakter de öyle."
- T1: "Mükemmellik bir eylem değil, alışkanlıktır."
- T2: "'Kirişi incelt, kimse anlamaz' dedi patron. İnceltmedim, attılar. Köprü hâlâ ayakta — ben de."
- T3: "İki yanlış var: korkup sinmek ya da öfkeyle onun gibi acımasızlaşmak. Erdem ortada — cesaret. Ölçüyü kaçırma."
- T3: "Onu yenmek değil, yenerken kim olduğunu korumak önemli."
- ✉️ Mektup: "...köprü ilk fırtınada değil, yıllarca taşıdığı küçük yüklerle sınanır. Her gün doğru olanı yap. Karakter perçin perçin kurulur. — B."
- Bağ: altın orta = 4C finali (aşırılık=canavarlaş, eksiklik=korkaklık).

**⚓ Søren Berg — Liman kaptanı — Varoluşçuluk (Sartre)**
Çekirdek: varoluş özden önce, radikal özgürlük ("özgür olmaya mahkûm"), sorumluluk, kötü niyet (mauvaise foi), otantiklik. Arka plan: babasının hazır rotasını reddedip kendi teknesini aldı.
- T1: "Denizde yol yoktur. Her dümen kırışı bir seçim."
- T1: "'Ben böyleyim' diyene gülerim. Her sabah yeniden seçersin kim olacağını."
- T2: "Babam donanmaya yazdırmıştı, rütbe hazırdı. Çantamı alıp kendi teknemi aldım. O korku ilk kez bana aitti."
- T3: "Biri 'akıntı böyle, elimden gelmez' derse yalan söylüyor. Akıntı karar vermez, sen verirsin. 'Mecburdum' diyen seçimini saklıyordur."
- T3: "Bunu sen mi seçtin, yoksa 'mecbur kaldım' deyip mi yaptın? İlki özgür kılar, ikincisi köle."
- ✉️ Mektup: "...pusulayı kuzey çekmez, sen tutarsın. 'Mecbur kaldım' diyen dümeni bırakıp rüzgârı suçluyordur. Seçen sensin. — S."
- Bağ: Crane'in "doğanın kanunu" kaderciliğini çürütür; 4C seçimlerini özgür seçim olarak çerçeveler.

**⚖️ Clara Vogt — Avukat — Kant (Deontoloji)** *(servis: sözleşme/IP, sonra)*
Çekirdek: kategorik buyruk (evrenselleştirilebilirlik + insanı amaç gör, asla yalnızca araç), ödev/iyi niyet, onur vs fiyat, söz tutma, yalan asla. Arka plan: küçük geliştiricinin hakkını "gömmesi" istenince firmadan ayrıldı.
- T1: "Sözleşme kâğıt değil, verilmiş sözdür. Sözünü tutmayan kendi sözünü değersizleştirir."
- T1: "Herkes senin yaptığını yapsa dünya yaşanır mı? Hayırsa yapma."
- T2: "Küçük bir geliştiricinin hakkını gömmemi istediler, 'iş böyle' dediler. Dosyayı bıraktım."
- T3: "Onu yenmek için onun yöntemini kullanma. İnsanları basamak yaparsan, kazandığında elinde sadece basamak kalır."
- T3: "Bazı zaferlerin bedeli onurundur. O parayı ödeme."
- ✉️ Mektup: "...İnsanın fiyatı değil onuru vardır. Bir kişiyi —rakibini, çalışanını, kendini— araç yerine koyma. İmzanı, sözünü, kendini ucuza verme. — C."
- Bağ: Crane'in "basamaktı, üstüne bastım"ının doğrudan çürütülmesi. Clara (Kant) ↔ Vivian (Fayda) merkez tartışma.

**🍞 Aldo Bianchi — Fırıncı — Epikürcülük**
Çekirdek: ataraxia+aponia (aşırılık değil), doğal-zorunlu arzular (ekmek, dostluk) vs boş arzular (şan/güç/servet→kaygı), dostluk en büyük haz, ölüm korkusu yok, gizli yaşa. Arka plan: meşhur lokantası vardı, yıldız peşinde mutsuzdu; bıraktı, fırın açtı, mutlu.
- T1: "Sıcak ekmek, biraz peynir, bir dost. Mutluluğun listesi bundan uzun değil."
- T1: "Aç mısın, canın mı sıkkın? İnsan çoğu şeyi açlıktan değil korkudan ister."
- T2: "Yıldız peşinde koştum, kazandım da, en tepedeyken en mutsuzdum. Bir sabah ekmek koktu — aradığım hep buymuş."
- T3: "İhtiyacın mı var, korkun mu konuşuyor? Şan, güç, intikam — dipsiz kuyu; içtikçe susarsın."
- T3: "Huzurunu onun terazisine koyma. Akşam sıcak ekmeğin, bir dostun olsun — yeter de artar."
- ✉️ Mektup: "...bir somun yolladım, sıcakken kes. Yıldızları topladım, hiçbiri karnımı doyurmadı. Asıl ziyafet sadedir. Huzurunu rehin verme. — A."
- Bağ: Crane'in boş arzularının panzehri. Aldo (Epikür, dingin) ↔ Rex (Kirenaik, anlık).

**🩺 Marta Reyes — Hemşire — Bakım Etiği**
Çekirdek: Gilligan/Noddings; ahlak ilişki/duyarlılık/empatide, somut kişi soyuttan önce, karşılıklı bağımlılık. Arka plan: crunch'tan çökenleri, ölüm döşeğindekileri gördü; rakamların ardındaki insanı bilir.
- T1: "Yüzün solgun. Son ne zaman uyudun? Oyun bekler, sen beklemezsin."
- T1: "Kuralı, rakamı bırak — karşımdaki insan nasıl, ben ona bakarım."
- T2: "Crunch'tan çökenlere 'kaynak' diyorlarmış. Ben titreyen ellerini tuttum. Tablo titremez, insan titrer."
- T3: "Sana kötülük eden de bir yerde kırılmış biri. Canavar sanırsan, dövüşürken sen de katılaşırsın. İnsan kal."
- T3: "Onu yenerken yanındakini kaybetme. İlişkini kazanmaya feda etme."
- ✉️ Mektup: "...kimsenin sormadığını ben sorarım: sen nasılsın? Gerçekten. Geceleri elini tutan biri yoksa o zafer üşütür. Kapım açık. — M."
- Bağ: Crane'in tablosunu insanlaştırır; Affet/Birleş + "ham iyi insanlar varmış"ın tohumu. Marta (bakım) ↔ Clara (adalet/Kant) = Gilligan↔Kohlberg.

**🕹️ Rex Calloway — Arcade sahibi — Kirenaik Hedonizm** *(servis: ilham/yaratıcılık, sonra)*
Çekirdek: anlık-bedensel-aktif haz (Aristippos), yalnız şu an gerçek, yoğunluk>süre, "sahibim ama esir değilim". Arka plan: sahnelerde parlayan yıldız, serveti yaşadı biriktirmedi, pişman değil.
- T1: "Geçmiş gitti, yarın belki gelmez. Elinde bir tek şu an var — endişeyle mi harcayacaksın?"
- T1: "Makinenin sesini duy! Düşünme, hisset."
- T2: "Kalabalık adımı bağırırdı. Serveti yaşadım, biriktirmedim. Bir saniye pişman değilim."
- T3: "Hayatını gelecek zafere rehin veriyorsun. Ya o gün gelmezse? Keyfini çıkararak yap ya da bırak."
- T3: "Onu yendiğin gün mutlu olacağını sanıyorsun — yanılıyorsun. Mutluluk ertelenmez."
- ✉️ Mektup: "...hep 'sonra' diyorsun. 'Sonra' diye bir yer yok. Bir akşam gel, bir oyun oyna, yaşadığını hatırla. — Rex"
- Bağ: Crane'in ertelenmiş hırsının panzehri; ama yumuşak cazibe (anlamsız kaçış riski).

**📈 Vivian Holt — Yatırımcı — Faydacılık** *(servis: fon/ROI, sonra)*
Çekirdek: sonuççu, en çok kişiye en çok mutluluk; Bentham (hesap) + Mill (nitelikli hazlar); amaç toplam artıdaysa aracı haklı çıkarır; tarafsızlık; azınlığı çoğunluğa feda riski. Arka plan: samimi sonuççu; bir stüdyoyu kapatıp beşini kurtardı, aynısını yine yapar.
- T1: "Duygu değil, toplam. Beşini sevindirip birini üzen karar doğrudur."
- T1: "İyi niyet yetmez, sonucu ölç."
- T2: "Bir stüdyoyu kapattım, beşini kurtarmak için. Kurucusu düşman oldu; yine yaparım, sayılar haklıydı."
- T3: "Onu yenmek toplamda değer mi yaratıyor, egonu mu doyuruyor? İlkse yap; ikinciyse pahalı hata."
- T3: "Amaç aracı haklı çıkarır — yeter ki toplam artıda olsun. Çoğu kendi acısını fazla tartar."
- ✉️ Mektup: "...her kararı teraziye koy; kazancın bir kefede, herkesin (rakibin dahil) kazancı öbüründe. Dürüst tart. — V. Holt"
- Bağ: Vivian (Fayda) ↔ Clara (Kant) merkez tartışma; Vivian ↔ Marta (toplam sayı vs somut kişi); Crane'e "saygın acımasızlık" yolu (Yok Et/Satın Al'a itiş).

### Sıradan NPC'ler (felsefesiz — dert/dostluk/flört)

**🌷 Greta Lund — Çiçekçi:** emekli öğretmen, oğlu başkentte pek aramıyor; sıcak, yalnız.
- T1: "Bahar geldi, laleler patladı. Al şu demeti, masana koy."
- T2: "Oğlum başkente gitti, pek aramıyor. Tezgâh sessiz oluyor bazen."
- T3: "Sen uğrayınca günüm güzelleşiyor. Torunum gibisin."

**🎶 Elise Moreau — Kafe müzisyeni (karşı cins → flört):**
- T1: "Yeni bir şarkı yazıyorum; içinde stüdyonun adı geçebilir."
- T2: "Çalarken hep kapıya bakıyorum — bugün geldin işte."
- T3 (flört): "Oyun mu yapıyorsun, büyü mü? Her uğradığında bir saatim nasıl uçuyor anlamıyorum."
- (Flört yönü oyuncu cinsiyetine göre; kadın oyuncuda muadil erkek NPC.)

---

## RESUME — kalınan yer (~06:00)
Eklenecek **sıradan NPC'ler:**
- İşi olmayan dümdüz kasaba sakinleri (birkaç).
- İşi olan sıradanlar (postacı [mektupları getirir], barmen/hancı, vb.).
- **Başta tanışacağımız birkaç genç yazılımcı** (oyunun açılışında tanışılan).
- "Baya NPC" — kalabalık, yaşayan kasaba hissi.
Sonra: kadro kapanınca **final spec** + writing-plans.
