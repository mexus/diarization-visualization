import { memo } from 'react';
import type { Segment } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { getSpeakerColor } from '../../utils/colors';

interface GhostSegmentProps {
  segment: Segment;
}

/**
 * Ghost segment that appears in the target lane during relabel drag.
 * Shows a dashed outline preview of where the segment will be placed.
 */
export const GhostSegment = memo(function GhostSegment({ segment }: GhostSegmentProps) {
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);

  const left = segment.startTime * pixelsPerSecond;
  const width = segment.duration * pixelsPerSecond;
  const color = getSpeakerColor(segment.speakerId);

  return (
    <div
      className="absolute top-1 bottom-1 rounded-md border-2 border-dashed pointer-events-none"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        borderColor: color,
        backgroundColor: `${color}33`, // 20% opacity
      }}
    />
  );
});
