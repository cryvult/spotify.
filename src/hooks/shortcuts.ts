// Lista skrótów klawiaturowych: używana przez hook obsługi klawiatury i okno pomocy.

export interface ShortcutInfo {
  keys: string[];
  description: string;
}

export const SHORTCUTS: ShortcutInfo[] = [
  { keys: ['Spacja'], description: 'Odtwórz lub wstrzymaj' },
  { keys: ['Shift', '→'], description: 'Następny utwór' },
  { keys: ['Shift', '←'], description: 'Poprzedni utwór' },
  { keys: ['→'], description: 'Przewiń o 5 s do przodu' },
  { keys: ['←'], description: 'Przewiń o 5 s do tyłu' },
  { keys: ['Shift', '↑'], description: 'Głośniej' },
  { keys: ['Shift', '↓'], description: 'Ciszej' },
  { keys: ['M'], description: 'Wycisz lub przywróć dźwięk' },
  { keys: ['S'], description: 'Tryb losowy' },
  { keys: ['R'], description: 'Tryb powtarzania' },
  { keys: ['L'], description: 'Polub bieżący utwór' },
  { keys: ['Q'], description: 'Pokaż lub ukryj kolejkę' },
  { keys: ['/'], description: 'Przejdź do wyszukiwarki' },
  { keys: ['?'], description: 'Pokaż listę skrótów' },
];
