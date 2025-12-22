import { useRef, useEffect, useCallback } from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { TimelineContainer } from './TimelineContainer';
import { Playhead } from './Playhead';
import { DragGuideLine } from './DragGuideLine';
import { EmptyState } from './EmptyState';
import { SegmentHint } from './SegmentHint';
import { useEditorStore } from '../store/editorStore';
import { useDragHandlers } from '../hooks/useDragHandlers';

const AUTO_SCROLL_THRESHOLD = 0.9; // Scroll when playhead reaches 90% of visible area
const AUTO_SCROLL_TARGET = 0.3; // Scroll to bring playhead to 30% from left

export function EditorWorkspace() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const audioFile = useEditorStore((s) => s.audioFile);
  const segments = useEditorStore((s) => s.segments);
  const speakers = useEditorStore((s) => s.speakers);
  const duration = useEditorStore((s) => s.duration);
  const currentTime = useEditorStore((s) => s.currentTime);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  // Handle document-level drag events
  useDragHandlers();

  // Mouse wheel → horizontal scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!scrollContainerRef.current) return;

    // Prevent default vertical scroll, use it for horizontal
    e.preventDefault();
    scrollContainerRef.current.scrollLeft += e.deltaY + e.deltaX;
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Auto-scroll to keep playhead visible during playback
  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const playheadPosition = currentTime * pixelsPerSecond;

    const viewportWidth = container.clientWidth - labelWidth;
    const viewportLeft = container.scrollLeft;

    // If playhead reaches 90% of visible area, scroll to bring it to 30%
    const threshold = viewportLeft + viewportWidth * AUTO_SCROLL_THRESHOLD;

    if (playheadPosition > threshold || playheadPosition < viewportLeft) {
      const targetScrollLeft = playheadPosition - viewportWidth * AUTO_SCROLL_TARGET;
      container.scrollLeft = Math.max(0, targetScrollLeft);
    }
  }, [currentTime, pixelsPerSecond, isPlaying, labelWidth]);

  // Show empty state when no audio is loaded
  if (!audioFile) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-800 flex-1">
      {/* Scrollable container - height fits content */}
      <div
        ref={scrollContainerRef}
        data-scroll-container
        className="overflow-x-auto overflow-y-visible relative flex-1"
      >
        {/* Playhead spans both sections */}
        {duration > 0 && <Playhead />}

        {/* Guide line during resize drag */}
        <DragGuideLine />

        {/* Waveform section */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex">
            {/* Spacer for label alignment with resize handle */}
            <div
              className="shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700"
              style={{ width: `${labelWidth}px` }}
            />
            <WaveformCanvas />
          </div>
        </div>

        {/* Timeline / Swimlanes section */}
        <div className="relative">
          <TimelineContainer />
          {/* Hint overlay when no segments */}
          {segments.length === 0 && <SegmentHint hasSpeakers={speakers.length > 0} />}
        </div>
      </div>
    </div>
  );
}
