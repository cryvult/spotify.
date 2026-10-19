import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.css';
import { Tooltip } from './Tooltip';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Opis dla czytników ekranu i treść podpowiedzi. Wymagany, bo przycisk nie ma tekstu. */
  label: string;
  /** Krótszy tekst podpowiedzi, gdy etykieta dla czytników jest dłuższa. */
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled' | 'accent';
  /** Stan włączenia przycisku przełączającego (np. tryb losowy). Ustawia aria-pressed. */
  active?: boolean;
  tooltipPlacement?: 'top' | 'bottom' | 'right';
  showTooltip?: boolean;
  iconFill?: boolean;
}

const ICON_SIZES = { sm: 16, md: 20, lg: 24 } as const;

export function IconButton({
  icon: Icon,
  label,
  tooltip,
  size = 'md',
  variant = 'ghost',
  active,
  tooltipPlacement = 'top',
  showTooltip = true,
  iconFill,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [styles.button, styles[size], styles[variant], active ? styles.active : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <Tooltip label={tooltip ?? label} placement={tooltipPlacement} disabled={!showTooltip}>
      <button type={type} aria-label={label} aria-pressed={active} className={classes} {...rest}>
        <Icon size={ICON_SIZES[size]} aria-hidden fill={iconFill ? 'currentColor' : 'none'} />
      </button>
    </Tooltip>
  );
}
