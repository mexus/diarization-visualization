import { X } from 'lucide-react';
import type { Segment } from '../types';
import { useEditorStore } from '../store/editorStore';
import { getSpeakerColor } from '../utils/colors';

interface SegmentBlockProps {
  segment: Segment;
}

export function SegmentBlock({ segment }: SegmentBlockProps) {
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const selectedSegmentId = useEditorStore((s) => s.selectedSegmentId);
  const dragState = useEditorStore((s) => s.dragState);
  const selectSegment = useEditorStore((s) => s.selectSegment);
  const deleteSegment = useEditorStore((s) => s.deleteSegment);
  const startDrag = useEditorStore((s) => s.startDrag);

  const isSelected = selectedSegmentId === segment.id;
  const isDragging = dragState?.segmentId === segment.id;
  const isRelabelDragging = isDragging && dragState?.type === 'relabel';

  // Calculate display position - use drag state for preview during resize
  let displayStartTime = segment.startTime;
  let displayDuration = segment.duration;

  if (isDragging && dragState.currentTime !== undefined) {
    if (dragState.type === 'resize-left') {
      const delta = dragState.currentTime - segment.startTime;
      displayStartTime = dragState.currentTime;
      displayDuration = Math.max(0.1, segment.duration - delta);
    } else if (dragState.type === 'resize-right') {
      displayDuration = Math.max(0.1, dragState.currentTime - segment.startTime);
    }
  }

  const left = displayStartTime * pixelsPerSecond;
  const width = Math.max(displayDuration * pixelsPerSecond, 4); // min 4px width
  const color = getSpeakerColor(segment.speakerId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger seek or deselect
    selectSegment(segment.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSegment(segment.id);
  };

  const handleResizeStart = (edge: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startDrag({
      type: edge === 'left' ? 'resize-left' : 'resize-right',
      segmentId: segment.id,
      originalSegment: { ...segment },
      currentTime: edge === 'left' ? segment.startTime : segment.startTime + segment.duration,
    });
  };

  const handleBodyMouseDown = (e: React.MouseEvent) => {
    // Only initiate relabel drag if already selected and not clicking on handles
    if (!isSelected) return;
    if ((e.target as HTMLElement).dataset.handle) return;

    e.preventDefault();
    e.stopPropagation();

    startDrag({
      type: 'relabel',
      segmentId: segment.id,
      originalSegment: { ...segment },
      currentSpeakerId: segment.speakerId,
    });
  };

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:brightness-110'
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: color,
        opacity: isRelabelDragging ? 0.5 : 1,
        cursor: isSelected ? 'grab' : 'pointer',
      }}
      onClick={handleClick}
      onMouseDown={handleBodyMouseDown}
      title={`${segment.speakerId}: ${segment.startTime.toFixed(2)}s - ${(segment.startTime + segment.duration).toFixed(2)}s`}
    >
      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          {/* Left resize handle */}
          <div
            data-handle="left"
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/30 hover:bg-white/60 rounded-l-md transition-colors"
            onMouseDown={handleResizeStart('left')}
          />
          {/* Right resize handle */}
          <div
            data-handle="right"
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/30 hover:bg-white/60 rounded-r-md transition-colors"
            onMouseDown={handleResizeStart('right')}
          />
          {/* Delete button */}
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-30 shadow-sm"
            onClick={handleDelete}
            title="Delete segment"
          >
            <X size={12} />
          </button>
        </>
      )}
    </div>
  );
}
