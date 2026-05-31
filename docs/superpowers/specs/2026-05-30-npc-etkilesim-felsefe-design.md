# NPC Etkileşim & Felsefe Sistemi (Spec A): Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam (Spec A):** Keşif modunda dünyadaki NPC'lerle konuşma sistemi + başlangıç karakter kadrosu (felsefe + sıradan + romantizm + kasabalı). Diyalog motoru **Yarn (YarnBound)**. Servisler ve romantizm-arc *mekaniği* kapsam dışı (kendi spec'leri).
**Önceki taslak:** Bu doküman `2026-05-30-felsefe-npc-WIP-taslak.md`'yi **birleştirip yerine geçer** (o silinir).

---

## Vizyon

Stardew tarzı, konuşulabilir NPC'lerle dolu bir kasaba. NPC'lerin **bazıları** bir etik felsefeyi *temsil eder* (müze değil, dokuda); çoğu sıradan kasabalıdır (dert/dostluk/flört). Kalp arttıkça diyalog derinleşir; felsefe NPC'leri yüksek kalpte oyuncunun asıl mücadelesine (Crane / nehir / kendini aşma) **isim vermeden** kendi felsefesinden ayna tutar. NPC ağı, oyunun ana temasına **çok sesli bir koro**dur ve 4C finalinin ahlaki aynasını besler.

## Dekompozisyon

- **Spec A (bu):** NPC konuşma sistemi + diyalog içeriği (felsefe/sıradan/romantizm/kasabalı). Yarn altyapısı. **Servis yok, romantizm-arc mekaniği yok.**
- **Sonraki spec'ler:** Servis NPC'leri — Avukat (Kant, sözleşme/IP), Yatırımcı (Fayda, fon/ROI), Arcade (Kirenaik, ilham). Her biri kendi mekaniği + spec.
- **İleride:** Romantizm arc mekaniği (flört → buluşma → ilişki), gezen NPC AI, hediye sistemi.

---

## Teknik: Yarn (YarnBound)

**Karar:** Diyaloglar **Yarn dili** (`.yarn` betikleri) ile yazılır; çalıştırıcı **YarnBound** (npm `yarn-bound`, `bondage.js` üstüne, Yarn 2.0). "Yarn Spinner" resmî runtime'ı Unity/C# olduğundan kullanılmaz; YarnBound saf JS olduğu için Electron renderer + Vite + React'te sorunsuz koşar.

**Neden:** Dallanma, koşul (`<<if $heart >= 6>>`), değişken, seçim, romance flag'leri yerleşik gelir; içerik **kodda değil `.yarn` dosyasında** yazılır (yazar dostu). Büyüyen ilişki/romantizm/aile-bağ ağı için ölçeklenir.

**Entegrasyon:**
- `.yarn` dosyaları Vite `?raw` ile metin olarak import edilir, YarnBound'a verilir.
- Değişkenler (kalp, romance flag, dünya durumu) **bizim store'da** tutulur; YarnBound'a variable storage olarak bağlanır. Yarn `<<if>>` bu değişkenleri okur.
- UI (`NpcDialog`) YarnBound'ın döndürdüğü satır/seçimleri render eder; cutscene sisteminden ayrı, daha basit kanal.

**Risk & de-risk:** YarnBound topluluk kütüphanesi (gerekirse vendor'lanıp içeri alınabilir — küçük runtime). **Planın ilk görevi bir spike:** `yarn-bound` kur, tek bir `.yarn` dosyasını (kalp koşullu) `NpcDialog`'da çalıştır, `electron-vite build`'de doğrula. Yeşilse tüm içerik Yarn'a kurulur.

---

## Sistem Tasarımı (Spec A)

- **Mod:** Keşif modunda aktif; masaya oturunca tycoon (mevcut çift mod, `worldStore`).
- **NPC'ler sabit** noktalarda (gezme ileri faza). Placeholder sprite (player gibi). Oyuncu ~1 tile yaklaşınca Pixi'de "E ile konuş" ipucu; `E`/Space → konuşma.
- **Konuşma:** `npcStore.startTalk(id)` → `dayTimeStore.setIsPaused(true)` → `NpcDialog` Yarn düğümünü oynatır → bitince pause kalkar.
- **Günlük değişim:** Yarn düğümü `dayIndex = weekNumber*7 + dayOfWeek` ve `$heart` değişkenine göre dallanır (o günün/katmanın repliği).
- **Kalp/yakınlık:** Her NPC için `heart` (0..N), konuşunca (günde bir) artar. Store'da tutulur, Yarn'a `$heart_<npcId>` olarak verilir.
- **3 diyalog katmanı** (kalp eşikleriyle Yarn `<<if>>`):
  - **T1** yüzeysel/günlük flavor · **T2** kişisel (arka plan) · **T3** yüksek kalp.
  - **Felsefe NPC'leri T3:** oyuncunun *taşıdığı yük/peşindeki güce* dair **isimsiz** felsefi öğüt (Crane adını anmaz; onu namıyla bilir).
  - **Sıradan NPC'ler:** öğüt vermez — kendi dertlerini anlatır, dostça konuşur; **karşı cins → flörtöz**.
- **Mektuplar:** Max kalpte NPC'nin **imza mektubu** ayrı **"Mektuplar" kutusuna** düşer (NewsFeed'den ayrı). Postacı (Felix) meta olarak getirir.
- **Aile/bağ ağı:** NPC'ler birbirine bağlı (veri: `relations`), birbirini anar/söylenti taşır (Liesl).
- **Bağımlılık (teyit edilecek):** Flört "karşı cins"e göre → oyuncu cinsiyeti gerekir; karakter yaratmada yoksa eklenmeli (küçük) ya da her iki yönde adaylar konur.
- **İsimler:** İngilizce/Avrupai.

**Dokunulan/yeni dosyalar:** `src/store/npcStore.ts`, `src/data/npcs.ts` (NPC meta + `.yarn` düğüm eşlemesi), `src/dialogue/*.yarn`, `NpcDialog.tsx`, `MektupKutusu` (inbox) bileşeni + store, `WorldScene` (NPC çizimi + yakınlık), `Game.ts` (E tuşu), `App.tsx` (render). Cutscene sistemine dokunmaz.

## Tema Bağı

