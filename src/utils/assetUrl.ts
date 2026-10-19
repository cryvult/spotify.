/**
 * Adres pliku z folderu public z uwzględnieniem ścieżki bazowej aplikacji.
 * Dzięki temu pliki działają także po publikacji w podkatalogu (GitHub Pages).
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
