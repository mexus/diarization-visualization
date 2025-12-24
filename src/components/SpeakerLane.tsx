import { useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '../store/editorStore';
import { getSpeakerColor } from '../utils/colors';
import { SegmentBlock } from './SegmentBlock';
import { GhostSegment } from './GhostSegment';
import { SpeakerLabel } from './SpeakerLabel';
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
  const dragState = useEditorStore((s) => s.dragState);
  const updateDrag = useEditorStore((s) => s.updateDrag);
  const createSegment = useEditorStore((s) => s.createSegment);

  const [isEditing, setIsEditing] = useState(false);

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

  // Check if this lane is the current drop target for relabel drag
  const isRelabelTarget =
    dragState?.type === 'relabel' && dragState.currentSpeakerId === speakerId;
  // Check if this is a relabel drag but NOT originating from this lane
  const showGhost =
    isRelabelTarget && dragState.originalSegment.speakerId !== speakerId;

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
      <SpeakerLabel
        speakerId={speakerId}
        color={color}
        hasSegments={hasSegments}
        isEven={isEven}
        isDragOver={isDragOver}
        isEditing={isEditing}
        onEditingChange={setIsEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onTouchStart={handleLabelTouchStart}
      />

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
