import { ChevronLeft, ChevronRight, Menu, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router';
import { useSettings } from '../../context/SettingsContext';
import { IconButton } from '../ui/IconButton';
import { LogoMark } from './LogoMark';
import styles from './TopBar.module.css';

interface TopBarProps {
  /** Tło staje się nieprzezroczyste po przewinięciu treści. */
  solid: boolean;
  showMenuButton: boolean;
  onOpenMenu: () => void;
}

/** Odczytuje pozycję w historii zapisaną przez React Router (pozwala wyłączyć „Wstecz” na starcie). */
function historyIndex(): number {
  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
}

/** Czy można cofnąć się lub przejść dalej w historii przeglądania aplikacji. */
function useHistoryPosition() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const index = historyIndex();
  // Zapamiętujemy najdalszą odwiedzoną pozycję; nowa nawigacja (PUSH) usuwa historię „do przodu”.
  const [tracked, setTracked] = useState({ key: location.key, furthest: index });
  if (tracked.key !== location.key) {
    setTracked({
      key: location.key,
      furthest: navigationType === 'PUSH' ? index : Math.max(tracked.furthest, index),
    });
  }
  return { canGoBack: index > 0, canGoForward: index < tracked.furthest };
}

export function TopBar({ solid, showMenuButton, onOpenMenu }: TopBarProps) {
  const navigate = useNavigate();
  const { settings, resolvedTheme, updateSettings } = useSettings();
  const { canGoBack, canGoForward } = useHistoryPosition();

  const initial = settings.userName.trim().charAt(0).toUpperCase();

  return (
    <header className={`${styles.topbar} ${solid ? styles.solid : ''}`}>
      <div className={styles.left}>
        {showMenuButton ? (
          <>
            <IconButton icon={Menu} label="Otwórz menu nawigacji" onClick={onOpenMenu} showTooltip={false} />
            <Link to="/" className={styles.mobileLogo} aria-label="SONORA, strona główna">
              <LogoMark size={28} />
            </Link>
          </>
        ) : null}
        <div className={styles.history}>
          <IconButton
            icon={ChevronLeft}
            label="Wstecz"
            variant="filled"
            size="sm"
            disabled={!canGoBack}
            onClick={() => navigate(-1)}
            tooltipPlacement="bottom"
          />
          <IconButton
            icon={ChevronRight}
            label="Dalej"
            variant="filled"
            size="sm"
            disabled={!canGoForward}
            onClick={() => navigate(1)}
            tooltipPlacement="bottom"
          />
        </div>
      </div>
      <div className={styles.right}>
        <IconButton
          icon={resolvedTheme === 'dark' ? Sun : Moon}
          label={resolvedTheme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          variant="filled"
          size="sm"
          tooltipPlacement="bottom"
          onClick={() => updateSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' })}
        />
        <Link to="/settings" className={styles.avatar} aria-label="Ustawienia i profil">
          {initial || 'S'}
        </Link>
      </div>
    </header>
  );
}
