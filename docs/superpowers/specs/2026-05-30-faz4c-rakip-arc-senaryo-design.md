# Faz 4C — Rakip Arc Senaryosu (Nexus / Victor Crane): Tasarım Dokümanı

**Tarih:** 2026-05-30
**Kapsam:** Mevcut 4C rakip mekaniklerinin (`rivalStore`, `awardsStore`, `ResolutionScreen`) `[PLACEHOLDER]` cutscene diyaloglarının gerçek senaryoyla doldurulması + bir yeni orta sahne (`nexus_meeting`).
**Bağlam:** 4C mekanikleri zaten kurulu (notice → rival → nemesis → resolution; ödül töreni). Bu doküman o tetikleyicilere bağlı cutscene'lerin **içeriğini** tanımlar. Stil olarak [giriş sahneleri](2026-05-30-senaryo-intro-sahneleri-design.md) ile aynı: **buruk-gerçekçi, anlatıcısız.**

---

## Tematik Çekirdek

Arc'ın felsefi omurgası — **iki insan, iki duruş:**

- **Victor Crane** — Nexus CEO. Hayatı (nehrin akışını), insanın güdüsel kötülüğünü **kabul etmiş**. Güç için akıntıya bırakmış kendini; gerekirse ezer. Makyavelist: bunu yükselmek için **bilerek** yaptı, pişman değil, dürüst. Düsturu: **"Sevgi ucuzlar, korku tutar."**
- **Ana karakter** — Akışı **değiştirmeye** çalışıyor. Nehir onu bataklığa sürüklese de savaşarak çıkıyor. Kendini aşmaya, **içindeki kötülükle bile** dövüşmeye uğraşıyor.

**Çatışma:** Güdüsel kötülüğü kanun sayan Crane ↔ kendini aşmaya çalışan ana karakter. **Oyuncunun 4 finali** bu mücadelenin sonucudur: Satın Al / Yok Et → akıntı kazandı, Crane'e dönüştün; Affet / Birleş → akışı yönlendirdin.

**Crane gri bir karakterdir** — kartoonize kötü değil; her kararı iş açısından mantıklı, insani, hatta karizmatik. Robot gibi mesafeli değil; candid ve keyifli konuşur.

### Leitmotif kullanımı (ölçülü)
- **"Sevgi ucuzlar, korku tutar"** → her `nexus_notice` varyantının kapanışında (her oyuncu bir kez duyar) + `awards_lose_to_nexus`'ta + `nexus_resolution`'da geri döner.
- **Nehir analojisi** → sadece **iki yerde**: `nexus_meeting` (tek yoğun beat) + oyuncunun seçtiği `nexus_resolution` finali (tek satır). Başka hiçbir sahnede nehir geçmez.

---

## Karakterler

| Konuşmacı | Kim |
|-----------|-----|
| `Victor Crane` | Nexus CEO, baş antagonist (isim sabit, İngilizce/Avrupai). |
| `Klein` | Crane'in asistanı (yan karakter). |
| `Sunucu` | Ödül töreni sunucusu (yayından duyulur). |
| `Rakip Kurucu` | Generic indie rakip kurucusu (`indie_resolution`). |
| `{{playerName}}` | Oyuncu. |

> `Anlatıcı` bu arc'ta **kullanılmaz** (mevcut placeholder'lardaki `Anlatıcı` satırları kaldırılır).

### Arka Plan ↔ Crane Tanışıklığı

Nexus = oyuncuyu kovan şirket (`isFormerEmployer: true`). Her geçmişin Crane'le ilişkisi farklı — bu `nexus_notice` varyantlarını belirler:

| Arka plan | Crane'le ilişki |
|-----------|-----------------|
| 📋 Yapımcı | Kovulmadaki "Yeni CEO" = Crane. Doğrudan geçmiş. |
| 👔 Eski CEO | Nexus'u oyuncu kurdu; Crane kurulun yerine koyduğu gaspçı. |
| 🎨 Yaratıcı Direktör | Fikrini çalan "Patron" artık CEO koltuğunda. |
| 💻 Baş Mühendis | Bir Nexus yöneticisi günah keçisi yaptı; Crane'i uzaktan tanır. |
| 🔍 KK Uzmanı | İK kovdu; Crane'i hiç görmedi (gerçek tanışma `nexus_meeting`'te). |

