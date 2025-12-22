import { useEditorStore } from '../store/editorStore';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface TickConfig {
  majorInterval: number; // Seconds between labeled ticks
  minorInterval: number; // Seconds between subdivision ticks
}

function getTickConfig(pixelsPerSecond: number): TickConfig {
  if (pixelsPerSecond >= 100) {
    return { majorInterval: 5, minorInterval: 1 };
  } else if (pixelsPerSecond >= 50) {
    return { majorInterval: 5, minorInterval: 1 };
  } else if (pixelsPerSecond >= 20) {
    return { majorInterval: 10, minorInterval: 5 };
  } else if (pixelsPerSecond >= 10) {
    return { majorInterval: 30, minorInterval: 10 };
  } else {
    return { majorInterval: 60, minorInterval: 30 };
  }
}

export function TimeRuler() {
  const duration = useEditorStore((s) => s.duration);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  const totalWidth = duration * pixelsPerSecond;
  const { majorInterval, minorInterval } = getTickConfig(pixelsPerSecond);

  // Generate minor ticks (subdivisions)
  const minorTicks: number[] = [];
  for (let t = 0; t <= duration; t += minorInterval) {
    // Skip if this is a major tick position
    if (t % majorInterval !== 0) {
      minorTicks.push(t);
    }
  }

  // Generate major ticks (labeled)
  const majorTicks: number[] = [];
  for (let t = 0; t <= duration; t += majorInterval) {
    majorTicks.push(t);
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
        {/* Minor ticks (subdivisions, no labels) */}
        {minorTicks.map((time) => (
          <div
            key={`minor-${time}`}
            className="absolute top-0"
            style={{ left: `${time * pixelsPerSecond}px` }}
          >
            <div className="w-px h-1.5 bg-gray-300" />
          </div>
        ))}

        {/* Major ticks (with labels) */}
        {majorTicks.map((time) => (
          <div
            key={`major-${time}`}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${time * pixelsPerSecond}px` }}
          >
            <div className="w-px h-2.5 bg-gray-400" />
            <span className="text-xs text-gray-500 -translate-x-1/2">
              {formatTime(time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
