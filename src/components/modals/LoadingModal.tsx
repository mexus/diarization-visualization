import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface LoadingModalProps {
  message: string | null;
}

export function LoadingModal({ message }: LoadingModalProps) {
  // Use a no-op for onClose since loading modals can't be dismissed
  const noop = () => {};

  return (
    <Modal
      isOpen={!!message}
      onClose={noop}
      size="sm"
      showCloseButton={false}
      closeOnEscape={false}
      closeOnBackdropClick={false}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
        <p className="text-gray-700 dark:text-gray-200 text-center">{message}</p>
      </div>
    </Modal>
  );
}
