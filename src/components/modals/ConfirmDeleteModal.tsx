import { AlertTriangle } from 'lucide-react';
import { Modal, ModalButton } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle size={20} className="text-red-500" />}
      iconVariant="red"
      size="md"
      onEnter={onConfirm}
      footer={
        <>
          <ModalButton onClick={onCancel}>Cancel</ModalButton>
          <ModalButton onClick={onConfirm} variant="danger">
            {confirmLabel}
          </ModalButton>
        </>
      }
    >
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
