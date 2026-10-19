import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClassName, type ButtonStyleOptions } from './buttonClassName';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  icon?: LucideIcon;
  children: ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  icon: Icon,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, fullWidth, className })} {...rest}>
      {Icon ? <Icon size={size === 'sm' ? 16 : 18} aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
