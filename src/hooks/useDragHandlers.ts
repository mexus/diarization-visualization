import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

/**
 * Hook that handles document-level mouse events during drag operations.
 * Attaches listeners when dragState is active, detaches when drag ends.
 */
export function useDragHandlers() {
  const dragState = useEditorStore((s) => s.dragState);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { updateDrag } = useEditorStore.getState();

      if (dragState.type === 'resize-left' || dragState.type === 'resize-right') {
        // Find the scroll container to calculate position
        const container = document.querySelector('[data-scroll-container]');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const mouseX = e.clientX - rect.left + scrollLeft - labelWidth;
        const time = Math.max(0, mouseX / pixelsPerSecond);

        updateDrag({ currentTime: time });
      }
      // Relabel drag updates currentSpeakerId via SpeakerLane's onMouseMove
    };

    const handleMouseUp = () => {
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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, pixelsPerSecond, labelWidth]);
}
