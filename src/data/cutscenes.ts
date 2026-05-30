import type { BackgroundId } from '@/data/backgrounds'
import type { ResolutionChoice } from '@/types/rival'
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

  nexus_notice: {
    id: 'nexus_notice',
    variants: {
      yapimci: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Şu yükselen stüdyo... kurucusunu hatırlarsınız.' },
            { speaker: 'Victor Crane',   text: '(gülümser) Elbette. Onu kovduğum gün koltuğum sağlamlaştı.' },
            { speaker: 'Victor Crane',   text: 'Çok şey biliyordu, Klein. Bilen adam, taht için fazla tehlikelidir.' },
            { speaker: 'Klein',          text: 'Tehdit olduğu için mi gönderdiniz?' },
            { speaker: 'Victor Crane',   text: 'Tehdit değildi, basamaktı. Yukarı çıkmak için birine basarsın — o da oradaydı, o kadar.' },
            { speaker: 'Klein',          text: 'Şimdi geri döndü.' },
            { speaker: 'Victor Crane',   text: 'Güzel. Açıkçası sıkılmıştım. İyi rakip iyi aynadır — bakalım ben mi haklıydım.' },
            { speaker: 'Victor Crane',   text: 'Beni sevmesini beklemiyorum. Makyavel ne demiş — hem sevilip hem korkulamıyorsan, korkulmayı seç. Sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
      kk_uzmani: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Küçük bir stüdyo dikkat çekiyor. {{studioName}}. Kurucusu eski çalışanımızmış.' },
            { speaker: 'Victor Crane',   text: 'Hangi ekipten?' },
            { speaker: 'Klein',          text: 'Kalite kontrol. Otomasyonda çıkarmışız.' },
            { speaker: 'Victor Crane',   text: 'Ah, o büyük temizlik. Dört yüz kişi gönderdim, hisse yüzde on iki fırladı. Kurul adımı o gün ezberledi.' },
            { speaker: 'Victor Crane',   text: 'Demek içlerinden biri stüdyo kurmuş. (eğlenir) Hoşuma gitti doğrusu.' },
            { speaker: 'Klein',          text: 'Endişelenelim mi?' },
            { speaker: 'Victor Crane',   text: 'Daha değil. Ama yetenekliyi yakından severim — ya yanına alırsın, ya önünü kesersin.' },
            { speaker: 'Victor Crane',   text: 'Korkutmak da var tabii. Makyavel boşuna yazmamış: sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
      eski_ceo: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Efendim, {{studioName}} büyüyor. Kurucusu... bu şirketin kurucusu.' },
            { speaker: 'Victor Crane',   text: '(koltuğa yaslanır) Bu koltuğu o yaptı. Ben sadece daha çok isteyeni oynadım.' },
            { speaker: 'Klein',          text: 'Kurulu siz mi çevirdiniz?' },
            { speaker: 'Victor Crane',   text: 'Çevirmedim, dinledim. Onlar korkuyordu, ben cesaret sattım. Oylar öyle döndü.' },
            { speaker: 'Klein',          text: 'Geri almaya gelir mi?' },
            { speaker: 'Victor Crane',   text: 'Umarım gelir. Bir adamı gerçekten tanımak için ondan bir şey çalman gerekir.' },
            { speaker: 'Victor Crane',   text: 'Ne yapacağını izlemek — bu işin tek gerçek keyfi.' },
            { speaker: 'Victor Crane',   text: 'Beni asla sevmeyecek. Olsun. Prens\'te der ki — sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
      yaratici_direktor: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: 'Yükselen bir stüdyo var. {{studioName}}. Tarzı tanıdık geliyor.' },
            { speaker: 'Victor Crane',   text: 'Gelmeli. O tarzı kurula ben sattım. (gülümser) Fikir benim değildi tabii.' },
            { speaker: 'Klein',          text: 'Onun fikriydi.' },
            { speaker: 'Victor Crane',   text: 'Fikir ucuzdur, Klein. Onu doğru odada söyleyen kişi pahalı. Ben o odadaydım, o değildi.' },
            { speaker: 'Klein',          text: 'Şimdi aynı fikirle dönüyor.' },
            { speaker: 'Victor Crane',   text: 'Ve bu sefer odanın sahibi o. Adil sayılır.' },
            { speaker: 'Victor Crane',   text: 'İtiraf edeyim — o oyunu çıkardığım gün en çok onun ne diyeceğini merak etmiştim.' },
            { speaker: 'Victor Crane',   text: 'Ondan af beklemiyorum. İstediğim, çekinmesi. Sevgi ucuzlar, Klein — korku tutar.' },
          ],
        },
      ],
      bas_muhendis: [
        {
          background: 'office',
          lines: [
            { speaker: 'Klein',          text: '{{studioName}} teknik olarak etkileyici. Kurucusu eski mühendislerimizden.' },
            { speaker: 'Victor Crane',   text: 'Batan proje, değil mi? O enkaza birinin adını yazmamız gerekiyordu.' },
            { speaker: 'Klein',          text: 'Onu siz mi seçtiniz?' },
            { speaker: 'Victor Crane',   text: 'Seçmedim, izin verdim. En sessiz, en az dostu olan seçilir — kural budur.' },
            { speaker: 'Victor Crane',   text: 'Oysa kod kusursuzdu. Sorun yönetimdeydi, yani bendeydi. Ama itibar pahalı, doğruluk ucuz.' },
            { speaker: 'Klein',          text: 'Şimdi karşımızda.' },
            { speaker: 'Victor Crane',   text: 'Kusursuz kod yazan, kusursuz kin de tutar. Demek bu işin tadı kaçmayacak.' },
            { speaker: 'Victor Crane',   text: 'Bana kin tutsun, sevgisi umurumda değil. Makyavel haklıydı: sevgi ucuzlar, korku tutar.' },
          ],
        },
      ],
    },
  },

  nexus_meeting: {
    id: 'nexus_meeting',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Victor Crane',   text: 'Sonunda yüz yüzeyiz. Otur. Seni uzaktan izliyordum.' },
          { speaker: '{{playerName}}', text: 'Neden çağırdın?' },
          { speaker: 'Victor Crane',   text: 'Merak. Beni bu kadar zorlayan kim, görmek istedim.' },
          { speaker: 'Victor Crane',   text: 'Hayatta tek şey öğrendim: akıntıya karşı yüzülmez. Ben bıraktım kendimi — bak, neredeyim.' },
          { speaker: '{{playerName}}', text: 'Akıntı seni bataklığa götürse de mi?' },
          { speaker: 'Victor Crane',   text: 'Orada da kral olurum. Boğulmaktan iyidir.' },
          { speaker: '{{playerName}}', text: 'Ben kürek çekeceğim. Yorulsam da, bataklığa saplansam da.' },
          { speaker: 'Victor Crane',   text: '(gülümser) Herkes öyle der; su sabırlıdır. Yine de... göster bakalım. Kimse beni uzun zamandır şaşırtmadı.' },
        ],
      },
    ],
  },

  awards_win: {
    id: 'awards_win',
    frames: [
      {
        background: 'server_room',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu ödülü... {{studioName}}!' },
          { speaker: '{{playerName}}', text: 'Duydum. Makinelerin uğultusu arasında, tek başıma.' },
          { speaker: '{{playerName}}', text: 'Sahnede birileri benim için alkışlıyor. Hiçbirini tanımıyorum.' },
          { speaker: '{{playerName}}', text: 'Kazandım. Ama elimi sıkacak kimse yok. Sadece fanların sesi.' },
          { speaker: '{{playerName}}', text: 'Yine de... fena değil. Hiç fena değil.' },
        ],
      },
    ],
  },
  awards_win_gallery: {
    id: 'awards_win_gallery',
    frames: [
      {
        background: 'gallery',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu... {{studioName}}!' },
          { speaker: '{{playerName}}', text: 'Duvardaki çizimlere baktım. Hepsinin altında tek bir imza var. Benimki.' },
          { speaker: '{{playerName}}', text: 'Yıllar önce bu sahnede başkası benim eserimle alkışlanmıştı.' },
          { speaker: '{{playerName}}', text: 'Şimdi alkış bana ait. Ama salon orada, ben buradayım.' },
          { speaker: '{{playerName}}', text: 'Galiba kazanmak, yalnız kalmanın güzel bir yolu.' },
        ],
      },
    ],
  },
  awards_win_boardroom: {
    id: 'awards_win_boardroom',
    frames: [
      {
        background: 'boardroom',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu... {{studioName}}!' },
          { speaker: '{{playerName}}', text: 'Uzun bir toplantı masası. Bir tek ben varım.' },
          { speaker: '{{playerName}}', text: 'Bir zamanlar böyle bir masadan kovulmuştum. Şimdi masa benim.' },
          { speaker: '{{playerName}}', text: 'Tuhaf — zirveye çıktıkça Crane\'i daha iyi anlıyorum.' },
          { speaker: '{{playerName}}', text: 'Ve beni en çok korkutan şey de bu.' },
        ],
      },
    ],
  },
  awards_lose_to_nexus: {
    id: 'awards_lose_to_nexus',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Sunucu',         text: '(yayından) Ve yılın oyunu ödülü... Nexus Games!' },
          { speaker: '{{playerName}}', text: 'Tabii ki. Parlak, güvenli, herkesin sevdiği bir oyun.' },
          { speaker: '{{playerName}}', text: 'Crane sahnede gülümsüyor. Beni görmüyor bile.' },
          { speaker: '{{playerName}}', text: '"Sevgi ucuzlar" demişti. Bu akşam sevgiyi de satın aldı.' },
          { speaker: '{{playerName}}', text: 'Sorun değil. Korku kalıcıysa... ben de sabırlıyım.' },
        ],
      },
    ],
  },

  nexus_resolution: {
    id: 'nexus_resolution',
    choiceVariants: {
      buyout: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Demek satın aldın. Çoğunluk hisse artık sende.' },
            { speaker: '{{playerName}}', text: 'Senin bana yaptığını yaptım. Sadece daha pahalıya.' },
            { speaker: 'Victor Crane',   text: 'Belki seni işten çıkararak hayatını kararttım. Kabul ediyorum.' },
            { speaker: 'Victor Crane',   text: 'Peki söyle — bu paraya ulaşana dek sen kaç kişinin hayatını kararttın?' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: 'Victor Crane',   text: 'Güç ezmeden gelmez. Bu benim kuralım değil, doğanın kanunu.' },
            { speaker: 'Victor Crane',   text: '"Sevgi ucuzlar, korku tutar" demiştim. Sen ikisini de geçtin — parayı seçtin.' },
            { speaker: 'Victor Crane',   text: '(kıkırdar) Koltuğu boşaltıyorum. Ama artık benden daha korkunçsun galiba.' },
            { speaker: 'Victor Crane',   text: '(kendini gösterir) Hayata son sürat kürek çektin. Ama bak — şu kütükle, yani benimle aynı hizadasın. İkimiz de aynı yere vardık.' },
          ],
        },
      ],
      destroy: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Skandalı basına verdin. Yarın sabaha bitmiş olacağım.' },
            { speaker: '{{playerName}}', text: 'Sen de beni böyle bitirmiştin. Tek bir imzayla.' },
            { speaker: 'Victor Crane',   text: 'Belki seni kovarak hayatını kararttım. Doğru.' },
            { speaker: 'Victor Crane',   text: 'Ama bu enkaza ulaşana dek sen kaç hayatın üstüne bastın?' },
            { speaker: '{{playerName}}', text: '...' },
            { speaker: 'Victor Crane',   text: 'Güç ezmeden gelmez. Doğanın kanunu bu — ben koymadım, sadece okudum.' },
            { speaker: 'Victor Crane',   text: '"Sevgi ucuzlar, korku tutar." Beni yıktın ama düsturumu taçlandırdın.' },
            { speaker: 'Victor Crane',   text: '(kıkırdar) Gömülen benim, korkma. Ama artık benden daha korkunçsun.' },
            { speaker: 'Victor Crane',   text: '(kendini gösterir) Tersine kürek çeke çeke vardığın yer, sürüklenen bir kütüğün — yani benim — vardığı yer. Nehir hep kazanır.' },
          ],
        },
      ],
      forgive: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Elinde her şey vardı. Skandalım, hisselerim, intikamın. Hiçbirini kullanmadın.' },
            { speaker: '{{playerName}}', text: 'Kullansaydım, sen olurdum. İstemedim.' },
            { speaker: 'Victor Crane',   text: '(uzun sessizlik) Anlamıyorum. Bu bir zayıflık.' },
            { speaker: '{{playerName}}', text: 'Ya da senin hiç sahip olmadığın bir şey.' },
            { speaker: 'Victor Crane',   text: '"Sevgi ucuzlar" demiştim. Sen onu bedavaya verdin, üstelik bana.' },
            { speaker: '{{playerName}}', text: 'Belki sevgi ucuz değildir, Crane. Belki sen hep yanlış mağazadaydın.' },
            { speaker: 'Victor Crane',   text: 'Sen nehrin sonuna kadar kürek çektin. Akıntıya değil, kendine rağmen. Oraya varan ilk insan belki de sensin.' },
            { speaker: 'Victor Crane',   text: '...Demek gerçekten varmış. Ham, katıksız iyi insanlar. Ben hep masal sanırdım.' },
            { speaker: 'Victor Crane',   text: 'Git. Seni anlamadan önce git.' },
          ],
        },
      ],
      merge: [
        {
          background: 'office',
          lines: [
            { speaker: 'Victor Crane',   text: 'Birleşme. İki stüdyo, tek çatı. Beklemediğim hamle.' },
            { speaker: '{{playerName}}', text: 'İkimiz de kaybetmekten yorulduk. Bu sefer aynı masadayız.' },
            { speaker: 'Victor Crane',   text: 'Sana onca kötülüğü yaptım, sen hâlâ elini uzatıyorsun.' },
            { speaker: '{{playerName}}', text: 'Güvendiğimden değil. Seni kontrol edebilirim çünkü — bunu bana sen öğrettin.' },
            { speaker: 'Victor Crane',   text: '(güler) Demek "sevgi ucuzlar, korku tutar"ı ezberledin.' },
            { speaker: '{{playerName}}', text: 'Hayır. Üçüncü bir şey buldum: ihtiyaç. O ikisinden de uzun sürer.' },
            { speaker: 'Victor Crane',   text: 'İkimiz de nehrin sonuna geldik — sen kürek çekerek, ben sürüklenerek. Tuhaf, yine de aynı yerde buluştuk.' },
            { speaker: 'Victor Crane',   text: '...Hayatım boyunca herkesi kendim sandım. Meğer gerçekten ham iyi insanlar varmış.' },
            { speaker: 'Victor Crane',   text: 'Ortak olalım. Ama gözünü dört aç.' },
            { speaker: '{{playerName}}', text: 'Sen de.' },
          ],
        },
      ],
    },
  },

  indie_resolution: {
    id: 'indie_resolution',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Rakip Kurucu',   text: 'Demek sıra bize geldi. Sizin gibi büyükler hep küçükleri ezerek başlar.' },
          { speaker: '{{playerName}}', text: 'Ben de bir zamanlar küçüktüm. Kovulmuş, bitmiş biriydim.' },
          { speaker: 'Rakip Kurucu',   text: 'Ama artık değilsin. Şimdi sen onlardansın.' },
          { speaker: '{{playerName}}', text: '...' },
          { speaker: '{{playerName}}', text: 'Belki. Ya da henüz değil. Bunu her gün yeniden seçiyorum.' },
        ],
      },
    ],
  },
}

/**
 * Aktif sahnenin frame dizisini çözer.
 * - choiceVariants + ctx.choice → seçime özgü (nexus_resolution)
 * - variants → arka plana özgü; ctx.background null ise kk_uzmani fallback
 * - aksi hâlde frames
 */
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
