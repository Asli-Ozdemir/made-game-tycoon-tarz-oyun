import type { CutsceneId, CutsceneDef } from '@/types/cutscene'

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  kovulma: {
    id: 'kovulma',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Patron',         text: '[PLACEHOLDER] Seni işten çıkarmak zorundayım.' },
          { speaker: '{{playerName}}', text: '[PLACEHOLDER] Anlamıyorum, neden?' },
          { speaker: 'Patron',         text: '[PLACEHOLDER] Bütçe kısıtlamaları. Üzgünüm.' },
        ],
      },
      {
        background: 'bedroom',
        lines: [
          { speaker: 'Anlatıcı', text: '[PLACEHOLDER] Kutuyu topladın ve kapıdan çıktın.' },
          { speaker: 'Anlatıcı', text: '[PLACEHOLDER] Belki de bu bir başlangıçtı.' },
        ],
      },
    ],
  },
  ilk_yayin: {
    id: 'ilk_yayin',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] İlk oyunun yayında.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Sonunda...' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} adını dünyaya duyuruyorsun.' },
        ],
      },
    ],
  },
  nexus_notice: {
    id: 'nexus_notice',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Nexus CEO',       text: '[PLACEHOLDER] Bu stüdyoyu araştır.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Nexus Games sizi fark etti.' },
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
          { speaker: 'Sunucu',          text: '[PLACEHOLDER] Ve yılın oyunu ödülü...' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] İnanamıyorum.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} sektörün zirvesine ulaştı.' },
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
          { speaker: 'Sunucu',          text: '[PLACEHOLDER] Ve yılın oyunu ödülü...' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] İnanamıyorum.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} sektörün zirvesine ulaştı.' },
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
          { speaker: 'Sunucu',          text: '[PLACEHOLDER] Ve yılın oyunu ödülü...' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] İnanamıyorum.' },
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] {{studioName}} sektörün zirvesine ulaştı.' },
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
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Nexus Games yılın oyununu aldı.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Daha güçlü geri döneceğim.' },
        ],
      },
    ],
  },
  nexus_resolution: {
    id: 'nexus_resolution',
    frames: [
      {
        background: 'office',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Nexus Games ile hesaplaşma zamanı.' },
          { speaker: '{{playerName}}',  text: '[PLACEHOLDER] Bu kadar.' },
        ],
      },
    ],
  },
  indie_resolution: {
    id: 'indie_resolution',
    frames: [
      {
        background: 'studio',
        lines: [
          { speaker: 'Anlatıcı',        text: '[PLACEHOLDER] Rakiple yollar ayrıldı.' },
        ],
      },
    ],
  },
}
