import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
  message: string | null;
}

export function LoadingModal({ message }: LoadingModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-gray-700 dark:text-gray-200 text-center">{message}</p>
        </div>
      </div>
    </div>
  );
}
