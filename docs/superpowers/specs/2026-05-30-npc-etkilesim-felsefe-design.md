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

**🧪 Yevgeni Volkov — Programcı-analist — Nihilizm (Bazarov tipi)** *(entelektüel meydan okuyucu).* Çekirdek: yalnız madde ve kuvvet gerçek; sanat, duygu, ahlak = kimya + teşvik. Kavgacı, kibirli; Crane'in acımasızlığını entelektüel haklı çıkarır. Arka plan: her şeyi sisteme indirgeyerek parlayan genç; "anlam yanılsamadır"ı kanıtlamaya geldi.
- T1 "Sanat mı? Beyninde dopamin, gerisi pazarlama." · T1 "Bu şehir bir duygusallık müzesi; inceliyorum."
- T2 "Babam 'seni özledim' diye yazar — mantıksız bir sevgi. Yine de hepsini saklıyorum."
- T3 "Senin nehre karşı kürek çekmen sevimli bir yanılsama; nehir kör." · T3 (çatlak) "Burada beklemediğim bir şey hissettim. Kimyasıyla açıklayamıyorum — rahatsız edici."
- ✉️ İmza: "...anlamsız bir dünyada inatla anlam kuruyorsun, bu beni etkiliyor; formülüm açıklamıyor. — Y. Volkov"
- Bağ: Crane'in "duygu zayıflık, güç gerçek"ini entelektüel haklı çıkarır (tehlikeli cazibe); ama çatlağı (etkilenmek) onu çürütür. Marta ve Remy karşısında.

**🔧 Bruno Adler — Mühendis — Erdem Etiği (Aristoteles).** Çekirdek: eudaimonia, erdem alışkanlıkla kurulur, altın orta, phronesis. Arka plan: "kirişi incelt" denince reddetti, atıldı; köprü hâlâ ayakta.
- T1 "Köprü bir günde çökmez, bir günde yükselmez. Her gün bir perçin." · T1 "Mükemmellik eylem değil, alışkanlıktır."
- T2 "'Kirişi incelt' dediler; inceltmedim, attılar. Köprü hâlâ ayakta — ben de."
- T3 "İki yanlış: korkup sinmek ya da öfkeyle acımasızlaşmak. Erdem ortada — cesaret." · T3 "Yenerken kim olduğunu koru."
- ✉️ İmza: "...köprü yıllarca taşıdığı küçük yüklerle sınanır. Her gün doğru olanı yap. Karakter perçin perçin kurulur. — B."
- Bağ: altın orta = 4C finali (aşırılık=canavarlaş, eksiklik=korkaklık).

**⚓ Søren Berg — Liman kaptanı — Varoluşçuluk (Sartre).** Çekirdek: varoluş özden önce, radikal özgürlük, sorumluluk, kötü niyet, otantiklik. Arka plan: babasının hazır rotasını reddedip kendi teknesini aldı.
- T1 "Nehirde yol yoktur; her dümen kırışı bir seçim." · T1 "'Ben böyleyim' diyene gülerim; her sabah yeniden seçersin."
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

**🌒 Magnus Hale — Yıkık efsane · Nietzsche.** Bu küçük şehirde doğdu — herkesin "fazla" dediği huzursuz çocuk. Genç yaşta şehre gitti, kuralların hepsini yakan bir oyun yaptı; tür tanımlandı, "dahi" diye taçlandırıldı. Sonra aynı kalabalık döndü: fazla radikal, fazla dik, fazla Magnus. Bir skandal, bir tükeniş, ve taç bir ilmeğe döndü. Sürünebileceği tek yer doğduğu şehirdi. Şimdi iskelenin ucundaki çürük bir teknede yaşıyor; geceleri nehrin karanlığına bakar — bakar, çünkü oraya düştü ve geri tırmandı. Değerlerini kimse vermedi, kimse alamadı.
*Detay:* İskeledeki çürük tekne; geceleri nehre bakıp mırıldanır. *Tema:* "uçuruma bakarsan o da sana bakar"ı yaşamış; 4C ahlaki aynasını haber verir. *Yerel bağ:* Hanna onu çocukluğundan tanır.

**🧪 Yevgeni Volkov — Programcı-analist · Nihilizm (Bazarov tipi).** Her şeyi sisteme ve sayıya indirgeyerek hızla parlayan genç bir programcı-analist. Duyguyu denklemden çıkarınca acımasızca etkili oldu; ona göre sevgi, sanat, ahlak yalnızca kimya ve teşvik yapıları. Bu küçük şehre, "anlamın bir yanılsama olduğunu" kanıtlayan bir inceleme yazmak için geldi; duygusal şehirliyi tuhaf bir tür gibi gözlemler, illüzyonlarını eğlence olsun diye söker. Kibirli, keskin, kavgacı — Crane'in acımasızlığını *entelektüel olarak* haklı çıkarmaya çalışır, bu yüzden tehlikelidir. **Çatlağı (Bazarov'un trajedisi):** Şefkatli yaşlı babası ona "oğlum, seni özledim" diye mektuplar yazar; Yevgeni soğuk cevap verir ama hepsini saklar — mantığıyla açıklayamadığı bir sevgi. Ve burada, beklemediği bir şeyden *etkilenir*; materyalizmi bunu açıklayamaz, bu da onu içten sarsar.
*Detay:* Babasının cevaplamadığı ama sakladığı mektuplar — itiraf etmediği çatlak. *Tema:* Crane'in "duygu zayıflık, güç gerçek"ini entelektüel haklı çıkarır (keskin cazibe); ama "etkilenmek" onu çürütür. Marta (bakım) ve Remy (anlam yaratan absürdizm) tam karşısında.

**🔧 Bruno Adler — Mühendis · Erdem Etiği (Aristoteles) — kök salmış.** Bu küçük şehirde doğdu, hiç ayrılmadı. Babası inşaatçıydı — eski liman duvarını, dereyi geçen köprüyü o ördü; Bruno çocukken yanında harç karıştırdı. Büyüdü, işi devraldı; şimdi şehrin iskeletini o tutuyor: Felix'in geçtiği köprü, Theo'nun dalgakıranı, Søren'in rıhtımı — hepsinde eli var. Şöhretin peşine hiç düşmedi; iyi yaşamı işini iyi yapmakta buldu, her gün bir perçinle. Bir müteahhit "kirişi incelt" diye dayatınca reddetti, sözleşmeyi kaybetti — bina hâlâ ayakta. Genç işçilere ve tamirci kardeşi Bjorn'a ustalık öğretir. Düşmedi, çünkü boş yükseklerin peşine hiç koşmadı.
*Detay:* Babasından kalan su terazisi; köprü ayağında küçük usta işareti. *Tema:* süreç/karakter sonuçtan önce — Crane'in panzehri. *Yerel bağ:* kardeşi Bjorn; şehri o inşa etti.

