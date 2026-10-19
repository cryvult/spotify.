import type { ReactNode } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './Page.module.css';

interface PageProps {
  /** Tytuł widoczny na stronie i w karcie przeglądarki. */
  title: string;
  /** Ukrywa nagłówek wizualnie (np. strona główna ma własne powitanie). */
  hideTitle?: boolean;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Wspólny układ zwykłych stron: nagłówek i odstępy między sekcjami. */
export function Page({ title, hideTitle, description, actions, children }: PageProps) {
  useDocumentTitle(title);
  return (
    <div className={styles.page}>
      {hideTitle ? (
        <h1 className="visually-hidden">{title}</h1>
      ) : (
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      )}
      {children}
    </div>
  );
}

/** Treść pod kolorowym nagłówkiem albumu lub playlisty. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}
