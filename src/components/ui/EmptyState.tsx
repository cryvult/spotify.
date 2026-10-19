import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Przyciski lub linki pomagające wyjść z pustego stanu. */
  actions?: ReactNode;
  tone?: 'neutral' | 'error';
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  tone = 'neutral',
  compact,
}: EmptyStateProps) {
  return (
    <div className={`${styles.empty} ${compact ? styles.compact : ''} ${styles[tone]}`}>
      <span className={styles.iconWrap} aria-hidden>
        <Icon size={compact ? 22 : 28} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
