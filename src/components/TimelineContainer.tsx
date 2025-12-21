import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { TimeRuler } from './TimeRuler';
import { SpeakerLane } from './SpeakerLane';

export function TimelineContainer() {
  const speakers = useEditorStore((s) => s.speakers);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  // Click on timeline to seek
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left - labelWidth;

      if (clickX < 0) return; // Clicked on label area

      const time = clickX / pixelsPerSecond;

      const controls = (window as unknown as Record<string, { seekTo?: (t: number) => void }>)
        .__wavesurferControls;
      controls?.seekTo?.(time);
    },
    [pixelsPerSecond, labelWidth]
  );

  if (speakers.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        Import an RTTM file to see speaker segments
      </div>
    );
  }

  return (
    <div className="bg-white cursor-pointer" onClick={handleClick}>
      <TimeRuler />
      {speakers.map((speakerId) => (
        <SpeakerLane key={speakerId} speakerId={speakerId} />
      ))}
    </div>
  );
}
