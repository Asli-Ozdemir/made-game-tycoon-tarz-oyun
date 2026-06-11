# Asset Manifest — Steam Demo

_Öncelik: P1 = demo için zorunlu · P2 = demo kalitesini yükseltir · P3 = lüks._
_Stil: sahil yakası lo-fi pixel art, 32×32 tile grid, sıcak pastel palet._
_Teslim formatı: .aseprite kaynak + .png export → `src/assets/` veya `public/`._

## P1 — Kahraman varlıklar
| Varlık | Boyut | Kullanım | Not |
|---|---|---|---|
| Oyuncu sprite sheet | 32×48, 4 yön × 4 kare | WorldScene/Player.ts | İlk öğrenme projesi olarak ideal |
| Garaj iç tileset | 32×32 | coast_home odası | Masa, PC, yatak, duvar/zemin |
| Marcus portresi | 96×96 | DialogueView | Tek kare, büst |
| Stüdyo masası + PC | 32×32 ×2-3 tile | Masa trigger görseli | Onboarding'in odak noktası |
| İskele + deniz tile'ları | 32×32 | coast odası | Balıkçılık girişi |

## P2 — Dünya dokusu
| Varlık | Boyut | Kullanım | Not |
|---|---|---|---|
| Sahil binaları (sahaf, fırın, ev) | 64×64+ | coast odası | Dış cepheler |
| Demo NPC sprite'ları (Marcus, Remy) | 32×48 | WorldScene | Idle 2 kare yeterli |
| Balıkçılık sahne görselleri | 480×300 | FishingScene | Su, şamandıra, balık silüetleri |
| UI ikonları (para, tohum, hedef) | 16×16 / 24×24 | HUD | Tutarlı piksel yoğunluğu |
| Arşiv sahnesi dokuları | 560×420 | AntiquarianScene | Kitap sırtları, raf |

## P3 — Atmosfer
| Varlık | Boyut | Kullanım | Not |
|---|---|---|---|
| Dalga/martı animasyonları | 32×32 | coast odası | 2-4 kare loop |
| Hava/ışık overlay'leri | ekran | WorldScene | Gün döngüsü tonlaması |
| Dekoratif detaylar (saksı, tabela) | 32×32 | odalar | Doluluk hissi |

## Ses (fal-ai üretimi)
| Varlık | Süre | Kullanım |
|---|---|---|
| Sahil ambiyans loop | 60-90 sn | playing fazı müziği (mevcut placeholder değişir) |
| Menü teması | 30-60 sn | StartScreen loop |
| SFX seti: click/publish/objective/sleep | <1 sn | soundService mevcut anahtarlar |

## Çalışma akışı
1. P1'den başla, her varlık bitince oyuna entegre edilir (placeholder değişir).
2. Palet/stil ilk P1 varlıkta kilitlenir; sonrakiler ona uyar.
3. Kaynak .aseprite dosyaları repo'da tutulur.
