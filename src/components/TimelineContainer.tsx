import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { TimeRuler } from './TimeRuler';
import { SpeakerLane } from './SpeakerLane';

export function TimelineContainer() {
  const speakers = useEditorStore((s) => s.speakers);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);
  const duration = useEditorStore((s) => s.duration);

  const selectSegment = useEditorStore((s) => s.selectSegment);
  const addSpeaker = useEditorStore((s) => s.addSpeaker);

  // Click on timeline to seek and deselect
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Deselect any selected segment (SegmentBlock clicks stopPropagation)
      selectSegment(null);

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left - labelWidth;

      if (clickX < 0) return; // Clicked on label area

      const time = clickX / pixelsPerSecond;

      const controls = (window as unknown as Record<string, { seekTo?: (t: number) => void }>)
        .__wavesurferControls;
      controls?.seekTo?.(time);
    },
    [pixelsPerSecond, labelWidth, selectSegment]
  );

  const handleAddSpeaker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addSpeaker();
    },
    [addSpeaker]
  );

  const totalWidth = duration * pixelsPerSecond;

  return (
    <div className="bg-white cursor-pointer" onClick={handleClick}>
      <TimeRuler />
      {speakers.map((speakerId, index) => (
        <SpeakerLane key={speakerId} speakerId={speakerId} index={index} />
      ))}
      {/* Add Speaker Button */}
      <div
        className="flex items-center border-b border-gray-200"
        style={{ width: `${totalWidth + labelWidth}px` }}
      >
        <div
          className="sticky left-0 z-10 flex items-center justify-center px-3 py-2 bg-white shrink-0"
          style={{ width: `${labelWidth}px` }}
        >
          <button
            onClick={handleAddSpeaker}
            className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500
              border border-dashed border-gray-300 rounded-md
              hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50
              transition-colors duration-150"
            title="Add speaker"
          >
            <Plus size={14} />
            <span>Add Speaker</span>
          </button>
        </div>
        <div className="h-10" style={{ width: `${totalWidth}px` }} />
      </div>
    </div>
  );
}
