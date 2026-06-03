# PROJE BAĞLAMI — Oyunun Fikri (Tüm Ajanlar İçin)

> **Bu dosyayı her yeni oturumda oku.** Projenin *ruhunu* anlatır — kod yapısı değil, **ne yaptığımızı ve neden**. Kod/faz durumu için `DURUM.md`, detaylar için `specs/` ve `plans/`.

---

## Tek cümle
Büyük bir oyun şirketinden kovulup boşanan, orta yaşlı bir insanın; nehrin ikiye böldüğü küçük bir şehrin sakin yakasında sıfırdan kendi oyun stüdyosunu kurarak **yeniden doğuşunun** ve **kendini aşma** mücadelesinin hikâyesi.

## Tür & sütunlar
**Tycoon + RPG + Yaşam Simülasyonu + Anlatı hibridi.**
- **Tycoon:** oyun geliştir/yayınla, ekonomi, pazar/trend, rakipler (MGT2 hissi).
- **RPG:** idea-seed (fikir tohumu) ekonomisi + **skill tree** + **3 yaşam yolu** (hırs/huzur/emek).
- **Yaşam-sim:** Stardew tarzı NPC'ler, kalp/ilişki, romantizm/evlilik/çocuk, **yıllık yaşlanma** (NPC'ler büyür/ölür), ~30 yıllık yaşam arcı.
- **Anlatı:** felsefelerin can bulduğu NPC korosu, ahlaki seçimler, duruma tetikli ara sahneler.
- **Referanslar:** MGT2 (tycoon) · Stardew (kasaba/sıcaklık) · Persona (çift mod/ilişki) · ahlaki ağırlık (gri seçimler).

## Dünya
**Bir nehir şehri ikiye böler:**
- **Sahil/ev yakası** (güney) — sakin, yeşil, kişisel. Oyuncunun ölen anne-babasından kalan ev burada. NPC'lerin çoğu burada (Marcus/sahaf, Remy/balıkçı, Theo/pub, Greta, Aldo...).
- **Köprü** — iki dünya arası fiziksel/duygusal geçiş.
- **Neon şehir yakası** (kuzey) — karanlık, mor neon, endüstriyel, hırslı. Apex Games, yatırımcılar, büyük sektör burada.
- **Eski liman kenti (deniz)** = geçmiş; oyuncunun kovulduğu/boşandığı yer. "Nehrin karşısından geldin" = o hayattan kaçtın.

> ⚠️ **Tutarlılık:** Burası tek bir **şehir** (asla "kasaba" deme). Nehir, şehrin **müstakil/konut kısmını** (ev yakası) ile **büyük binaları** (kurumsal/neon yaka) ayırır. **Şimdiki şehirde deniz yoktur** — su = nehir; deniz yalnızca *geçmiştir*. NPC diyaloglarında deniz/liman/gemi yerine nehir/iskele/tekne kullan (istisna: bir karakter bilerek geçmiş deniz kentini anıyorsa, ör. Remy).

Oyuncu **sahil evinde, yalnız, parasız başlar.** Ofis tutacak parası olana dek sahil yakasında takılır; büyüdükçe nehri geçer.

## Kahramanın yayı
Apex Games'ten kovulma (arka plana göre 5 varyant: otomasyon/fikir çalınması/günah keçisi/kültür uyumu/kurul darbesi) → eşi "başka biri var" deyip boşanma → şehirdeki gayrimenkulü satıp **nehir kıyısındaki miras eve yalnız dönüş** → sıfırdan stüdyo → yıllar içinde yükseliş → **ahlaki ayna** → ~30. yılda emeklilik/epilog (sonra sandbox).

## Merkez tema — Nehir & Kendini Aşma
**Hayat bir nehirdir.**
- **Victor Crane** (Apex CEO, baş antagonist, Makyavelist): akıntıya bırakır kendini — *güç için* ezmeyi kabul eder. Düsturu: **"Sevgi ucuzlar, korku tutar."** Kartoonize kötü değil; her kararı iş açısından mantıklı, gri, insani.
- **Ana karakter:** akışı *değiştirmeye*, bataklığa saplansa da kürek çekmeye, **içindeki kötülükle bile dövüşmeye** çalışır.
- **Ahlaki ayna:** Oyuncu büyüdükçe, kendisini ezen kararların *verildiği* tarafa geçer (gelişemeyen dostu kovmak, eski meslektaşı reddetmek, rakibi satın al/yık). "Kovulan, kovan olur mu?" 4C finali (satın al/yık/affet/birleş) ve 3 yaşam yolu bu aynanın cevabıdır.
- **Üç su felsefesi:** Crane = sürüklen (kötü niyet) · Remy (Tao) = akışla uyum · Søren (Sartre) = kendi rotanı çiz.

