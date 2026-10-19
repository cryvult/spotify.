/** Powitanie zależne od pory dnia. */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Dzień dobry';
  if (hour >= 12 && hour < 18) return 'Miłego popołudnia';
  if (hour >= 18 && hour < 23) return 'Dobry wieczór';
  return 'Dobrej nocy';
}

/** Playlista dopasowana do pory dnia (rano kawa, wieczorem nocna jazda, w dzień skupienie). */
export function playlistForTimeOfDay(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'poranna-kawa';
  if (hour >= 20 || hour < 5) return 'nocna-jazda';
  return 'skupienie';
}

/** Data (RRRR-MM-DD) sprzed podanej liczby dni: granica „nowych wydań”. */
export function daysAgoIsoDate(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
}
