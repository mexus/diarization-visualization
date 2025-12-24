import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export function ZoomControls() {
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const setZoom = useEditorStore((s) => s.setZoom);

  // Calculate zoom progress for slider fill
  const zoomProgress = ((pixelsPerSecond - 10) / 190) * 100;

  return (
    <div className="hidden md:flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Zoom</span>
      <button
        onClick={() => setZoom(Math.max(10, pixelsPerSecond - 20))}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={18} className="text-gray-500 dark:text-gray-400" />
      </button>
      <input
        type="range"
        min="10"
        max="200"
        value={pixelsPerSecond}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-28 custom-slider"
        style={{
          background: `linear-gradient(to right, var(--slider-track-active) 0%, var(--slider-track-active) ${zoomProgress}%, var(--slider-track-bg) ${zoomProgress}%, var(--slider-track-bg) 100%)`,
          borderRadius: '2px',
        }}
      />
      <button
        onClick={() => setZoom(Math.min(200, pixelsPerSecond + 20))}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={18} className="text-gray-500 dark:text-gray-400" />
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400 w-14 text-right tabular-nums">
        {pixelsPerSecond}px/s
      </span>
    </div>
  );
}
