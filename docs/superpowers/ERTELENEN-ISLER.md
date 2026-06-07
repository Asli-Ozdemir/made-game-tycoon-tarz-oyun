# Ertelenen İşler — Yaşam-sim & Romantizm (devam talimatları)

_Son güncelleme: 2026-06-07_

Yaşam-sim hattı **A→B→C1→C2** motor + veri + temel UI olarak **tamam ve push'lu** (706 test yeşil). Aşağıdakiler bilinçli ertelendi (sistem-bağımlı / ayrı entegrasyon). Yeni oturumda buradan devam et. Her biri için: *ne / nerede / nasıl / test*.

---

## Öncelikli (oynanışı görünür kılar)

### 1. Spawn/retire dünya tüketimi
- **Sorun:** `getNpc` (npcDialogues.ts) sadece `NPC_DEFS` okuyor. Romantizm çocuğu (`romanceStore.haveChild`) ve B doğumları `lifeStore.spawnedNpcs`'e gidiyor ama **yaşlanmıyor / render edilmiyor**. `retiredNpcs` sadece `getAvailableDialogues`'ta tüketiliyor (ölen NPC ile konuşulamaz) — dünya/panelde hâlâ görünebilir.
- **Yap:** `getNpc`'yi (ya da yeni `resolveNpc`) `lifeStore.spawnedNpcs`'i de okuyacak şekilde genişlet → `lifeStore.buildCtx.getAge` spawn'ları da bulur, çocuk yaşlanır. NPC listesi/panelleri `spawnedNpcs`'i ekle, `isRetired` olanları gizle.
- **Test:** spawn edilen çocuk yıllar geçince `getStage` cocuk→ergen→genç yetişkin.

### 2. Cutscene içeriği (itiraf / düğün / ölüm)
- **Sorun:** C1 itiraf/düğün ve B Aldo ölümü şu an yalnız flag/state; duygusal sahne yok.
- **Yap:** `cutscenes.ts`'e yeni frame içeriği + `CutsceneId` genişlet; `cutsceneStore.startCutsceneForce(id)` ile tetikle. `romanceStore.confess/marry` ve `lifeEvents` (`aldo_olum`) bu cutscene'leri çağırabilir (effect: `cutscene`).
- **Önemli kısıt:** B'nin `setDialogueNode` effect'i bizim **tier-tabanlı** diyalog sistemimize uymuyor (named Yarn node yok). Ya NPCDef'e alternatif diyalog seti/bayrak ekle (ör. "yas" hâli) ya da değişimi cutscene ile çöz.

### 3. Çiçekçi / kuyumcu harita lokasyonu
- **Sorun:** demet ($200) / yüzük ($5000) butonları şu an DialogueView'de (Greta/kuyumcu flavor). Spec'te Greta tezgâhı + kuyumcu lokasyonu istenmişti. Greta NPCDef değil.
- **Yap (opsiyonel zenginlik):** Greta'yı (çiçekçi) + kuyumcuyu basit dükkan paneli/harita-trigger'ı yap; `buyBouquet/buyRing` oradan çağrılsın. Mevcut butonlar çalışıyor — düşük öncelik.

---

## İkincil (mekanik derinlik)

### 4. Eş enerji/moral etkisi
- `characterStore.spouseId` varsa gün başı küçük enerji/moral desteği (`dayTimeStore`/`characterStore`). Hafif tut (ezici değil). Spec C1 "eş etkisi (hafif)".

### 5. Save/load — RPG store persist
- **Sorun:** `savegameEngine.ts` şunları serileştirmiyor: `ideaSeedStore`, `skillTreeStore`, `npcStore`, `lifePathStore`, `lifeStore`, `romanceStore`. Yani seed/skill/NPC ilişkileri, hayat yolu, **life flag'leri (arcEnd, arcEnd_shown, married_*, devir_*), romantizm kademesi, partner/spouse/child** kaydedilmiyor.
- **Yap:** savegameEngine'e bu store'ları ekle (`version` bump + eski kayıtta default merge; Set↔Array dönüşümü `firedEvents`/`flags`/`retiredNpcs` için).

---

## DOKUNMA (paralel makine — umutm)
- `objectiveStore`, `soundService`, `DEMO_MODE`, demo-açılış akışı (HUD/Dashboard `VISIBLE_TABS`) **umutm'un işi**. Çakışmamak için koordine et. (objectiveStore testine jsdom directive eklendi — orası tamam.)

---

## 📏 Sayı ayrımı (karışmasın)
- **32 = karakter / NPC sayısı** (`NPC_DEFS`): 12 felsefe + 12 romantizm + 4 gamer + 4 minör.
- **39 = skill ağacı düğümü** (`SKILL_NODES`): nostalji/hikaye/kaos/zaman + analiz + sosyallik + oyun-tarihi dalları (36→39).
- "39 karakter" yanlış — o skill node sayısı. Karakter = 32.

## Çalışma notları
- Spec'ler: `specs/2026-05-31-*` (A/B/C1/C2). Durum: `DURUM.md` yaşam-sim satırları (pipeline sıra 2–5).
- **Her push öncesi `git pull --rebase --autostash`** (paralel makine aktif; sık sık merge gerekiyor).
- `npm run build` typecheck yapmaz; doğrulama `npx vitest run`. Bazı testler jsdom ister (`// @vitest-environment jsdom`).
- NPC diyalogları: kullanıcıya sormadan yazma (PROJE-BAGLAM "⛔ NPC DİYALOGLARI"). İsimler İngilizce, diyalog Türkçe, "şehir"/"nehir" (kasaba/deniz değil).
