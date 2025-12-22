import { useEditorStore } from '../store/editorStore';

export function Playhead() {
  const currentTime = useEditorStore((s) => s.currentTime);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  const left = labelWidth + currentTime * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-slate-200 z-20 pointer-events-none"
      style={{ left: `${left}px` }}
    />
  );
}
