import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';

// Height constants (matching Tailwind classes used in layout components)
const WAVEFORM_HEIGHT = 129; // 128px (min-h-[128px]) + 1px border
const TIME_RULER_HEIGHT = 25; // 24px (h-6) + 1px border
const SPEAKER_LANE_HEIGHT = 41; // 40px (h-10) + 1px border

export function Playhead() {
  const currentTime = useEditorStore((s) => s.currentTime);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);
  const audioControls = useEditorStore((s) => s.audioControls);
  const duration = useEditorStore((s) => s.duration);
  const speakers = useEditorStore((s) => s.speakers);

  const [isDragging, setIsDragging] = useState(false);

  const left = labelWidth + currentTime * pixelsPerSecond;
  const lineHeight = WAVEFORM_HEIGHT + TIME_RULER_HEIGHT + speakers.length * SPEAKER_LANE_HEIGHT;

  // Calculate time from mouse position
  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      const container = document.querySelector('[data-scroll-container]');
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const mouseX = clientX - rect.left + scrollLeft - labelWidth;
      const time = Math.max(0, Math.min(duration, mouseX / pixelsPerSecond));
      return time;
    },
    [labelWidth, pixelsPerSecond, duration]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  // Document-level drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const time = getTimeFromPosition(clientX);
      if (time !== null) {
        audioControls?.seekTo(time);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, getTimeFromPosition, audioControls]);

  return (
    <div className="absolute top-0 z-20" style={{ left: `${left}px` }}>
      {/* Top marker - triangle pointing down (draggable) */}
      <div
        className="absolute -translate-x-1/2 top-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div
          className={`w-0 h-0
            border-l-[8px] border-l-transparent
            border-r-[8px] border-r-transparent
            border-t-[10px] border-t-blue-500 dark:border-t-blue-400
            ${isDragging ? 'opacity-80' : 'hover:opacity-80'}
            transition-opacity`}
        />
      </div>

      {/* Vertical line (not interactive, ends at last speaker lane) */}
      <div
        className="absolute top-0 w-px bg-blue-500 dark:bg-blue-400 -translate-x-1/2 pointer-events-none"
        style={{ height: `${lineHeight}px` }}
      />
    </div>
  );
}
