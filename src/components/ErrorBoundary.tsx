import { CircleAlert } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Zmiana klucza (np. adresu strony) czyści błąd. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetKey?: string;
}

/**
 * Łapie błędy renderowania w widoku, aby awaria jednej strony nie wyłączała całej
 * aplikacji (odtwarzacz i nawigacja działają dalej).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SONORA] Błąd widoku:', error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <EmptyState
        icon={CircleAlert}
        tone="error"
        title="Coś poszło nie tak"
        description="Ten widok napotkał nieoczekiwany błąd. Muzyka i nawigacja działają dalej. Spróbuj ponownie albo wróć na stronę główną."
        actions={
          <>
            <Button variant="primary" onClick={() => this.setState({ error: null })}>
              Spróbuj ponownie
            </Button>
            <Button variant="secondary" onClick={() => (window.location.hash = '#/')}>
              Strona główna
            </Button>
          </>
        }
      />
    );
  }
}