NPC ağı oyuncunun asıl sorusuna çok sesli yanıt: her felsefe Crane'e/mücadeleye farklı bakar; 4C finalini (Satın Al/Yok Et = canavarlaş · Affet/Birleş = aş) besler.
**Üç su felsefesi:** Crane = akıntıya bırak *(güç için → Sartre'a göre kötü niyet)* · Theo = akışla uyum *(wu wei)* · Søren = kendi rotanı çiz *(özgürlük)*.

---

## Karakter Kadrosu

> Felsefe NPC'leri tam (çekirdek + imza replik + mektup); **genişletilmiş arka planları aşağıdaki "Felsefe NPC'leri — Genişletilmiş Arka Planlar" bölümünde.** Sıradan/romantizm/kasabalı: replikler var, **arka planlar kısa stub — sonra birlikte genişletilecek (TODO).** Tüm replikler implementasyonda `.yarn`'a taşınır; aşağıdakiler kanonik kaynaktır.
>
> **Mekân:** Oyun küçük bir (sahil) şehirde geçer — "kasaba" değil. NPC'lerin bir kısmı bu şehirde doğup büyümüştür (kök salmış), bir kısmı dışarıdan gelmiştir; hepsi "yükseklerden düşmüş" değildir.

### Felsefe NPC'leri

**📚 Marcus Thorne — Sahaf — Stoacılık.** Çekirdek: tek iyi erdem; kontrolüne odaklan (Epiktetos), yargı senin; apatheia; memento mori. Arka plan: eski ünlü tasarımcı, çöküş+ihanetle sadeleşti.
- T1 "Övgü de yergi de rüzgâr. Sen kayanı sağlam tut." · T1 "Satışlar elinde değildi; yargın, çaban senindi."
- T2 "Zirvedeydim; bir çöküş, bir ihanet... Kırılmadım, sadeleştim."
- T3 "Hiçbir şey, üzerine anlam yüklenmedikçe iyi ya da kötü değildir — sadece bir deneyim. Yargıyı sen koyarsın, geri de alırsın." · T3 "Ondan nefret, zinciri kendi boynuna takmaktır; öfke seni yakar."
- ✉️ İmza: yargı/dinginlik üzerine kısa Stoacı mektup.

**🪶 Theo Vance — Balıkçı — Taoizm (wu wei)** *(Crane'in zıttı).* Çekirdek: akışla uyum, zorlamama, su yumuşaktır ama dağı deler — teslimiyet değil ustalık. Arka plan: bir megakurumun zirvesinden **kendi isteğiyle** çıktı.
- T1 "Didinme. Nehrin nereye gittiğini dinle, bırak taşısın." · T1 "En yumuşak, en sertini yener."
- T2 "Bir kulede oturdum; kalemi bıraktım, çıktım. Sadece aktım."
- T3 "Seni sıkıştıran güce kürekle değil suyla karşılık ver — yumuşaklıkla aş."
- ✉️ İmza: wu wei / su üzerine mektup.

**🌒 Magnus Hale — Yıkık efsane (dev) — Nietzsche.** Çekirdek: ahlakın ötesi, sürü/ressentiment, güç istenci, kendini aşma, bengi dönüş/amor fati, uçurum (BGE §146). Arka plan: devrimci efsaneydi, aynı kalabalık yaktı.
- T1 "İyi/kötü oyun — kim koydu? Sürü. Kendi değerini döv." · T1 "Beğenilmek için mi yapıyorsun, var olmak için mi?"
- T2 "Bir oyun yaptım, kuralları yaktı; sonra beni yaktılar. Yükseklik, düşmekten korkanlar içindir."
- T3 (imza) "Canavarlarla dövüşen, kendi canavara dönüşmesin. Uçuruma uzun bakarsan, uçurum da sana bakar." · T3 "Onu değil, kendini aş." · T3 "Bu acıyı sonsuza tekrar yaşamaya razı mısın? Razıysan özgürlük budur."
- ✉️ İmza mektubu: "...Canavarlarla dövüşen kendi canavara dönüşmesin. Uçuruma bakarsan uçurum da sana bakar. Geç yazdım belki, ya da tam vaktinde. — M."
- Bağ: uçurum öğüdü 4C ahlaki aynasını önceden haber verir.

**🎭 Remy Vail — İndie geliştirici (dev) — Absürdizm (Camus).** Çekirdek: absürt, kaçış yok, isyan-özgürlük-tutku, "Sisifos'u mutlu hayal et." Arka plan: 10 oyun battı, 11.'ye başlıyor.
- T1 "On oyun battı, yarın on birinciye başlıyorum. Saçma — gülmemin sebebi bu." · T1 "Evren cevap vermiyor; inadına bir oyun daha."
- T2 "Onuncu batışta artık gülüyordum. Alışmıyorsun — isyan ediyorsun."
- T3 "Yenemeyebilirsin, önemi yok; ezilirken bile oyununu yap — asıl isyan bu." · T3 "Zafer de kandırmaca; Sisifos iterken mutludur."
- ✉️ İmza: "...bugün yine bir oyunum battı, kutluyorum. Sisifos'u mutlu hayal et. — R."

**🕳️ Nina Vex — Tükenmiş dev — Nihilizm** *(cazip boşluk/folyo).* Çekirdek: anlam/değer yok; absürdizm isyan eder, Nietzsche aşar — nihilizm durur. Arka plan: inandığı her şeyin tabloya dönüşmesini izledi.
- T1 "Çıkar, satar ya da satmaz, unutulur. Her şey gibi." · T1 "İyi iş, kötü iş — sonunda aynı sessizlik."
- T2 "On yıl inandım, hepsi tabloya döndü. Bıraktım — daha hafifim."
- T3 (cazip) "Yensen de yenilsen de aynı hiçliğe akıyor; bırak gitsin." · T3 (tehlikeli) "Hiçbir şey önemli değilse, acımasız ol ya da iyi — fark yok."
- ✉️ İmza: "...Bir gün duracaksın; herkes durur. Dediklerim kötü değil, sessiz gelecek. — N."
- Bağ: Crane yoluna/pes etmeye iten cazibe; diğerleri ona karşı konuşur.

**🔧 Bruno Adler — Mühendis — Erdem Etiği (Aristoteles).** Çekirdek: eudaimonia, erdem alışkanlıkla kurulur, altın orta, phronesis. Arka plan: "kirişi incelt" denince reddetti, atıldı; köprü hâlâ ayakta.
- T1 "Köprü bir günde çökmez, bir günde yükselmez. Her gün bir perçin." · T1 "Mükemmellik eylem değil, alışkanlıktır."
- T2 "'Kirişi incelt' dediler; inceltmedim, attılar. Köprü hâlâ ayakta — ben de."
- T3 "İki yanlış: korkup sinmek ya da öfkeyle acımasızlaşmak. Erdem ortada — cesaret." · T3 "Yenerken kim olduğunu koru."
- ✉️ İmza: "...köprü yıllarca taşıdığı küçük yüklerle sınanır. Her gün doğru olanı yap. Karakter perçin perçin kurulur. — B."
- Bağ: altın orta = 4C finali (aşırılık=canavarlaş, eksiklik=korkaklık).

**⚓ Søren Berg — Liman kaptanı — Varoluşçuluk (Sartre).** Çekirdek: varoluş özden önce, radikal özgürlük, sorumluluk, kötü niyet, otantiklik. Arka plan: babasının hazır rotasını reddedip kendi teknesini aldı.
- T1 "Denizde yol yoktur; her dümen kırışı bir seçim." · T1 "'Ben böyleyim' diyene gülerim; her sabah yeniden seçersin."
- T2 "Rütbe hazırdı; çantamı alıp kendi teknemi aldım. O korku ilk kez bana aitti."
- T3 "'Akıntı böyle, elimden gelmez' diyen yalan söylüyor; akıntı karar vermez, sen verirsin." · T3 "Sen mi seçtin, 'mecbur kaldım' deyip mi yaptın? İlki özgür kılar."
- ✉️ İmza: "...pusulayı kuzey çekmez, sen tutarsın. Seçen sensin. — S."
- Bağ: Crane'in "doğanın kanunu" kaderciliğini çürütür; 4C seçimlerini özgür seçim olarak çerçeveler.

**⚖️ Clara Vogt — Avukat — Kant (Deontoloji)** *(servis NPC'si — sözleşme/IP, kendi spec'i).* Çekirdek: kategorik buyruk (evrenselleştirilebilirlik + insanı amaç gör, asla yalnızca araç), ödev, onur vs fiyat, söz tut, yalan asla. Arka plan: küçük geliştiricinin hakkını "gömmesi" istenince firmadan ayrıldı.
- T1 "Sözleşme kâğıt değil, verilmiş sözdür." · T1 "Herkes senin yaptığını yapsa dünya yaşanır mı? Hayırsa yapma."
- T2 "Bir geliştiricinin hakkını gömmemi istediler; dosyayı bıraktım."
- T3 "İnsanları basamak yaparsan, kazandığında elinde sadece basamak kalır." · T3 "Bazı zaferlerin bedeli onurundur; o parayı ödeme."
- ✉️ İmza: "...İnsanın fiyatı değil onuru vardır. Kimseyi araç yerine koyma. — C."
- Bağ: Crane'in "basamaktı, üstüne bastım"ının çürütülmesi. Clara (Kant) ↔ Vivian (Fayda) merkez tartışma.

**🍞 Aldo Bianchi — Fırıncı — Epikürcülük.** Çekirdek: ataraxia+aponia (aşırılık değil), doğal-zorunlu vs boş arzular (şan/güç→kaygı), dostluk en büyük haz, ölüm korkusu yok, gizli yaşa. Arka plan: meşhur lokantası vardı, yıldız peşinde mutsuzdu; bıraktı, fırın açtı, mutlu.
- T1 "Sıcak ekmek, peynir, bir dost — mutluluğun listesi bundan uzun değil." · T1 "İnsan çoğu şeyi açlıktan değil korkudan ister."
- T2 "Yıldızları topladım, en tepedeyken en mutsuzdum; bir sabah ekmek koktu, anladım."
- T3 "Şan, güç, intikam — dipsiz kuyu; içtikçe susarsın." · T3 "Huzurunu onun terazisine koyma."
- ✉️ İmza: "...bir somun yolladım, sıcakken kes. Asıl ziyafet sadedir; huzurunu rehin verme. — A."
- Bağ: Crane'in boş arzularının panzehri. Aldo (Epikür) ↔ Rex (Kirenaik).

**🩺 Marta Reyes — Hemşire — Bakım Etiği.** Çekirdek: Gilligan/Noddings; ahlak ilişki/duyarlılıkta, somut kişi soyuttan önce, karşılıklı bağımlılık. Arka plan: crunch'tan çökenleri, ölüm döşeğindekileri gördü.
- T1 "Yüzün solgun, son ne zaman uyudun?" · T1 "Kuralı, rakamı bırak — karşımdaki insan nasıl, ben ona bakarım."
- T2 "Çökenlere 'kaynak' diyorlarmış; ben titreyen ellerini tuttum. Tablo titremez, insan titrer."
- T3 "Sana kötülük eden de kırılmış biri; canavar sanırsan sen de katılaşırsın. İnsan kal." · T3 "Yenerken yanındakini kaybetme."
- ✉️ İmza: "...sen nasılsın? Gerçekten. Geceleri elini tutan biri yoksa o zafer üşütür. Kapım açık. — M."
- Bağ: Crane'in tablosunu insanlaştırır; Affet/Birleş + "ham iyi insanlar varmış"ın tohumu. Marta (bakım) ↔ Clara (adalet) = Gilligan↔Kohlberg.

**🕹️ Rex Calloway — Arcade sahibi — Kirenaik Hedonizm** *(servis NPC'si — ilham, kendi spec'i).* Çekirdek: anlık-bedensel-aktif haz (Aristippos), yalnız şu an gerçek, yoğunluk>süre. Arka plan: sahnelerde parlayan yıldız, serveti yaşadı biriktirmedi, pişman değil.
- T1 "Elinde bir tek şu an var — endişeyle mi harcayacaksın?" · T1 "Makinenin sesini duy! Düşünme, hisset."
- T2 "Serveti yaşadım, biriktirmedim, bir saniye pişman değilim."
- T3 "Hayatını gelecek zafere rehin verme; ya o gün gelmezse?" · T3 "Mutluluk ertelenmez — ya şimdi, ya hiç."
- ✉️ İmza: "...'sonra' diye bir yer yok. Bir akşam gel, yaşadığını hatırla. — Rex"
- Bağ: Crane'in ertelenmiş hırsının panzehri; yumuşak cazibe (anlamsız kaçış riski). Rex (Kirenaik) ↔ Aldo (Epikür).

**📈 Vivian Holt — Yatırımcı — Faydacılık** *(servis NPC'si — fon/ROI, kendi spec'i).* Çekirdek: sonuççu, en çok kişiye en çok mutluluk; Bentham+Mill; amaç toplam artıdaysa aracı haklı çıkarır; tarafsızlık; azınlığı feda riski. Arka plan: samimi sonuççu; bir stüdyoyu kapatıp beşini kurtardı.
- T1 "Duygu değil, toplam. Beşini sevindirip birini üzen karar doğrudur." · T1 "İyi niyet yetmez, sonucu ölç."
- T2 "Bir stüdyoyu kapattım, beşini kurtardım; kurucusu düşman oldu, yine yaparım."
- T3 "Onu yenmek toplamda değer mi, egonu mu doyuruyor?" · T3 "Amaç aracı haklı çıkarır — yeter ki toplam artıda olsun; çoğu kendi acısını fazla tartar."
- ✉️ İmza: "...her kararı teraziye koy; rakibin kazancı da öbür kefede. Dürüst tart. — V. Holt"
- Bağ: Vivian (Fayda) ↔ Clara (Kant) merkez tartışma; Vivian ↔ Marta (toplam vs somut kişi); Crane'e "saygın acımasızlık" yolu (Yok Et/Satın Al'a itiş).

### Felsefe NPC'leri — Genişletilmiş Arka Planlar

**📚 Marcus Thorne — Sahaf · Stoacılık.** Bir zamanlar şehrin parlayan adıydı; kurduğu stüdyo üst üste zirveye oynadı, dergiler onu "sektörün vicdanı" yazdı. Sonra aynı yıl piyasa çöktü ve en güvendiği ortağı — masasını paylaştığı dostu — batışın faturasını ona yıkıp kendi payını kurtardı. Her şeyini kaybetti: stüdyo, birikim, ad, o dostluk. İflas masasını toplarken devrilen rafların altında yıpranmış bir *Kendime Düşünceler* nüshası buldu; o gece "seni sarsan olaylar değil, olaylara dair yargın" satırında durdu. Çöküşü de ihaneti de geri alamazdı; yalnız nasıl karşılayacağı elindeydi. Kıyıda küçük bir sahaf açtı, üstündeki odada yaşıyor; az konuşur, denizi izler. Eski ortağı ara sıra başarısının gazete kupürlerini yollar; Marcus okur, kıpırdamadan rafa kaldırır — kin değil, pratik.
*Detay:* Tezgâhtaki yıpranmış *Kendime Düşünceler*, kenarına kurşunkalem notlar. *Tema:* oyuncuda kendi yol ayrımını görür — kırılmak ya da yeniden çerçevelemek.

**🪶 Theo Vance — Balıkçı · Taoizm (wu wei).** Bir kuledeki cam ofiste, koca bir ekibin başında zirveye varmıştı; köşe ofis, dev terfi bir imza uzaktaydı. Yıllarca akıntıya karşı kürek çekti, kazandıkça susadı. Bir sabah köprüden nehre baktı: su zorlamıyordu, yine de taşı oyup denize varıyordu. O gün kalemini bıraktı, terfiyi imzalamadı, sessizce çıktı — kimse kovmadı, aktı gitti. Şimdi şehrin kıyısında balık tutuyor, ağ örüyor, acelesi yok; tuttuğunu çoğu zaman geri salar. Eski hırs ara sıra bir dalga gibi kabarır, bırakır geçsin. *(Geçmişi genel bir "kule"; Crane'i şahsen tanımaz.)*
*Detay:* Suda taş sektirir, "en yumuşak en sertini yener" der. *Tema:* kürek çekmeyi bırakanın üçüncü yolu — Crane (sürüklen) ve oyuncu (akıntıya karşı kürek) arasında.

**🌒 Magnus Hale — Yıkık efsane · Nietzsche.** Bu küçük şehirde doğdu — herkesin "fazla" dediği huzursuz çocuk. Genç yaşta şehre gitti, kuralların hepsini yakan bir oyun yaptı; tür tanımlandı, "dahi" diye taçlandırıldı. Sonra aynı kalabalık döndü: fazla radikal, fazla dik, fazla Magnus. Bir skandal, bir tükeniş, ve taç bir ilmeğe döndü. Sürünebileceği tek yer doğduğu şehirdi. Şimdi iskelenin ucundaki çürük bir teknede yaşıyor; geceleri denizin karanlığına bakar — bakar, çünkü oraya düştü ve geri tırmandı. Değerlerini kimse vermedi, kimse alamadı.
*Detay:* İskeledeki çürük tekne; geceleri denize bakıp mırıldanır. *Tema:* "uçuruma bakarsan o da sana bakar"ı yaşamış; 4C ahlaki aynasını haber verir. *Yerel bağ:* Hanna onu çocukluğundan tanır.

**🕳️ Nina Vex — Tükenmiş geliştirici · Nihilizm.** Bir zamanlar gerçekten inanırdı — oyunların, emeğin, kendisinin önemli olduğuna; yetenekliydi de. Kırılma tek darbeyle değil, yavaş aşınmayla geldi: sevdiği her oyun gelir hunisine döndü, en iyi işi A/B testlerinde lapalaştı, uğruna yandığı proje bir tabloyla iptal edildi. Bir gün hiçbir şey hissetmediğini fark etti; inancı parçalanmadı, buharlaştı. Bu küçük şehre *hiçbir şey olmadığı için* geldi; denizin uçsuz kayıtsızlığı ona dürüst gelen tek şey. Nihilizmini satmaz, boşluğu olduğu gibi söyler — cazibesi de bu. Tek çatlağı: sevdiği o ilk oyunun kopyasını saklar, hiç açmaz; ne silebilir ne oynayabilir.
*Detay:* Açmadığı, silemediği o eski oyun dosyası — itiraf etmediği son kor. *Tema:* diğerlerinin yanıt verdiği boşluk; pes etmeye / "nasılsa fark etmez"e (Crane'in yolu) iter.

**🔧 Bruno Adler — Mühendis · Erdem Etiği (Aristoteles) — kök salmış.** Bu küçük şehirde doğdu, hiç ayrılmadı. Babası inşaatçıydı — eski liman duvarını, dereyi geçen köprüyü o ördü; Bruno çocukken yanında harç karıştırdı. Büyüdü, işi devraldı; şimdi şehrin iskeletini o tutuyor: Felix'in geçtiği köprü, Theo'nun dalgakıranı, Søren'in rıhtımı — hepsinde eli var. Şöhretin peşine hiç düşmedi; iyi yaşamı işini iyi yapmakta buldu, her gün bir perçinle. Bir müteahhit "kirişi incelt" diye dayatınca reddetti, sözleşmeyi kaybetti — bina hâlâ ayakta. Genç işçilere ve tamirci kardeşi Bjorn'a ustalık öğretir. Düşmedi, çünkü boş yükseklerin peşine hiç koşmadı.
*Detay:* Babasından kalan su terazisi; köprü ayağında küçük usta işareti. *Tema:* süreç/karakter sonuçtan önce — Crane'in panzehri. *Yerel bağ:* kardeşi Bjorn; şehri o inşa etti.

**🩺 Marta Reyes — Hemşire · Bakım Etiği — kök salmış.** Bu küçük şehrin ömürlük hemşiresi; kırk yıldır aynı insanlara bakıyor — kucağında doğanları büyürken gördü, ölüm döşeğindekilerin elini tuttu. Bir defter tutmaz, herkesi ezbere bilir; hasta bir dosya değil, tanıdığı bir insandır. Yıllar önce başkente gitme şansı vardı; annesi hastalandı, kaldı — kalmak bütün hayatı oldu, pişman değil. Başkentten kırılıp dönen geliştiricileri o ayağa kaldırdı; "kaynak" denen gençlerin titreyen ellerini tuttu. Şehrin yarısını o onardı: düşüşünden sonra Magnus'u, kocasını kaybeden Hanna'yı, yaşlı Pjotr'u. Crane gibi birini bile canavar saymaz.
*Detay:* Eskimiş hemşire çantası; kimseyi deftere yazmaz. *Tema:* rakamları insanlaştırır; Affet/Birleş'in tohumu. *Eksen:* Marta (bakım) ↔ Clara (adalet). *Yerel bağ:* Magnus, Hanna, Pjotr.

**🎭 Remy Vail — İndie geliştirici · Absürdizm (Camus).** Hiç zirve yapmadı — düşmedi de; inatla hep tabandaydı. Küçük yaşta oyun yapmaya âşık oldu, ilk oyunlarına kendini döktü; dünya umursamadı — flop, ret, sessizlik. Bir kez başkente gidip "başarmayı" denedi, çiğnenip döndü. Bir gece gerçekten bırakacaktı (boşluk çağırıyordu), ama güldü: madem hiçbir şey anlamı garanti etmiyor, anlam borç değil — yapılır. Oyunları kazanmak için değil, *yapmak bir isyan olduğu için* yapacaktı. Şimdi bu küçük şehirde on batık oyunun ardından on birinciye başlıyor. Genç geliştiriciler (Lena, Sam, Milo) ona bakıp cesaret buluyor.
*Detay:* Rafında kupa gibi dizili on batık oyun; her flopta kadeh kaldırır. *Tema:* zafer yerine isyan — Nina'nın pes edişine ve oyuncunun zafer takıntısına karşı. *Yerel bağ:* genç dev üçlüsünün ilhamı.

**⚓ Søren Berg — Liman kaptanı · Varoluşçuluk (Sartre).** Bir donanma ailesine doğdu; babası madalyalı subaydı, rütbesi daha doğmadan yazılmıştı. Otuzuna varmadan komisyon kâğıdı önüne kondu — imzalamadı. Hurda bir tekne alıp tek başına açıldı; ödü kopuyordu ama o korku ilk kez ona aitti. Yıllarca dünyayı dolaştı, her dümen kırışını kendi seçti; sonunda bu küçük şehrin limanına demir attı, şimdi kaptanı o. Yerleşti ama bağlanmadı — kalmayı da seçti. Bahaneye tahammülü yok: "mecbur kaldım" diyene "hayır, seçtin" der. O ilk hurda tekneyi hiç değiştirmedi, yüz kez onardı; seçtiğinin kanıtı.
*Detay:* Yüz kez onarılmış o ilk tekne. *Tema:* radikal özgürlük; Crane'in "doğanın kanunu" kaderciliğini (kötü niyet) çürütür; 4C'yi özgür seçim olarak çerçeveler. *Yerel bağ:* eski gemi arkadaşı Marek.

**⚖️ Clara Vogt — Avukat · Kant (Deontoloji).** Başkentin prestijli bir firmasında liyakatle yükseldi — kurumsal davalar, fikrî mülkiyet. Sınav bir dosyayla geldi: büyük bir müvekkil, genç bir yapımcının fikir hırsızlığı iddiasını "gömmesini" istedi; yasal, kazançlı, rutin. Dilekçenin yarısını yazdı, durdu ve Kant'ın sorusunu sordu: herkes bunu yapsa, nasıl bir dünya? Yaratıcının araç, sözleşmenin silah olduğu bir dünya. İsteyemezdi; dosyayı kapattı, istifa etti — ortaklığı, parayı bıraktı. Bu küçük şehirde tek odalı bir büro açtı; artık adil sözleşmeler yazıyor, bağımsızları koruyor, ücreti az. Yarım bıraktığı o dosyayı çekmecesinde saklar — çizgiyi unutmamak için.
*Detay:* Tamamlamayı reddettiği yarım dosya. *Tema:* Crane'in "basamaktı, üstüne bastım"ını çürütür. *Eksenler:* Clara (Kant) ↔ Vivian (Fayda); Clara (adalet) ↔ Marta (bakım). *Servis:* sözleşme/IP.

**🍞 Aldo Bianchi — Fırıncı · Epikürcülük.** Bir zamanlar başkentte adı duyulan bir lokantası vardı, yıldız peşinde koştukça boşaldı. Onu döndüren bir düşüş değil, bir ölüm oldu: kardeşi — Rosa'nın babası — aniden gitti. Cenazeden sonra o bomboş lokantada ödüller hiçbir şey ifade etmedi; Epikuros'un söylediğini adını koymadan anladı — ölüm duyumun sonudur, korkmak boşa; tek gerçek servet sıcak, paylaşılan, *şimdiki* hazdır. Lokantayı kapattı, bu küçük şehre geldi, yetim yeğeni Rosa'yı yanına aldı, ona ekmek yapmayı öğretiyor. Tombul, sıcak, cömert; uğrayana ekmek tutuşturur. Her gün "ihtiyacı olana" diye bir fazla somun pişirir, bedava verir.
*Detay:* Her gün fazladan pişirdiği o somun. *Tema:* Crane'in boş arzularının panzehri; ölümü kabul, dostluğu yüceltme. *Eksen:* Aldo (Epikür) ↔ Rex (Kirenaik). *Yerel bağ:* yeğeni Rosa.

**🕹️ Rex Calloway — Arcade sahibi · Kirenaik Hedonizm.** Turne devrindeki bir efsaneydi — şehir şehir gezen arcade/turnuva sahnelerinde kalabalık adını bağırırdı. Kazandığı serveti hep bir sonraki geceye yatırdı, biriktirmek aklına gelmedi; para geldi gitti, o hep anın peşinde kaldı. Bu bir düşüş değildi — sahne küçüldü; refleksleri yavaşlayınca yıkılmadı, bu küçük şehirde kendi arcade'ini açtı, ışıkların hiç sönmediği bir köşe. Hâlâ "şimdi"nin peşinde, pişman değil. Tek gölgesi: kapanış saatini sevmez — müdavimler gidip ışıklar kısılınca, o sessizlikte ertelediği boşluğun kendisine yetişmesinden ürker; geç kapatır, hep bir oyun daha.
*Detay:* Turnuva rozetli eski şampiyon ceketi; kapanış sessizliğinden kaçışı. *Tema:* Crane'in ertelenmiş hırsının panzehri; yumuşak cazibe (salt an). *Eksen:* Rex (Kirenaik) ↔ Aldo (Epikür). *Servis:* ilham/yaratıcılık. *Yerel bağ:* gençler (Tomas, Pippa, Bea) orada takılır.

**📈 Vivian Holt — Yatırımcı · Faydacılık.** Finansta keskin ve dürüst bir yükseliş yaşadı; faydacılığı açgözlülük değil, gerçek bir kanaat: en çok iyiliği toplamı büyüterek yapabileceğine inanır. Bu kanaat bir yaradan doğdu — kariyerinin başında batmakta olan bir dostunun stüdyosunu sırf sevgiden kurtarmaya çalıştı, tüm fonu oraya yığdı; stüdyo yine battı ve o parayla kurtulabilecek beş stüdyoyu da götürdü. O gün öğrendi: bir yüze şefkat, yüz kişiye ihanetti. Ahlakını toplam üzerine kurdu. Şimdi bir fon yönetiyor, bu küçük şehre yükselen stüdyoları görmeye geliyor; batanı keser, beşi kurtarır, "en büyük iyi" diye savunur. Hâlâ o ilk kurtaramadığı dostun adını anar ara sıra.
*Detay:* Kurtarmaya çalışıp herkesi batırdığı dostun adı — terazisini katılaştıran yara. *Tema:* samimi toplam-iyi vs Crane'in kendi-gücü; "saygın acımasızlık" cazibesi. *Eksenler:* Vivian (Fayda) ↔ Clara (Kant); Vivian ↔ Marta (toplam vs kişi). *Servis:* fon/ROI.

---

### Sıradan / Romantizm / Kasabalı
> Aşağıda özet replikler; **genişletilmiş arka planlar bir alttaki "Sıradan/Romantizm/Kasabalı — Genişletilmiş Arka Planlar" bölümünde.** Romantizm adayı toplam **12** (6 kadın / 6 erkek).

- **🌷 Greta Lund — Çiçekçi** *(sıradan).* Stub: emekli öğretmen, oğlu başkentte. T1 "Laleler patladı, al şu demeti." · T2 "Oğlum pek aramıyor, tezgâh sessiz." · T3 "Sen uğrayınca günüm güzelleşiyor."
- **🎶 Elise Moreau — Kafe müzisyeni** *(romantizm adayı).* Stub: kasaba sahnesinde çalan genç müzisyen. T1 "Yeni şarkımda stüdyonun adı geçebilir." · T3(flört) "Her uğradığında bir saatim nasıl uçuyor anlamıyorum."
- **🔬 Daniel Pierce — Deniz biyoloğu** *(romantizm).* Stub: koyu inceleyen sakin bilim insanı. T1 "Yeni bir tür buldum, istersen adını sana veririm." · T3 "Seni çözmek için ömür harcardım."
- **🏺 Nadia Petrova — Seramikçi** *(romantizm).* Stub: kıyıda atölyeli özgür ruh. T1 "Çamur elimde, çay soğudu — sanat hırsız." · T3 "İlk kez bir şeyi bozmaktan korkuyorum."
- **🗼 Cassian Vale — Fenerci** *(romantizm).* Stub: münzevi, geceleri yazan. T1 "Işık denize gider, bana karanlık kalır." · T3 "Sen geldiğinden beri ışık içeride de yanıyor."
- **🥐 Rosa Bianchi — Fırın çırağı** *(romantizm; Aldo'nun yeğeni).* Stub: neşeli, beceriksizce şirin. T1 "Ekmeklerim ya çiğ ya kömür, sen yersin değil mi?" · T3 "En güzel somunu sakladım — aslında bahane."
- **📰 Iris Lindqvist — Gazeteci** *(romantizm).* Stub: keskin, hırslı, atışmacı. T1 "Röportaj? Yoksa korkuyor musun?" · T3 "Bu hikâyeyi kendime saklasam mı?"
- **🔧 Bjorn Adler — Tamirci** *(romantizm; Bruno'nun kardeşi).* Stub: az konuşan, eli her işe yatan. T1 "Ne kırıldıysa getir, çoğunu tamir ederim." · T3 "Seni görünce tamir edecek bir şey aramadım, sadece baktım."
- **💻 Lena Brandt — Genç yazılımcı** *(Felix'in kızı).* Stub: hevesli, yetenekli, güvensiz. T1 "Büyük şirkette oyun mu yapmıştın, vay be." · T2 "Babam 'sağlam iş bul' diyor; yanlış mıyım?"
- **💻 Sam Okoye — Genç yazılımcı.** Stub: pratik, alaycı, grubun motoru. T1 "Üçüncü prototip de çöktü." · T3 "Bir gün seninle çalışmak isteriz; olduğumuzda ilk sana geliriz."
- **💻 Milo — Genç yazılımcı.** Stub: hayalperest, sanatçı ruhlu. T1 "Sonu olmayan bir okyanus hayal ediyorum." · T3 "Sen pes etmemişsin; bu bana cesaret veriyor."
- **📮 Felix Brandt — Postacı** *(mektupları getirir).* T1 "Marta hep soruyor seni." · T3 "Mektupları tartarım — seninkiler hep ağır."
- **🍺 Hanna Vogel — Hancı.** Stub: kocası denizde kayboldu, hanı kapatmadı. T1 "Kötü gün mü iyi gün mü, aynı kadehi koyarım." · T3 "İlk geldiğinde köşede tek başınaydın; iyileşiyorsun."
- **🎣 Old Pjotr — İşsiz emekli, iskelede.** T1 "Balık tutar gibi yapıyorum, denize bakmak için." · T2 "Fabrikam battı; boş günün de tadı var."
- **🧒 Tomas (16) — Hanna'nın oğlu** *(normal genç).* T1 "Annem hanı devralmamı istiyor; sen kaçtın, nasıl yaptın?"
- **🧒 Pippa (12) — iskele çocuğu** *(normal genç).* T1 "Şehirden gelen adam sensin! Gökdelenler bulutları deliyor mu?"
- **🏪 Otto Reinhardt — Bakkal.** Stub: somurtkan, gizliden cömert. T1 "Al alacağını, oyalanma." · T2 "Herkes marketten alıyor, ben yine kepenk açıyorum — inat."
- **👵👴 Wilhelm & Edith Stern — Elli yıllık çift** *(boşanmaya zıtlık).* T1(Edith) "Sırrı yok; her sabah yeniden seçtik birbirimizi." · T2(Wilhelm) "Bin kere kavga ettik; gitmek aklımıza gelmedi."
- **🐟 Marek — İşsiz eski denizci** *(Søren'in dostu).* T1 "Søren kaptan oldu, ben karaya vurdum." · T2 "İş aramıyorum; sabah kahvem, öğlen güneşim var."
- **🧶 Liesl — Örgücü, dedikodu merkezi** *(NPC'ler arası söylenti taşır).* T1 "Duydun mu, Rosa'nın gözü birine takılmış... neyse."
- **🎨 Bea (15) — Duvarlara çizen genç** *(Nadia'ya özenir).* T1 "Nadia gibi sanatçı olacağım; sanat meslek değil mi yani?"

### Sıradan/Romantizm/Kasabalı — Genişletilmiş Arka Planlar

#### Romantizm adayları (12 · 6K/6E)

**🎶 Elise Moreau — Kafe müzisyeni *(K)*.** Akşamları Hanna'nın hanında çalar. Yıllar önce kısa bir süre için gelmişti, denizin akustiğini sevdi, gitmeyi unuttu. İzlediği insanlar hakkında şarkı yazar; "gitmek üzerine" olanı hiç bitiremedi. Sıcaklığının ardında ince bir yalnızlık: kalabalığa söyler, eve tek döner. Flörtü, onu *gerçekten dinleyecek* birine duyduğu özlemi gizler. *Bağ:* Hanna'nın hanında çalar.

**🔬 Daniel Pierce — Deniz biyoloğu *(E)*.** Koyu incelemek için geldi, limandaki küçük araştırma istasyonunda çalışır. Nazik, meraklı, insanlarla beceriksiz — gelgit havuzlarıyla aran daha iyi. Akademinin politikasından sahaya kaçtı. Özlemi: sessiz hayretini paylaşacak biri. *Bağ:* Theo ona ilginç balıklar getirir.

**🏺 Nadia Petrova — Seramikçi *(K)*.** Kıyıda atölyeli özgür ruh; denizi resmeder, yaratırken vakti unutur. Tutmayan bir sanat hayatından sonra buraya yerleşti — burada kimse "pratik ol" demiyor. Özlemi: onu "aklını başına al" demeden seven biri. *Bağ:* genç Bea'ya ustalık eder.

**🗼 Cassian Vale — Fenerci *(E)*.** Feneri bekler; münzevi, melankolik, geceleri yazar. Adını anmadığı bir kayıptan sonra yalnızlığa çekildi. Gemilere yol gösterir, kendi limanını bulamaz. En çok korktuğu şey istediği şey: yakınlık. *Bağ:* fener Søren'in limanına yakın; Marek onu tanır.

**🥐 Rosa Bianchi — Fırın çırağı *(K; Aldo'nun yeğeni)*.** Babası ölünce amcası Aldo büyüttü; ekmek yapmayı öğreniyor. Kayba rağmen güneş gibi, beceriksizce şirin. Özlemi: "Aldo'nun yeğeni"nden fazlası olarak görülmek. *Bağ:* amcası Aldo; Bea ile arkadaş.

**📰 Iris Lindqvist — Gazeteci *(K)*.** Şehrin gazetesini çıkarır, gözü sektörde. Keskin, atışmacı; sertliğinin altında kırılganlık. Oyuncu en iyi hikâyesi — ama habere âşık olabilir. *Bağ:* rakip/Crane haberlerini o duyurur; Vivian'la röportajda atışır.

**🔧 Bjorn Adler — Tamirci *(E; Bruno'nun kardeşi)*.** Ne kırıksa onarır; sessiz, nazik bir dev. Ünlü inşaatçı ağabeyinin gölgesinde, küçük şeyleri onarmaktan memnun. Özlemi: "Bruno'nun kardeşi" değil, kendisi olarak görülmek. *Bağ:* ağabeyi Bruno; Søren'in teknesini onarır.

**🩻 Elias Voss — Genç doktor *(E)*.** Marta'yla aynı muayenehanede; hevesli, uykusuz idealist, kendine bakmayı unutur. Büyük hastanenin "vaka numarası" düzeninden kaçıp buraya geldi. Özlemi: bir kez durup nefes almak, yanında biriyle. *Bağ:* Marta (mentor); Hanna'da geç çorba.

**⚓ Sigrid Holm — Balıkçı *(K)*.** Tekneleri çeker, ağ atar — en güçlü bilek. Dobra, sert kabuk, yumuşak iç. Babası denizciydi; kimseye muhtaç olmamayı ondan öğrendi. Özlemi: zayıflık sanmadan yaslanabileceği biri. *Bağ:* Søren'le atışma; Marek'in eski dostu.

**🍲 Matteo Ricci — Aşçı *(E)*.** Hanna'nın hanının mutfağını çeviren gürültülü, koca yürekli aşçı. Herkesi doyurur, sofra kurmayı sever. Özlemi: sofrasında her akşam aynı kişi. *Bağ:* Hanna (işveren); Aldo & Rosa (aile dostu).

**🌿 Liv Andersen — Bahçıvan *(K)*.** Şehrin serasını işletir, Greta'ya fide yetiştirir. Dingin, şefkatli, yeşil parmaklı; sabırla büyütmeyi bilir. Özlemi: aceleye getirmeyen, birlikte büyüyecek biri. *Bağ:* Greta'ya fide verir.

**🏊 Kai Lindgren — Yüzme hocası/cankurtaran *(E)*.** Sahilin güneşi; her sabah ilk o denize girer. Atletik, neşeli — ama herkesi kurtaranın gizli yorgunluğunu taşır. Özlemi: bir kez de birinin *onu* sudan çıkarması. *Bağ:* Rex'in arcade'i; gençlere (Pippa, Tomas) yüzme öğretir.

#### Genç geliştiriciler (garaj üçlüsü)

**💻 Lena Brandt *(Felix'in kızı)*.** Kendi kendini yetiştirmiş, yetenekli ama güvensiz. Geceleri kod yazar, babasından gizler; Felix "sağlam iş" diye tutturur (gizliden gurur duyar). Oyuncuyu hem "mümkünmüş" kanıtı hem korkutucu ayna görür. *Bağ:* baba Felix; üçlü; Remy'ye hayran.

**💻 Sam Okoye.** Üçlünün pratik motoru; keskin, alaycı, işi bitirir. Sektörün acımasızlığı konusunda gerçekçi; "büyük şehre git" baskısını reddeder, buradan bir şey çıkacağını kanıtlamak ister. Hazır olunca oyuncunun kapısını ilk o çalar. *Bağ:* üçlü.

**💻 Milo.** Hayalperest sanatçı; imkânsız hayaller, titrek beceri, kırılgan özgüven. Oyuncunun inadı ona cesaret verir. En kırılganları. *Bağ:* üçlü; oyuncunun genç hâlinin aynası.

#### Çalışan kasabalılar

**📮 Felix Brandt — Postacı.** Otuz yıldır çantayı taşır; her kapıyı, her sırrı bilir, söylemez. Dünyası kızı Lena; onu "sağlam işe" iter (hayallerin nasıl kırıldığını gördü) ama dergilerini saklar. Artık mektup gitmeyen kapılar sessiz sızısı. Felsefe mektuplarını da o getirir. *Bağ:* kızı Lena.

**🍺 Hanna Vogel — Hancı.** Şehrin kalbi olan hanı işletir. Kocası denizde kayboldu; hanı kapatmadı, "insanların gidecek yeri olmalı". Oğlu Tomas'ı tek büyüttü — o kaçmak, Hanna devralmasını ister. Magnus'u çocukluğundan tanır. *Bağ:* oğlu Tomas; Magnus; Elise çalar; yasında Marta.

**🌷 Greta Lund — Çiçekçi.** Emekli öğretmen; oğlu başkentte, pek aramıyor. Yalnız ama sıcak. Şehrin yetişkinlerinin yarısını çocukken o okuttu (Lena, Tomas, Bea, küçük Magnus). Nazik büyükanne. *Bağ:* başkentteki oğlu; Liv'den fide.

**🏪 Otto Reinhardt — Bakkal.** Somurtkan, gizliden cömert (veresiye yazar, sessizce yiyecek bırakır). Zincirler işini bitirdi, inatla kepenk açar. Dul, hırçın yalnız; itiraf etmediği yumuşak yanı — Pjotr ve Marek'e sessizce ekmek bırakır. *Bağ:* işsizlere gizli yardım; Liesl'le atışma.

**🧶 Liesl — Örgücü.** Herkesin işini bilen şehrin söylenti merkezi (meta: ilişki ağı bilgisini taşır). Dul, yalnız; dedikodu onun bağlı kalma yolu — çoğu zaman aslında insanları kollar. Bütün bağları bilir. *Bağ:* herkesi söylentiyle bağlar; Otto'yla atışır.

#### Yaşlılar / işsizler

**🎣 Old Pjotr.** Küçük atölyesi battı, hem işini hem kimliğini kaybetti; acılaşmak yerine boş günlerde tuhaf bir huzur buldu. İskelede "balık tutar" (asıl niyeti denize bakmak). Oyuncuya didinmeyi bırakmanın resmini gösterir. *Bağ:* sağlığını Marta kollar; Theo'ya komşu; Otto ekmek bırakır.

**🐟 Marek *(Søren'in dostu)*.** Gençliğinde Søren'le aynı gemideydi; Søren kaptan oldu, Marek "karaya vurdu". Kıskanmaz; yaşamayı denizden çok sevdi. Sabah kahvesi, öğlen güneşiyle yetinir — hırsa nazik karşı ses. *Bağ:* Søren; Cassian; Sigrid; Otto.

**👵👴 Wilhelm & Edith Stern.** Elli yıllık evli; aşkın sürebileceğinin canlı kanıtı — sır yok, her sabah birbirini yeniden seçmek. Wilhelm emekli saat ustası, Edith keskin dilli. Gölge: Wilhelm'in hafızası siliniyor; Edith her sabah kendini yeniden tanıtır, Wilhelm her sabah yeniden âşık olur. Oyuncunun boşanmasına dokunaklı karşıtlık. *Bağ:* sağlıklarını Marta kollar; şehrin eski hafızası.

#### Gençler / çocuklar

**🧒 Tomas (16) — Hanna'nın oğlu.** Huzursuz; annesi hanı devralmasını ister, o kaçmak ister — oyuncuyu "gidip bir şey olunabiliyormuş" kanıtı görür. Somurtkan, içi yumuşak; oyunlara meraklı ama kabul etmez. "Kal ya da git"in küçük yankısı. *Bağ:* annesi Hanna; Rex'in arcade'i; Kai yüzme öğretir.

**🧒 Pippa (12) — İskele çocuğu.** Meraklı, durmadan soru soran küçük kâşif. Büyük şehir hakkında gözleri kocaman; oyuncuyu hayret kaynağı belleyip peşine takılır. Yarı öksüz, şehrin ortak çocuğu. Cebinde deniz kabukları. *Bağ:* Pjotr yanında oturtur; Kai yüzme öğretir.

**🎨 Bea (15) — Duvarlara çizen genç.** Hevesli sanatçı; Nadia'ya tapar. Annesi "gerçek meslek" ister, Bea "sanat da meslek" diye direnir. İsyankâr-yaratıcı, kendi sesini arıyor. *Bağ:* Nadia (idol/usta); Rosa (arkadaş).

---

### Aile/Bağ Ağı
Felix → Lena (kızı) · Hanna → Tomas (oğlu) · Aldo → Rosa (yeğeni) · Bruno → Bjorn (kardeşi) · Søren → Marek (dostu) · Nadia → Bea (usta-çırak) · Greta → başkentteki oğlu · Liesl → herkesi söylentiyle bağlar · Wilhelm & Edith = aşkın kalıcı yüzü. *(Yarn değişkenleri + `npcs.ts` `relations` ile.)*

---

## Test Stratejisi
- `npcs.ts`/yükleyici: her NPC'nin geçerli meta'sı (id, isim, spot, yarn düğümü) var; tüm `.yarn` dosyaları derleniyor (YarnBound parse hatası yok).
- `npcStore`: startTalk/endTalk pause'u doğru yönetir; kalp artışı (günde bir) doğru; reset temizler.
- Kalp eşikleri: düşük kalpte T3 düğümü açılmaz; eşik aşılınca açılır (Yarn `<<if>>` davranışı, runner üzerinden).
- Mektup: max kalpte imza mektubu inbox'a bir kez düşer (tekrar düşmez).
- Spike doğrulaması (Task 1): YarnBound `electron-vite build`'de koşar.

## Kapsam Dışı
- Servis mekanikleri (Avukat/Yatırımcı/Arcade) → kendi spec'leri.
- Romantizm *arc* mekaniği (buluşma/ilişki ilerleyişi) — Spec A sadece flört repliği; arc sonraki faz.
- Gezen NPC AI, hediye sistemi, tam Stardew kalp etkinlikleri.
- Yeni NPC'lerin **tam arka planları** (stub → sonra genişletilecek) ve **ek NPC'ler** (gerektikçe eklenir; sistem buna açık).
- Oyuncu cinsiyeti yoksa eklenmesi (flört yönü için) — teyit edilecek küçük bağımlılık.