---

## Sahne Envanteri ve Tetikleyiciler

| Cutscene | Tetikleyici (mevcut/yeni) | Yapı |
|----------|---------------------------|------|
| `nexus_notice` | `rivalStore.noticeCheck` (Nexus eşiği aşılınca) | **Arka plana özgü 5 varyant** |
| `nexus_meeting` ⭐YENİ | Nexus ilişkisi `rival`'a geçince (yeni tetikleyici) | Tek sahne (flat) |
| `awards_win` | `awardsStore` oyuncu kazanınca (KK/Mühendis) | Tek sahne, `server_room` |
| `awards_win_gallery` | Oyuncu kazanınca (Yaratıcı Direktör) | Tek sahne, `gallery` |
| `awards_win_boardroom` | Oyuncu kazanınca (Yapımcı/Eski CEO) | Tek sahne, `boardroom` |
| `awards_lose_to_nexus` | Ödülü Nexus kazanınca | Tek sahne, `studio` |
| `nexus_resolution` | `ResolutionScreen` (Nexus) | **Seçime özgü 4 final** |
| `indie_resolution` | `ResolutionScreen` (indie rakip) | Tek sahne, `studio` |

---

## Veri Yapısı Değişiklikleri

Bu arc, [giriş sahneleri planındaki](../plans/2026-05-30-senaryo-intro-sahneleri.md) `variants` modeli üzerine kurulur. O plan henüz uygulanmadıysa, bu plan onun veri-modeli adımlarını da içerir/varsayar.

### `src/types/cutscene.ts`

```ts
import type { BackgroundId } from '@/data/backgrounds'
import type { ResolutionChoice } from '@/types/rival'

export interface DialogLine { speaker: string; text: string }

export interface CutsceneFrame {
  background:
    | 'office' | 'bedroom' | 'studio' | 'court' | 'coast'   // mevcut + giriş planı
    | 'server_room' | 'gallery' | 'boardroom'               // 4C ödül sahneleri
  lines: DialogLine[]
}

export type CutsceneId =
  | 'kovulma' | 'ilk_yayin'
  | 'nexus_notice' | 'nexus_meeting'
  | 'awards_win' | 'awards_win_gallery' | 'awards_win_boardroom' | 'awards_lose_to_nexus'
  | 'nexus_resolution' | 'indie_resolution'

export interface CutsceneDef {
  id:             CutsceneId
  frames?:        CutsceneFrame[]                                  // varyantsız sahneler
  variants?:      Record<BackgroundId, CutsceneFrame[]>            // nexus_notice (arka plana göre)
  choiceVariants?: Partial<Record<ResolutionChoice, CutsceneFrame[]>>  // nexus_resolution (seçime göre)
}
```

### Frame resolver (`src/data/cutscenes.ts`)

`getCutsceneFrames` bir bağlam alır:

```ts
export function getCutsceneFrames(
  id: CutsceneId,
  ctx: { background: BackgroundId | null; choice?: ResolutionChoice },
): CutsceneFrame[] {
  const def = CUTSCENES[id]
  if (def.choiceVariants && ctx.choice) {
    return def.choiceVariants[ctx.choice] ?? def.frames ?? []
  }
  if (def.variants) {
    return def.variants[ctx.background ?? 'kk_uzmani']
  }
  return def.frames ?? []
}
```

> **Not:** Giriş planında resolver imzası `(id, background)` idi. Bu arc onu `(id, ctx)` nesnesine genişletir. İki plan birlikte uygulanırken bu birleştirilmeli (tek imza: `ctx`).

### Resolution seçimini cutscene'e taşımak

`nexus_resolution` seçime göre dallandığı için `ResolutionScreen` seçilen `ResolutionChoice`'u cutscene'e iletmeli. `cutsceneStore`'a bir alan eklenir:

