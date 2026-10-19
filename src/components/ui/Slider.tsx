import type { CSSProperties, InputHTMLAttributes } from 'react';
import styles from './Slider.module.css';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Etykieta dla czytników ekranu. */
  label: string;
  /** Tekst odczytywany zamiast surowej liczby, np. „1:05 z 3:20”. */
  valueText?: string;
  /** Dodatkowe wypełnienie (np. pobrana część utworu), w procentach. */
  bufferedPercent?: number;
  onChange: (value: number) => void;
}

/**
 * Suwak oparty na <input type="range">: obsługa klawiatury (strzałki, Home, End,
 * PageUp/PageDown) i czytników ekranu jest wbudowana w przeglądarkę.
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  valueText,
  bufferedPercent,
  onChange,
  className,
  ...rest
}: SliderProps) {
  const range = max - min || 1;
  const percent = Math.min(100, Math.max(0, ((value - min) / range) * 100));
  const style = {
    '--fill': `${percent}%`,
    '--buffered': `${Math.max(percent, bufferedPercent ?? 0)}%`,
  } as CSSProperties;
  return (
    <input
      type="range"
      className={`${styles.slider} ${className ?? ''}`}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      aria-valuetext={valueText}
      style={style}
      onChange={(event) => onChange(Number(event.target.value))}
      {...rest}
    />
  );
}
