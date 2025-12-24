import { GitMerge, AlertTriangle } from 'lucide-react';
import { getSpeakerColor } from '../../utils/colors';
import { Modal, ModalButton } from './Modal';

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
  const sourceColor = getSpeakerColor(sourceId);
  const targetColor = getSpeakerColor(targetId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Merge Speakers"
      icon={<GitMerge size={20} className="text-blue-600 dark:text-blue-400" />}
      iconVariant="blue"
      size="md"
      onEnter={onConfirm}
      footer={
        <>
          <ModalButton onClick={onCancel}>Cancel</ModalButton>
          <ModalButton onClick={onConfirm} variant="primary">
            Merge
          </ModalButton>
        </>
      }
    >
      <div className="mb-2">
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
    </Modal>
  );
}