```ts
// cutsceneStore
resolutionChoice: ResolutionChoice | null   // startCutsceneForce öncesi set edilir
setResolutionChoice: (c: ResolutionChoice | null) => void
```

`ResolutionScreen.handleChoice` içinde, `startCutsceneForce('nexus_resolution')` çağrılmadan önce `setResolutionChoice(choice)` çağrılır. `cutsceneStore` frame çözerken `getCutsceneFrames(id, { background, choice: resolutionChoice })` kullanır. `endCutscene`/`reset` `resolutionChoice`'u `null`'lar.

### Yeni tetikleyici: `nexus_meeting`

Nexus ilişkisi `noticed` → `rival`'a geçtiği anda (`rivalStore` içinde bu geçişin yapıldığı yerde) `useCutsceneStore.getState().startCutsceneForce('nexus_meeting')` çağrılır. (Mevcut kodda `rival`'a geçişin nerede yapıldığı doğrulanmalı; tetikleyici oraya eklenir.)

### Yeni CSS arka planları (`CutscenePlayer.SceneBackground`)

`server_room`, `gallery`, `boardroom` için CSS dalları eklenir (4B/giriş desenindeki gibi; gerçek asset gelince değişir). `office` zaten var (`nexus_notice`, `nexus_meeting`, `nexus_resolution` onu kullanır).

---

## Sahne İçeriği

`{{playerName}}` / `{{studioName}}` runtime'da değişir. `...` = sessizlik. Parantez içi *(eylem)* yönergeleri diyalog metnine dahil edilir (typewriter yazar) — ileride asset/animasyon gelince ayrıştırılabilir.

### `nexus_notice` — `variants` (arka plana göre)

#### 📋 yapimci — office
- Klein: Şu yükselen stüdyo... kurucusunu hatırlarsınız.
- Victor Crane: *(gülümser)* Elbette. Onu kovduğum gün koltuğum sağlamlaştı.
- Victor Crane: Çok şey biliyordu, Klein. Bilen adam, taht için fazla tehlikelidir.
- Klein: Tehdit olduğu için mi gönderdiniz?
- Victor Crane: Tehdit değildi, basamaktı. Yukarı çıkmak için birine basarsın — o da oradaydı, o kadar.
- Klein: Şimdi geri döndü.
- Victor Crane: Güzel. Açıkçası sıkılmıştım. İyi rakip iyi aynadır — bakalım ben mi haklıydım.
- Victor Crane: Beni sevmesini beklemiyorum. Makyavel ne demiş — hem sevilip hem korkulamıyorsan, korkulmayı seç. Sevgi ucuzlar, korku tutar.

#### 🔍 kk_uzmani — office
- Klein: Küçük bir stüdyo dikkat çekiyor. {{studioName}}. Kurucusu eski çalışanımızmış.
- Victor Crane: Hangi ekipten?
- Klein: Kalite kontrol. Otomasyonda çıkarmışız.
- Victor Crane: Ah, o büyük temizlik. Dört yüz kişi gönderdim, hisse yüzde on iki fırladı. Kurul adımı o gün ezberledi.
- Victor Crane: Demek içlerinden biri stüdyo kurmuş. *(eğlenir)* Hoşuma gitti doğrusu.
- Klein: Endişelenelim mi?
- Victor Crane: Daha değil. Ama yetenekliyi yakından severim — ya yanına alırsın, ya önünü kesersin.
- Victor Crane: Korkutmak da var tabii. Makyavel boşuna yazmamış: sevgi ucuzlar, korku tutar.

