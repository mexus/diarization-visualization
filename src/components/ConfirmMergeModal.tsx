import { useEffect } from 'react';
import { GitMerge, AlertTriangle } from 'lucide-react';
import { getSpeakerColor } from '../utils/colors';

interface ConfirmMergeModalProps {
  isOpen: boolean;
  sourceId: string;
  targetId: string;
  sourceSegmentCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmMergeModal({
  isOpen,
  sourceId,
  targetId,
  sourceSegmentCount,
  onConfirm,
  onCancel,
}: ConfirmMergeModalProps) {
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

  const sourceColor = getSpeakerColor(sourceId);
  const targetColor = getSpeakerColor(targetId);

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
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
            <GitMerge size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Merge Speakers
          </h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This will move all segments from one speaker to another:
          </p>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {/* Source */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: sourceColor }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                {sourceId}
              </span>
              <span className="text-sm text-gray-400">
                ({sourceSegmentCount} segment{sourceSegmentCount !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Arrow */}
            <div className="text-gray-400 text-xl">→</div>

            {/* Target */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: targetColor }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                {targetId}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>{sourceId}</strong> will be removed after merging.
              Overlapping segments will be combined.
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
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md
              hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            Merge
          </button>
        </div>
      </div>
    </div>
  );
}
