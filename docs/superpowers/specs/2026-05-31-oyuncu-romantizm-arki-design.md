# Oyuncu Romantizm Arkı (Spec C1): Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** Oyuncunun romantizm yaşam arkı — mevcut NPC kalp sistemine binen Stardew-tam ilerleme: arkadaşlık → itiraf → flört/buluşma → teklif → evlilik → çocuk. `player_romance_*` / `player_married_*` bayraklarını set eder (Spec B okur). ~30-yıl final içeriği **Spec C2**'dedir.

## Bağlam & Dekompozisyon

- **NPC sistemi** (`2026-05-30-npc-etkilesim-felsefe-design.md`): 12 romantizm adayı (6K/6E), kalp (0–5), flört (T3). C1 bunun üstüne kademe ekler.
- **A — Yaşlanma çekirdeği** (`2026-05-31-yaslanma-yasam-olayi-design.md`): `spawnNpc` (oyuncu çocuğu), yaş evreleri (eş/çocuk yetişkinlik kontrolü).
- **B — NPC yaşam olayları** (`2026-05-31-npc-yasam-olaylari-design.md`): yazılı evlilikler `player_romance_<npc>` bayrağına **koşullu** — C1 bu bayrağı set eder, B okur (oyuncu birini romantize edince o NPC başkasıyla evlendirilmez).
- **C1 (bu):** romantizm arkı. **C2 (sonraki):** ~30-yıl emeklilik/final (romantizm sonucunu yansıtır).

---

## Genel Akış (kalp sistemine biner)

Kalp (0–5) zaten var. Romantizm kademeleri:

```
Arkadaşlık (kalp 0–5)
   │  kalp max + çiçek demeti jesti
   ▼
İtiraf → "sevgili"   (player_romance_<npc> set)
   │  birkaç buluşma (özel diyalog/anlar)
   ▼
Flört/buluşma dönemi
   │  yüzük jesti → teklif → kabul
   ▼
Evlilik (düğün cutscene)   (player_married_<npc> set; eş sahil evine taşınır)
   │  opsiyonel, evlilik sonrası
   ▼
Çocuk (en fazla 2; spawnNpc → A ile büyür)
```

**Dünyayla örgü:** İtiraf için **çiçek demeti Greta'nın tezgâhından** alınır; teklif **yüzüğü** kuyumcu/Otto'dan. İçerik mevcut NPC'lere bağlanır.

---

## Aday Havuzu (gating)

