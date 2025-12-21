import type { Segment } from '../types';
import { useEditorStore } from '../store/editorStore';
import { getSpeakerColor } from '../utils/colors';

interface SegmentBlockProps {
  segment: Segment;
}

export function SegmentBlock({ segment }: SegmentBlockProps) {
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);

  const left = segment.startTime * pixelsPerSecond;
  const width = Math.max(segment.duration * pixelsPerSecond, 4); // min 4px width
  const color = getSpeakerColor(segment.speakerId);

  return (
    <div
      className="absolute top-1 bottom-1 rounded-md cursor-pointer hover:brightness-110 transition-all"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: color,
      }}
      title={`${segment.speakerId}: ${segment.startTime.toFixed(2)}s - ${(segment.startTime + segment.duration).toFixed(2)}s`}
    />
  );
}
