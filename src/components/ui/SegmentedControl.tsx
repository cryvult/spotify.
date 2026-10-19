import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Wybór jednej z kilku opcji: natywne przyciski radiowe, więc działają strzałki na klawiaturze. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className="visually-hidden">{label}</legend>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className={styles.input}
            />
            {Icon ? <Icon size={16} aria-hidden /> : null}
            <span>{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
