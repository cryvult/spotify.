import { Music } from 'lucide-react';
import { useState } from 'react';
import styles from './CoverImage.module.css';

interface CoverImageProps {
  src: string | null;
  alt: string;
  /** Rozmiar w pikselach podawany w atrybutach width/height (zapobiega przesuwaniu układu). */
  size?: number;
  shape?: 'square' | 'circle';
  /** Obrazy widoczne od razu (np. w nagłówku) wczytujemy bez opóźnienia. */
  eager?: boolean;
  className?: string;
}

/** Prosty, deterministyczny skrót tekstu (ten sam tytuł = te same kolory zastępcze). */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/**
 * Okładka z leniwym ładowaniem i szkieletem do czasu wczytania.
 * Gdy obrazu brakuje lub nie da się go pobrać, pokazujemy estetyczną grafikę zastępczą.
 */
export function CoverImage({ src, alt, size = 300, shape = 'square', eager, className }: CoverImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const showFallback = !src || status === 'error';
  const hue = 250 + (hashString(alt) % 70);

  return (
    <div
      className={`${styles.cover} ${styles[shape]} ${status === 'loading' && !showFallback ? styles.loading : ''} ${className ?? ''}`}
    >
      {showFallback ? (
        <div
          className={styles.fallback}
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 60) % 360} 55% 28%))`,
          }}
          role="img"
          aria-label={alt}
        >
          <Music size={Math.max(18, Math.round(size / 6))} aria-hidden />
        </div>
      ) : (
        <img
          // Klucz resetuje stan po zmianie adresu obrazu.
          key={src}
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className={status === 'loaded' ? styles.visible : styles.hidden}
          ref={(image) => {
            // Obraz z pamięci podręcznej może być gotowy, zanim podepniemy onLoad.
            if (image?.complete && image.naturalWidth > 0 && status !== 'loaded') setStatus('loaded');
          }}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}
