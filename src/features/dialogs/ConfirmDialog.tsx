import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { ConfirmOptions } from '../../context/DialogContext';

interface ConfirmDialogProps {
  options: ConfirmOptions | null;
  onResult: (confirmed: boolean) => void;
}

export function ConfirmDialog({ options, onResult }: ConfirmDialogProps) {
  return (
    <Modal
      open={options !== null}
      onClose={() => onResult(false)}
      title={options?.title ?? ''}
      description={options?.message}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onResult(false)}>
            {options?.cancelLabel ?? 'Anuluj'}
          </Button>
          <Button
            variant={options?.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => onResult(true)}
            autoFocus
          >
            {options?.confirmLabel ?? 'Potwierdź'}
          </Button>
        </>
      }
    />
  );
}
