import { useEditorStore } from '../store/editorStore';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TimeRuler() {
  const duration = useEditorStore((s) => s.duration);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  const totalWidth = duration * pixelsPerSecond;

  // Calculate tick interval based on zoom level
  let tickInterval: number;
  if (pixelsPerSecond >= 100) {
    tickInterval = 5; // every 5 seconds
  } else if (pixelsPerSecond >= 50) {
    tickInterval = 10; // every 10 seconds
  } else if (pixelsPerSecond >= 20) {
    tickInterval = 30; // every 30 seconds
  } else {
    tickInterval = 60; // every minute
  }

  const ticks: number[] = [];
  for (let t = 0; t <= duration; t += tickInterval) {
    ticks.push(t);
  }

  return (
    <div
      className="flex border-b border-gray-300 bg-gray-50"
      style={{ width: `${totalWidth + labelWidth}px` }}
    >
      {/* Spacer for label column */}
      <div
        className="sticky left-0 z-10 shrink-0 bg-gray-50 border-r border-gray-300"
        style={{ width: `${labelWidth}px` }}
      />

      {/* Ruler */}
      <div
        className="relative h-6"
        style={{ width: `${totalWidth}px` }}
      >
        {ticks.map((time) => (
          <div
            key={time}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${time * pixelsPerSecond}px` }}
          >
            <div className="w-px h-2 bg-gray-400" />
            <span className="text-xs text-gray-500 -translate-x-1/2">
              {formatTime(time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
