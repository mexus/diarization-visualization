import { useEffect } from 'react';
import { AlertTriangle, FileAudio, FileText } from 'lucide-react';
import { formatDuration } from '../utils/formatTime';
import type { MismatchInfo } from '../utils/rttmMismatch';

interface RTTMMismatchModalProps {
  isOpen: boolean;
  audioFileName: string;
  audioDuration: number;
  rttmFileName: string;
  segmentCount: number;
  rttmCoverage: { minStartTime: number; maxEndTime: number };
  mismatchInfo: MismatchInfo;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RTTMMismatchModal({
  isOpen,
  audioFileName,
  audioDuration,
  rttmFileName,
  segmentCount,
  rttmCoverage,
  mismatchInfo,
  onConfirm,
  onCancel,
}: RTTMMismatchModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onCancel();
      } else if (e.key === 'Enter') {
        e.stopImmediatePropagation();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Duration Mismatch Detected
          </h2>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-4">
          {/* Audio File Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileAudio size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Audio File
              </span>
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-200 truncate">
              {audioFileName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Duration: {formatDuration(audioDuration)}
            </p>
          </div>

          {/* RTTM File Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-green-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                RTTM File
              </span>
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-200 truncate">
              {rttmFileName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {segmentCount} segment{segmentCount !== 1 ? 's' : ''} &bull; Coverage: {formatDuration(rttmCoverage.minStartTime)} &ndash; {formatDuration(rttmCoverage.maxEndTime)}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {mismatchInfo.message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-amber-500 rounded-md
              hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
