import { useState, useCallback } from 'react';
import { X, Plus, MousePointer } from 'lucide-react';

interface SegmentHintProps {
  hasSpeakers: boolean;
}

export function SegmentHint({ hasSpeakers }: SegmentHintProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
  }, []);

  if (isDismissed) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-6 py-4 pointer-events-auto max-w-sm mx-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              {hasSpeakers ? (
                <>
                  <MousePointer size={14} className="inline mr-1.5 -mt-0.5" />
                  Double-click a speaker lane to create a segment
                </>
              ) : (
                <>
                  <Plus size={14} className="inline mr-1.5 -mt-0.5" />
                  Click "Add Speaker" below, then double-click the lane to create segments
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              Or import an RTTM file from the header
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
