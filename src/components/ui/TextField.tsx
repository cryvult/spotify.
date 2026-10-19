import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './TextField.module.css';

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string | null;
  counter?: { value: number; max: number };
}

type InputProps = FieldWrapperProps & InputHTMLAttributes<HTMLInputElement> & { multiline?: false };
type TextareaProps = FieldWrapperProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

/** Pole formularza z etykietą nad polem, podpowiedzią i komunikatem błędu pod polem. */
export function TextField(props: InputProps | TextareaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const { label, hint, error, counter } = props;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  let control;
  if (props.multiline) {
    const {
      label: _label,
      hint: _hint,
      error: _error,
      counter: _counter,
      multiline: _multiline,
      ...rest
    } = props;
    control = (
      <textarea
        id={id}
        className={styles.control}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        rows={3}
        {...rest}
      />
    );
  } else {
    const {
      label: _label,
      hint: _hint,
      error: _error,
      counter: _counter,
      multiline: _multiline,
      ...rest
    } = props;
    control = (
      <input
        id={id}
        className={styles.control}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
      />
    );
  }

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {counter ? (
          <span className={styles.counter} aria-hidden>
            {counter.value}/{counter.max}
          </span>
        ) : null}
      </div>
      {control}
      {hint && !error ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
