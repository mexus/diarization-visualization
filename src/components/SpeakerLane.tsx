import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { getSpeakerColor } from '../utils/colors';
import { SegmentBlock } from './SegmentBlock';
import { GhostSegment } from './GhostSegment';
import { ConfirmMergeModal } from './ConfirmMergeModal';
import { useSpeakerMerge } from '../hooks/useSpeakerMerge';

interface SpeakerLaneProps {
  speakerId: string;
  index: number;
}

export function SpeakerLane({ speakerId, index }: SpeakerLaneProps) {
  const segments = useEditorStore((s) => s.segments);
  const duration = useEditorStore((s) => s.duration);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);
  const setLabelWidth = useEditorStore((s) => s.setLabelWidth);
  const renameSpeaker = useEditorStore((s) => s.renameSpeaker);
  const removeSpeaker = useEditorStore((s) => s.removeSpeaker);
  const dragState = useEditorStore((s) => s.dragState);
  const updateDrag = useEditorStore((s) => s.updateDrag);
  const createSegment = useEditorStore((s) => s.createSegment);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(speakerId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speaker merge logic from custom hook
  const {
    isDragOver,
    pendingMerge,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLabelTouchStart,
    handleConfirmMerge,
    handleCancelMerge,
  } = useSpeakerMerge(speakerId, isEditing);

  const laneSegments = useMemo(
    () => segments.filter((s) => s.speakerId === speakerId),
    [segments, speakerId]
  );
  const hasSegments = laneSegments.length > 0;
  const color = useMemo(() => getSpeakerColor(speakerId), [speakerId]);
  const totalWidth = duration * pixelsPerSecond;
  const isEven = index % 2 === 0;

  const [isHovering, setIsHovering] = useState(false);

  const handleRemoveSpeaker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasSegments) {
        removeSpeaker(speakerId);
      }
    },
    [hasSegments, removeSpeaker, speakerId]
  );

  // Check if this lane is the current drop target for relabel drag
  const isRelabelTarget =
    dragState?.type === 'relabel' && dragState.currentSpeakerId === speakerId;
  // Check if this is a relabel drag but NOT originating from this lane
  const showGhost =
    isRelabelTarget && dragState.originalSegment.speakerId !== speakerId;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent seek
    setEditValue(speakerId);
    setIsEditing(true);
  };

  const handleSave = () => {
    const newId = editValue.trim();
    if (newId && newId !== speakerId) {
      renameSpeaker(speakerId, newId);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(speakerId);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Handle resize drag (mouse and touch)
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startWidth = labelWidth;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      // Prevent scrolling during resize on touch devices
      if ('touches' in moveEvent) {
        moveEvent.preventDefault();
      }
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const delta = clientX - startX;
      setLabelWidth(startWidth + delta);
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    // passive: false allows preventDefault() to stop scrolling
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);
  }, [labelWidth, setLabelWidth]);

  // Track mouse position during relabel drag to update target speaker
  const handleMouseMove = useCallback(() => {
    if (dragState?.type === 'relabel') {
      updateDrag({ currentSpeakerId: speakerId });
    }
  }, [dragState?.type, speakerId, updateDrag]);

  // Double-click to create new segment
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickTime = clickX / pixelsPerSecond;

      // Create 1-second segment centered on click position
      const segmentDuration = 1;
      const startTime = Math.max(0, clickTime - segmentDuration / 2);

      createSegment(speakerId, startTime, segmentDuration);
    },
    [pixelsPerSecond, speakerId, createSegment]
  );

  // Get source segment count for modal
  const sourceSegmentCount = useMemo(
    () => pendingMerge
      ? segments.filter((s) => s.speakerId === pendingMerge.sourceId).length
      : 0,
    [segments, pendingMerge]
  );

  return (
    <div
      className={`flex items-center border-b border-gray-200 dark:border-gray-700 ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}
      style={{ width: `${totalWidth + labelWidth}px` }}
      data-speaker-lane={speakerId}
    >
      {/* Sticky label with left border accent and resize handle */}
      <div
        className={`sticky left-0 z-10 flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab
          hover:bg-gray-100/80 dark:hover:bg-gray-800/80 relative group transition-colors duration-150
          ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
          ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400 ring-inset' : ''}`}
        style={{ width: `${labelWidth}px`, borderLeft: `3px solid ${color}` }}
        draggable={!isEditing}
        data-speaker-label={speakerId}
        onClick={handleLabelClick}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onTouchStart={handleLabelTouchStart}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-blue-500 rounded px-1 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">
            {speakerId}
          </span>
        )}
        {/* Delete button - only show for empty speakers on hover */}
        {!hasSegments && isHovering && !isEditing && (
          <button
            onClick={handleRemoveSpeaker}
            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove speaker"
            aria-label={`Remove speaker ${speakerId}`}
          >
            <X size={14} />
          </button>
        )}
        {/* Resize handle - thin and subtle */}
        <div
          className="absolute top-0 bottom-0 -right-px w-px cursor-col-resize
            bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 hover:w-0.5 active:bg-blue-500
            z-20 transition-all duration-150 touch-none"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Invisible wider hit area for touch */}
          <div className="absolute inset-y-0 -left-3 -right-3 sm:-left-1.5 sm:-right-1.5" />
        </div>
      </div>

      {/* Segments container */}
      <div
        className={`relative h-10 overflow-hidden ${isRelabelTarget ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
        style={{ width: `${totalWidth}px` }}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
      >
        {laneSegments.map((segment) => (
          <SegmentBlock key={segment.id} segment={segment} />
        ))}

        {/* Ghost segment preview during relabel drag */}
        {showGhost && dragState && (
          <GhostSegment segment={dragState.originalSegment} />
        )}
      </div>

      {/* Merge confirmation modal */}
      <ConfirmMergeModal
        isOpen={pendingMerge !== null}
        sourceId={pendingMerge?.sourceId ?? ''}
        targetId={speakerId}
        sourceSegmentCount={sourceSegmentCount}
        onConfirm={handleConfirmMerge}
        onCancel={handleCancelMerge}
      />
    </div>
  );
}
