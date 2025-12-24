import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { Toast as ToastType, ToastType as ToastVariant } from '../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastVariant, React.ComponentType<{ size: number; className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const styles: Record<ToastVariant, { bg: string; icon: string; text: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    icon: 'text-green-500 dark:text-green-400',
    text: 'text-green-800 dark:text-green-200',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500 dark:text-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    text: 'text-red-800 dark:text-red-200',
  },
};

function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = icons[toast.type];
  const style = styles[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${style.bg} animate-in slide-in-from-right duration-200`}
      role="alert"
    >
      <Icon size={20} className={style.icon} />
      <span className={`text-sm font-medium ${style.text}`}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`ml-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${style.text}`}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
