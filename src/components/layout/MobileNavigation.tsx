import { Compass, House, LibraryBig, Search, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import styles from './MobileNavigation.module.css';

const TABS: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: '/', label: 'Główna', icon: House, end: true },
  { to: '/discover', label: 'Odkrywaj', icon: Compass },
  { to: '/search', label: 'Szukaj', icon: Search },
  { to: '/library', label: 'Biblioteka', icon: LibraryBig },
];

/** Dolne menu na telefonach: duże pola dotyku i podpisy pod ikonami. */
export function MobileNavigation() {
  return (
    <nav className={styles.tabbar} aria-label="Nawigacja mobilna">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <tab.icon size={22} aria-hidden />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
