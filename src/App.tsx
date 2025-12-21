import { useEffect } from 'react';
import { Header, EditorWorkspace } from './components';
import './index.css';

function App() {
  // Space bar to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const controls = (window as unknown as Record<string, { playPause?: () => void }>)
          .__wavesurferControls;
        controls?.playPause?.();
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
