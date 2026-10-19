import { Search, X } from 'lucide-react';
import type { Ref } from 'react';
import styles from './SearchField.module.css';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  ref?: Ref<HTMLInputElement>;
}

/** Pole wyszukiwania z ikoną i przyciskiem czyszczenia. Escape czyści pole. */
export function SearchField({ value, onChange, onSubmit, ref }: SearchFieldProps) {
  return (
    <form
      role="search"
      className={styles.field}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Search className={styles.icon} size={20} aria-hidden />
      <label htmlFor="search-input" className="visually-hidden">
        Szukaj utworów, wykonawców, albumów, playlist i gatunków
      </label>
      <input
        ref={ref}
        id="search-input"
        type="search"
        className={styles.input}
        placeholder="Czego chcesz posłuchać?"
        value={value}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            onChange('');
          }
        }}
      />
      {value ? (
        <button
          type="button"
          className={styles.clear}
          aria-label="Wyczyść wyszukiwanie"
          onClick={() => onChange('')}
        >
          <X size={18} aria-hidden />
        </button>
      ) : null}
    </form>
  );
}
