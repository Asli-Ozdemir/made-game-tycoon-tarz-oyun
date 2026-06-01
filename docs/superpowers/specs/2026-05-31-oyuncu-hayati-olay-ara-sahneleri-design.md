# Oyuncu-Hayatı & Olay Ara Sahneleri: Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** Oyun durumuna (para, romantizm, çalışan, zaman, NPC ölümü…) tetiklenen, buruk-gerçekçi/gri **olay ara sahneleri** + bunları yöneten hafif **olay-cutscene gözcüsü**. Eski eş ipliği, çocuk anları, ahlaki seçim, yıl dönümü, tükenmişlik, yas ve "gelişemeyen çalışan" (Ned) damarları.

## Bağlam

- **Cutscene sistemi** (frame tabanlı, `CUTSCENES`/`CutsceneId`), **A** (`lifeStore` flags/`setFlag`), **C1** (`player_romance_*`/`player_married_*`, `spouseId`/`childIds`), **B** (Wilhelm ölümü vb.), `gameStore` (money/reputation), `employeeStore` (hire/fire), `npcStore` (kalp). Bu doküman bunların üstüne **olay tetikli** kısa sahneler ekler.
- Bağımsız bir içerik/mekanik katmanı; sıralı uygulamada NPC sistemi + A + C1 sonrası gelir.

---

## Mekanizma — Olay-Cutscene Gözcüsü

Bu sahneler **yıllık değil, durum değişimine** tetiklenir (para düşünce, Ned kovulunca, sevgili olunca — anında). A'nın yıllık motoru yetmez; küçük bir gözcü gerekir.

- **`src/data/storyEvents.ts`:** bildirimsel olay listesi. A'nın `LifeEvent` benzeri yapısı; tetik bir **`test(ctx)`** koşulu, etki genelde `cutscene` (+ opsiyonel `setFlag`). `once: true`.
- **`src/store/storyEventStore.ts`** (veya mevcut bir gözcüye kanca): ilgili **state değişimlerinde** (money, romanceStore, employeeStore, lifeStore flags, timeStore yıl) `evaluate()` çağrılır → koşulu sağlanan & daha önce tetiklenmemiş olayları bulur → cutscene açar, `fired`'e ekler.
- **Ctx:** `{ money, yearsElapsed, hasFlag, partnerId, spouseId, heartOf, firedEmployee(npcId), ... }` — store'lardan türetilir.
- **Tetik noktaları (where `evaluate()` çağrılır):** para değiştiğinde (gameStore), çalışan kovulduğunda (employeeStore.fire), romantizm bayrağı set olduğunda (romanceStore), yıl değiştiğinde (Dashboard), NPC öldüğünde (lifeStore retire). Hepsi `evaluate()` çağırır; gözcü `once` ile tek sefer garantiler.

> Not: Save/load gelince `fired` set'i persist edilir.

---

## Damarlar (küratörlü, gri, anlatıcısız)

### Eski Eş ipliği
Kovulmada bizi "başka biri var" deyip terk eden eş, yıllar sonra geri döner — kötü değil, hayat gibi.

**Profil/ses:** O dönem yalnızlığa ve ihmale dayanamadı, başkasına gitti; yıllar sonra yoluna girdi. Dürüst, sıcak ama suçluluk taşıyan; özür dilemez, inkâr da etmez — "ikimiz de doğru yere vardık" diyen olgunluk. *(İsim generic "Eski Eş"; kovulmadaki "Eş" ile tutarlı.)* Üç beat'lik arc: **para → düğün → son mektup.**

- **`eski_es_para`** *(tetik: erken oyun `yearsElapsed ≤ ~3` + `money` kritik eşik altı)* — gurur vs yardım. Felix zarf getirir:
  - Felix: "Sana bir zarf var. Gönderen... eski adresinden. Açayım mı, götüreyim mi?"
  - {{playerName}}: "...Bırak."
  - Eski Eş (mektup): "{{playerName}}. Battığını duydum — bu küçük şehirde her şey duyulur. İçinde biraz para var. Gururun var; borç de, hiç geri verme de. Sadece aç kalmanı izleyemem. Seni hâlâ bir yerimde taşıyorum — istemesem de."
  - {{playerName}}: "Geri yollamalıyım. ...Kira yarın. Yollayamıyorum."
  - {{playerName}}: "Teşekkür bile edemiyorum. Belki bir gün."
  - Etki: küçük `gameStore.addMoney(+X)` (gri yardım); flag `eski_es_para_alindi`.

