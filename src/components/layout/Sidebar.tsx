import {
  Compass,
  Disc3,
  Heart,
  History,
  House,
  Keyboard,
  LibraryBig,
  ListMusic,
  MicVocal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { PlaylistCover } from '../music/PlaylistCover';
import { IconButton } from '../ui/IconButton';
import { Tooltip } from '../ui/Tooltip';
import { LogoMark } from './LogoMark';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: '/', label: 'Strona główna', icon: House, end: true },
  { to: '/discover', label: 'Odkrywaj', icon: Compass },
  { to: '/search', label: 'Szukaj', icon: Search },
  { to: '/library', label: 'Moja biblioteka', icon: LibraryBig },
];

const COLLECTION: NavItem[] = [
  { to: '/playlists', label: 'Playlisty', icon: ListMusic },
  { to: '/liked', label: 'Ulubione utwory', icon: Heart },
  { to: '/recent', label: 'Ostatnio odtwarzane', icon: History },
  { to: '/albums', label: 'Albumy', icon: Disc3 },
  { to: '/artists', label: 'Wykonawcy', icon: MicVocal },
];

interface SidebarProps {
  /** rail: wąski pasek z samymi ikonami. */
  variant: 'full' | 'rail';
  /** Wywoływane po kliknięciu linku (zamyka menu wysuwane). */
  onNavigate?: () => void;
  /** Przycisk zwijania/rozwijania (tylko na dużych ekranach). */
  onToggleCollapse?: () => void;
  /** Na tablecie pasek ikon może otworzyć pełne menu. */
  onExpandRequest?: () => void;
  /** W menu wysuwanym: przycisk zamknięcia (na ekranach dotykowych nie ma klawisza Escape). */
  onClose?: () => void;
}

export function Sidebar({ variant, onNavigate, onToggleCollapse, onExpandRequest, onClose }: SidebarProps) {
  const { playlists, liked } = useLibrary();
  const { openCreatePlaylist, openShortcuts } = useDialogs();
  const rail = variant === 'rail';

  const renderLink = (item: NavItem, badge?: number) => {
    const link = (
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        onClick={onNavigate}
        aria-label={rail ? item.label : undefined}
      >
        <item.icon size={20} aria-hidden />
        {rail ? null : <span className={styles.label}>{item.label}</span>}
        {!rail && badge ? <span className={styles.badge}>{badge}</span> : null}
      </NavLink>
    );
    return (
      <li key={item.to}>
        {rail ? (
          <Tooltip label={item.label} placement="right">
            {link}
          </Tooltip>
        ) : (
          link
        )}
      </li>
    );
  };

  return (
    <nav className={`${styles.sidebar} ${rail ? styles.rail : ''}`} aria-label="Główna nawigacja">
      <div className={styles.brand}>
        <NavLink to="/" className={styles.logo} onClick={onNavigate} aria-label="SONORA, strona główna">
          <LogoMark size={rail ? 34 : 30} />
          {rail ? null : <span className={styles.wordmark}>SONORA</span>}
        </NavLink>
        {onToggleCollapse && !rail ? (
          <IconButton
            icon={PanelLeftClose}
            label="Zwiń panel boczny"
            size="sm"
            tooltipPlacement="bottom"
            onClick={onToggleCollapse}
          />
        ) : null}
        {onClose ? (
          <IconButton icon={X} label="Zamknij menu" size="sm" showTooltip={false} onClick={onClose} />
        ) : null}
      </div>

      {rail && (onToggleCollapse || onExpandRequest) ? (
        <div className={styles.expand}>
          <IconButton
            icon={PanelLeftOpen}
            label="Rozwiń panel boczny"
            size="sm"
            tooltipPlacement="right"
            onClick={onToggleCollapse ?? onExpandRequest}
          />
        </div>
      ) : null}

      <div className={styles.scroll}>
        <ul className={styles.group}>{PRIMARY.map((item) => renderLink(item))}</ul>

        <div className={styles.section}>
          {rail ? null : <h2 className={styles.sectionTitle}>Kolekcja</h2>}
          <ul className={styles.group}>
            {COLLECTION.map((item) => renderLink(item, item.to === '/liked' ? liked.length : undefined))}
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            {rail ? null : <h2 className={styles.sectionTitle}>Twoje playlisty</h2>}
            <IconButton
              icon={Plus}
              label="Utwórz playlistę"
              size="sm"
              variant={rail ? 'filled' : 'ghost'}
              tooltipPlacement={rail ? 'right' : 'top'}
              onClick={() => {
                onNavigate?.();
                openCreatePlaylist();
              }}
            />
          </div>
          {playlists.length === 0 && !rail ? (
            <div className={styles.hint}>
              <p>Utwórz pierwszą playlistę i dodawaj do niej utwory z menu przy każdym utworze.</p>
            </div>
          ) : (
            <ul className={styles.playlists}>
              {playlists.map((playlist) => {
                const link = (
                  <NavLink
                    to={`/playlist/${playlist.id}`}
                    className={({ isActive }) => `${styles.playlistLink} ${isActive ? styles.active : ''}`}
                    onClick={onNavigate}
                    aria-label={rail ? playlist.title : undefined}
                  >
                    <PlaylistCover playlist={playlist} size={80} className={styles.playlistCover} />
                    {rail ? null : (
                      <span className={styles.playlistText}>
                        <span className={styles.playlistTitle}>{playlist.title}</span>
                        <span className={styles.playlistMeta}>Playlista</span>
                      </span>
                    )}
                  </NavLink>
                );
                return (
                  <li key={playlist.id}>
                    {rail ? (
                      <Tooltip label={playlist.title} placement="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ul className={`${styles.group} ${styles.footer}`}>
        {renderLink({ to: '/settings', label: 'Ustawienia', icon: Settings })}
        <li>
          {rail ? (
            <IconButton
              icon={Keyboard}
              label="Skróty klawiaturowe"
              size="md"
              tooltipPlacement="right"
              onClick={openShortcuts}
              className={styles.railButton}
            />
          ) : (
            <button type="button" className={styles.link} onClick={openShortcuts}>
              <Keyboard size={20} aria-hidden />
              <span className={styles.label}>Skróty klawiaturowe</span>
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}
