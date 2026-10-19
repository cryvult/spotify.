import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { buttonClassName } from '../../components/ui/buttonClassName';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

interface NotFoundContentProps {
  title: string;
  description: string;
}

/** Komunikat dla nieistniejącego albumu, playlisty, wykonawcy lub strony. */
export function NotFoundContent({ title, description }: NotFoundContentProps) {
  useDocumentTitle(title);
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      actions={
        <>
          <Link to="/" className={buttonClassName({ variant: 'primary' })}>
            Strona główna
          </Link>
          <Link to="/search" className={buttonClassName({ variant: 'secondary' })}>
            Szukaj muzyki
          </Link>
        </>
      }
    />
  );
}