- **`eski_es_dugun`** *(tetik: `player_romance_*` set + yearsElapsed ≥ ~5)* — Felix davetiye getirir; oyuncu giderse:
  - Eski Eş: "Geldin demek. Çağırırken elim titredi; ama gelmeni istedim, başka türlü olmazdı."
  - {{playerName}}: "Davetiyeyi görünce uzun düşündüm. Yine de buradayım."
  - Eski Eş: "Mutlu görünüyorsun. Yanındaki sana yakışmış — gözlerin daha sakin artık."
  - {{playerName}}: "Sen de mutlu görünüyorsun. Sonunda ikimiz de."
  - Eski Eş: "O zaman seni bekleyemedim; yalnızlık ağırdı, sen hep ekrandaydın. Özür dilemeyeceğim — ama pişman da değilim. İkimiz de doğru yere vardık."
  - {{playerName}}: "Vardık. Farklı teknelerle, aynı limana."
  - Eski Eş: "...Bir dans? Eski bir dost olarak, bir kez. Sonra herkes kendi sofrasına." · {{playerName}}: "Bir kez."
  - *(Bekar varyantı, opsiyonel: "Yalnız geldin... üzülme, ben de uzun yalnız kaldım. Birini bulacaksın." — daha melankolik.)*

- **`eski_es_son_mektup`** *(tetik: geç oyun / `arcEnd` yakını)* — kapanış:
  - Eski Eş (mektup): "{{playerName}}. Yıllar oldu. O düğünde dans ettiğimiz günü hatırlıyorum bazen. İkimiz de yaşlandık, ikimiz de yola devam ettik. Sana hiç kızmadım — sadece korkmuştum. Umarım o ev seni iyileştirdi. Tuz hâlâ aynı kokuyor mu?"
  - {{playerName}}: *(mektubu katlar, çekmeceye koyar)* "Kokuyor. Hâlâ kokuyor."

**Bağlar:** "tuz kokusu" → kovulma sahil evine callback; saklanan mektup → "saklanan nesne" motifi (Marcus/Nina/Clara); "farklı teknelerle aynı limana" → su/Søren teması.

### A) Çocuk anları *(koşul: `childIds` dolu — C1)*
- **`cocuk_ilk_kelime`:** {{playerName}}: "İlk kelimesi 'baba/anne' olur sanmıştım." · Çocuk: "...Deniz." · {{playerName}}: "Deniz. Tabii — bu evin ilk öğrettiği şey."
- **`cocuk_gecmis_sorusu`** *(çocuk büyüyünce)*: Çocuk: "Neden hep deniz, neden geldin?" · {{playerName}}: "Şehir bir şeyimi aldı, deniz geri verdi. Bir gün anlarsın."

### B) Eski hayattan biri — ahlaki seçim *(koşul: yearsElapsed eşik)*
- **`eski_meslektas`** — seni günah keçisi yapılırken susan biri, düşmüş, iş ister:
  - Eski Meslektaş: "O toplantıdaydım — senin suçlandığın. Sustum. Şimdi ben de battım. Bir iş... olur mu?"
  - **Seçim:** *İşe al (affet)* / *Reddet (sustuğun gibi sus)* / *Otur, konuşalım* — 4C ahlaki aynasının kişisel yankısı. (Küçük seçim ekranı / dallanma.)

### C) Yıl dönümü *(koşul: her ~10 yıl)*
- **`sahil_yildonumu`:** {{playerName}}: "On yıl oldu bu eve geleli. Anahtar hâlâ saksının altında." *(aileyle / yalnız varyantı)*

### D) Tükenmişlik *(koşul: A enerji düşüşü / aşırı crunch)*
- **`tukenme_marta`:** Marta: "Yine masada yığılmışsın. Bu sefer dinle." · {{playerName}}: "Bir oyun daha bitsin..." · Marta: "Oyun bekler, kalbin beklemez. Eve git."

