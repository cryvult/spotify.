import { assetUrl } from '../utils/assetUrl';
import type { GenreId, TrackLicense } from '../types/music';

/**
 * Surowe dane utworów. Nazwy wykonawców, tytuły albumów i okładki są dołączane
 * w pliku catalog.ts na podstawie identyfikatorów (bez powielania danych).
 */
export interface TrackSeed {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  trackNumber: number;
  durationSec: number;
  genreIds: GenreId[];
  popularity: number;
  source: 'generated' | 'remote';
  audioUrl: string;
  license: TrackLicense;
}

// Utwory wygenerowane skryptem scripts/generate-audio.mjs (pliki w public/audio).
const GENERATED_LICENSE: TrackLicense = {
  name: 'CC0 1.0',
  url: 'https://creativecommons.org/publicdomain/zero/1.0/deed.pl',
  author: 'Projekt SONORA (utwór wygenerowany algorytmicznie)',
  sourceUrl: null,
};

function generated(seed: Omit<TrackSeed, 'source' | 'audioUrl' | 'license'>): TrackSeed {
  return {
    ...seed,
    source: 'generated',
    audioUrl: assetUrl(`audio/${seed.id}.mp3`),
    license: GENERATED_LICENSE,
  };
}

// Utwory Kevina MacLeoda odtwarzane z Wikimedia Commons (licencja CC BY 3.0).
function commons(
  seed: Omit<TrackSeed, 'source' | 'license' | 'audioUrl'> & { file: string; mp3Url: string },
): TrackSeed {
  const { file, mp3Url, ...rest } = seed;
  return {
    ...rest,
    source: 'remote',
    audioUrl: mp3Url,
    license: {
      name: 'CC BY 3.0',
      url: 'https://creativecommons.org/licenses/by/3.0/deed.pl',
      author: 'Kevin MacLeod (incompetech.com)',
      sourceUrl: `https://commons.wikimedia.org/wiki/File:${file}`,
    },
  };
}

const COMMONS_MP3 = 'https://upload.wikimedia.org/wikipedia/commons';