**🩺 Marta Reyes — Hemşire · Bakım Etiği — kök salmış.** Bu küçük şehrin ömürlük hemşiresi; kırk yıldır aynı insanlara bakıyor — kucağında doğanları büyürken gördü, ölüm döşeğindekilerin elini tuttu. Bir defter tutmaz, herkesi ezbere bilir; hasta bir dosya değil, tanıdığı bir insandır. Yıllar önce başkente gitme şansı vardı; annesi hastalandı, kaldı — kalmak bütün hayatı oldu, pişman değil. Başkentten kırılıp dönen geliştiricileri o ayağa kaldırdı; "kaynak" denen gençlerin titreyen ellerini tuttu. Şehrin yarısını o onardı: düşüşünden sonra Magnus'u, kocasını kaybeden Hanna'yı, yaşlı Pjotr'u. Crane gibi birini bile canavar saymaz.
*Detay:* Eskimiş hemşire çantası; kimseyi deftere yazmaz. *Tema:* rakamları insanlaştırır; Affet/Birleş'in tohumu. *Eksen:* Marta (bakım) ↔ Clara (adalet). *Yerel bağ:* Magnus, Hanna, Pjotr.

**🎭 Remy Vail — İndie geliştirici · Absürdizm (Camus).** Hiç zirve yapmadı — düşmedi de; inatla hep tabandaydı. Küçük yaşta oyun yapmaya âşık oldu, ilk oyunlarına kendini döktü; dünya umursamadı — flop, ret, sessizlik. Bir kez başkente gidip "başarmayı" denedi, çiğnenip döndü. Bir gece gerçekten bırakacaktı (boşluk çağırıyordu), ama güldü: madem hiçbir şey anlamı garanti etmiyor, anlam borç değil — yapılır. Oyunları kazanmak için değil, *yapmak bir isyan olduğu için* yapacaktı. Şimdi bu küçük şehirde on batık oyunun ardından on birinciye başlıyor. Genç geliştiriciler (Lena, Sam, Milo) ona bakıp cesaret buluyor.
*Detay:* Rafında kupa gibi dizili on batık oyun; her flopta kadeh kaldırır. *Tema:* zafer yerine isyan — Yevgeni'nin "anlam yanılsamadır"ına ve oyuncunun zafer takıntısına karşı. *Yerel bağ:* genç dev üçlüsünün ilhamı.

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