## Ton
**Buruk-gerçekçi, gri, anlatıcısız.** Kötüler ve iyiler savaşmaz — hayat gibi, çoğu zaman sadece saçma ve insani. Stardew sıcaklığı + ahlaki ağırlık. Melodram yok; sessizlik, alt-metin, kazanılmış duygular.

## NPC korosu — felsefeler can bulmuş
Şehrin bazı NPC'leri birer etik felsefeyi *temsil eder* (filozofun adıyla değil, **felsefenin yaşayan hâliyle**): Stoa (Marcus/sahaf), Tao-akış (Remy/balıkçı), absürd-varoluş (Theo/pub), Nietzsche (Magnus), nihilizm-Bazarov (Yevgeni), Aristoteles-erdem (Bruno), Kant (Clara), Epikür (Aldo), Kirenaik (Rex), Fayda (Vivian), bakım (Marta), Sartre (Søren). Kalp arttıkça (tier 1→3) açılırlar; yüksek kalpte oyuncunun derdine *kendi felsefesinden* (isim vermeden) öğüt verirler. Konuşmak **idea-seed** kazandırır → RPG ilerlemesini besler. Sıradan kasabalılar + 12 romantizm adayı (farklı insan tipleri: süslü, kibirli, melankolik, çapkın...) korosu tamamlar.

## Sistemler (özet → detay specs/plans'te)
- **Tycoon/Ekonomi/Pazar/Pazarlama/Rakipler** — uygulandı (Faz 1–7).
- **RPG:** idea-seed + skill tree + 3 yaşam yolu (+tek-sefer tövbe) — `specs/2026-06-01-skill-tree-design.md`, `specs/2026-06-01-sandbox-yan-isler-ve-yasam-yollari-design.md`.

  **⚠️ Hayat Yolu Kilit & Ceza Mekaniği (uygulama gerçeği):**
  - Progress threshold (100 puan) aşılınca yol **kilitlenir** — diğer yollar artık progress kabul etmez (`lifePathStore.addProgress` guard).
  - Yol değiştirmek (`switchPath`) **ağır bedel** öder: kilitli yolun T5 capstone + sinapsları sökülür, eski yolun bağlı NPC'leri penalize edilir (`npcStore.penalizeNpc`), eski yolun progress'i −40 düşer.
  - **Tek-seferlik tövbe:** İkinci yol değiştirme ya tamamen engellenir ya da iki kat bedel alır.
  - Bu mekanik **anlatı-tetiklidir** (menüden değil): bir pişmanlık beat'i (ör. idealist çalışanın istifası, eski eşin düğünü) oyunu sorar: *"Bu sen misin?"*
  - Yaktığın köprüler kalıcıdır — kapanan sahaf açılmaz, giden NPC geri gelmez.
- **NPC diyalog sistemi** (tier 1/2/3, idea-seed, ilişki) — `data/npcDialogues.ts` (uygulandı, genişliyor); tam kadro `specs/2026-05-30-npc-etkilesim-felsefe-design.md`.
- **Yaşam-sim:** Yaşlanma çekirdeği (A) → NPC yaşam olayları (B: evlilik/doğum/ölüm/miras) → Romantizm (C1) → Final/Epilog (C2) — `specs/2026-05-31-*`.
- **Olay ara sahneleri:** duruma tetikli gri anlar (eski eş, Ned/gelişemeyen dost, eski meslektaş, çocuk, tükenmişlik, yas) — `specs/2026-05-31-oyuncu-hayati-olay-ara-sahneleri-design.md`.
- **Senaryo/cutscene:** giriş sahneleri + 4C rakip arc (Apex/Crane) — `specs/2026-05-30-*`.

