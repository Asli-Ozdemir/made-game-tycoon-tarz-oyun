# Steam Next Fest Demo — Tasarım Spec'i

_Tarih: 2026-06-10 · Durum: Onaylandı (kullanıcı), implementasyon planı bekleniyor_

## Amaç

DEMO_MODE altyapısını halka açık (Steam Next Fest kalitesinde), ~30-60 dakikalık,
uçtan uca oynanabilir bir demoya dönüştürmek. Demo, oyunun hibrit DNA'sını
(tycoon + yaşam-sim) gösterir ve tam sürüm merakı yaratarak biter.

## Kapsam Kararları (kullanıcıyla netleştirildi)

| Karar | Seçim |
|---|---|
| Hedef kitle | Steam Next Fest / halka açık demo |
| İçerik dilimi | Tycoon çekirdeği + 2 yan iş |
| Açık yan işler | Sahaf arşiv taraması + balıkçılık |
| Demo sonu | İlk oyun yayınlandığında (DemoEndScreen) |
| Demo sonrası | Serbest dolaşım (ikinci proje kilitli) |
| Zihin ağacı | Tier-1 açık; tier-2+ görünür ama "Tam sürümde" kilidi |
| Asset stratejisi | Kullanıcı pixel art öğreniyor + AI desteği (karışık); zaman baskısı yok |
| İş sıralaması | Önce oynanabilir döngü (placeholder görsellerle), sanat paralel manifest ile |

## Oyuncu Yolculuğu

1. **Açılış**: Karakter yaratma → kovulma cutscene (Apex Games, Victor Crane) → garajda uyanış.
2. **Onboarding**: Mevcut `ObjectiveBanner` + `MovementHint` + `StudioDeskPointer`
   akışı oyuncuyu masaya oturtur → ilk proje başlar.
3. **Gün döngüsü**: Sabah tycoon (geliştirme), öğleden sonra keşif. Hedef sistemi
   oyuncuyu dışarı yönlendirir ("Marcus'u ziyaret et", "İskelede balık tut").
4. **Yan işler**: Sahaf arşiv taraması (Marcus üzerinden) + balıkçılık →
   fikir tohumları + para.
5. **Zihin ağacı**: Uykuda Zihin sekmesi açık; tier-1 node'lar kilitlenebilir,
   tier-2+ "Tam sürümde" rozetiyle kilitli.
6. **Doruk**: İlk oyun yayınlanır → `PublishResult` puanları → **DemoEndScreen**:
   epilog metni, oyun istatistikleri (gün, para, tohum, dostluklar), wishlist çağrısı.
7. **Sonrası**: "Keşfe devam et" (serbest dolaşım; yeni proje başlatılamaz) veya
   "Ana menü".

## Kapı (Gating) Değişiklikleri — `src/config.ts`

- `DEMO_BLOCKED_LOCATIONS`'tan `balikci` çıkar. `pub` ve `nehir` kilitli kalır.
- Köprü/şehir odaları (`DEMO_BLOCKED_ROOMS`) kilitli kalır. Köprü girişine flavor
  mesaj: "Şehir merkezi tam sürümde açılıyor."

## Teknik İş Kalemleri

### 1. Save/Load persist düzeltmesi (kritik)

`src/engine/savegameEngine.ts` şu store'ları serileştirmiyor: `ideaSeedStore`,
`skillTreeStore`, `npcStore`, `lifePathStore`, `lifeStore`, `romanceStore`.
Demo kapsamında ilk üçü zorunlu; kalanlar aynı işin parçası olarak ucuz olduğundan
**altısı birden** tek seferde eklenir (tam sürüm de kazanır).

- Savegame şemasına ekle, `version` bump.
- Eski kayıtlarda default merge (eksik alanlar store default'larıyla doldurulur).
- `Set ↔ Array` dönüşümü: `firedEvents`, `flags`, `retiredNpcs`, `seenDialogues` vb.

### 2. Sahaf arşivi bağlantısı

`AntiquarianScene` + `antiquarianStore` motor olarak hazır ama UI girişi yok.

- `SahafPanel`'e "Arşiv taraması yap" butonu. Şart: Marcus dostluğu T1 (≥0 — temel
  diyaloğu görmüş olmak yeterli; ekstra bariyer koymuyoruz, demo süresi kısıtlı).
