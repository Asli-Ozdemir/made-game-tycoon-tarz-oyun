# NPC Yaşam Olayları (Spec B): Tasarım Dokümanı

**Tarih:** 2026-05-31
**Kapsam:** Küratörlü/yazılı NPC yaşam olayları — reşit olma & kariyer, çift olma & evlilik, doğum (yeni NPC), ölüm & miras. Hepsi [Yaşlanma Çekirdeği (Spec A)](2026-05-31-yaslanma-yasam-olayi-design.md) framework'üne **veri + içerik** olarak biner.

## Bağlam & Dekompozisyon

- **A — Çekirdek:** yaş + life-event motoru (trigger/effect türleri). **Hazır.**
- **B — Bu spec:** A'nın motoruna takılan **küratörlü yaşam olayları** + içerik (cutscene, Yarn düğümleri, çocuk NpcDef'leri).
- **C — Sonraki:** Oyuncunun kendi hayatı (evlilik/çocuk/emeklilik finali).

NPC kadrosu ve diyalog: [NPC Etkileşim & Felsefe spec'i](2026-05-30-npc-etkilesim-felsefe-design.md).

## Tasarım İlkesi: Yeni motor YOK

B, A'nın mevcut effect/trigger türleriyle tümüyle ifade edilir (A'nın tasarımını doğrular). B **kod motoru eklemez**; yalnızca:
- `src/data/lifeEvents.ts`'e yeni `LifeEvent` kayıtları,
- yeni cutscene'ler (`cutscenes.ts` + `.yarn`/frame içeriği),
- yeni Yarn diyalog düğümleri (yas/yetişkin/çift sesi — `setDialogueNode` hedefleri),
- doğum için yazılı çocuk `NpcDef`'leri.

Effect eşlemesi:
| Olay | A effect(leri) |
|------|----------------|
| Reşit/kariyer | `setDialogueNode` + (gerekirse) `unlockRole` |
| Evlilik | `cutscene` + `setFlag('evli_<a>_<b>')` + `setDialogueNode` (ikisi de) |
| Doğum | `spawnNpc` (yazılı çocuk) |
| Ölüm | `retireNpc` + `cutscene` + `setDialogueNode` (yas) |
| Miras/devir | `setFlag('devir_<x>')` + `setDialogueNode` / `unlockRole` |

---

## Kritik Kural — Oyuncuyla Çakışmama

Oyuncunun romantik ilgilendiği/evlendiği NPC **otomatik olarak başkasıyla evlendirilmez.** Evlilik olayları A'nın `condition` trigger'ıyla korunur:

```ts
trigger: { kind: 'condition', test: (ctx) =>
  ctx.yearsElapsed >= 6 && !ctx.hasFlag('player_romance_daniel') && !ctx.hasFlag('player_romance_sigrid') }
```

`player_romance_<npc>` bayrağı, oyuncu o NPC'yle romantizm başlattığında set edilir (Spec C / romantizm-arc; B bu bayrağı **okur**). Bayrak yoksa (oyuncu ilgilenmemiş) yazılı evlilik gerçekleşir.

---

## Kategoriler ve Küratörlü Olaylar

