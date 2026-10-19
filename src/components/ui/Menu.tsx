import type { LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './Menu.module.css';

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  tone?: 'danger';
  /** Linia oddzielająca grupę poleceń. */
  separatorBefore?: boolean;
}

export type MenuAnchor = { x: number; y: number } | HTMLElement;

interface MenuProps {
  items: MenuItem[];
  anchor: MenuAnchor;
  label: string;
  onClose: (reason: 'select' | 'escape' | 'outside') => void;
}

const MARGIN = 8;

/**
 * Menu kontekstowe w portalu. Obsługa klawiatury: strzałki, Home, End, Enter, Escape.
 * Kliknięcie poza menu, przewinięcie lub zmiana rozmiaru okna zamykają je.
 */
export function Menu({ items, anchor, label, onClose }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Pozycjonowanie: przy wskazanym punkcie albo pod przyciskiem; menu nie wychodzi poza ekran.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    let x: number;
    let y: number;
    if (anchor instanceof HTMLElement) {
      const rect = anchor.getBoundingClientRect();
      x = rect.right - width;
      y = rect.bottom + 4;
      if (y + height > window.innerHeight - MARGIN) y = rect.top - height - 4;
    } else {
      x = anchor.x;
      y = anchor.y;
      if (y + height > window.innerHeight - MARGIN) y = anchor.y - height;
    }
    x = Math.min(Math.max(MARGIN, x), window.innerWidth - width - MARGIN);
    y = Math.min(Math.max(MARGIN, y), window.innerHeight - height - MARGIN);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.visibility = 'visible';
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose('outside');
    };
    const onViewportChange = () => onClose('outside');
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, { capture: true });
    };
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [],
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (next: number) => buttons[(next + buttons.length) % buttons.length]?.focus();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(buttons.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        onClose('escape');
        break;
      case 'Tab':
        event.preventDefault();
        onClose('escape');
        break;
    }
  };

  return createPortal(
    <div ref={menuRef} role="menu" aria-label={label} className={styles.menu} onKeyDown={onKeyDown}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} role="none" className={item.separatorBefore ? styles.separated : undefined}>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              className={`${styles.item} ${item.tone === 'danger' ? styles.danger : ''}`}
              onClick={() => {
                onClose('select');
                item.onSelect();
              }}
            >
              {Icon ? <Icon size={16} aria-hidden /> : <span className={styles.iconSpacer} />}
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
