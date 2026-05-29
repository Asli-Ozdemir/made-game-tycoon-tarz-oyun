# Senaryo — Giriş Sahneleri (Kovulma + İlk Yayın): Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Faz 4B cutscene altyapısının üzerine gerçek senaryo içeriği — 5 arkaplana özgü kovulma sahnesi + ilk yayın sahnesi. Genel arc sadece kabaca taslaklanır.
**Bağlam:** [Faz 4B Ara Sahne tasarımı](2026-05-29-faz4b-ara-sahne-design.md) altyapıyı kurdu; diyaloglar `[PLACEHOLDER]` idi. Bu doküman o placeholder'ların yerine geçecek gerçek içeriği tanımlar.

---

## Genel Bakış

Oyunun açılışı iki kritik ara sahneden oluşur:

1. **Kovulma** — Karakter yaratma wizard'ı bittiğinde tetiklenir. Oyuncunun seçtiği arkaplana göre **5 farklı varyant**tan biri oynar. Her varyant 4 frame: kovulma → boşanma → mahkeme → sahil evine dönüş.
2. **İlk Yayın** — Oyuncu ilk oyununu yayınladığında tetiklenir. Kişisel, yalnız bir an. Rakip şirket geçmez (arc tohumu sonraki bir sahneye bırakılır).

**Ton:** Buruk-gerçekçi. Sessiz öfke ve kararlılık; kurumsal soğukluk + kişisel acı. Drama abartılmaz.

