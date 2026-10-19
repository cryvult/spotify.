import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Klasy przycisku: można ich użyć także dla linków wyglądających jak przycisk. */
export function buttonClassName({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className,
}: ButtonStyleOptions = {}) {
  return [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : '', className ?? '']
    .filter(Boolean)
    .join(' ');
}
