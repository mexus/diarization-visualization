import { useEditorStore } from '../../store/editorStore';
import { formatDuration } from '../../utils/formatTime';

export function TimeDisplay() {
  const currentTime = useEditorStore((s) => s.currentTime);
  const duration = useEditorStore((s) => s.duration);

  return (
    <div className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-300 tabular-nums">
      <span className="hidden sm:inline">{formatDuration(currentTime, true)} / {formatDuration(duration)}</span>
      <span className="sm:hidden">{formatDuration(currentTime)}</span>
    </div>
  );
}
