import { useEffect } from 'react';
import { Header, EditorWorkspace } from './components';
import { useEditorStore } from './store/editorStore';
import { useStatePersistence } from './hooks/useStatePersistence';
import './index.css';

function App() {
  // Persist editor state to browser storage
  useStatePersistence();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
      <Header />
      <EditorWorkspace />
    </div>
  );
}

export default App;
