/** Pełny adres widoku aplikacji (routing oparty na # działa także na GitHub Pages). */
export function appUrl(path: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${path.startsWith('/') ? path : `/${path}`}`;
}

/** Kopiuje tekst do schowka. Zwraca false, gdy przeglądarka na to nie pozwoliła. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Przechodzimy do metody zapasowej poniżej.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}
