import type { BackgroundId } from '@/data/backgrounds'
import type { CutsceneId, CutsceneDef, CutsceneFrame } from '@/types/cutscene'

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  kovulma: {
    id: 'kovulma',
    variants: {
      kk_uzmani: [
        {
          background: 'office',
          lines: [
            { speaker: 'İK Müdürü',     text: 'Otur, {{playerName}}. Uzun tutmayacağım.' },
            { speaker: '{{playerName}}', text: 'Ayakta kalırım. Alışkınım.' },
            { speaker: 'İK Müdürü',     text: 'Kalite kontrol süreçlerini otomasyona geçiriyoruz. Yeni sistem hataları senden hızlı buluyor.' },
            { speaker: '{{playerName}}', text: 'O sistem on yıl önce benim yazdığım test kılavuzuyla eğitildi.' },
            { speaker: 'İK Müdürü',     text: 'Karar yukarıdan geldi.' },
            { speaker: '{{playerName}}', text: 'On yıl be, on yıl. Hepsini tek bir kutuya mı sığdırayım?' },
            { speaker: 'İK Müdürü',     text: 'Tazminatını muhasebeden alabilirsin.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Kolileri gördüm. Demek gerçek oldu.' },
            { speaker: '{{playerName}}', text: '"Otomasyon" dediler.' },
            { speaker: 'Eş',             text: 'Hep iş, hep ekran. Eve geldiğinde bile burada değildin.' },
            { speaker: '{{playerName}}', text: 'O işi bizim için yapıyordum.' },
            { speaker: 'Eş',             text: 'Hayır, kendin için. Ben yıllardır bu evde yalnızım.' },
            { speaker: 'Eş',             text: '...Başka biri var, {{playerName}}.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Evi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.' },
            { speaker: 'Eş',             text: 'Seni bir daha görmek istemiyorum.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Annemlerin evi. Anahtar hâlâ saksının altında.' },
            { speaker: '{{playerName}}', text: 'Tuz ve toz kokuyor. Kimse yok. Sadece ben.' },
            { speaker: '{{playerName}}', text: 'Annem derdi ki: "Bir gün oturur, kendi işini kurarsın."' },
            { speaker: '{{playerName}}', text: 'Belki de zamanı geldi.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      yaratici_direktor: [
        {
          background: 'office',
          lines: [
            { speaker: 'Patron',         text: 'Oyun rekor kırdı, {{playerName}}. Bütün ekip gurur duymalı.' },
            { speaker: '{{playerName}}', text: 'Jenerik akarken adımı aradım. Yoktu.' },
            { speaker: 'Patron',         text: 'Fikir bir ekip işidir. Telifi şirkette kalır.' },
            { speaker: '{{playerName}}', text: 'O konsepti gece üçte, kendi masamda çizdim. Tek başıma.' },
            { speaker: 'Patron',         text: 'Fikirler şirkete aittir. Sen de öyleydin.' },
            { speaker: '{{playerName}}', text: 'Demek imzamı silip beni de siliyorsunuz.' },
            { speaker: 'Patron',         text: 'Eşyalarını topla. Güvenlik aşağıda bekliyor.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Yine mi kovuldun? Yoksa yine mi "prensip" meselesi?' },
            { speaker: '{{playerName}}', text: 'Eserimi çaldılar. Adımı bile koymadılar.' },
            { speaker: 'Eş',             text: 'Sen de hep o eserler için yaşadın. Bizim tablomuz hep yarım kaldı.' },
            { speaker: '{{playerName}}', text: 'Sanat böyledir, bedeli olur.' },
            { speaker: 'Eş',             text: 'Bedelini hep ben ödedim. Yalnızlığı ben taşıdım.' },
            { speaker: 'Eş',             text: '...Başka biri var. Beni gören biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Atölyeyi satıp ikiye bölelim. Anlaşmalı bitirelim.' },
            { speaker: 'Eş',             text: 'Bu sefer kendine bir imza bul. Çünkü beni bulamayacaksın.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Babamın evi. Duvarda hâlâ çocukken yaptığım resimler.' },
            { speaker: '{{playerName}}', text: 'Boyalar kurumuş, ama duruyor. Kimse silmemiş.' },
            { speaker: '{{playerName}}', text: 'Burada hiçbir fikir çalınmadı.' },
            { speaker: '{{playerName}}', text: 'Bu sefer jenerikte tek bir isim olacak.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      bas_muhendis: [
        {
          background: 'office',
          lines: [
            { speaker: 'Patron',         text: 'Proje battı, {{playerName}}. Yatırımcılar bir isim istiyor.' },
            { speaker: '{{playerName}}', text: 'Tarihi üç ay öne siz çektiniz. Ekibi yarıya siz indirdiniz.' },
            { speaker: 'Patron',         text: 'Teknik taraf senin sorumluluğundaydı.' },
            { speaker: '{{playerName}}', text: 'Uyardım. Her toplantıda, yazılı olarak uyardım.' },
            { speaker: 'Patron',         text: 'O mailleri kimse hatırlamayacak. Sadece batan projeyi hatırlayacaklar.' },
            { speaker: '{{playerName}}', text: 'Yani günah keçisi ben oluyorum.' },
            { speaker: 'Patron',         text: 'Çıkışın hazır. Kimseye veda etme, sessizce git.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Çantanı toplamışsın. Demek bu sefer gerçekten bitti.' },
            { speaker: '{{playerName}}', text: 'Batan geminin faturasını bana kestiler.' },
            { speaker: 'Eş',             text: 'Eve hep işi getirdin. Şimdi de suçu getiriyorsun.' },
            { speaker: '{{playerName}}', text: 'Suç benim değildi.' },
            { speaker: 'Eş',             text: 'Biliyorum. Ama haklı olman beni daha az yalnız bırakmadı.' },
            { speaker: 'Eş',             text: '...Başka biri var. Geceleri yanımda olan biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Evi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.' },
            { speaker: 'Eş',             text: 'Bu sefer batarsan, yanında ben olmayacağım.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Babamın evi. Garajda eski bilgisayarım hâlâ duruyor.' },
            { speaker: '{{playerName}}', text: 'Fişi taktım. Çalışıyor. İnatçı, tıpkı sahibi gibi.' },
            { speaker: '{{playerName}}', text: 'Bu sefer her satır kodun altında benim adım olacak.' },
            { speaker: '{{playerName}}', text: 'Batarsa, gerçekten benim hatam olur. İyi.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      yapimci: [
        {
          background: 'office',
          lines: [
            { speaker: 'Yeni CEO',       text: 'Şirkete yeni bir yön çiziyorum, {{playerName}}. Yeni bir kültür.' },
            { speaker: '{{playerName}}', text: 'On iki yıldır bu kültürü kuran bendim.' },
            { speaker: 'Yeni CEO',       text: 'Açıkçası... bu yeni vizyonla pek uyumlu görünmüyorsun.' },
            { speaker: '{{playerName}}', text: '"Uyum" derken, hangi sözleşmenin nereye gittiğini bilmemi mi kastediyorsun?' },
            { speaker: 'Yeni CEO',       text: 'Çok şey biliyorsun. Sorun da tam olarak bu.' },
            { speaker: '{{playerName}}', text: 'Yani bildiklerim yüzünden gidiyorum.' },
            { speaker: 'Yeni CEO',       text: 'Tazminatın cömert olacak. Karşılığında sessizliğini bekliyoruz.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Komşulara ne diyeceğiz? Daireyi, arabayı, okulları...' },
            { speaker: '{{playerName}}', text: 'Hepsi o işe bağlıydı. O iş de bitti.' },
            { speaker: 'Eş',             text: 'Bu hayatı sen seçtin. Bu çevreyi, bu tempoyu. Ben sadece uydum.' },
            { speaker: '{{playerName}}', text: 'Sana iyi bir hayat kurdum.' },
            { speaker: 'Eş',             text: 'Bana hayat kurdun ama içinde sen hiç yoktun.' },
            { speaker: 'Eş',             text: '...Başka biri var. Akşamları eve gelen biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Daireyi satıp ikiye bölelim. Anlaşmalı bitirelim, uzatmayalım.' },
            { speaker: 'Eş',             text: 'Aileme bunu açıklamak, sana açıklamaktan kolay olacak.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Annemlerin evi. Küçükken buradan kaçmak için can atardım.' },
            { speaker: '{{playerName}}', text: 'Şimdi tek sığınağım burası. Tuhaf.' },
            { speaker: '{{playerName}}', text: 'Kimse beni izlemiyor. İlk kez kimseye hesap vermiyorum.' },
            { speaker: '{{playerName}}', text: 'Bildiğim her şey hâlâ kafamda. Ve artık benim.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
      eski_ceo: [
        {
          background: 'office',
          lines: [
            { speaker: 'Kurul Başkanı',  text: 'Hisse iki çeyrektir düşüşte, {{playerName}}. Yatırımcılar bir kurban istiyor.' },
            { speaker: '{{playerName}}', text: 'Bu şirketi ben kurdum. Sıfırdan, kendi ellerimle.' },
            { speaker: 'Kurul Başkanı',  text: 'Ve bugün kurul, gitmen yönünde oy kullandı.' },
            { speaker: '{{playerName}}', text: 'Kaç kişi? Yıllarca yanımda oturanlardan kaçı?' },
            { speaker: 'Kurul Başkanı',  text: 'Oybirliği. Şirket artık senden büyük.' },
            { speaker: '{{playerName}}', text: 'Şirketi ben büyüttüm. Beni de o yüzden gömüyorsunuz.' },
            { speaker: 'Kurul Başkanı',  text: 'Basın açıklaması saat beşte çıkıyor. Kapıda araba bekliyor.' },
          ],
        },
        {
          background: 'bedroom',
          lines: [
            { speaker: 'Eş',             text: 'Telefonum susmuyor. Herkes "geçmiş olsun" diyor, ama gözleri gülüyor.' },
            { speaker: '{{playerName}}', text: 'Geçer. Manşetler hep geçer.' },
            { speaker: 'Eş',             text: 'Manşetlerde senin adın. Ama hep benimki de yanında.' },
            { speaker: '{{playerName}}', text: 'Buna katlanmayı biliyoruz. Birlikte atlattık daha kötülerini.' },
            { speaker: 'Eş',             text: 'Hayır, sen atlattın. Ben hep arka planda durdum.' },
            { speaker: 'Eş',             text: '...Başka biri var. Beni manşet değil, insan olarak gören biri.' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: '{{playerName}}', text: 'Villayı satıp ikiye bölelim. Anlaşmalı bitirelim, basına yem olmayalım.' },
            { speaker: 'Eş',             text: 'Seni bir daha görmek istemiyorum. Hele gazetede hiç.' },
          ],
        },
        {
          background: 'court',
          lines: [
            { speaker: 'Hâkim',          text: 'Taraflar anlaşmalı boşanmada mutabık. Talep kabul edilmiştir.' },
            { speaker: '{{playerName}}', text: '...' },
          ],
        },
        {
          background: 'coast',
          lines: [
            { speaker: '{{playerName}}', text: 'Babamın evi. Bir zamanlar bana küçük gelirdi.' },
            { speaker: '{{playerName}}', text: 'Şimdi tam. Tam da olması gerektiği kadar.' },
            { speaker: '{{playerName}}', text: 'Beni gömdüklerini sanıyorlar. Mezar taşımı bile yazdılar.' },
            { speaker: '{{playerName}}', text: 'Bir dahaki sefere manşetleri ben yazacağım.' },
            { speaker: '{{playerName}}', text: '{{studioName}}.' },
          ],
        },
      ],
    },
  },
  ilk_yayin: {
    id: 'ilk_yayin',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: '{{playerName}}', text: 'Gece yarısını geçti. "Yayınla" tuşu hâlâ ekranda, parlıyor.' },
          { speaker: '{{playerName}}', text: 'Eskiden bu an için bir toplantı odası dolusu insan olurdu. Pasta, alkış, fotoğraf.' },
          { speaker: '{{playerName}}', text: 'Şimdi sadece ben varım. Bir de dışarıda dalga sesi.' },
          { speaker: '{{playerName}}', text: '...Basayım mı?' },
        ],
      },
      {
        background: 'studio',
        lines: [
          { speaker: '{{playerName}}', text: '{{studioName}}. İlk oyun. Yayında.' },
          { speaker: '{{playerName}}', text: 'Kimse alkışlamıyor. İlk kez canımı yakmıyor bu.' },
          { speaker: '{{playerName}}', text: 'Çünkü bu sefer jenerikte tek bir isim var. Benimki.' },
          { speaker: '{{playerName}}', text: 'Yorgunum. Ama bu yorgunluk, ilk kez tamamen bana ait.' },
        ],
      },
    ],
  },
}

/**
 * Aktif sahnenin frame dizisini çözer.
 * variants varsa arkaplana göre seçer; yoksa frames döndürür.
 * background null ise (beklenmeyen durum) ilk varyanta (kk_uzmani) düşer.
 */
export function getCutsceneFrames(id: CutsceneId, background: BackgroundId | null): CutsceneFrame[] {
  const def = CUTSCENES[id]
  if (def.variants) {
    return def.variants[background ?? 'kk_uzmani']
  }
  return def.frames ?? []
}