### 1) Reşit olma & kariyer
- **Tomas** → `genc_yetiskin` → `unlockRole hireable` + `setDialogueNode 'AdultStart'` *(A'da örnek; B kanon kabul eder)*.
- **Bea** → 18 → `setDialogueNode 'ArtistStart'` + tek seferlik **"ilk mural"** cutscene'i (şehrin duvarına ilk eseri; Nadia gururlu).
- **Pippa** → 18 → `setDialogueNode 'AdultStart'` (kâşif/denizci hevesiyle büyümüş genç).
- **Garaj üçlüsü (Lena/Sam/Milo)** → evlilikten bağımsız, ~5-7 yıl sonra **"stüdyolarını kurdular"** milestone'u: bir cutscene + diyalog değişimi; oyuncuya saygı göndermesi (kendi yolunu açan yeni nesil).

### 2) Çift olma & evlilik *(koşullu)*
- **Daniel & Sigrid** (bilim + deniz; zıt ama tamamlayan): ~yıl 7'de yakınlaşma, ~yıl 9'da evlilik → kısa düğün cutscene'i + ikisinin diyaloğu birbirini anar (`married_daniel_sigrid` flag, `setDialogueNode`).
- **Lena & Sam** (garaj üçlüsünden): ~yıl 8'de evlilik → sahne + ortak diyalog.
- Her ikisi de **koşullu** (oyuncu o NPC'yle romantik değilse). Oyuncu birini romantize ettiyse o evlilik atlanır (eşi varsa yalnız kalır ya da alternatif yok — sade tut).

### 3) Doğum (yeni nesil)
- Evli çift → evlilikten ~2 yıl sonra `spawnNpc`: yazılı çocuk NpcDef (isim, `birthYear`, ebeveyn bağı `relations`, çocuk diyaloğu).
  - Örn. Daniel & Sigrid → çocuk **"Mira"** (deniz temalı); Lena & Sam → çocuk **"Theo Jr."** vb. *(isimler içerik kararı)*.
- Çocuk A'nın yaşlanmasıyla büyür (çocuk→ergen→genç yetişkin), kendi reşit-olma olaylarını alabilir → **yeni nesil sürekliliği**.
- **Romantizm dışı flavor:** oyuncuyla yaş farkı nedeniyle doğan çocuklar romantizm adayı değildir; konuşulabilir kasaba NPC'si olur.

### 4) Ölüm & miras *(gerçek, duygusal, seyrek)*
- **Wilhelm Stern** ileri bir yılda (yaşı 60+; ~yıl 12-15) ölür → `retireNpc('wilhelm')` + **duygusal cutscene** (Edith'in başucu vedası; hafıza/sevgi teması — "adını unutsam da yüzünü unutmam" geri döner).
  - **Edith** → `setDialogueNode 'GriefStart'` (yas); birkaç yıl sonra `setDialogueNode 'AcceptanceStart'` (dingin kabul) — ikinci bir koşullu olay.
- **Miras/devir:** Hanna ileri yaşta (ya da bir yıl eşiğinde), **Tomas yetişkinse** (`condition`) → han Tomas'a kalır: `setFlag('devir_han_tomas')` + Hanna & Tomas diyalog değişimi (Hanna huzurlu emeklilik, Tomas sahibi). Tomas oyuncu tarafından işe alınmışsa alternatif kısa varyant (içerik notu).

---

## Oyuncu Katılımı
- **Duygusal anahtar beat'ler** → cutscene (oyuncu tanık olur): Wilhelm'in ölümü, Bea'nın ilk mural'ı, üçlünün stüdyosu, (oyuncuya yakınsa) bir düğün.
- **İkincil olaylar** (uzak evlilik/doğum) → ambient: Liesl dedikodusu, mektup, ilgili NPC'nin diyalog değişimi. Cutscene yok.

---

## İçerik Envanteri (B'nin ürettikleri)
- **LifeEvent kayıtları** (`lifeEvents.ts`): reşit (Bea, Pippa, üçlü), evlilik (Daniel&Sigrid, Lena&Sam — koşullu), doğum (çiftlerin çocukları), ölüm (Wilhelm), yas (Edith grief→acceptance), miras (han→Tomas).
- **Cutscene'ler:** `bea_mural`, `uclu_studyo`, `daniel_sigrid_dugun`, `lena_sam_dugun`, `wilhelm_olum`. (CutsceneId + frame/`.yarn` içeriği.)
- **Yarn düğümleri:** ilgili NPC'lerde `AdultStart` (Tomas/Pippa), `ArtistStart` (Bea), `GriefStart`/`AcceptanceStart` (Edith), çift/ebeveyn varyant düğümleri.
- **Çocuk NpcDef'leri:** doğan yeni nesil (isim, birthYear, relations, diyalog).

---

## Test Stratejisi
- Yeni `LifeEvent`'ler A'nın motorunda doğru tetiklenir: Bea 18'de `ArtistStart`; Daniel&Sigrid evliliği `condition` sağlanınca (oyuncu romantik değilse) tetiklenir, `player_romance_*` bayrağı varsa **tetiklenmez**.
- Wilhelm ölümü: `retireNpc` + Edith `GriefStart`; sonraki yıl(lar)da `AcceptanceStart`.
- Doğum: `spawnNpc` çocuğu `lifeStore.spawnedNpcs`'e ekler; çocuk A yaşlanmasıyla evre değiştirir.
- Miras: Tomas yetişkin + (koşul) → `devir_han_tomas` flag bir kez.
- Tüm yeni cutscene id'leri `cutscenes.ts`'te tanımlı; `.yarn`/frame içeriği geçerli (placeholder/Anlatıcı yok).

## Kapsam Dışı
- Oyuncunun kendi evliliği/çocuğu/emekliliği (Spec C).
- Prosedürel/rastgele yaşam (B küratörlü).
- `player_romance_<npc>` bayrağını **set eden** romantizm-arc mekaniği (Spec C / romantizm; B yalnız okur).
- Save/load persist'i (A ile aynı; save sistemi gelince).