- Vardiya bitişi → ödüller (para + Nostalji/Hikaye tohumu) store'da mevcut;
  dönüş akışını panele bağla.

### 3. Zihin ağacı tier kapısı

- `SleepOverlay`: Zihin sekmesi `DEMO_MODE`'da artık görünür.
- `skillTreeStore.canUnlock`: `DEMO_MODE && node.tier > 1` → kilitli.
- `SkillTreeCanvas`/`SkillTreePanel`: kilitli üst tier node'larında "Tam sürümde"
  rozeti.

### 4. DemoEndScreen (yeni bileşen)

- Tetik: `DEMO_MODE && totalPublished === 1` iken `PublishResult.onContinue`.
- İçerik: epilog metni ("Macenta Koyu'nda hikaye daha yeni başlıyor"), istatistik
  özeti, wishlist çağrısı.
- Butonlar: "Keşfe devam et" → serbest dolaşım; "Ana menü".
- Serbest dolaşımda `NewProjectModal` demo bayrağıyla kilitli: "İkinci projen tam
  sürümde seni bekliyor."

### 5. Demo hedef zinciri (objectives)

`objectiveStore`'a demo senaryosu (sıralı): masaya otur → ilk projeyi başlat →
Marcus'u ziyaret et → balık tut → arşiv taraması yap → uyu ve tohum harca →
oyunu yayınla. Oyuncu hiçbir demo sistemini kaçırmaz.

### 6. Küçük pürüzler

- `electron/main.ts`: DevTools otomatik açılması production build'den kaldırılır.
- Köprü girişi flavor mesajı (bkz. Gating).

## Asset Manifest (sanat paralel hattı)

`docs/asset-manifest.md` oluşturulur. Her satır: varlık adı, boyut, kullanım yeri,
stil notu, öncelik.

- **P1**: oyuncu sprite'ı, garaj içi tileset, Marcus portresi, masa/PC, iskele.
- **P2**: sahil binaları, NPC sprite'ları (demo NPC'leri), balıkçılık görselleri,
  UI ikonları.
- **P3**: dekoratif detaylar, hava/ambiyans efektleri.

Kullanıcı pixel art öğrendikçe P1'den üretir; her teslim oyuna entegre edilir.
Müzik/SFX: fal-ai ile sahil ambiyansı + menü teması üretilip placeholder'lar
değiştirilir. Kod hattı asset'leri **beklemez** — placeholder'larla ilerler.

## Test Stratejisi (mevcut 732 teste ek)

- **savegameEngine round-trip**: yeni store'lar kaydet → yükle → derin eşitlik
  (Set dönüşümleri dahil); eski sürüm kaydı yükleme (default merge).
- **Demo gating**: tier-2 node kilidi, balıkçı açık, pub/nehir kilitli, köprü
  kilitli, ikinci proje kilidi.
- **DemoEndScreen tetikleme**: `totalPublished` 0→1 geçişinde gösterim;
  serbest dolaşım dönüşü.
- **Objective zinciri**: sıralı ilerleme, atlama yok.

## Kapsam Dışı (bilinçli)

- Pub garsonluğu, nehir/sal, şehir odaları, romantizm UI, çocuk yaşlanması,
  cutscene içeriği (itiraf/düğün/ölüm) — tam sürüm işleri (`ERTELENEN-ISLER.md`).
- Pixel art üretiminin kendisi — manifest üzerinden paralel hat, bu spec'in
  kod kapsamına dahil değil.

## Riskler

- **Paralel makine koordinasyonu**: `objectiveStore`, `DEMO_MODE`, HUD/Dashboard
  görünürlükleri bu makinenin (umutm) sorumluluğunda — diğer makineyle çakışma
  riski düşük ama push öncesi `git pull --rebase --autostash` şart.
- **Savegame migration**: version bump eski test kayıtlarını bozabilir;
  default-merge testi zorunlu.
- **Demo süre dengesi**: ilk oyun geliştirme süresi 30-60 dk hedefine
  sığmayabilir — playtest sonrası tycoon süre ayarı gerekebilir (ayrı ayar
  değişkeni olarak izole edilir).
