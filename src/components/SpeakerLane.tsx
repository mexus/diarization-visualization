import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { getSpeakerColor } from '../utils/colors';
import { SegmentBlock } from './SegmentBlock';

interface SpeakerLaneProps {
  speakerId: string;
}

export function SpeakerLane({ speakerId }: SpeakerLaneProps) {
  const segments = useEditorStore((s) => s.segments);
  const duration = useEditorStore((s) => s.duration);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);
  const setLabelWidth = useEditorStore((s) => s.setLabelWidth);
  const renameSpeaker = useEditorStore((s) => s.renameSpeaker);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(speakerId);
  const inputRef = useRef<HTMLInputElement>(null);

  const laneSegments = segments.filter((s) => s.speakerId === speakerId);
  const color = getSpeakerColor(speakerId);
  const totalWidth = duration * pixelsPerSecond;

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

  return (
    <div
      className="flex items-center border-b border-gray-200"
      style={{ width: `${totalWidth + labelWidth}px` }}
    >
      {/* Sticky label with resize handle */}
      <div
        className="sticky left-0 z-10 flex items-center gap-2 px-3 py-2 bg-white shrink-0 cursor-pointer hover:bg-gray-50 relative"
        style={{ width: `${labelWidth}px` }}
        onClick={handleLabelClick}
      >
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
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
          <span className="text-sm font-medium text-gray-700 truncate">
            {speakerId}
          </span>
        )}
        {/* Resize handle */}
        <div
          className="absolute top-0 bottom-0 -right-1 w-2 cursor-col-resize bg-gray-300 hover:bg-blue-400 active:bg-blue-500 z-20"
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Segments container */}
      <div
        className="relative h-10"
        style={{ width: `${totalWidth}px` }}
      >
        {laneSegments.map((segment) => (
          <SegmentBlock key={segment.id} segment={segment} />
        ))}
      </div>
    </div>
  );
}
