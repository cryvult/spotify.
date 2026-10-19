import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '../../components/ui/Button';
import styles from './ErrorPages.module.css';

/**
 * Strona błędu na poziomie routera (np. nie udało się pobrać części aplikacji po aktualizacji
 * albo bez internetu). Pokazujemy zrozumiały komunikat zamiast pustego ekranu.
 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const details = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;
  return (
    <div className={`${styles.page} ${styles.standalone}`} role="alert">
      <p className={styles.code} aria-hidden>
        Błąd
      </p>
      <h1 className={styles.title}>Nie udało się wczytać aplikacji</h1>
      <p className={styles.text}>
        Sprawdź połączenie z internetem i odśwież stronę. Twoje playlisty i ulubione pozostają zapisane w tej
        przeglądarce.
      </p>
      {details ? <p className={styles.details}>Szczegóły: {details}</p> : null}
      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
          Odśwież stronę
        </Button>
        <Button variant="secondary" size="lg" onClick={() => (window.location.hash = '#/')}>
          Strona główna
        </Button>
      </div>
    </div>
  );
}