#### 👔 eski_ceo — office
- Klein: Efendim, {{studioName}} büyüyor. Kurucusu... bu şirketin kurucusu.
- Victor Crane: *(koltuğa yaslanır)* Bu koltuğu o yaptı. Ben sadece daha çok isteyeni oynadım.
- Klein: Kurulu siz mi çevirdiniz?
- Victor Crane: Çevirmedim, dinledim. Onlar korkuyordu, ben cesaret sattım. Oylar öyle döndü.
- Klein: Geri almaya gelir mi?
- Victor Crane: Umarım gelir. Bir adamı gerçekten tanımak için ondan bir şey çalman gerekir.
- Victor Crane: Ne yapacağını izlemek — bu işin tek gerçek keyfi.
- Victor Crane: Beni asla sevmeyecek. Olsun. Prens'te der ki — sevgi ucuzlar, korku tutar.

#### 🎨 yaratici_direktor — office
- Klein: Yükselen bir stüdyo var. {{studioName}}. Tarzı tanıdık geliyor.
- Victor Crane: Gelmeli. O tarzı kurula ben sattım. *(gülümser)* Fikir benim değildi tabii.
- Klein: Onun fikriydi.
- Victor Crane: Fikir ucuzdur, Klein. Onu doğru odada söyleyen kişi pahalı. Ben o odadaydım, o değildi.
- Klein: Şimdi aynı fikirle dönüyor.
- Victor Crane: Ve bu sefer odanın sahibi o. Adil sayılır.
- Victor Crane: İtiraf edeyim — o oyunu çıkardığım gün en çok onun ne diyeceğini merak etmiştim.
- Victor Crane: Ondan af beklemiyorum. İstediğim, çekinmesi. Sevgi ucuzlar, Klein — korku tutar.

#### 💻 bas_muhendis — office
- Klein: {{studioName}} teknik olarak etkileyici. Kurucusu eski mühendislerimizden.
- Victor Crane: Batan proje, değil mi? O enkaza birinin adını yazmamız gerekiyordu.
- Klein: Onu siz mi seçtiniz?
- Victor Crane: Seçmedim, izin verdim. En sessiz, en az dostu olan seçilir — kural budur.
- Victor Crane: Oysa kod kusursuzdu. Sorun yönetimdeydi, yani bendeydi. Ama itibar pahalı, doğruluk ucuz.
- Klein: Şimdi karşımızda.
- Victor Crane: Kusursuz kod yazan, kusursuz kin de tutar. Demek bu işin tadı kaçmayacak.
- Victor Crane: Bana kin tutsun, sevgisi umurumda değil. Makyavel haklıydı: sevgi ucuzlar, korku tutar.

### `nexus_meeting` ⭐YENİ — frames · office
- Victor Crane: Sonunda yüz yüzeyiz. Otur. Seni uzaktan izliyordum.
- {{playerName}}: Neden çağırdın?
- Victor Crane: Merak. Beni bu kadar zorlayan kim, görmek istedim.
- Victor Crane: Hayatta tek şey öğrendim: akıntıya karşı yüzülmez. Ben bıraktım kendimi — bak, neredeyim.
- {{playerName}}: Akıntı seni bataklığa götürse de mi?
- Victor Crane: Orada da kral olurum. Boğulmaktan iyidir.
- {{playerName}}: Ben kürek çekeceğim. Yorulsam da, bataklığa saplansam da.
- Victor Crane: *(gülümser)* Herkes öyle der; su sabırlıdır. Yine de... göster bakalım. Kimse beni uzun zamandır şaşırtmadı.

### `awards_win` — frames · server_room (🔍 KK Uzmanı + 💻 Baş Mühendis)
- Sunucu: *(yayından)* Ve yılın oyunu ödülü... {{studioName}}!
- {{playerName}}: Duydum. Makinelerin uğultusu arasında, tek başıma.
- {{playerName}}: Sahnede birileri benim için alkışlıyor. Hiçbirini tanımıyorum.
- {{playerName}}: Kazandım. Ama elimi sıkacak kimse yok. Sadece fanların sesi.
- {{playerName}}: Yine de... fena değil. Hiç fena değil.

### `awards_win_gallery` — frames · gallery (🎨 Yaratıcı Direktör)
- Sunucu: *(yayından)* Ve yılın oyunu... {{studioName}}!
- {{playerName}}: Duvardaki çizimlere baktım. Hepsinin altında tek bir imza var. Benimki.
- {{playerName}}: Yıllar önce bu sahnede başkası benim eserimle alkışlanmıştı.
- {{playerName}}: Şimdi alkış bana ait. Ama salon orada, ben buradayım.
- {{playerName}}: Galiba kazanmak, yalnız kalmanın güzel bir yolu.