### E) Yas *(koşul: `wilhelm_dead` — B)*
- **`wilhelm_yas_oyuncu`** — oyuncunun cenazeye/sonrasına dair kısa, sessiz anı (B'yi oyuncuya bağlar).

### F) Gelişemeyen çalışan — Ned Carver
**Profil/ses:** Buralı, hevesli, **yeteneksiz** ama yılmayan hayalperest; senin eski oyunlarınla büyümüş en büyük hayranın. Çaba ≠ yetenek gerçeğinin canlı hâli — liyakat/fayda mantığının insani karşı-argümanı. Sıcak, onurlu, asla zavallı değil. **Baştan seçilebilir NPC** (sahil mahallesi, kalbi var) + **işe alınabilir** (özel aday, `noGrowth` — gelişmez).

**Kalp diyalogları:**
- T1: "Naber patron! Sana 'patron' diyorum, alışkanlık — bir gün gerçekten olur belki." · "Bu gece üç saat kod çalıştım; hâlâ aynı hatayı yapıyorum ama azaldı gibi? Azaldı, değil mi?" · "Senin ilk oyununu yüz kere bitirdim, ezbere biliyorum."
- T2: "Öğretmen 'el işine bak' demişti, orada da battım. Tek sevdiğim oyunlar." · "Annem 'gerçekçi ol' der; gerçekçi olsam yatakta yatardım."
- T3 (arkadaşlık): "Sen benimle vakit kaybeden tek kişisin patron. Çoğu yeteneksizle konuşmaz bile. Unutmam." · "İtiraf edeyim: belki hiç beceremeyeceğim. Ama denerken mutluyum — bu da bir şeydir, değil mi?"

**Arc:** arkadaş ol → (işe al) → gelişmez → **dayanamayıp çıkarırsan** → `ned_evsiz` (yüksek kalpse `ned_evsiz_dost`); **tutarsan** → `ned_kaliyor`.

- **`ned_ise_alindi`:** Ned: "Beni mi? Gerçekten mi? Pişman etmeyeceğim — gece gündüz, yemin." · {{playerName}}: "Biliyorum Ned. Otur şu masaya." · Ned: "Kendi masam. Bir oyun stüdyosunda. *(sesi titrer)*"
- **`ned_calisiyor`** *(ara ara, gelişmez)*: Ned: "Bütün geceyi verdim, bak çalıştı! ...bir kısmı. Gerisi yarın." · {{playerName}}: *(kod bozuk)* "...İdare eder, Ned."
- **`ned_evsiz`** *(kovuldu — standart)*:
  - {{playerName}}: "Ned, otur. Bu yürümüyor." · Ned: "Biliyordum, bekliyordum. Kızmadım — sen bana en uzun şansı verensin."
  - *(sokakta)* {{playerName}}: "Ned? Burada ne..." · Ned: "İş bulamadım — kimse yeteneksizi istemiyor, sen bile sonunda istemedin. Haklıydın." · {{playerName}}: "Beni de bir zamanlar böyle göndermişlerdi." · Ned: "Boş ver beni. Sen büyük işler yaparsın; ben sadece denemiştim."
- **`ned_evsiz_dost`** *(yüksek kalpse — dostluğa ihanet, daha yırtıcı)*:
  - *(kovma)* Ned: "Sen de mi? ...Tamam, sorun değil. *(gülmeye çalışır, başaramaz)* En azından arkadaştık, o kalsın bende."
  - *(sokakta)* Ned: "Selam patron. Korkma, para istemem. Sadece... bir ara konuşurduk ya, onu özledim. İşi değil — seni." · {{playerName}}: "Ned, ben—" · Ned: "Açıklama yapma. Rakamlar rakamdır; sen de öğrenmişsin. Kendine iyi bak."
- **`ned_kaliyor`** *(tutarsan)*: Ned: "Beni kovmadın; herkes kovardı. Faydam yok, biliyorum." · {{playerName}}: "Herkes bir tabloya sığmaz, Ned. Sen kal." · Ned: "O zaman kahveyi ben yaparım — en iyi yaptığım iş! Stüdyonun morali bende."

**Mekanik (employeeStore):** Ned özel aday — düşük skill + **`noGrowth: true`** (XP kazanmaz, sabit). İşe alınca çıktı zayıf; tutmak ekonomik yük ama `ned_kaliyor` sonrası **küçük moral bonusu** (şefkatin ödülü).
**Tema:** Kovulmayı yaşayan oyuncu, bir **dostunu** "verimsiz" diye kovuyor → Crane'in tablosunun + Marta'nın "tablo titremez, insan titrer"inin en kişisel hâli. **Fayda(Vivian) ↔ Bakım(Marta)** seçimi.

---

## Genişleme: "Tüm karakterlerle ara sahneler"
Çerçeve **veri-odaklı**: her NPC'ye kalp-event'i / olay sahnesi eklemek = `storyEvents.ts`'e yeni kayıt + cutscene. Kadro büyüdükçe (felsefe NPC'leri, romantizm adayları, kasabalılar) her birine küçük dönüm anları eklenebilir — sonraki turlarda derinleşir. Bu spec çerçeveyi + ilk damarları kurar.

---

## Test Stratejisi
- Gözcü: koşulu sağlanan olay bir kez tetiklenir; `fired`'deyse tekrar tetiklenmez; ilgisiz state değişiminde tetiklenmez.
- `eski_es_para`: erken oyun + para eşik altı → tetiklenir; para yüksekken tetiklenmez.
- `eski_es_dugun`: `player_romance_*` yokken tetiklenmez; set + yıl eşiği → tetiklenir.
- `ned_evsiz`: Ned hire→fire dizisi → tetiklenir; hiç işe alınmadıysa / tutulduysa tetiklenmez.
- `eski_meslektas` seçim dallanması: üç seçim doğru sonucu/flag'i verir.
- Tüm cutscene id'leri `cutscenes.ts`'te tanımlı; içerik anlatıcısız, placeholder yok.

## Kapsam Dışı
- Ned'in `noGrowth` çalışan mekaniğinin tam dengesi (employeeStore eki — küçük; planda).
- Eski eşin tam karakter profili (generic "Eski Eş"; isim opsiyonel).
- Her NPC için tam kalp-event seti (genişleme; ilk damarlar burada).
- Save/load persist'i (`fired`).
