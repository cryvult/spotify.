import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

type Placement = 'top' | 'bottom' | 'right';

interface TooltipProps {
  label: string;
  placement?: Placement;
  children: ReactNode;
  /** Pozwala wyłączyć podpowiedź (np. gdy obok widać już podpis). */
  disabled?: boolean;
}

interface Position {
  x: number;
  y: number;
  placement: Placement;
}

const SHOW_DELAY = 450;

function computePosition(rect: DOMRect, placement: Placement): Position {
  if (placement === 'right') return { x: rect.right + 8, y: rect.top + rect.height / 2, placement };
  if (placement === 'bottom' || rect.top < 48)
    return { x: rect.left + rect.width / 2, y: rect.bottom + 8, placement: 'bottom' };
  return { x: rect.left + rect.width / 2, y: rect.top - 8, placement: 'top' };
}

/**
 * Podpowiedź dla przycisków z samą ikoną. Wyświetlana w portalu, więc nie jest ucinana
 * przez przewijane kontenery. Nie pojawia się na ekranach dotykowych.
 * Tekst dla czytników ekranu zapewnia aria-label przycisku, dlatego dymek ma aria-hidden.
 */
export function Tooltip({ label, placement = 'top', children, disabled }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [position, setPosition] = useState<Position | null>(null);

  const show = () => {
    if (disabled) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) setPosition(computePosition(rect, placement));
    }, SHOW_DELAY);
  };

  const hide = () => {
    window.clearTimeout(timer.current);
    setPosition(null);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Podczas przewijania pozycja dymka byłaby nieaktualna, więc go chowamy.
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('keydown', close);
    };
  }, [position]);

  return (
    <span
      ref={anchorRef}
      className={styles.anchor}
      onPointerEnter={(event) => event.pointerType === 'mouse' && show()}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(event) => event.target.matches(':focus-visible') && show()}
      onBlur={hide}
    >
      {children}
      {position
        ? createPortal(
            <span
              aria-hidden
              className={`${styles.tooltip} ${styles[position.placement]}`}
              style={{ left: position.x, top: position.y }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