**Anlatıcı yoktur.** Tüm anlatım karakter replikleriyle taşınır. (4B'deki `Anlatıcı` konuşmacısı bu sahnelerde kullanılmaz.)

---

## Anlatı Yayı (kovulma sahnesinin ortak iskeleti)

Beş varyant da aynı 4-frame beat yapısını paylaşır; **yalnızca diyalog metni** arkaplana göre değişir:

| Frame | Arka plan | Beat | Konuşmacılar |
|-------|-----------|------|--------------|
| F1 | `office` | Kovulma anı — soğuk, kişisel acıyı karşılamayan bir yönetici | Yönetici (arkaplana göre değişir) + `{{playerName}}` |
| F2 | `bedroom` | Boşanma — ilgisizlik/aşırı çalışma tartışması → eş "başka biri var" der → oyuncu anlaşmalı ayrılığı önerir → eş son sözü söyler | `Eş` + `{{playerName}}` |
| F3 | `court` | Kısa mahkeme görseli (anlaşmalı boşanma onayı) | `Hâkim` + `{{playerName}}` |
| F4 | `coast` | Ölen anne-babadan kalan sahil evine yalnız dönüş + kıvılcım (`{{studioName}}`) | `{{playerName}}` |

**Ortak hikâye mantığı:** Karakter işten çıkarılır; büyük şehirdeki gayrimenkulünü satıp (anlaşmalı boşanmada eşle ikiye böler) ve ölen anne-babasından kalan küçük bir sahil kasabasındaki eve döner. Oyun, oyuncu bu evde **tek başına** başlar.

> **`houseSale` ile uyum:** `backgrounds.ts`'teki `houseSale` değeri (oyuncunun başlangıç sermayesi) artık **paylaşımdan sonra oyuncuya kalan pay** olarak yorumlanır. Sayılar değişmez; sadece anlatısal çerçeve "evi ikiye böldük" olur. `backgrounds.ts`'teki mevcut `houseStory` metinleri wizard'da gösterilmeye devam eder; bu sahnelerle çelişmez (ne sattığını söyler, sahne ise boşanma + sahil evine dönüşü gösterir).

---

## Gameplay / Tasarım Notları (cutscene dışı, ileride uygulanır)

- **Total sandbox.** İntro bittiğinde oyuncu sahil evinde yalnız başlar. Hiçbir şey zorunlu değil.
- **Yumuşak ana görev:** "Bir ofis tut / kendi stüdyonu kur." Yönlendirici bir hedeftir, **mecbur değildir.**
- **NPC işleri:** Garsonluk, "bana bir internet sitesi yap" gibi serbest/freelance işleri oyun içinde **NPC'ler** verir — cutscene karakteri bunları monolog içinde *saymaz*. Karakterin repliklerinde iş seçenekleri listelenmez.
- Bu, ana spec'teki çift-mod (keşif + tycoon) ve sandbox felsefesiyle örtüşür.

---

## Veri Yapısı Değişiklikleri

Faz 4B'deki `src/types/cutscene.ts` ve `src/data/cutscenes.ts` aşağıdaki gibi genişletilir.

### `src/types/cutscene.ts`

```ts
import type { BackgroundId } from '@/data/backgrounds'

export interface DialogLine {
  speaker: string  // "İK Müdürü", "Patron", "Yeni CEO", "Kurul Başkanı", "Eş", "Hâkim", "{{playerName}}"
  text:    string  // {{playerName}}, {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'court' | 'coast' | 'studio'  // 'court' + 'coast' eklendi
  lines:      DialogLine[]
}

export type CutsceneId = 'kovulma' | 'ilk_yayin'

export interface CutsceneDef {
  id:       CutsceneId
  frames?:  CutsceneFrame[]                          // varyantsız sahneler (ilk_yayin)
  variants?: Record<BackgroundId, CutsceneFrame[]>   // arkaplana özgü sahneler (kovulma)
}
```

> **Not:** `frames` ve `variants` ikisi de opsiyonel; bir sahne ya birini ya diğerini kullanır. `ilk_yayin` → `frames`. `kovulma` → `variants`.

### `cutsceneStore.startCutscene` değişikliği

`startCutscene(id)` çağrıldığında, sahnenin `variants` alanı varsa `characterStore`'dan aktif `backgroundId` okunur ve `variants[backgroundId]` seçilir; yoksa `frames` kullanılır. Geri kalan akış (frameIndex/lineIndex, typewriter, pause) 4B'deki gibi kalır.

### Yeni arka planlar (CSS)

- `court` — mahkeme salonu: ahşap tonları, soğuk ışık, hâkim kürsüsü silüeti.
- `coast` — sahil evi içi: gün batımı/deniz penceresi, eski ahşap mobilya, sıcak ama tozlu.

(4B'deki gibi tümü CSS ile; gerçek asset gelince `<img>` ile değiştirilir.)

---

## Sahne İçeriği

`{{playerName}}` ve `{{studioName}}` runtime'da değiştirilir. `...` tek başına bir replik olarak sessizliği temsil eder (typewriter onu da yazar).

### Kovulma — `variants`

#### 🔍 `kk_uzmani`

**F1 · office**
- İK Müdürü: Otur, {{playerName}}. Uzun tutmayacağım.
- {{playerName}}: Ayakta kalırım. Alışkınım.
- İK Müdürü: Kalite kontrol süreçlerini otomasyona geçiriyoruz. Yeni sistem hataları senden hızlı buluyor.
- {{playerName}}: O sistem on yıl önce benim yazdığım test kılavuzuyla eğitildi.
- İK Müdürü: Karar yukarıdan geldi.
- {{playerName}}: On yıl be, on yıl. Hepsini tek bir kutuya mı sığdırayım?
- İK Müdürü: Tazminatını muhasebeden alabilirsin.

**F2 · bedroom**
- Eş: Kolileri gördüm. Demek gerçek oldu.
- {{playerName}}: "Otomasyon" dediler.
- Eş: Hep iş, hep ekran. Eve geldiğinde bile burada değildin.
- {{playerName}}: O işi bizim için yapıyordum.
- Eş: Hayır, kendin için. Ben yıllardır bu evde yalnızım.
- Eş: ...Başka biri var, {{playerName}}.
- {{playerName}}: ...
- {{playerName}}: Evi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.
- Eş: Seni bir daha görmek istemiyorum.

**F3 · court**
- Hâkim: Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.
- {{playerName}}: ...

**F4 · coast**
- {{playerName}}: Annemlerin evi. Anahtar hâlâ saksının altında.
- {{playerName}}: Tuz ve toz kokuyor. Kimse yok. Sadece ben.
- {{playerName}}: Annem derdi ki: "Bir gün oturur, kendi işini kurarsın."
- {{playerName}}: Belki de zamanı geldi.
- {{playerName}}: {{studioName}}.

#### 🎨 `yaratici_direktor`

**F1 · office**
- Patron: Oyun rekor kırdı, {{playerName}}. Bütün ekip gurur duymalı.
- {{playerName}}: Jenerik akarken adımı aradım. Yoktu.
- Patron: Fikir bir ekip işidir. Telifi şirkette kalır.
- {{playerName}}: O konsepti gece üçte, kendi masamda çizdim. Tek başıma.
- Patron: Fikirler şirkete aittir. Sen de öyleydin.
- {{playerName}}: Demek imzamı silip beni de siliyorsunuz.
- Patron: Eşyalarını topla. Güvenlik aşağıda bekliyor.

**F2 · bedroom**
- Eş: Yine mi kovuldun? Yoksa yine mi "prensip" meselesi?
- {{playerName}}: Eserimi çaldılar. Adımı bile koymadılar.
- Eş: Sen de hep o eserler için yaşadın. Bizim tablomuz hep yarım kaldı.
- {{playerName}}: Sanat böyledir, bedeli olur.
- Eş: Bedelini hep ben ödedim. Yalnızlığı ben taşıdım.
- Eş: ...Başka biri var. Beni gören biri.
- {{playerName}}: ...
- {{playerName}}: Atölyeyi satıp ikiye bölelim. Anlaşmalı bitirelim.
- Eş: Bu sefer kendine bir imza bul. Çünkü beni bulamayacaksın.

**F3 · court**
- Hâkim: Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.
- {{playerName}}: ...

**F4 · coast**
- {{playerName}}: Babamın evi. Duvarda hâlâ çocukken yaptığım resimler.
- {{playerName}}: Boyalar kurumuş, ama duruyor. Kimse silmemiş.
- {{playerName}}: Burada hiçbir fikir çalınmadı.
- {{playerName}}: Bu sefer jenerikte tek bir isim olacak.
- {{playerName}}: {{studioName}}.

#### 💻 `bas_muhendis`

**F1 · office**
- Patron: Proje battı, {{playerName}}. Yatırımcılar bir isim istiyor.
- {{playerName}}: Tarihi üç ay öne siz çektiniz. Ekibi yarıya siz indirdiniz.
- Patron: Teknik taraf senin sorumluluğundaydı.
- {{playerName}}: Uyardım. Her toplantıda, yazılı olarak uyardım.
- Patron: O mailleri kimse hatırlamayacak. Sadece batan projeyi hatırlayacaklar.
- {{playerName}}: Yani günah keçisi ben oluyorum.
- Patron: Çıkışın hazır. Kimseye veda etme, sessizce git.

**F2 · bedroom**
- Eş: Çantanı toplamışsın. Demek bu sefer gerçekten bitti.
- {{playerName}}: Batan geminin faturasını bana kestiler.
- Eş: Eve hep işi getirdin. Şimdi de suçu getiriyorsun.
- {{playerName}}: Suç benim değildi.
- Eş: Biliyorum. Ama haklı olman beni daha az yalnız bırakmadı.
- Eş: ...Başka biri var. Geceleri yanımda olan biri.
- {{playerName}}: ...
- {{playerName}}: Evi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.
- Eş: Bu sefer batarsan, yanında ben olmayacağım.

**F3 · court**
- Hâkim: Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.
- {{playerName}}: ...

**F4 · coast**
- {{playerName}}: Babamın evi. Garajda eski bilgisayarım hâlâ duruyor.
- {{playerName}}: Fişi taktım. Çalışıyor. İnatçı, tıpkı sahibi gibi.
- {{playerName}}: Bu sefer her satır kodun altında benim adım olacak.
- {{playerName}}: Batarsa, gerçekten benim hatam olur. İyi.
- {{playerName}}: {{studioName}}.

#### 📋 `yapimci`

**F1 · office**
- Yeni CEO: Şirkete yeni bir yön çiziyorum, {{playerName}}. Yeni bir kültür.
- {{playerName}}: On iki yıldır bu kültürü kuran bendim.
- Yeni CEO: Açıkçası... bu yeni vizyonla pek uyumlu görünmüyorsun.
- {{playerName}}: "Uyum" derken, hangi sözleşmenin nereye gittiğini bilmemi mi kastediyorsun?
- Yeni CEO: Çok şey biliyorsun. Sorun da tam olarak bu.
- {{playerName}}: Yani bildiklerim yüzünden gidiyorum.
- Yeni CEO: Tazminatın cömert olacak. Karşılığında sessizliğini bekliyoruz.

**F2 · bedroom**
- Eş: Komşulara ne diyeceğiz? Daireyi, arabayı, okulları...
- {{playerName}}: Hepsi o işe bağlıydı. O iş de bitti.
- Eş: Bu hayatı sen seçtin. Bu çevreyi, bu tempoyu. Ben sadece uydum.
- {{playerName}}: Sana iyi bir hayat kurdum.
- Eş: Bana hayat kurdun ama içinde sen hiç yoktun.
- Eş: ...Başka biri var. Akşamları eve gelen biri.
- {{playerName}}: ...
- {{playerName}}: Daireyi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.
- Eş: Aileme bunu açıklamak, sana açıklamaktan kolay olacak.

**F3 · court**
- Hâkim: Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.
- {{playerName}}: ...

**F4 · coast**
- {{playerName}}: Annemlerin evi. Küçükken buradan kaçmak için can atardım.
- {{playerName}}: Şimdi tek sığınağım burası. Tuhaf.
- {{playerName}}: Kimse beni izlemiyor. İlk kez kimseye hesap vermiyorum.
- {{playerName}}: Bildiğim her şey hâlâ kafamda. Ve artık benim.
- {{playerName}}: {{studioName}}.

#### 👔 `eski_ceo`

**F1 · office** (kurul odası)
- Kurul Başkanı: Hisse iki çeyrektir düşüşte, {{playerName}}. Yatırımcılar bir kurban istiyor.
- {{playerName}}: Bu şirketi ben kurdum. Sıfırdan, kendi ellerimle.
- Kurul Başkanı: Ve bugün kurul, gitmen yönünde oy kullandı.
- {{playerName}}: Kaç kişi? Yıllarca yanımda oturanlardan kaçı?
- Kurul Başkanı: Oybirliği. Şirket artık senden büyük.
- {{playerName}}: Şirketi ben büyüttüm. Beni de o yüzden gömüyorsunuz.
- Kurul Başkanı: Basın açıklaması saat beşte çıkıyor. Kapıda araba bekliyor.

**F2 · bedroom**
- Eş: Telefonum susmuyor. Herkes "geçmiş olsun" diyor, ama gözleri gülüyor.
- {{playerName}}: Geçer. Manşetler hep geçer.
- Eş: Manşetlerde senin adın. Ama hep benimki de yanında.
- {{playerName}}: Buna katlanmayı biliyoruz. Birlikte atlattık daha kötülerini.
- Eş: Hayır, sen atlattın. Ben hep arka planda durdum.
- Eş: ...Başka biri var. Beni manşet değil, insan olarak gören biri.
- {{playerName}}: ...
- {{playerName}}: Villayı satıp ikiye bölelim. Anlaşmalı bitirelim, basına yem olmayalım.
- Eş: Seni bir daha görmek istemiyorum. Hele gazetede hiç.

**F3 · court**
- Hâkim: Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.
- {{playerName}}: ...

**F4 · coast**
- {{playerName}}: Babamın evi. Bir zamanlar bana küçük gelirdi.
- {{playerName}}: Şimdi tam. Tam da olması gerektiği kadar.
- {{playerName}}: Beni gömdüklerini sanıyorlar. Mezar taşımı bile yazdılar.
- {{playerName}}: Bir dahaki sefere manşetleri ben yazacağım.
- {{playerName}}: {{studioName}}.

---

### İlk Yayın — `frames`

**F1 · studio** (sahil evinin çalışma köşesi)
- {{playerName}}: Gece yarısını geçti. "Yayınla" tuşu hâlâ ekranda, parlıyor.
- {{playerName}}: Eskiden bu an için bir toplantı odası dolusu insan olurdu. Pasta, alkış, fotoğraf.
- {{playerName}}: Şimdi sadece ben varım. Bir de dışarıda dalga sesi.
- {{playerName}}: ...Basayım mı?

**F2 · studio**
- {{playerName}}: {{studioName}}. İlk oyun. Yayında.
- {{playerName}}: Kimse alkışlamıyor. İlk kez canımı yakmıyor bu.
- {{playerName}}: Çünkü bu sefer jenerikte tek bir isim var. Benimki.
- {{playerName}}: Yorgunum. Ama bu yorgunluk, ilk kez tamamen bana ait.

---

## Genel Arc İskeleti (kaba taslak — 4C'de detaylanır)

1. **Kovulma** ✅ (bu doküman)
2. **İlk Yayın** ✅ (bu doküman) — kişisel, rakip yok
3. *(4C)* Rakibi ilk kez geçince → rakip CEO seni fark eder
4. *(4C)* Eski şirketten biri arar → ahlaki gri seçim
5. *(4C)* Büyük etkinlikte yüzleşme → gerilim doruğu
6. *(4C)* Final → satın al / yık / affet / birleş

Rakip şirketin adı/CEO'su 4C'de netleşecek.

---

## Test Stratejisi (mevcut testlerin genişletilmesi)

`tests/data/cutscenes.test.ts`:
- `ilk_yayin` → `frames` tanımlı, her frame ≥1 satır, her satırın `speaker` ve `text`'i boş değil.
- `kovulma` → `variants` tanımlı; 5 `BackgroundId`'nin **hepsi** mevcut; her varyant 4 frame; her satır geçerli.
- Tüm `background` değerleri izinli kümede (`office`/`bedroom`/`court`/`coast`/`studio`).

`tests/store/cutsceneStore.test.ts`:
- `startCutscene('kovulma')` aktif `backgroundId`'ye göre doğru varyantı seçer.
- `variants` olmayan sahnede (`ilk_yayin`) `frames` kullanılır.
- Geri kalan 4B davranışları (advance / skip / reset / pause) korunur.

---

## Kapsam Dışı

- Genel arc'ın 3–6. sahnelerinin diyalogları (4C).
- Rakip şirket kimliği.
- Gerçek pixel-art asset'leri.
- Ses/müzik.
- `court`/`coast` arka planlarının nihai görsel detayları (CSS placeholder yeterli).