export const TRACK_SEEDS: TrackSeed[] = [
  // Pola Wiatr: Herbata o drugiej
  generated({
    id: 'parujacy-kubek',
    title: 'Parujący kubek',
    artistId: 'pola-wiatr',
    albumId: 'herbata-o-drugiej',
    trackNumber: 1,
    durationSec: 90.2,
    genreIds: ['lofi'],
    popularity: 94,
  }),
  generated({
    id: 'deszcz-na-parapecie',
    title: 'Deszcz na parapecie',
    artistId: 'pola-wiatr',
    albumId: 'herbata-o-drugiej',
    trackNumber: 2,
    durationSec: 97.3,
    genreIds: ['lofi'],
    popularity: 88,
  }),
  generated({
    id: 'notatki-na-marginesie',
    title: 'Notatki na marginesie',
    artistId: 'pola-wiatr',
    albumId: 'herbata-o-drugiej',
    trackNumber: 3,
    durationSec: 84,
    genreIds: ['lofi'],
    popularity: 71,
  }),
  generated({
    id: 'lampka-na-biurku',
    title: 'Lampka na biurku',
    artistId: 'pola-wiatr',
    albumId: 'herbata-o-drugiej',
    trackNumber: 4,
    durationSec: 88,
    genreIds: ['lofi'],
    popularity: 76,
  }),

  // Okto: Autostrada 1986
  generated({
    id: 'neon-nad-wisla',
    title: 'Neon nad Wisłą',
    artistId: 'okto',
    albumId: 'autostrada-1986',
    trackNumber: 1,
    durationSec: 87.1,
    genreIds: ['synthwave'],
    popularity: 91,
  }),
  generated({
    id: 'autostrada-1986',
    title: 'Autostrada 1986',
    artistId: 'okto',
    albumId: 'autostrada-1986',
    trackNumber: 2,
    durationSec: 82.5,
    genreIds: ['synthwave'],
    popularity: 86,
  }),
  generated({
    id: 'kaseta-vhs',
    title: 'Kaseta VHS',
    artistId: 'okto',
    albumId: 'autostrada-1986',
    trackNumber: 3,
    durationSec: 94,
    genreIds: ['synthwave'],
    popularity: 64,
  }),
  generated({
    id: 'chromowany-zachod',
    title: 'Chromowany zachód',
    artistId: 'okto',
    albumId: 'autostrada-1986',
    trackNumber: 4,
    durationSec: 90.4,
    genreIds: ['synthwave'],
    popularity: 69,
  }),

  // Mira Halden: Szkło i mgła
  generated({
    id: 'poranna-mgla',
    title: 'Poranna mgła',
    artistId: 'mira-halden',
    albumId: 'szklo-i-mgla',
    trackNumber: 1,
    durationSec: 91.7,
    genreIds: ['neoklasyka', 'ambient'],
    popularity: 83,
  }),
  generated({
    id: 'szklo',
    title: 'Szkło',
    artistId: 'mira-halden',
    albumId: 'szklo-i-mgla',
    trackNumber: 2,
    durationSec: 87,
    genreIds: ['ambient'],
    popularity: 67,
  }),
  generated({
    id: 'cisza-po-burzy',
    title: 'Cisza po burzy',
    artistId: 'mira-halden',
    albumId: 'szklo-i-mgla',
    trackNumber: 3,
    durationSec: 97,
    genreIds: ['neoklasyka', 'ambient'],
    popularity: 74,
  }),
  generated({
    id: 'swiatlo-przez-liscie',
    title: 'Światło przez liście',
    artistId: 'mira-halden',
    albumId: 'szklo-i-mgla',
    trackNumber: 4,
    durationSec: 89.3,
    genreIds: ['ambient'],
    popularity: 58,
  }),

  // Kaskada: Ciepłe noce (EP)
  generated({
    id: 'cieple-noce',
    title: 'Ciepłe noce',
    artistId: 'kaskada',
    albumId: 'cieple-noce',
    trackNumber: 1,
    durationSec: 66,
    genreIds: ['house'],
    popularity: 90,
  }),
  generated({
    id: 'dachy-miasta',
    title: 'Dachy miasta',
    artistId: 'kaskada',
    albumId: 'cieple-noce',
    trackNumber: 2,
    durationSec: 64.9,
    genreIds: ['house'],
    popularity: 79,
  }),
  generated({
    id: 'pulsar',
    title: 'Pulsar',
    artistId: 'kaskada',
    albumId: 'cieple-noce',
    trackNumber: 3,
    durationSec: 67,
    genreIds: ['house'],
    popularity: 72,
  }),

  // Bit Brigada: Ósmy bit (EP)
  generated({
    id: 'start-gry',
    title: 'Start gry',
    artistId: 'bit-brigada',
    albumId: 'osmy-bit',
    trackNumber: 1,
    durationSec: 62,
    genreIds: ['chiptune'],
    popularity: 85,
  }),
  generated({
    id: 'zamek-z-pikseli',
    title: 'Zamek z pikseli',
    artistId: 'bit-brigada',
    albumId: 'osmy-bit',
    trackNumber: 2,
    durationSec: 67.5,
    genreIds: ['chiptune'],
    popularity: 66,
  }),
  generated({
    id: 'ostatni-boss',
    title: 'Ostatni boss',
    artistId: 'bit-brigada',
    albumId: 'osmy-bit',
    trackNumber: 3,
    durationSec: 58.8,
    genreIds: ['chiptune'],
    popularity: 77,
  }),

  // Nocny Tramwaj: Linia 33 (EP)
  generated({
    id: 'linia-33',
    title: 'Linia 33',
    artistId: 'nocny-tramwaj',
    albumId: 'linia-33',
    trackNumber: 1,
    durationSec: 72,
    genreIds: ['downtempo'],
    popularity: 81,
  }),
  generated({
    id: 'przystanek-na-zadanie',
    title: 'Przystanek na żądanie',
    artistId: 'nocny-tramwaj',
    albumId: 'linia-33',
    trackNumber: 2,
    durationSec: 69,
    genreIds: ['downtempo'],
    popularity: 68,
  }),

  // Kevin MacLeod: Calming (Wikimedia Commons, CC BY 3.0)
  commons({
    id: 'km-carefree',
    title: 'Carefree',
    artistId: 'kevin-macleod',
    albumId: 'calming',
    trackNumber: 1,
    durationSec: 205.1,
    genreIds: ['ambient'],
    popularity: 80,
    file: 'Kevin_MacLeod_-_Carefree.ogg',
    mp3Url: `${COMMONS_MP3}/transcoded/5/58/Kevin_MacLeod_-_Carefree.ogg/Kevin_MacLeod_-_Carefree.ogg.mp3`,
  }),
  commons({
    id: 'km-dream-culture',
    title: 'Dream Culture',
    artistId: 'kevin-macleod',
    albumId: 'calming',
    trackNumber: 2,
    durationSec: 214.4,
    genreIds: ['ambient'],
    popularity: 62,
    file: 'Kevin_MacLeod_-_Dream_Culture.ogg',
    mp3Url: `${COMMONS_MP3}/transcoded/e/e0/Kevin_MacLeod_-_Dream_Culture.ogg/Kevin_MacLeod_-_Dream_Culture.ogg.mp3`,
  }),
  commons({
    id: 'km-smoother-move',
    title: 'Smoother Move',
    artistId: 'kevin-macleod',
    albumId: 'calming',
    trackNumber: 3,
    durationSec: 278.1,
    genreIds: ['ambient'],
    popularity: 73,
    file: 'Kevin_MacLeod_-_Smoother_Move.ogg',
    mp3Url: `${COMMONS_MP3}/transcoded/e/e5/Kevin_MacLeod_-_Smoother_Move.ogg/Kevin_MacLeod_-_Smoother_Move.ogg.mp3`,
  }),
  commons({
    id: 'km-silver-blue-light',
    title: 'Silver Blue Light',
    artistId: 'kevin-macleod',
    albumId: 'calming',
    trackNumber: 4,
    durationSec: 350.1,
    genreIds: ['ambient'],
    popularity: 59,
    file: 'Kevin_MacLeod_-_Silver_Blue_Light.ogg',
    mp3Url: `${COMMONS_MP3}/transcoded/8/85/Kevin_MacLeod_-_Silver_Blue_Light.ogg/Kevin_MacLeod_-_Silver_Blue_Light.ogg.mp3`,
  }),
  commons({
    id: 'km-sovereign-quarter',
    title: 'Sovereign Quarter',
    artistId: 'kevin-macleod',
    albumId: 'calming',
    trackNumber: 5,
    durationSec: 291.4,
    genreIds: ['ambient'],
    popularity: 55,
    file: 'Kevin_MacLeod_-_Sovereign_Quarter.ogg',
    mp3Url: `${COMMONS_MP3}/transcoded/4/43/Kevin_MacLeod_-_Sovereign_Quarter.ogg/Kevin_MacLeod_-_Sovereign_Quarter.ogg.mp3`,
  }),

  // Kevin MacLeod: Cattails (singiel, Wikimedia Commons, CC BY 3.0)
  commons({
    id: 'km-cattails',
    title: 'Cattails',
    artistId: 'kevin-macleod',
    albumId: 'cattails',
    trackNumber: 1,
    durationSec: 159,
    genreIds: ['folk'],
    popularity: 60,
    file: 'Kevin_MacLeod_-_Cattails.mp3',
    mp3Url: `${COMMONS_MP3}/4/4c/Kevin_MacLeod_-_Cattails.mp3`,
  }),
];
