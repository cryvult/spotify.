import type { Genre } from '../types/music';

export const GENRES: Genre[] = [
  {
    id: 'lofi',
    name: 'Lo-fi',
    description: 'Ciepłe akordy pianina elektrycznego, miękka perkusja i szum płyty. Dobre tło do nauki.',
    color: '#8a4f2e',
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Syntezatory, automaty perkusyjne i neonowe arpeggia inspirowane latami 80.',
    color: '#7a2d8c',
  },
  {
    id: 'ambient',
    name: 'Ambient',
    description: 'Przestrzenne plamy dźwięku, długie wybrzmienia i spokojne tempo.',
    color: '#2f5c8a',
  },
  {
    id: 'neoklasyka',
    name: 'Neoklasyka',
    description: 'Fortepian i smyczki w prostych, powolnych kompozycjach.',
    color: '#4f4a78',
  },
  {
    id: 'house',
    name: 'House',
    description: 'Równa stopa, ciepłe akordy i bas, który prowadzi cały utwór.',
    color: '#a12f55',
  },
  {
    id: 'chiptune',
    name: 'Chiptune',
    description: 'Muzyka w stylu 8-bitowych konsol: fale prostokątne, trójkątny bas i szumowa perkusja.',
    color: '#1d6a99',
  },
  {
    id: 'downtempo',
    name: 'Downtempo',
    description: 'Powolne bity, głęboki bas i melancholijne harmonie na późne godziny.',
    color: '#246a60',
  },
  {
    id: 'folk',
    name: 'Folk',
    description: 'Akustyczne brzmienia i proste, ciepłe melodie.',
    color: '#6f5b22',
  },
];
