import { AlertTriangle, FileAudio, FileText } from 'lucide-react';
import { Modal, ModalButton } from './Modal';
import { formatDuration } from '../../utils/formatTime';
import type { MismatchInfo } from '../../utils/rttmMismatch';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Duration Mismatch Detected"
      icon={<AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />}
      iconVariant="amber"
      size="md"
      onEnter={onConfirm}
      footer={
        <>
          <ModalButton onClick={onCancel}>Cancel</ModalButton>
          {/* Custom amber button for "Continue Anyway" */}
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-amber-500 rounded-md
              hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            Continue Anyway
          </button>
        </>
      }
    >
      <div className="space-y-4">
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
    </Modal>
  );
}
