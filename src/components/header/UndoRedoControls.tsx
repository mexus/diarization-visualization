import { Undo2, Redo2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export function UndoRedoControls() {
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return (
    <div className="hidden sm:flex items-center gap-1">
      <button
        onClick={undo}
        disabled={history.length === 0}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="Undo (Ctrl+Z)"
        aria-label="Undo last action"
      >
        <Undo2 size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={redo}
        disabled={future.length === 0}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo last undone action"
      >
        <Redo2 size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}
