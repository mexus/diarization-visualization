import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface SpeakerLabelProps {
  speakerId: string;
  color: string;
  hasSegments: boolean;
  isEven: boolean;
  isDragOver: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

/**
 * Speaker label component with inline editing, drag-to-merge, and resize handle.
 * Extracted from SpeakerLane for better separation of concerns.
 */
export const SpeakerLabel = memo(function SpeakerLabel({
  speakerId,
  color,
  hasSegments,
  isEven,
  isDragOver,
  isEditing,
  onEditingChange,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
}: SpeakerLabelProps) {
  const labelWidth = useEditorStore((s) => s.labelWidth);
  const setLabelWidth = useEditorStore((s) => s.setLabelWidth);
  const renameSpeaker = useEditorStore((s) => s.renameSpeaker);
  const removeSpeaker = useEditorStore((s) => s.removeSpeaker);

  const [editValue, setEditValue] = useState(speakerId);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    onEditingChange(true);
  };

  const handleSave = () => {
    const newId = editValue.trim();
    if (newId && newId !== speakerId) {
      renameSpeaker(speakerId, newId);
    }
    onEditingChange(false);
  };

  const handleCancel = () => {
    setEditValue(speakerId);
    onEditingChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleRemoveSpeaker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasSegments) {
        removeSpeaker(speakerId);
      }
    },
    [hasSegments, removeSpeaker, speakerId]
  );

  // Handle resize drag (mouse and touch)
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
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
    },
    [labelWidth, setLabelWidth]
  );

  return (
    <div
      className={`sticky left-0 z-10 flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab
        hover:bg-gray-100/80 dark:hover:bg-gray-800/80 relative group transition-colors duration-150
        ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
        ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400 ring-inset' : ''}`}
      style={{ width: `${labelWidth}px`, borderLeft: `3px solid ${color}` }}
      draggable={!isEditing}
      data-speaker-label={speakerId}
      onClick={handleLabelClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
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
  );
});
