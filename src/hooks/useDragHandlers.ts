import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

/**
 * Helper to get clientX from mouse or touch event
 */
function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) {
    return e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
  }
  return e.clientX;
}

/**
 * Helper to get clientY from mouse or touch event
 */
function getClientY(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) {
    return e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
  }
  return e.clientY;
}

/**
 * Hook that handles document-level mouse/touch events during drag operations.
 * Attaches listeners when dragState is active, detaches when drag ends.
 */
export function useDragHandlers() {
  const dragState = useEditorStore((s) => s.dragState);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      // Prevent scrolling during drag on touch devices
      if ('touches' in e) {
        e.preventDefault();
      }

      const { updateDrag } = useEditorStore.getState();

      if (dragState.type === 'resize-left' || dragState.type === 'resize-right') {
        // Find the scroll container to calculate position
        const container = document.querySelector('[data-scroll-container]');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const clientX = getClientX(e);
        const mouseX = clientX - rect.left + scrollLeft - labelWidth;
        const time = Math.max(0, mouseX / pixelsPerSecond);

        updateDrag({ currentTime: time });
      } else if (dragState.type === 'relabel') {
        // For touch relabel, find which lane we're over
        const clientY = getClientY(e);
        const lanes = document.querySelectorAll('[data-speaker-lane]');
        for (const lane of lanes) {
          const rect = lane.getBoundingClientRect();
          if (clientY >= rect.top && clientY <= rect.bottom) {
            const speakerId = lane.getAttribute('data-speaker-lane');
            if (speakerId) {
              updateDrag({ currentSpeakerId: speakerId });
            }
            break;
          }
        }
      }
    };

    const handleEnd = () => {
      const { dragState, updateSegment, endDrag } = useEditorStore.getState();
      if (!dragState) return;

      const { type, segmentId, currentTime, currentSpeakerId, originalSegment } = dragState;

      if (type === 'resize-left' && currentTime !== undefined) {
        // Calculate new start time and adjust duration
        const delta = currentTime - originalSegment.startTime;
        const newDuration = originalSegment.duration - delta;
        updateSegment(segmentId, {
          startTime: currentTime,
          duration: newDuration,
        });
      } else if (type === 'resize-right' && currentTime !== undefined) {
        // Calculate new duration from new end time
        const newDuration = currentTime - originalSegment.startTime;
        updateSegment(segmentId, {
          duration: newDuration,
        });
      } else if (type === 'relabel' && currentSpeakerId) {
        // Move segment to new speaker lane
        if (currentSpeakerId !== originalSegment.speakerId) {
          updateSegment(segmentId, {
            speakerId: currentSpeakerId,
          });
        }
      }

      endDrag();
    };

    // Mouse events
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    // Touch events - passive: false allows preventDefault() to stop scrolling
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };
  }, [dragState, pixelsPerSecond, labelWidth]);
}
