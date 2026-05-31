# Final / Emeklilik Epilogu (Spec C2): Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** ~30. yılda (`arcEnd`) bir kez otomatik oynayan kapanış epilogu — sahil evinde oyuncu monoloğu + oyuncunun seçimlerini yansıtan dinamik "neredeler şimdi" kartları. Epilog sonrası **sandbox devam eder** (sert son yok).

## Bağlam & Dekompozisyon

- **A — Yaşlanma çekirdeği:** `arcEnd` bayrağını `yearsElapsed 30`'da set eder. C2 onu tüketir.
- **B — NPC yaşam olayları:** şehir/yeni nesil durumu (Tomas han devri, Bea mural, doğanlar, Wilhelm ölümü) — kartlarda yansır.
- **C1 — Romantizm:** `spouseId`/`childIds`/`partnerId` — eş & çocuk kartında yansır.
- **4C — Rakip arc:** `rivalStore` Nexus resolution — Crane kartında yansır.
- **C2 (bu):** kapanış epilogu. Romantizm/yaş/B'siz de çalışır (o kartlar "olmadı" varyantına düşer).

---

## Tetikleme & Akış

- App, `lifeStore.hasFlag('arcEnd') && !hasFlag('arcEnd_shown')` olunca epilogu **bir kez** açar; `arcEnd_shown` set edilir.
- Epilog kapanınca **oyun devam eder** (sandbox). Sert oyun-sonu yok.
- Epilog = **monolog frame'i** + sırayla **4 "neredeler" kartı** (cutscene diyalog kutusu görseliyle, tıkla/Space ilerlet).

---

## Mimari (dinamik — state'ten derlenir)

Epilog statik bir `CUTSCENE` değil; oyun durumundan derlenir.

### `src/engine/finaleEngine.ts` (saf)
```ts
export interface FinaleSnapshot {
  playerName:   string
  spouseId:     string | null
  spouseName:   string | null
  childNames:   string[]
  nexusOutcome: 'buyout' | 'destroy' | 'forgive' | 'merge' | 'none'  // 4C
  reputation:   number
  awardsWon:    number
  trioStudio:   boolean        // genç devler stüdyo kurdu mu (lifeStore flag)
  topPhilosophy: string | null // en yüksek kalpli felsefe NPC'nin felsefesi (örn. 'stoa')
  cityFlags:    { hanDevir: boolean; beaMural: boolean }
}

export interface EpilogueLine { speaker: string; text: string }
export interface EpilogueCard { baslik: string; metin: string }

export function buildEpilogue(s: FinaleSnapshot): { monolog: EpilogueLine[]; kartlar: EpilogueCard[] }
```
- **Saf fonksiyon** → kolay test edilir (snapshot → içerik).

### Tetik & render
- `App` (veya küçük `finaleStore`): `arcEnd && !arcEnd_shown` → `FinaleSnapshot`'ı store'lardan kur → `buildEpilogue` → `EpiloguePlayer`'a ver → `lifeStore.setFlag('arcEnd_shown')`.
- **`EpiloguePlayer.tsx`:** monolog satırlarını + kartları sırayla gösterir (CutscenePlayer'ın diyalog kutusu stilini yeniden kullanır; kart = başlık + metin paneli). Bitince kapanır.

**Snapshot kaynakları:** `characterStore` (name, spouseId→spouseName via getNpc, childIds→isimler), `rivalStore` (nexus.relationship → outcome), `gameStore` (reputation), `awardsStore` (history.length / oyuncu kazanımları), `lifeStore` (flags: trio studio, hanDevir, beaMural), `npcStore` (hearts → en yüksek felsefe NPC → `topPhilosophy`).

---

## İçerik (anlatıcısız, buruk-gerçekçi)

### Monolog (sahil evi, `{{playerName}}`) — hafif dallanır
Ortak açılış + evli/yalnız varyantı + evrensel kapanış. Örn:
- Açılış: "Otuz yıl. Kovulmuş, terk edilmiş gelmiştim bu eve. Tuz hâlâ aynı kokuyor."
- *(evli ise)* "Ama artık yalnız değilim. {{spouseName}} mutfakta; çocukların sesi bahçede."
- *(yalnız ise)* "Hâlâ yalnızım. Ama bu, terk edilmişlik değil — seçtiğim bir sükûnet."
- Kapanış (evrensel): "Nehir beni buraya getirdi. Bir kısmını ben kürek çektim, bir kısmını bıraktım. İkisi de benim."

### Kartlar (state'e göre varyant — her biri 1–2 cümle)

**1) Eş & çocuklar**
- Evli: "{{spouseName}} ile bir ömür. [eşin kısa akıbeti.]" + çocuklar: "[çocuk isimleri] büyüdü; [biri şehirde, biri sahilde…]."
- Bekar: "Kimseyle evlenmedin. Yine de evin hiç boş olmadı — uğrayan dostlar, gelen mektuplar."

