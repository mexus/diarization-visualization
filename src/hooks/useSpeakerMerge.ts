import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export interface UseSpeakerMergeReturn {
  isDragOver: boolean;
  pendingMerge: { sourceId: string } | null;
  handleDragStart: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleLabelTouchStart: (e: React.TouchEvent) => void;
  handleConfirmMerge: () => void;
  handleCancelMerge: () => void;
}

export function useSpeakerMerge(
  speakerId: string,
  isEditing: boolean
): UseSpeakerMergeReturn {
  const mergeSpeakers = useEditorStore((s) => s.mergeSpeakers);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{ sourceId: string } | null>(null);

  // HTML5 drag handlers for speaker merge (desktop)
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/speaker-id', speakerId);
      e.dataTransfer.effectAllowed = 'move';
    },
    [speakerId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    const draggedSpeakerId = e.dataTransfer.types.includes('application/speaker-id');
    if (!draggedSpeakerId) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const sourceId = e.dataTransfer.getData('application/speaker-id');
      if (!sourceId || sourceId === speakerId) return;

      // Show confirmation modal
      setPendingMerge({ sourceId });
    },
    [speakerId]
  );

  // Touch handlers for speaker merge (mobile)
  const handleLabelTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isEditing) return;

      // Store the source speaker ID in a data attribute on the element
      const target = e.currentTarget as HTMLElement;
      target.dataset.touchDragSpeaker = speakerId;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        const touch = moveEvent.touches[0];
        if (!touch) return;

        // Find which speaker label we're over
        const labels = document.querySelectorAll('[data-speaker-label]');
        let foundTarget = false;
        for (const label of labels) {
          const rect = label.getBoundingClientRect();
          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            const targetSpeakerId = label.getAttribute('data-speaker-label');
            if (targetSpeakerId && targetSpeakerId !== speakerId) {
              // Highlight drop target
              label.classList.add('ring-2', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-900/50');
              foundTarget = true;
            }
          } else {
            // Remove highlight from non-targets
            label.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-900/50');
          }
        }
        if (!foundTarget) {
          // Clean up all highlights
          labels.forEach((l) => l.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-900/50'));
        }
      };

      const handleTouchEnd = (endEvent: TouchEvent) => {
        const touch = endEvent.changedTouches[0];
        if (!touch) {
          cleanup();
          return;
        }

        // Find which speaker label we dropped on
        const labels = document.querySelectorAll('[data-speaker-label]');
        for (const label of labels) {
          const rect = label.getBoundingClientRect();
          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            const targetSpeakerId = label.getAttribute('data-speaker-label');
            if (targetSpeakerId && targetSpeakerId !== speakerId) {
              // Dispatch event to the TARGET lane to show merge confirmation
              const mergeEvent = new CustomEvent('speaker-merge-request', {
                detail: { sourceId: speakerId, targetId: targetSpeakerId },
                bubbles: true,
              });
              document.dispatchEvent(mergeEvent);
            }
          }
          label.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-900/50');
        }

        cleanup();
      };

      const cleanup = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', cleanup);
        delete target.dataset.touchDragSpeaker;
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', cleanup);
    },
    [speakerId, isEditing]
  );

  // Listen for merge requests from other lanes (touch drag)
  useEffect(() => {
    const handleMergeRequest = (e: Event) => {
      const { sourceId, targetId } = (e as CustomEvent).detail;
      if (targetId === speakerId && sourceId !== speakerId) {
        setPendingMerge({ sourceId });
      }
    };

    document.addEventListener('speaker-merge-request', handleMergeRequest);
    return () => document.removeEventListener('speaker-merge-request', handleMergeRequest);
  }, [speakerId]);

  const handleConfirmMerge = useCallback(() => {
    if (!pendingMerge) return;
    mergeSpeakers(pendingMerge.sourceId, speakerId);
    setPendingMerge(null);
  }, [pendingMerge, mergeSpeakers, speakerId]);

  const handleCancelMerge = useCallback(() => {
    setPendingMerge(null);
  }, []);

  return {
    isDragOver,
    pendingMerge,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLabelTouchStart,
    handleConfirmMerge,
    handleCancelMerge,
  };
}
