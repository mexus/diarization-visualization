import { useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { formatDuration } from '../../utils/formatTime';

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

  // Memoize tick calculations to avoid recalculating on every render
  const { minorTicks, majorTicks } = useMemo(() => {
    const minor: number[] = [];
    const major: number[] = [];

    for (let t = 0; t <= duration; t += minorInterval) {
      if (t % majorInterval !== 0) {
        minor.push(t);
      }
    }

    for (let t = 0; t <= duration; t += majorInterval) {
      major.push(t);
    }

    return { minorTicks: minor, majorTicks: major };
  }, [duration, minorInterval, majorInterval]);

  return (
    <div
      className="flex border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
      style={{ width: `${totalWidth + labelWidth}px` }}
    >
      {/* Spacer for label column */}
      <div
        className="sticky left-0 z-10 shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600"
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
            <div className="w-px h-1.5 bg-gray-300 dark:bg-gray-600" />
          </div>
        ))}

        {/* Major ticks (with labels) */}
        {majorTicks.map((time) => (
          <div
            key={`major-${time}`}
            className="absolute top-0 flex flex-col"
            style={{ left: `${time * pixelsPerSecond}px` }}
          >
            <div className="w-px h-2.5 bg-gray-400 dark:bg-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 -translate-x-1/2">
              {formatDuration(time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
