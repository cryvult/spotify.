import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from '../ErrorBoundary';
import { MiniPlayer } from '../player/MiniPlayer';
import { MusicPlayer } from '../player/MusicPlayer';
import { NowPlayingSheet } from '../player/NowPlayingSheet';
import { QueuePanel } from '../player/QueuePanel';
import { PageSkeleton } from '../ui/Skeleton';
import { useSettings } from '../../context/SettingsContext';
import { useUI } from '../../context/UIContext';
import { WelcomeDialog } from '../../features/onboarding/WelcomeDialog';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { DESKTOP_QUERY, MOBILE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileNavigation } from './MobileNavigation';
import { NavDrawer } from './NavDrawer';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import styles from './AppLayout.module.css';

/**
 * Główny układ: panel boczny, przewijana treść, kolejka i stały odtwarzacz.
 * Na telefonach: górny pasek z menu, mini odtwarzacz i dolna nawigacja.
 */
export function AppLayout() {
  const { settings, updateSettings } = useSettings();
  const { isQueueOpen, setQueueOpen, isNavOpen, setNavOpen } = useUI();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const [scrolled, setScrolled] = useState(false);

  useKeyboardShortcuts();

  // Po zmianie widoku: przewiń treść na górę i przenieś fokus (ważne dla czytników ekranu).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const main = mainRef.current;
    if (!main) return;
    main.scrollTo({ top: 0 });
    const active = document.activeElement;
    if (!active || active === document.body || !main.contains(active)) main.focus({ preventScroll: true });
  }, [location.pathname]);

  // Górny pasek staje się nieprzezroczysty, gdy treść jest przewinięta (bez nasłuchiwania „scroll”).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const main = mainRef.current;
    if (!sentinel || !main || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!(entry?.isIntersecting ?? true)), {
      root: main,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const sidebarVariant = isDesktop && !settings.sidebarCollapsed ? 'full' : 'rail';
  const drawerOpen = isNavOpen && !isDesktop;
  const queueOverlay = !isDesktop;

  return (
    <div className={`${styles.shell} ${isQueueOpen && !queueOverlay ? styles.withQueue : ''}`}>
      <button type="button" className="skip-link" onClick={() => mainRef.current?.focus()}>
        Przejdź do treści
      </button>

      {!isMobile ? (
        <div className={`${styles.sidebarSlot} ${sidebarVariant === 'rail' ? styles.rail : ''}`}>
          <Sidebar
            variant={sidebarVariant}
            onToggleCollapse={
              isDesktop ? () => updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed }) : undefined
            }
            onExpandRequest={!isDesktop ? () => setNavOpen(true) : undefined}
          />
        </div>
      ) : null}

      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden />
        <TopBar solid={scrolled} showMenuButton={isMobile} onOpenMenu={() => setNavOpen(true)} />
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      {isQueueOpen ? (
        <>
          {queueOverlay ? (
            <div className={styles.scrim} onClick={() => setQueueOpen(false)} aria-hidden />
          ) : null}
          <div className={`${styles.queueSlot} ${queueOverlay ? styles.queueOverlay : ''}`}>
            <QueuePanel />
          </div>
        </>
      ) : null}

      {isMobile ? (
        <div className={styles.mobileBottom}>
          <MiniPlayer />
          <MobileNavigation />
        </div>
      ) : (
        <div className={styles.playerSlot}>
          <MusicPlayer />
        </div>
      )}

      <NavDrawer open={drawerOpen} onClose={() => setNavOpen(false)}>
        <Sidebar variant="full" onNavigate={() => setNavOpen(false)} onClose={() => setNavOpen(false)} />
      </NavDrawer>
      {isMobile ? <NowPlayingSheet /> : null}
      <WelcomeDialog />
    </div>
  );
}
