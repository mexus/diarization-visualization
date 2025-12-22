import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { getSpeakerColor } from '../utils/colors';
import { SegmentBlock } from './SegmentBlock';
import { GhostSegment } from './GhostSegment';
import { ConfirmMergeModal } from './ConfirmMergeModal';

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
  const mergeSpeakers = useEditorStore((s) => s.mergeSpeakers);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(speakerId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Merge speaker state
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{ sourceId: string } | null>(null);

  const laneSegments = segments.filter((s) => s.speakerId === speakerId);
  const hasSegments = laneSegments.length > 0;
  const color = getSpeakerColor(speakerId);
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

  // Handle resize drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = labelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLabelWidth(startWidth + delta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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

  // Drag handlers for speaker merge
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/speaker-id', speakerId);
      e.dataTransfer.effectAllowed = 'move';
    },
    [speakerId]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      const draggedSpeakerId = e.dataTransfer.types.includes('application/speaker-id');
      if (!draggedSpeakerId) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    },
    []
  );

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

  const handleConfirmMerge = useCallback(() => {
    if (!pendingMerge) return;
    mergeSpeakers(pendingMerge.sourceId, speakerId);
    setPendingMerge(null);
  }, [pendingMerge, mergeSpeakers, speakerId]);

  const handleCancelMerge = useCallback(() => {
    setPendingMerge(null);
  }, []);

  // Get source segment count for modal
  const sourceSegmentCount = pendingMerge
    ? segments.filter((s) => s.speakerId === pendingMerge.sourceId).length
    : 0;

  return (
    <div
      className={`flex items-center border-b border-gray-200 ${isEven ? 'bg-white' : 'bg-gray-50/50'}`}
      style={{ width: `${totalWidth + labelWidth}px` }}
    >
      {/* Sticky label with left border accent and resize handle */}
      <div
        className={`sticky left-0 z-10 flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab
          hover:bg-gray-100/80 relative group transition-colors duration-150
          ${isEven ? 'bg-white' : 'bg-gray-50/50'}
          ${isDragOver ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : ''}`}
        style={{ width: `${labelWidth}px`, borderLeft: `3px solid ${color}` }}
        draggable={!isEditing}
        onClick={handleLabelClick}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
            className="w-full text-sm font-medium text-gray-700 bg-white border border-blue-500 rounded px-1 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm font-medium text-gray-700 truncate flex-1">
            {speakerId}
          </span>
        )}
        {/* Delete button - only show for empty speakers on hover */}
        {!hasSegments && isHovering && !isEditing && (
          <button
            onClick={handleRemoveSpeaker}
            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove speaker"
          >
            <X size={14} />
          </button>
        )}
        {/* Resize handle - thin and subtle */}
        <div
          className="absolute top-0 bottom-0 -right-px w-px cursor-col-resize
            bg-gray-200 hover:bg-blue-400 hover:w-0.5 active:bg-blue-500
            z-20 transition-all duration-150"
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Invisible wider hit area */}
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
        </div>
      </div>

      {/* Segments container */}
      <div
        className={`relative h-10 ${isRelabelTarget ? 'bg-blue-50' : ''}`}
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
