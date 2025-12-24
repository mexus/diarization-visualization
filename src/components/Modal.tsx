import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
type IconVariant = 'blue' | 'amber' | 'red' | 'green';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  iconVariant?: IconVariant;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  onEnter?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const iconBgClasses: Record<IconVariant, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/50',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  red: 'bg-red-100 dark:bg-red-900/30',
  green: 'bg-green-100 dark:bg-green-900/30',
};

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  iconVariant = 'blue',
  size = 'md',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  onEnter,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === 'Enter' && onEnter) {
        e.stopImmediatePropagation();
        onEnter();
      }
    };

    // Use capture phase to run before App's handler
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, onEnter, closeOnEscape]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full mx-4 p-6 ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || icon || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className={`p-2 rounded-full ${iconBgClasses[iconVariant]}`}>
                  {icon}
                </div>
              )}
              {title && (
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {title}
                </h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components for consistent button styling
interface ModalButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

const buttonVariantClasses = {
  primary: 'text-white bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50',
  secondary: 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-400/50',
  danger: 'text-white bg-red-500 hover:bg-red-600 focus:ring-red-500/50',
};

export function ModalButton({ onClick, variant = 'secondary', children }: ModalButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 ${buttonVariantClasses[variant]}`}
    >
      {children}
    </button>
  );
}