Bir aday romantik kademeye geçebilir ancak:
- `characterStore.romanticPreference` (`kadin`/`erkek`/`herkes`) adayın cinsiyet etiketiyle (NPC spec'inde K/E) uyuşuyorsa,
- aday yetişkinse (A evresi `genc_yetiskin`+),
- B tarafından evlendirilmemişse (`!married_<...>` içinde değilse).

Uymayan adaylarla yalnız **arkadaşlık** kalbi ilerler (flört T3 açılmaz / romantik kademe kilitli).

---

## Bileşenler / State

### `characterStore` (genişletme)
```ts
  romanticPreference: 'kadin' | 'erkek' | 'herkes' | null  // karakter yaratmada seçilir
  partnerId:  string | null   // sevgili
  spouseId:   string | null   // eş
  childIds:   string[]        // oyuncunun çocukları (spawn edilen NPC id'leri)
```
Karakter yaratma sihirbazına küçük bir **"ilgi"** adımı/seçimi eklenir (`romanticPreference`). `reset`'te sıfırlanır.

### `romanceStore` (yeni)
```ts
type RomanceStage = 'arkadas' | 'sevgili' | 'nisanli' | 'evli'
interface RomanceStore {
  stage:        Record<string, RomanceStage>   // npcId -> kademe
  dateCount:    Record<string, number>          // sevgili dönemi buluşma sayısı
  hasBouquet:   boolean                          // çiçek demeti envanterde
  hasRing:      boolean                          // yüzük envanterde
  confess:      (npcId: string) => void          // kalp max + bouquet → sevgili + player_romance flag
  goOnDate:     (npcId: string) => void
  propose:      (npcId: string) => void          // ring + yeterli buluşma → nisanli → düğün
  marry:        (npcId: string) => void          // evli + player_married flag + spouseId + eş taşınma
  haveChild:    () => void                        // spawnNpc oyuncu çocuğu (max 2)
  buyBouquet / buyRing  // jest edinme (Greta / kuyumcu)
  reset:        () => void
}
```

---

## Akış Detayı & Entegrasyon

- **İtiraf (`confess`):** önkoşul kalp == max (NPC heart) + `hasBouquet` + aday uygun. Etki: kademe `sevgili`; `lifeStore.flags`'e `player_romance_<npc>` (Spec B kuralı kapanır); kısa **itiraf cutscene'i** (adıyla, tona göre); `partnerId` set.
- **Buluşma (`goOnDate`):** sevgili dönemi; `dateCount++`; özel buluşma diyalogları (`DatingStart` Yarn düğümü). Teklif için min. buluşma eşiği (örn. 3).
- **Teklif (`propose`):** `hasRing` + `dateCount ≥ 3` → kademe `nisanli`.
- **Evlilik (`marry`):** **düğün cutscene'i** → kademe `evli`; `player_married_<npc>` flag; `spouseId` set; eş sahil evine taşınır (`SpouseStart` Yarn düğümü, ortak ev diyaloğu). **Eş etkisi (hafif):** sabah küçük moral/enerji desteği (gün başı +küçük); ara sıra eş mektubu/diyaloğu. Ezici mekanik yok.
- **Çocuk (`haveChild`):** evlilik sonrası opsiyon; `spawnNpc` ile oyuncu çocuğu NpcDef (isim, `birthYear=mevcut yıl`, ebeveyn = oyuncu+eş). `childIds`'e eklenir. **En fazla 2.** Çocuk A yaşlanmasıyla büyür (çocuk→ergen→...).
- **C2 finali** `spouseId`/`childIds`/`partnerId`'i okur → kapanışta yansır.

### Cutscene & Yarn içeriği
- Cutscene'ler: `itiraf` (generic, `{{playerName}}` + aday adı geçer), `dugun_oyuncu`. *(Aday-özel ton T3 repliklerinden gelir; cutscene'ler ortak şablon + isim.)*
- Yarn düğümleri (adaylarda): `DatingStart` (sevgili), `SpouseStart` (eş).

---

## Karakter Yaratma Değişikliği
Sihirbaza küçük bir adım: **"İlgi"** seçimi (kadın / erkek / herkes) → `romanticPreference`. (Görünüm/cinsiyet editörü ayrı; bu sadece romantizm havuzu içindir.)

---

## Test Stratejisi
- Aday havuzu gating: `romanticPreference='kadin'` iken erkek aday romantik kademeye **geçemez**; yetişkin olmayan aday kilitli; B evlendirmişse kilitli.
- `confess`: kalp max + bouquet → `sevgili` + `player_romance_<npc>` flag set (lifeStore). Bouquet yoksa olmaz.
- `propose`: ring + dateCount≥3 → `nisanli`; eksikse olmaz.
- `marry`: `evli` + `player_married_<npc>` + `spouseId`; düğün cutscene tetiklenir.
- `haveChild`: `spawnNpc` çağrılır, `childIds` artar, **max 2** (üçüncüde olmaz).
- B entegrasyonu: `player_romance_daniel` set'liyken B'nin `daniel_sigrid_evlilik` olayı **tetiklenmez** (Spec B testiyle uyumlu).

## Kapsam Dışı
- ~30-yıl emeklilik/final (C2) — `spouseId`/`childIds`'i tüketir.
- Boşanma/aldatma/çoklu eş (YAGNI).
- Prosedürel romantizm; eş için derin günlük yardım mekaniği (Stardew chore'ları gibi) — hafif tutuldu.
- Save/load persist'i (genel; save sistemi gelince).