### Felsefe NPC'leri — Genişletilmiş Replik Havuzları
> Stardew yapısı: bol **günlük (T1, kalp<2, $day'e göre döner)** kısa replik + **kişisel (T2, kalp≥2)** + **derin/öğüt (T3, kalp≥4)**. Kısa replikler bile karaktere göre renklenir. Mektuplar yukarıdaki imza mektuplarıdır.

**📚 Marcus — Stoacılık.**
T1: "Naber? Otur istersen, çay demledim." · "Bugün nehir sakin. Okumaya iyi gün." · "Yeni bir kutu kitap geldi, daha açmadım." · "Sabahın bu saatini severim — kimse gelmeden önce." · "Şu rafı üçüncü kez diziyorum. İşim değil, huzurum." · "Yağmur gelecek; kemiklerim kitaplardan önce haber verir." · "Bir şey mi arıyorsun, yoksa nehire mi bakıyorsun? İkisi de olur."
T2: "Ben de zirvedeydim. Bir çöküş, bir ihanet... Kırılmadım, sadeleştim." · "Eski ortağım başarısının kupürlerini yollar. Okur, rafa kaldırırım. Kin yorucu."
T3: "Hiçbir şey, üzerine anlam yüklenmedikçe iyi ya da kötü değildir — sadece bir deneyim." · "Peşindekinden nefret etmek, zincirini kendi boynuna takmaktır."

**🪶 Theo — Taoizm.**
T1: "Naber. Otur, su seni de yavaşlatsın." · "Balık var mı? Bilmiyorum, sormadım. Önemi de yok." · "Bak şu dalgaya — hiç acelesi yok, yine de kıyıya varıyor." · "Ağ yine yırtıldı. Onaracağım, ne zaman olursa." · "Güneş nereye giderse oraya bakarım. Plan yapmam." · "Rüzgâr döndü. Bugün başka türlü bir gün demek." · "Acelen mi var? Acele eden vardığı yeri göremez."
T2: "Bir kulede oturdum, zirvede. Bir gün kalemi bıraktım, çıktım — sadece aktım." · "'Nasıl bıraktın' derler. Bırakmadım; su beni taşıdı, ben karşı koymayı bıraktım."
T3: "Seni sıkıştıran güce kürekle değil suyla karşılık ver. Su zorlamaz ama dağı deler." · "Didinmeyi bırak demiyorum — doğru anı bekle, sonra tek hamle yeter."

**🌒 Magnus — Nietzsche.**
T1: "Naber mi? Naber sıradan insanların sorusu. Yine de otur." · "Gece nehire bağırdım yine. Cevap vermedi — saygı duyarım." · "Şu martıya bak. Özgür sanıyorsun; balığın kölesi aslında." · "Uyumadım. Uyku ölümün ödünç hâli, fazla geliyor." · "Şu çürük tekne benim sarayım. Batmıyor — inadına." · "Bugün hiçbir şey yapmadım. Bazen en dürüst gün odur." · "Bana deli diyorlar. Deli, herkesin görmezden geldiğini yüksek sesle söyleyendir."
T2: "Bir oyun yaptım, kuralları yaktı. 'Efsane' dediler; sonra aynı ağız beni yaktı." · "Zirveden düştüm, doğduğum yere sürünerek döndüm."
T3: "Canavarlarla dövüşen kendi canavara dönüşmesin. Uçuruma uzun bakarsan, uçurum da sana bakar." · "Onu değil, kendini aş. Düşmanı geçmek kolay; kendini geçmek marifet."

**🧪 Yevgeni Volkov — Nihilizm (Bazarov tipi).**
T1: "Naber. Vakit kaybı bu sohbet, ama devam et — eğlenceli." · "Sanat mı? Beyninde dopamin, gerisi pazarlama." · "Güzel gün batımı dediğin, gözüne giren foton. Romantizm optik." · "Bu şehir bir duygusallık müzesi; inceliyorum." · "Sevgi, akrabana bağlı bir kimyasal — üreme stratejisi, hepsi bu." · "İnsanlar 'anlam' arar; aslında hayatta kalma içgüdüsünü süslüyorlar."
T2: "Duyguyu çıkardım, verim arttı; beni acımasızca iyi yaptı bu." · "Babam 'oğlum seni özledim' diye yazar. Mantıksız bir sevgi. ...Yine de hepsini saklıyorum, neden bilmiyorum."
T3: "Senin 'nehre karşı kürek çekmen' sevimli bir yanılsama; nehir kör, sen önemlisin sanıyorsun." · "Duygu zayıflık, güç gerçektir. Crane bunu anlamış; sen direniyorsun — neden?" · *(çatlak)* "Burada beklemediğim bir şey hissettim. Kimyasıyla açıklayamıyorum. Bu beni rahatsız ediyor, çok."

**🔧 Bruno — Erdem Etiği.**
T1: "Naber. Elini ver — nasır tutmuş, iyi." · "Şu köprüyü babamla ördük; her sabah kontrol ederim." · "Acele iş yok bende. İyi yapılan iş kendi hızını bilir." · "Bugün bir kiriş düzlüyorum. Doğru açıyı bulunca içim rahat." · "Genç işçiler hızlı olmak ister; önce sağlam olmayı öğretiyorum." · "Ölçü her şey — ne fazla ne eksik. Harçta da, hayatta da." · "Yağmurdan sonra taş başka kokar."
T2: "Bir müteahhit 'kirişi incelt' dedi; inceltmedim, attılar. Köprü hâlâ ayakta." · "Babam derdi: bir taşı gizlice yanlış koyarsan önce kendin çürürsün."
T3: "İki yanlış var: korkup sinmek ya da öfkeyle acımasızlaşmak. Erdem ortada — cesaret." · "Onu yenmek değil, yenerken kim olduğunu korumak önemli."

**🩺 Marta — Bakım Etiği.**
T1: "Naber? Dur bakayım yüzüne... iyi görünmüyorsun. Su içtin mi?" · "Geç de olsa uğradın. Otur, ayakta dikilme." · "Sabah Pjotr'a baktım, yine üşütmüş." · "Eller soğuk; battaniye var." · "İyi uyudun mu? Gözlerin söylüyor, yalan söyleme." · "Bir çayı hak ettin. Otur, ben koyarım." · "Bütün gün başkalarına baktım; sıra sende. Nasılsın, gerçekten?"
T2: "Annem hastalanınca kaldım; bence kazandım — bağ, gidilen yoldan kıymetli." · "Çökenlere 'kaynak' diyorlarmış; ben titreyen ellerini tuttum. Tablo titremez, insan titrer."
T3: "Sana kötülük eden de kırılmış biri. Canavar sanırsan sen de katılaşırsın. İnsan kal." · "Onu yenerken yanındakini kaybetme." · "Herkese bakan sen — yığılırsan kim tutacak elini? Kendine de bak."

**🎭 Remy — Absürdizm.**
T1: "Naber! On birinci oyuna başladım. Batarsa rekor." · "Dün gece bir bug buldum, üç saat güldüm." · "Kahve mi içtin? Ben altıncıdayım." · "Şu rafa bak — on batık oyun, kupalarım." · "Bugün hiçbir şey satmadım. Neyse, devam." · "Fikir mi? Bin tane var, hepsi kötü; biri parlar bazen." · "Evren bugün de cevap vermedi; inadına bir satır daha yazdım."
T2: "Bir gece bırakacaktım, boşluk çağırıyordu. Sonra güldüm — madem anlam yok, ben koyarım." · "Başkente gidip 'başarmayı' denedim, çiğnenip döndüm. En iyi kararımdı."
T3: "Yenemeyebilirsin; önemi yok. Ezilirken bile oyununu yap — asıl isyan bu." · "Zafer de kandırmaca; Sisifos iterken mutludur."

**⚓ Søren — Varoluşçuluk.**
T1: "Naber. Gelgit dönüyor — otur, dümen başında bekleyemem." · "Üç gemi geç yanaştı, üçü de rüzgârı suçladı. Rüzgâr suçlanmaz." · "Nehir durgun; aldanma, en sakin su en derinidir." · "Şu tekneyi yüz kez onardım, yenisini almadım." · "Pusulaya her zaman güvenme." · "Marek geçti sabah, kahve içtik." · "Hava neyse o. Sen rotanı sor kendine."
T2: "Babam donanmaya yazdırmıştı; imzalamadım, kendi teknemi aldım. O korku ilk kez bana aitti." · "Yıllarca başkasının rotasını tuttum; tutan da bendim, kabul etmiyordum."
T3: "'Akıntı böyle, elimden gelmez' diyen yalan söylüyor. Akıntı karar vermez, sen verirsin." · "Sen mi seçtin, 'mecbur kaldım' deyip mi yaptın? İlki özgür kılar."

**⚖️ Clara — Kant.**
T1: "Naber. Sözleşme mi getirdin, sohbet mi? İkisine de bakarım." · "Sabah üç haksızlık düzelttim. İyi bir gün." · "İmzanı atmadan oku." · "Çayım var ama bardak az; adil bölüşürüz." · "Dün küçük bir geliştiriciye bedava sözleşme yazdım." · "Şu dolap benim hafızam; hiçbir sözü unutmam." · "Gün düzgün geçti — kimse aldatılmadı."
T2: "Bir geliştiricinin hakkını gömmemi istediler; dosyayı kapattım, çıktım." · "Yarım dosyayı çekmecede tutarım — çizgiyi unutmamak için."
T3: "Onu yenmek için onun yöntemini kullanma. İnsanları basamak yaparsan elinde sadece basamak kalır." · "Herkes senin yaptığını yapsa nasıl bir dünya? Kötüyse yapma; bazı zaferlerin bedeli onurundur."

**🍞 Aldo — Epikürcülük.**
T1: "Naber! Gel, fırın sıcak. Al şu somunu." · "Kahvaltı ettin mi? Etmedin, yüzünden belli." · "Bugün tarçınlı yaptım, koku sokağa yayıldı." · "Rosa'nın ekmeği yine yandı, gülüyoruz." · "Sıcak ekmek, peynir, bir dost — başka ne lazım?" · "Fazladan somun pişirdim, kapıya koydum; ihtiyacı olan alır." · "Acele etme, çay demleniyor."
T2: "Yıldız peşinde mutsuzdum; kardeşim ölünce anladım, ödüller karın doyurmuyor." · "Rosa'nın gülüşü, kazandığım tüm yıldızlardan parlak."
T3: "İhtiyacın mı var, korkun mu konuşuyor? Şan, güç — dipsiz kuyu." · "Huzurunu onun terazisine koyma. Ölümden değil, eksikten korkarım ben."

**🕹️ Rex — Kirenaik Hedonizm.**
T1: "Naber kanka! Yeni makine geldi, dene hadi!" · "Hayat kısa, jeton bol. Bir tur at." · "Bugünün rekorunu ben kırdım, yine." · "Müzik, ışık, gümbürtü — işte bu!" · "Dün ne yaptım hatırlamıyorum, yarın umurumda değil." · "Para geldi gitti, yine gelir; bu geceyi yaşayamazsın ama." · "Kapatma saati geldi neredeyse... bir tur daha ama."
T2: "Sahnelerdeydim, kalabalık adımı bağırırdı. Biriktirmedim, pişman değilim." · "Sahne küçüldü; yıkılmadım, kendi köşemi kurdum."
T3: "Hayatını gelecek bir zafere rehin veriyorsun. Ya o gün gelmezse?" · "Onu yendiğin gün mutlu olacağını sanıyorsun — yanılıyorsun. Mutluluk ertelenmez."

**📈 Vivian — Faydacılık.**
T1: "Naber. Vaktim kısıtlı ama iyi fikre vakit var. Anlat." · "Bu şehir yavaş, açıkçası dinlendirici." · "Bir stüdyo gördüm; üçünü eledim, birini fonladım. Matematik." · "Kahve içerim ama hızlı." · "İyi niyet güzel, bilanço daha güzel." · "Iris yine röportaj istedi; keskin kız." · "Günün toplamı artıdaysa iyi gündür."
T2: "Başta bir dostun stüdyosunu sevgiden kurtarmaya çalıştım; beş stüdyoyu götürdü. Bir yüze şefkat, yüze ihanet olabilir." · "Hâlâ o dostun adını anarım; terazimi o katılaştırdı."
T3: "Onu yenmek toplamda değer mi, egonu mu doyuruyor?" · "Amaç aracı haklı çıkarır — yeter ki toplam artıda olsun; çoğu kendi acısını fazla tartar."

---

### Sıradan / Romantizm / Kasabalı
> Aşağıda özet replikler; **genişletilmiş arka planlar bir alttaki "Sıradan/Romantizm/Kasabalı — Genişletilmiş Arka Planlar" bölümünde.** Romantizm adayı toplam **12** (6 kadın / 6 erkek).

- **🌷 Greta Lund — Çiçekçi** *(sıradan).* Stub: emekli öğretmen, oğlu başkentte. T1 "Laleler patladı, al şu demeti." · T2 "Oğlum pek aramıyor, tezgâh sessiz." · T3 "Sen uğrayınca günüm güzelleşiyor."
- **🎶 Elise Moreau — Kafe müzisyeni** *(romantizm adayı).* Stub: kasaba sahnesinde çalan genç müzisyen. T1 "Yeni şarkımda stüdyonun adı geçebilir." · T3(flört) "Her uğradığında bir saatim nasıl uçuyor anlamıyorum."
- **🔬 Daniel Pierce — Nehir biyoloğu** *(romantizm).* Stub: koyu inceleyen sakin bilim insanı. T1 "Yeni bir tür buldum, istersen adını sana veririm." · T3 "Seni çözmek için ömür harcardım."
- **🏺 Nadia Petrova — Seramikçi** *(romantizm).* Stub: kıyıda atölyeli özgür ruh. T1 "Çamur elimde, çay soğudu — sanat hırsız." · T3 "İlk kez bir şeyi bozmaktan korkuyorum."
- **🗼 Cassian Vale — Fenerci** *(romantizm).* Stub: münzevi, geceleri yazan. T1 "Işık nehre gider, bana karanlık kalır." · T3 "Sen geldiğinden beri ışık içeride de yanıyor."
- **🥐 Rosa Bianchi — Fırın çırağı** *(romantizm; Aldo'nun yeğeni).* Stub: neşeli, beceriksizce şirin. T1 "Ekmeklerim ya çiğ ya kömür, sen yersin değil mi?" · T3 "En güzel somunu sakladım — aslında bahane."
- **📰 Iris Lindqvist — Gazeteci** *(romantizm).* Stub: keskin, hırslı, atışmacı. T1 "Röportaj? Yoksa korkuyor musun?" · T3 "Bu hikâyeyi kendime saklasam mı?"
- **🔧 Bjorn Adler — Tamirci** *(romantizm; Bruno'nun kardeşi).* Stub: az konuşan, eli her işe yatan. T1 "Ne kırıldıysa getir, çoğunu tamir ederim." · T3 "Seni görünce tamir edecek bir şey aramadım, sadece baktım."
- **💻 Lena Brandt — Genç yazılımcı** *(Felix'in kızı).* Stub: hevesli, yetenekli, güvensiz. T1 "Büyük şirkette oyun mu yapmıştın, vay be." · T2 "Babam 'sağlam iş bul' diyor; yanlış mıyım?"
- **💻 Sam Okoye — Genç yazılımcı.** Stub: pratik, alaycı, grubun motoru. T1 "Üçüncü prototip de çöktü." · T3 "Bir gün seninle çalışmak isteriz; olduğumuzda ilk sana geliriz."
- **💻 Milo — Genç yazılımcı.** Stub: hayalperest, sanatçı ruhlu. T1 "Sonu olmayan bir okyanus hayal ediyorum." · T3 "Sen pes etmemişsin; bu bana cesaret veriyor."
- **📮 Felix Brandt — Postacı** *(mektupları getirir).* T1 "Marta hep soruyor seni." · T3 "Mektupları tartarım — seninkiler hep ağır."
- **🍺 Hanna Vogel — Hancı.** Stub: kocası denizde kayboldu, hanı kapatmadı. T1 "Kötü gün mü iyi gün mü, aynı kadehi koyarım." · T3 "İlk geldiğinde köşede tek başınaydın; iyileşiyorsun."
- **🎣 Old Pjotr — İşsiz emekli, iskelede.** T1 "Balık tutar gibi yapıyorum, nehre bakmak için." · T2 "Fabrikam battı; boş günün de tadı var."
- **🧒 Tomas (16) — Hanna'nın oğlu** *(normal genç).* T1 "Annem hanı devralmamı istiyor; sen kaçtın, nasıl yaptın?"
- **🧒 Pippa (12) — iskele çocuğu** *(normal genç).* T1 "Şehirden gelen adam sensin! Gökdelenler bulutları deliyor mu?"
- **🏪 Otto Reinhardt — Bakkal.** Stub: somurtkan, gizliden cömert. T1 "Al alacağını, oyalanma." · T2 "Herkes marketten alıyor, ben yine kepenk açıyorum — inat."
- **👵👴 Wilhelm & Edith Stern — Elli yıllık çift** *(boşanmaya zıtlık).* T1(Edith) "Sırrı yok; her sabah yeniden seçtik birbirimizi." · T2(Wilhelm) "Bin kere kavga ettik; gitmek aklımıza gelmedi."
- **🐟 Marek — İşsiz eski denizci** *(Søren'in dostu).* T1 "Søren kaptan oldu, ben karaya vurdum." · T2 "İş aramıyorum; sabah kahvem, öğlen güneşim var."
- **🧶 Liesl — Örgücü, dedikodu merkezi** *(NPC'ler arası söylenti taşır).* T1 "Duydun mu, Rosa'nın gözü birine takılmış... neyse."
- **🎨 Bea (15) — Duvarlara çizen genç** *(Nadia'ya özenir).* T1 "Nadia gibi sanatçı olacağım; sanat meslek değil mi yani?"

### Sıradan/Romantizm/Kasabalı — Genişletilmiş Arka Planlar

#### Romantizm adayları (12 · 6K/6E)

**🎶 Elise Moreau — Kafe müzisyeni *(K · süslü diva)*.** Hanna'nın hanında çalar ama kendini şehrin fazla büyüğü sayar — imajına, şöhretine düşkün; başta küçümseyen, çalımlı. Yıllar önce "keşfedilmeyi" bekleyerek gelmişti, sahne onu burada tuttu. **Gizli derinlik:** yalnız, gerçek bir sanatçı; alkışın ardında kimsenin onu *dinlemediğini* bilir. Kalp arttıkça cila düşer, kırılgan sanatçı görünür. *Bağ:* Hanna'nın hanında çalar.

**🔬 Daniel Pierce — Nehir biyoloğu *(E)*.** Koyu incelemek için geldi, limandaki küçük araştırma istasyonunda çalışır. Nazik, meraklı, insanlarla beceriksiz — gelgit havuzlarıyla aran daha iyi. Akademinin politikasından sahaya kaçtı. Özlemi: sessiz hayretini paylaşacak biri. *Bağ:* Theo ona ilginç balıklar getirir.

**🏺 Nadia Petrova — Seramikçi *(K)*.** Kıyıda atölyeli özgür ruh; nehri resmeder, yaratırken vakti unutur. Tutmayan bir sanat hayatından sonra buraya yerleşti — burada kimse "pratik ol" demiyor. Özlemi: onu "aklını başına al" demeden seven biri. *Bağ:* genç Bea'ya ustalık eder.

**🗼 Cassian Vale — Fenerci *(E)*.** Feneri bekler; münzevi, melankolik, geceleri yazar. Adını anmadığı bir kayıptan sonra yalnızlığa çekildi. Gemilere yol gösterir, kendi limanını bulamaz. En çok korktuğu şey istediği şey: yakınlık. *Bağ:* fener Søren'in limanına yakın; Marek onu tanır.

**🥐 Rosa Bianchi — Fırın çırağı *(K; Aldo'nun yeğeni)*.** Babası ölünce amcası Aldo büyüttü; ekmek yapmayı öğreniyor. Kayba rağmen güneş gibi, beceriksizce şirin. Özlemi: "Aldo'nun yeğeni"nden fazlası olarak görülmek. *Bağ:* amcası Aldo; Bea ile arkadaş.

**📰 Iris Lindqvist — Gazeteci *(K)*.** Şehrin gazetesini çıkarır, gözü sektörde. Keskin, atışmacı; sertliğinin altında kırılganlık. Oyuncu en iyi hikâyesi — ama habere âşık olabilir. *Bağ:* rakip/Crane haberlerini o duyurur; Vivian'la röportajda atışır.

**🔧 Bjorn Adler — Tamirci *(E; Bruno'nun kardeşi)*.** Ne kırıksa onarır; sessiz, nazik bir dev. Ünlü inşaatçı ağabeyinin gölgesinde, küçük şeyleri onarmaktan memnun. Özlemi: "Bruno'nun kardeşi" değil, kendisi olarak görülmek. *Bağ:* ağabeyi Bruno; Søren'in teknesini onarır.

**🩻 Elias Voss — Genç doktor *(E)*.** Marta'yla aynı muayenehanede; hevesli, uykusuz idealist, kendine bakmayı unutur. Büyük hastanenin "vaka numarası" düzeninden kaçıp buraya geldi. Özlemi: bir kez durup nefes almak, yanında biriyle. *Bağ:* Marta (mentor); Hanna'da geç çorba.

**⚓ Sigrid Holm — Balıkçı *(K)*.** Tekneleri çeker, ağ atar — en güçlü bilek. Dobra, sert kabuk, yumuşak iç. Babası denizciydi; kimseye muhtaç olmamayı ondan öğrendi. Özlemi: zayıflık sanmadan yaslanabileceği biri. *Bağ:* Søren'le atışma; Marek'in eski dostu.

**🍲 Matteo Ricci — Aşçı *(E)*.** Hanna'nın hanının mutfağını çeviren gürültülü, koca yürekli aşçı. Herkesi doyurur, sofra kurmayı sever. Özlemi: sofrasında her akşam aynı kişi. *Bağ:* Hanna (işveren); Aldo & Rosa (aile dostu).

**🌿 Liv Andersen — Bahçıvan *(K)*.** Şehrin serasını işletir, Greta'ya fide yetiştirir. Dingin, şefkatli, yeşil parmaklı; sabırla büyütmeyi bilir. Özlemi: aceleye getirmeyen, birlikte büyüyecek biri. *Bağ:* Greta'ya fide verir.

**🏊 Kai Lindgren — Yüzme hocası/cankurtaran *(E · kibirli altın oğlan)*.** Sahilin güneşi ve bunu fazlasıyla bilen biri — çalımlı, kendine hayran, hep kahraman pozunda; herkes baksın diye her sabah ilk o denize girer. **Gizli derinlik:** "kurtaran" olmadığında değersiz hissetmekten korkan, yorgun biri; bir kez de birinin *onu* sudan çıkarmasını ister. *Bağ:* Rex'in arcade'i; Pippa, Tomas'a yüzme öğretir.

#### Romantizm — Tip/Arketip Haritası
Bekarlar tek tip değil; gerçek insan tipleri gibi geniş yelpaze. Her tip **yüzey → gizli derinlik** (kalp arttıkça açılan büyüme; Stardew mantığı). Arketip = Jung/romans; mizaç = dört mizaç (sanguine/choleric/melancholic/phlegmatic).

| NPC | Tip (arketip · mizaç) | Yüzey | Gizli derinlik |
|---|---|---|---|
| Elise | Süslü diva (Femme glam · sanguine) | Kibirli, imaj/şöhret düşkünü, küçümseyen | Yalnız; sahne ardında kırılgan gerçek sanatçı |
| Iris | Alaycı kariyerci (Cynic · choleric) | Keskin dilli, mesafeli, hırslı | İnce kırılganlık; doğruya tutkuyla bağlı |
| Sigrid | Sert tomboy (Warrior · choleric/phlegmatic) | Dobra, duygusuz, kimseye muhtaç değil | Derin sadakat; yaslanmaktan korkan yürek |
| Nadia | Bohem özgür ruh (Creator · sanguine) | Dağınık, kuralsız, manic-pixie | Bağlılığın boğmasından korkar; sadık |
| Rosa | Güneş-masum (Innocent · sanguine) | Neşeli, beceriksizce şirin, saf | Babasının kaybını taşır; görülmek ister |
| Liv | Dingin şefaatçi (Caregiver · phlegmatic) | Sakin, sabırlı, toprak ana | İhtiyaçlarını hep erteler; o da büyümek ister |
| Kai | Kibirli altın oğlan (Charmer/Jock · sanguine) | Kendine hayran, çalımlı, hep kahraman | "Kurtaran" olmazsa değersiz hisseder; yorgun |
| Cassian | Melankolik kayıp ruh (Lost Soul · melancholic) | Kasvetli, mesafeli, içine kapalı | Yakınlıktan hem korkan hem can atan şair |
| Daniel | Utangaç profesör (Professor · melancholic/phlegmatic) | Sakar, sosyal beceriksiz | Eşsiz merak ve hayranlık; sadık |
| Bjorn | Nazik dev (Best Friend · phlegmatic) | Az konuşan, ağır, sade | Görülmek ister (ağabey gölgesi); en sıcak el |
| Elias | Hevesli şifacı (Caregiver/Idealist · choleric-sanguine) | Fazla idealist, kendini harcayan | Herkesi kurtaramayınca yıkılır; durmayı öğrenmeli |
| Matteo | Çapkın gönül adamı (Charmer · sanguine) | Herkesle flört eden, bağlanmaktan kaçan | Gerçek bir bağ özler; reddedilmekten korkar |

---

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

### Sıradan/Romantizm/Kasabalı — Genişletilmiş Replik Havuzları
> Aynı yapı: bol günlük (T1) + kişisel (T2) + derin/flört (T3). Romantizm adaylarında T3 = flört (tipin gizli derinliği açılır). Sıradan/genç/çocukta T3 = derin dostluk/açılma (flört yok).

#### Romantizm adayları

**🎶 Elise — süslü diva.** T1: "Aa, sen. Hâlâ o eski ceketi mi? Neyse, otur." · "Bu akşamki şarkım harika — beni hak eden bir dinleyici olursa." · "Saçımı beğendin mi? Herkes beğeniyor." · "Bu kasaba bana küçük; bir gün büyük sahneler." · "Çalışıyorum, rahatsız etme; sanat zahmet ister." — T2: "Masa dolar ama kimse dinlemez, gürültü isterler." · "Bu şarkıyı kimseye çalmadım, fazla gerçek." — T3 (flört): "Sen gerçekten dinliyorsun; hem korkutuyor hem hoşuma gidiyor." · "Yüzlerce kişiye söylerim ama bu şarkı sadece senin için."

**📰 Iris — alaycı kariyerci.** T1: "Naber. Alıntılanabilir bir şey söyle." · "Bugün üç yalan, iki skandal, bir aşk dedikodusu." · "Röportaj? Yoksa hâlâ korkuyor musun?" · "Doğruyu yazınca kimse sevmiyor." · "Kahve içerim ama dedikodusuz olmaz." — T2: "Hakikati eğmemi istediler, kendi gazetemi kurdum." · "Sertlik zırh; içeriyi göstermem, henüz." — T3 (flört): "Seni manşete taşırdım ama o zaman paylaşmam gerekir." · "Zekânla baş edebilen tek kişisin; sinir bozucu ve çekici."

**⚓ Sigrid — sert tomboy.** T1: "Naber. Yardım lazımsa söyle, laf sevmem." · "Sabah üç ağ çektim." · "Deniz sert bugün; kolay olan sıkıcı." · "Konuşmam ama susman hoş." · "Bir şey mi var, yoksa bakıyor musun?" — T2: "Babam denizciydi; muhtaç olmamayı ondan öğrendim." · "Yaslanmayı beceremem, düşersem kendim kalkarım." — T3 (flört): "Sana güveniyorum galiba; huzursuz ediyor — iyi anlamda." · "Bir gün tekneye gel; kimseyi almam, sen başka."

**🏺 Nadia — bohem.** T1: "Naber! Ellerim çamurlu, içten sarıldım say." · "Gün doğumunu üç kez boyadım, olmadı — harika." · "Saat kaç? Önemi yok." · "Vazo eğri; mükemmel olsa sıkıcı." · "Plan yapma bana, plan hayatı öldürür." — T2: "Şehir 'pratik ol' dedi, buraya kaçtım." · "Bağlanmak boğar diye korkarım." — T3 (flört): "Seni kilden yapsam ellerim titrerdi." · "Birlikte bir şey yapalım, yanımda olman yeter."

**🥐 Rosa — güneş-masum.** T1: "Naber! Ekmek biraz yandı ama kokusu güzel." · "Amcam tarifi öğretti, yine batırdım." · "Sen gelince hep gülüyorum." · "Şu çöreği dene, o daha az yanık." · "Bir gün kendi fırınımı açacağım." — T2: "Babamı küçükken kaybettim, amcam büyüttü." · "Herkes 'Aldo'nun yeğeni' diyor; bir gün 'Rosa' olmak istiyorum." — T3 (flört): "En güzel somunu sakladım — bahane, seni görmek istedim." · "Yanındayken yeğen değil, sadece ben'im."

**🌿 Liv — dingin şefaatçi.** T1: "Naber. Nane kopardım, iyi gelir." · "Domatesler kızardı, sabırla bekledim." · "Acele etme; güzel şeyler yavaş büyür." · "Greta'ya fide götürdüm." · "Toprak dürüsttür." — T2: "Herkesi büyütürüm, kendi bahçemi unuturum." · "Ben de büyümek istiyorum." — T3 (flört): "Bazı tohumlar yıllarca bekler; seninle öyle hissediyorum." · "Birlikte bir şey ekelim mi?"

**🏊 Kai — kibirli altın oğlan.** T1: "Naber. Yeni rekorumu duydun mu? Herkes konuşuyor." · "Sabah on kulaç yüzdüm, herkes izliyordu." · "Bak şu kaslara." · "Dün birini kurtardım, alkışladılar." · "Yüzme öğret— benden iyi hoca yok." — T2: "Ya kurtaramazsam, kimim ben?" · "Sürekli gülümsemek yorucu." — T3 (flört): "Hep ben kurtarırım; bir kez de biri beni sudan çıkarsa — sen?" · "Senin yanında numara yapmama gerek yok."

**🗼 Cassian — melankolik.** T1: "...Geldin demek." · "Üç gemiye yol gösterdim, hiçbiri durmadı." · "Nehir kurşun rengi, bana uygun." · "Uyumadım, karanlık benimle konuşuyor." · "Acele et, ışığı yakmam lazım." — T2: "Bir zamanlar biri vardı, sonra olmadı." · "Yalnızlığı seçtim sandım; o beni seçmiş." — T3 (flört): "Kendi limanımı bulamadım; sen geldiğinden beri ışık içeride de yanıyor." · "Karanlığımdan kaçmadın, ilk sen."

**🔬 Daniel — utangaç profesör.** T1: "Ah merhaba! Ellerim ıslak, gelgit havuzundaydım." · "Bir salyangoz buldum, kabuğu mükemmel — değil mi?" · "Bir şey anlatacaktım, unuttum." · "İnsanlardan çok denizanalarını anlıyorum." · "Numuneyi görmek ister— yok, sıkıcı gelir." — T2: "Akademi atıf peşindeydi, ben denizi merak ediyordum." · "Bir konuyu sevince susmuyorum." — T3 (flört): "Seni çözmek için ömür harcardım." · "Yeni tür buldum dedim ya — adını senin adına koymuştum."

**🔧 Bjorn — nazik dev.** T1: "...Naber. Otur istersen." · "Radyoyu tamir ettim, çalışıyor." · "Søren'in teknesini onardım." · "Az konuşurum, ama dinlerim." · "Bir şey kırıldıysa getir." — T2: "Abim köprü kurar; ben küçük şeyleri onarırım, yeter bana." · "'Bruno'nun kardeşi' olmaktan yoruluyorum." — T3 (flört): "Seni görünce tamir edecek şey aramadım, sadece baktım." · "Çok laf bilmem; ama yanında dururum, hep."

**🩻 Elias — hevesli şifacı.** T1: "Naber! Koşuyorum, Pjotr'a bakacağım." · "Üç gece uyumadım ama iyiyim." · "Bugün bir çocuğun ateşi düştü." · "Marta'dan çok şey öğreniyorum." · "Burada hastaların adını biliyorum." — T2: "Herkesi kurtaramıyorum; denememek kaldıramam." · "Kendime bakmayı unutuyorum, Marta kızıyor." — T3 (flört): "Sana 'nasılsın' diye sorduğumda cevabı gerçekten merak ediyorum." · "Belki bir gün durup nefes alırım, yanımda sen olursan."

**🍲 Matteo — çapkın.** T1: "Naber güzelim! Aç mısın, otur doyururum." · "Herkese gülücük dağıttım, sana da bir tane." · "Mutfak sıcak, ben daha sıcağım — şaka. Belki." · "Üç masaya iltifat ettim." · "Hanna 'fazla flört' diyor, ben 'sıcakkanlılık' diyorum." — T2: "Herkesle flört ederim, kimseyle kalmam; ya yetmezsem?" · "Sofram dolu, gönlüm boş." — T3 (flört): "Sana söylediklerim gerçek." · "İlk kez biri için her akşam sofra kurmak istiyorum — senin için."

#### Genç geliştiriciler

**💻 Lena.** T1: "Naber! Bütün gece kod yazdım, babama söyleme." · "Prototip berbat ama çalışıyor, biraz." · "Gerçekten o büyük şirkette miydin?" · "Bir bug üç saattir peşimde." · "Babam yine 'sağlam iş' dedi." — T2: "Babam korkudan beni güvenli yola itiyor." · "Ya yeteneksizsem?" — T3: "Senin yaptığını görünce 'mümkünmüş' diyorum, sonra yine kod yazıyorum." · "Bir gün senin gibi gerçek bir oyun çıkaracağım."

**💻 Sam.** T1: "Naber. Üçüncü prototip de çöktü." · "Ben gerçekçilikle ayakta duruyorum." · "Lena yine geceyi kaçırdı." · "Sektör gerçekten o kadar acımasız mı?" · "Büyük şehre gitmem, kanıtlayacağım." — T2: "İçten içe ben de inanmak istiyorum." · "Hiç denememekten korkuyorum." — T3: "Hazır olduğumuzda ilk senin kapını çalarız, söz." · "Sen yıkılıp kalkmışsın; bana da gerekecek o numara."

**💻 Milo.** T1: "Naber... bir şey çiziyordum, kayboldum." · "Sonu olmayan bir okyanus hayal ediyorum." · "Sam 'imkânsız' dedi; hayal etmek bedava." · "Bugün hiçbir şey çizemedim." · "Bea de çiziyor, iyi geliyor." — T2: "Ya yeteneğim yoksa? Yine de çiziyorum." · "Hayallerimden korkuyorum, fazla büyükler." — T3: "Sen pes etmemişsin, bu cesaret veriyor." · "Bir gün o okyanusu yapacağım, sen gösterdin."

#### Çalışan şehirliler

**📮 Felix.** T1: "Naber! Bugün mektup yok ama Marta sordu seni." · "Otuz yıldır bu çanta omzumda." · "Liesl dedikodu sıkıştırdı, taşımam." · "Lena'ya yazılım kitabı geldi, sevindim — söyleme." — T2: "Bazı kapıları kimse açmıyor, çalmak en zoru." · "Lena'yı sağlam işe itiyorum, korkudan." — T3: "Seninkiler hep ağır gelir — hafif iş, ağır kalp; seninki kalp." · "Lena'ya bir şey söyle; senin sözün çok geçer."

**🍺 Hanna.** T1: "Naber. Otur, kötü gün mü iyi gün mü — aynı kadeh." · "Matteo mutfakta şarkı söylüyor." · "Magnus uğradı, 'yine mi sen' dedim." · "Tomas yine surat astı." — T2: "Kocam denizde kayboldu; han hep açık, insanların yeri olmalı." · "O günlerde Marta yanımdaydı." — T3: "İlk geldiğinde köşede tek başınaydın; iyileşiyorsun." · "Bu han senin de evin; kapı açık."

**🌷 Greta.** T1: "Naber evladım, al şu demeti." · "Bahar geldi, Liv'in fideleri tuttu." · "Lena'yı, Tomas'ı, Bea'yı çocukken okuttum." · "Tezgâh bugün sessiz." · "Oğlumdan haber yok." — T2: "Oğlum başkente gitti; 'anneler alışır' yalan." · "En çok çocukların gülüşünü özlüyorum." — T3: "Sen uğrayınca günüm güzelleşiyor, torunum gibisin." · "Çiçek de insan da bakınca açar; sen de açıyorsun."

**🏪 Otto.** T1: "Yine mi sen? Al alacağını." · "Fiyatı sorma, moralim bozuk." · "Herkes marketten alıyor, inat işte." · "Çıkarken kapıyı sık kapat." — T2: "Dükkân elimde kalan tek şey, karım gideli..." · "Pjotr'a, Marek'e ekmek bırakırım; söyleme." — T3: "Sen iyi çocuksun; söylemem zaten ama öylesin." · "Zor günde gel, veresiye yazarım — sana yaparım."

**🧶 Liesl.** T1: "Naberrr, gel otur, anlatacaklarım var!" · "Rosa'nın gözü birine takılmış... neyse." · "Bir kazak daha bitirdim, alan yok." · "Aldo tarçınlı yapmış, kokusu geldi." — T2: "Kocam gideli ev sessiz; dedikodu, bağlı kalma yolum." · "Kimse beni merak etmiyor artık." — T3: "'Dedikodu' dediğim, herkesi kollamam; sen geldin mi diye bakarım." · "Sana kazak ördüm, üşütme."

#### Yaşlılar / işsizler

**🎣 Pjotr.** T1: "Naber genç, otur — nehir kimseyi kovmaz." · "Oltada yem bile yok, söyleme." · "Acelen ne? Nehir hep burada." · "Otto yine ekmek bırakmış, görmezden geliyorum." · "Theo'yla suskun otururuz." — T2: "Atölyem battı, işimi adımı kaybettim, sonra nehre baktım." · "Boş günün de tadı var." — T3: "Bir gün dur, nehre bak; kaybettiğini sandığın orada değil." · "Yarın yine gel, yanında biri olması iyi."

**🐟 Marek.** T1: "Søren'i gördün mü? Kahve sözümüz vardı." · "Ayağımın altında toprak hâlâ sallanıyor." · "İş aramıyorum, sabah kahvem var." · "Sigrid benden iyi ağ atıyor, helal." · "Cassian'ın feneri yandı mı?" — T2: "Søren kaptan oldu, ben karaya vurdum; yaşamayı daha çok sevdim." · "Tutunmak herkesin harcı değil." — T3: "Ara sıra kıyıya otur, orada da hayat var." · "Bana 'başarısız' derler, ben 'mutluyum' derim."

**👵👴 Wilhelm & Edith.** T1 (Edith): "Naber yavrum, Wilhelm uyukluyor." · "Elli yıl; sırrı, her sabah yeniden seçmek." — T1 (Wilhelm): "Tanıştık mı? İsimler kaçıyor, ama yüzün iyi." · "Saati nereye koydum — Edith bilir." — T2 (Edith): "Bazı sabahlar beni tanımaz, yeniden tanıtırım, yeniden âşık olur." · "Bin kere kavga ettik, gitmek aklımıza gelmedi." — T3 (Edith): "Sevmek, onu her gün yeniden seçmektir." · "Birini bulursan fırtınada bırakma." — T3 (Wilhelm, berrak an): "Adını unutsam da yüzünü unutmam; sevgi hafızadan derinde."

#### Gençler / çocuklar

**🧒 Tomas (16).** T1: "Annem hanı devralmamı istiyor, sıkıcı." · "Rex'in arcade'inde makineleri kurcalıyorum." · "Buradan gitmek istiyorum; sen döndün, neden?" · "Kai yüzme öğretiyor ama bağırıyor." — T2: "Annemin hayatını yaşamak istemiyorum, nasıl söylerim?" · "Babam kaybolmadan önce... hatırlamıyorum bile." — T3: "Her şeyini kaybetmişsin, yine başlamışsın; nasıl korkmadın?" · "Belki kendi şeyimi burada da kurabilirim, sen yaptın gibi."

**🧒 Pippa (12).** T1: "Sen o şehirden gelen adamsın! Gökdelenler bulutları deliyor mu?" · "Bak, deniz kabuğu! Kulağına tut." · "Pjotr'la balık tutuyoruz ama tutamıyoruz." · "Kai yüzme öğretti, boğuluyordum, eğlenceliydi!" · "Bir fikrim var, dinle!" — T2: "Annem babam pek yok, herkes göz kulak oluyor." · "Deniz çok büyük geliyor bazen, ama korkmuyorum, pek." — T3: "Üzgün müsün bazen? Deniz kabuğuna bakınca geçiyor — al, sana." · "Büyüyünce senin gibi olacağım."

**🎨 Bea (15).** T1: "Şu duvara çizdim, belediye kızacak, umurumda değil." · "Nadia gibi olacağım." · "Sanat meslek değil mi yani?" · "Rosa'yla iyi ekibiz." · "Sprey boya bitti, para yok." — T2: "Annem 'aç kalırsın' diyor; ama çizmezsem boğulurum." · "Nadia 'yeteneğin var' dedi, uçuyorum." — T3: "Her şeyini riske atmışsın; ben de sanat için yapabilir miyim?" · "Bir gün koca bir duvarı boyayacağım; sen ilk inanmıştın."

---

### Aile/Bağ Ağı
Felix → Lena (kızı) · Hanna → Tomas (oğlu) · Aldo → Rosa (yeğeni) · Bruno → Bjorn (kardeşi) · Søren → Marek (dostu) · Nadia → Bea (usta-çırak) · Greta → başkentteki oğlu · Liesl → herkesi söylentiyle bağlar · Wilhelm & Edith = aşkın kalıcı yüzü. *(Yarn değişkenleri + `npcs.ts` `relations` ile.)*

---

## Yaşlanma & Oyun Süresi (Spec A dışı — tasarım kaydı)

- **Oyun süresi:** Ana yaşam/kariyer arc'ı **~30 yıl**; doruk + emeklilik/final sahnesi. Sonrası isteğe bağlı **sandbox** (yıl sınırı yok). Oyuncu boşanma sonrası orta yaşta (~35) başlar, ~65'e/emekliliğe varır.
- **NPC yaşlanma & yaşam kilometre taşları:** Yıllar geçtikçe NPC'ler yaşlanır; çocuklar büyür ve eşikte yeni roller açılır — ör. **Tomas 18'de işe alınabilir** (ileride romantizm de açılabilir), Pippa/Bea sonraki yıllarda. Elderlar için dokunaklı yaşam-sonu olayları (Wilhelm vb.) hafif tutulur.
- **Bağ:** NPC sistemini (Spec A) **çalışan sistemine** bağlar. **Kendi spec'i** olmalı (ayrı mekanik: zaman→yaş→milestone). Spec A kapsamında değil; burada karar olarak kaydedildi.

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