### `awards_win_boardroom` — frames · boardroom (📋 Yapımcı + 👔 Eski CEO)
- Sunucu: *(yayından)* Ve yılın oyunu... {{studioName}}!
- {{playerName}}: Uzun bir toplantı masası. Bir tek ben varım.
- {{playerName}}: Bir zamanlar böyle bir masadan kovulmuştum. Şimdi masa benim.
- {{playerName}}: Tuhaf — zirveye çıktıkça Crane'i daha iyi anlıyorum.
- {{playerName}}: Ve beni en çok korkutan şey de bu.

### `awards_lose_to_nexus` — frames · studio (tüm geçmişler)
- Sunucu: *(yayından)* Ve yılın oyunu ödülü... Nexus Games!
- {{playerName}}: Tabii ki. Parlak, güvenli, herkesin sevdiği bir oyun.
- {{playerName}}: Crane sahnede gülümsüyor. Beni görmüyor bile.
- {{playerName}}: "Sevgi ucuzlar" demişti. Bu akşam sevgiyi de satın aldı.
- {{playerName}}: Sorun değil. Korku kalıcıysa... ben de sabırlıyım.

### `nexus_resolution` — `choiceVariants` (seçime göre) · office

#### 💰 buyout
- Victor Crane: Demek satın aldın. Çoğunluk hisse artık sende.
- {{playerName}}: Senin bana yaptığını yaptım. Sadece daha pahalıya.
- Victor Crane: Belki seni işten çıkararak hayatını kararttım. Kabul ediyorum.
- Victor Crane: Peki söyle — bu paraya ulaşana dek sen kaç kişinin hayatını kararttın?
- {{playerName}}: ...
- Victor Crane: Güç ezmeden gelmez. Bu benim kuralım değil, doğanın kanunu.
- Victor Crane: "Sevgi ucuzlar, korku tutar" demiştim. Sen ikisini de geçtin — parayı seçtin.
- Victor Crane: *(kıkırdar)* Koltuğu boşaltıyorum. Ama artık benden daha korkunçsun galiba.
- Victor Crane: *(kendini gösterir)* Hayata son sürat kürek çektin. Ama bak — şu kütükle, yani benimle aynı hizadasın. İkimiz de aynı yere vardık.

#### 🔥 destroy
- Victor Crane: Skandalı basına verdin. Yarın sabaha bitmiş olacağım.
- {{playerName}}: Sen de beni böyle bitirmiştin. Tek bir imzayla.
- Victor Crane: Belki seni kovarak hayatını kararttım. Doğru.
- Victor Crane: Ama bu enkaza ulaşana dek sen kaç hayatın üstüne bastın?
- {{playerName}}: ...
- Victor Crane: Güç ezmeden gelmez. Doğanın kanunu bu — ben koymadım, sadece okudum.
- Victor Crane: "Sevgi ucuzlar, korku tutar." Beni yıktın ama düsturumu taçlandırdın.
- Victor Crane: *(kıkırdar)* Gömülen benim, korkma. Ama artık benden daha korkunçsun.
- Victor Crane: *(kendini gösterir)* Tersine kürek çeke çeke vardığın yer, sürüklenen bir kütüğün — yani benim — vardığım yer. Nehir hep kazanır.