**2) Crane / Nexus** *(4C aynası)*
- `buyout`: "Nexus'u satın aldın. Crane koltuğu bıraktı; sen oturdun. Bazen onun gülümsemesini takınıyorsun — fark etmeden."
- `destroy`: "Crane'i yıktın. Düsturunu kanıtladın: korku tuttu. Aynaya bakınca bazen onu görüyorsun."
- `forgive`: "Crane'i affettin. Anlamadı, ama affın senin içindi. Yıllar sonra kısa bir mektup geldi: 'Hâlâ anlamıyorum. Teşekkürler.'"
- `merge`: "Nexus'la birleştin. İki düşman, tek çatı. Kâr yerine ihtiyaç tuttu sizi."
- `none`: "Crane'le hiç yüzleşmedin. Nexus uzakta, büyük, kayıtsız kaldı — ve sen huzurla küçük kaldın."

**3) Stüdyo & kariyer**
- İtibar/ödül eşiği: efsane ("adın sektöre yazıldı") / saygın ("küçük ama sevilen bir iz") / mütevazı ("büyük olmadı, ama senindi").
- Trio: trioStudio ise "Lena, Sam ve Milo kendi stüdyolarını kurdu — ilk teşekkürleri sanaydı."

**4) Yakın felsefe & şehir**
- `topPhilosophy` mercek: ör. stoa → "En çok Marcus'a uğradın; onun dinginliğini öğrendin." · camus → "Remy'nin isyanını taşıdın: anlamı sen kurdun." · tao → "Theo gibi akmayı öğrendin." (vb. 12 felsefe için kısa.)
- Şehir: hanDevir → "Han artık Tomas'ın." · beaMural → "Bea'nın murali hâlâ rıhtımda." · doğanlar → "yeni nesil sokaklarda koşuyor."

Kartlar dinamik seçilir; yoksa o kart atlanır (ör. trio kurmadıysa o satır yok).

---

## Test Stratejisi
- `buildEpilogue`: her `nexusOutcome` doğru Crane kartını verir; `none` → "yüzleşmedin" kartı.
- Evli snapshot → eş & çocuk kartı isimlerle; bekar → "yalnız ama huzurlu" varyantı.
- `topPhilosophy` → doğru felsefe mercek metni (örnek birkaç felsefe).
- İtibar eşikleri → efsane/saygın/mütevazı doğru.
- Şehir bayrakları yoksa ilgili satır atlanır.
- Tetik: `arcEnd` set + `arcEnd_shown` değilse epilog bir kez; `arcEnd_shown` sonrası tekrar açılmaz.

## Kapsam Dışı
- Sert oyun-sonu (sandbox sürer).
- İstatistik/score paneli (kart-temelli kapanış yeterli).
- Oyuncunun ölümü/uzun-vade nesil oyunu (YAGNI).
- Save/load persist'i (`arcEnd_shown` save sistemi gelince).
