import { useEffect, useState } from 'react';
import { Header, EditorWorkspace } from './components';
import { useEditorStore } from './store/editorStore';
import { useStatePersistence } from './hooks/useStatePersistence';
import { isFirstVisit, markVisited } from './utils/firstVisit';
import './index.css';

function App() {
  // Persist editor state to browser storage
  useStatePersistence();

  // Check first visit once and mark as visited
  const [showHelpOnStart] = useState(() => {
    const firstVisit = isFirstVisit();
    if (firstVisit) {
      markVisited();
    }
    return firstVisit;
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo: Ctrl/Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
        return;
      }

      // Redo: Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        useEditorStore.getState().redo();
        return;
      }

      // Space: toggle play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        const controls = (window as unknown as Record<string, { playPause?: () => void }>)
          .__wavesurferControls;
        controls?.playPause?.();
        return;
      }

      // Escape: deselect segment
      if (e.key === 'Escape') {
        useEditorStore.getState().selectSegment(null);
        return;
      }

      // Delete/Backspace: delete selected segment
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedSegmentId, deleteSegment } = useEditorStore.getState();
        if (selectedSegmentId) {
          e.preventDefault();
          deleteSegment(selectedSegmentId);
        }
        return;
      }

      // Arrow keys: skip back/forward
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const controls = (window as unknown as Record<string, { skip?: (s: number) => void }>)
          .__wavesurferControls;
        controls?.skip?.(e.key === 'ArrowLeft' ? -5 : 5);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header helpDefaultOpen={showHelpOnStart} />
      <EditorWorkspace />
    </div>
  );
}

export default App;