#### 🕊️ forgive
- Victor Crane: Elinde her şey vardı. Skandalım, hisselerim, intikamın. Hiçbirini kullanmadın.
- {{playerName}}: Kullansaydım, sen olurdum. İstemedim.
- Victor Crane: *(uzun sessizlik)* Anlamıyorum. Bu bir zayıflık.
- {{playerName}}: Ya da senin hiç sahip olmadığın bir şey.
- Victor Crane: "Sevgi ucuzlar" demiştim. Sen onu bedavaya verdin, üstelik bana.
- {{playerName}}: Belki sevgi ucuz değildir, Crane. Belki sen hep yanlış mağazadaydın.
- Victor Crane: Sen nehrin sonuna kadar kürek çektin. Akıntıya değil, kendine rağmen. Oraya varan ilk insan belki de sensin.
- Victor Crane: ...Demek gerçekten varmış. Ham, katıksız iyi insanlar. Ben hep masal sanırdım.
- Victor Crane: Git. Seni anlamadan önce git.

#### 🤝 merge
- Victor Crane: Birleşme. İki stüdyo, tek çatı. Beklemediğim hamle.
- {{playerName}}: İkimiz de kaybetmekten yorulduk. Bu sefer aynı masadayız.
- Victor Crane: Sana onca kötülüğü yaptım, sen hâlâ elini uzatıyorsun.
- {{playerName}}: Güvendiğimden değil. Seni kontrol edebilirim çünkü — bunu bana sen öğrettin.
- Victor Crane: *(güler)* Demek "sevgi ucuzlar, korku tutar"ı ezberledin.
- {{playerName}}: Hayır. Üçüncü bir şey buldum: ihtiyaç. O ikisinden de uzun sürer.
- Victor Crane: İkimiz de nehrin sonuna geldik — sen kürek çekerek, ben sürüklenerek. Tuhaf, yine de aynı yerde buluştuk.
- Victor Crane: ...Hayatım boyunca herkesi kendim sandım. Meğer gerçekten ham iyi insanlar varmış.
- Victor Crane: Ortak olalım. Ama gözünü dört aç.
- {{playerName}}: Sen de.

### `indie_resolution` — frames · studio (generic indie rakip)
- Rakip Kurucu: Demek sıra bize geldi. Sizin gibi büyükler hep küçükleri ezerek başlar.
- {{playerName}}: Ben de bir zamanlar küçüktüm. Kovulmuş, bitmiş biriydim.
- Rakip Kurucu: Ama artık değilsin. Şimdi sen onlardansın.
- {{playerName}}: ...
- {{playerName}}: Belki. Ya da henüz değil. Bunu her gün yeniden seçiyorum.

---

## Test Stratejisi

`tests/data/cutscenes.test.ts` (genişletme):
- `nexus_notice.variants` 5 `BackgroundId`'nin hepsini içerir; her varyant ≥1 frame, satırlar dolu.
- `nexus_resolution.choiceVariants` dört `ResolutionChoice` (`buyout`/`destroy`/`forgive`/`merge`) için tanımlı; her biri ≥1 frame.
- `nexus_meeting`, `awards_*`, `indie_resolution` `frames` tanımlı ve dolu.
- Tüm `background` değerleri izinli kümede (`office`/`bedroom`/`studio`/`court`/`coast`/`server_room`/`gallery`/`boardroom`).
- Hiçbir satırda `speaker === 'Anlatıcı'` yok; hiçbir metinde `[PLACEHOLDER]` yok.

`getCutsceneFrames` testleri:
- `('nexus_notice', { background: 'eski_ceo' })` → eski_ceo varyantı.
- `('nexus_resolution', { background, choice: 'forgive' })` → forgive varyantı.
- `('nexus_meeting', { background: null })` → flat frames.

`tests/store/cutsceneStore.test.ts` (genişletme):
- `resolutionChoice` set edilince `nexus_resolution` doğru choice varyantını oynatır.
- `endCutscene`/`reset` `resolutionChoice`'u temizler.

---

## Kapsam Dışı

- Felsefe NPC'leri (ayrı alt sistem — sıradaki brainstorming döngüsü).
- Rakip mekaniklerinin kendisi (zaten kurulu).
- `nexus`'un `rival`'a geçiş mekaniği (yalnız tetikleyici eklenir; geçiş kuralı mevcutsa korunur).
- Gerçek pixel-art asset'leri; CSS placeholder yeterli.
- Ses/müzik, *(eylem)* yönergelerinin animasyona ayrıştırılması.
