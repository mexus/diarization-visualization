import { useEffect, useState } from 'react';
import { Header, EditorWorkspace, ToastContainer, LoadingModal } from './components';
import { useEditorStore } from './store/editorStore';
import { useStatePersistence } from './hooks/useStatePersistence';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { isFirstVisit, markVisited } from './utils/firstVisit';
import './index.css';

function App() {
  // Persist editor state to browser storage
  useStatePersistence();

  // Theme management
  const { mode: themeMode, setTheme } = useTheme();

  // Toast notifications
  const { toasts, showToast, dismissToast } = useToast();

  // Loading state
  const loadingMessage = useEditorStore((s) => s.loadingMessage);

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
        useEditorStore.getState().audioControls?.playPause();
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
        useEditorStore.getState().audioControls?.skip(e.key === 'ArrowLeft' ? -5 : 5);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header
        helpDefaultOpen={showHelpOnStart}
        themeMode={themeMode}
        onThemeModeChange={setTheme}
        onToast={showToast}
      />
      <EditorWorkspace />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <LoadingModal message={loadingMessage} />
    </div>
  );
}

export default App;
