import { Link } from 'react-router';
import { buttonClassName } from '../../components/ui/buttonClassName';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './ErrorPages.module.css';

export default function NotFoundPage() {
  useDocumentTitle('Nie znaleziono strony');
  return (
    <div className={styles.page}>
      <p className={styles.code} aria-hidden>
        404
      </p>
      <h1 className={styles.title}>Ta strona nie gra</h1>
      <p className={styles.text}>
        Adres jest nieprawidłowy albo strona została przeniesiona. Muzyka w odtwarzaczu gra dalej.
      </p>
      <div className={styles.actions}>
        <Link to="/" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
          Strona główna
        </Link>
        <Link to="/search" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
          Szukaj muzyki
        </Link>
      </div>
    </div>
  );
}
