import { Ellipsis, type LucideIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { IconButton } from './IconButton';
import { Menu, type MenuItem } from './Menu';

interface MenuButtonProps {
  items: MenuItem[];
  label: string;
  tooltip?: string;
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled';
  className?: string;
}

/** Przycisk „Więcej opcji” otwierający menu. Po zamknięciu klawiszem fokus wraca na przycisk. */
export function MenuButton({
  items,
  label,
  tooltip,
  icon = Ellipsis,
  size = 'sm',
  variant = 'ghost',
  className,
}: MenuButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = useCallback(
    (reason: 'select' | 'escape' | 'outside') => {
      if (reason !== 'outside') anchor?.focus();
      setAnchor(null);
    },
    [anchor],
  );
  return (
    <>
      <IconButton
        icon={icon}
        label={label}
        tooltip={tooltip}
        size={size}
        variant={variant}
        className={className}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(anchor ? null : event.currentTarget);
        }}
      />
      {anchor ? <Menu items={items} anchor={anchor} label={label} onClose={close} /> : null}
    </>
  );
}
