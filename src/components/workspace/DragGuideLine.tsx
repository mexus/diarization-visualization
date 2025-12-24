import { useEditorStore } from '../../store/editorStore';

/**
 * Vertical guide line that appears during resize drag operations.
 * Shows the current drag position across all lanes.
 */
export function DragGuideLine() {
  const dragState = useEditorStore((s) => s.dragState);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const labelWidth = useEditorStore((s) => s.labelWidth);

  // Only show during resize drags (not relabel)
  if (!dragState) return null;
  if (dragState.type === 'relabel') return null;
  if (dragState.currentTime === undefined) return null;

  const left = labelWidth + dragState.currentTime * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30 pointer-events-none"
      style={{ left: `${left}px` }}
    />
  );
}