## Tekrar eden motifler (tutarlılık için)
- **Saklanan nesne:** Marcus'un kupürleri, Yevgeni'nin babasının mektupları, Clara'nın yarım dosyası, oyuncunun eski eş mektubu — bırakamadığın geçmiş.
- **"Tuz/su kokusu"** → nehir kıyısı evi; iyileşme.
- **"Farklı teknelerle aynı limana"** → ayrılık ama olgun kapanış.
- **"Sevgi ucuzlar, korku tutar"** → Crane düsturu (finalde çürütülür/doğrulanır).
- **"Tablo titremez, insan titrer"** (Marta) → rakamların ardındaki insan; Ned/işten çıkarma.
- **"Her sabah yeniden seçtik"** (Wilhelm & Edith) → kalıcı sevgi, boşanmaya zıtlık.
- **"Geçmiş elimizde değil, şimdi elimizde"** (Marcus/Stoa) → tövbe ileriyi değiştirir, geçmişi değil.

## Tasarım ilkeleri
- **Küratörlü** içerik (prosedürel değil) — her olay anlamlı, elle yazılı.
- **Anlatıcısız** diyalog; karakterler konuşur.
- İsimler **Avrupai/İngilizce.**
- Her seçimin **gri bir bedeli** var; "doğru" cevap yok.
- **Sandbox:** ana arc mecbur değil; istersen sadece yaşarsın.
- Mekân: **"küçük şehir"** (kasaba değil).

## ⛔ NPC DİYALOGLARI — ZORUNLU KURAL
**NPC diyaloglarını kullanıcıya sormadan ASLA yazma.** Her karakteri **tek tek** kullanıcıya sun ve onayını al; diyalog metnini kullanıcı görmeden/onaylamadan koda yazma. Bu içerik küratörlü ve kişiseldir — toplu/otomatik üretilmez.

**Akış (her NPC için):**
1. Karakterin felsefesi, rolü, arka planı, idea-seed'i ve T1/T2/T3 beat'lerini **önce öner** (taslak metin olarak göster).
2. Kullanıcı her satırı görüp düzeltsin/onaylasın.
3. **Ancak onaydan sonra** `npcDialogues.ts`'e yaz.

**Romantizm adayları — belirgin sosyal tip:** Her romantizm adayı **birbirinden farklı, belirgin bir sosyal/duygusal tip** olmalı (melankolik, heyecanlı/hevesli, çapkın, kibirli, neşeli-saf, sert/dobra, bohem, utangaç...). Dümdüz/içi boş olmamalı; her biri **yüzey → gizli derinlik** taşır (kalp arttıkça açılır, Stardew mantığı). Mizaç/arketip haritası `specs/2026-05-30-npc-etkilesim-felsefe-design.md` "Romantizm — Tip/Arketip Haritası" tablosunda. Diyalog ritmi de tipe uymalı (melankolik = sparse/ağır/uzun sessizlik; heyecanlı = hızlı/coşkulu).

**Herkesin mesleği olmak zorunda değil:** Bazı NPC'ler işsiz/hobi sahibi olabilir — şehir gerçekçi olsun. Özellikle **oyun oynamayı hobi edinmiş NPC sayısını artır**: bir oyun stüdyosu kuruluyor, oyuncular doğal hayran/müşteri/playtester kitlesidir (ileride hype/fan mekaniğine bağlanabilir). Mevcut oyun-temalı NPC'ler: garaj üçlüsü (Lena/Sam/Milo), Tomas (arcade), Rex. Yeni gamer kasabalı NPC'leri romantizm dışı, NPCDef yapısında (T3 = flört değil, derin dostluk).

**Format/kalite referansı:** `src/data/npcDialogues.ts` içindeki **Yevgeni** bloğu örnek alınır. Yapı: NPCDef + **5 diyalog** — 2×T1 (ikincisi `choices` ile), 2×T2 (ikincisi `choices` ile), 1×T3 (Crane aynası, `relationshipBonus: 15`). Ton: buruk-gerçekçi, anlatıcısız, gri; her seçimin bir bedeli. idea-seed türü karakterin felsefesine uygun seçilir. T2'lerden biri NPC'nin "saklanan nesnesi"ne / yarasına değer (bkz. Tekrar eden motifler).

## Nasıl çalışıyoruz
`brainstorming → writing-plans → (subagent-driven) executing`. Her sistem: spec → plan → kod. Durum `DURUM.md`'de; başlarken `git pull`, bitince `git push`.
