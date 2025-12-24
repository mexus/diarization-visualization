import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

export function TransportControls() {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const audioControls = useEditorStore((s) => s.audioControls);

  const handlePlayPause = () => {
    audioControls?.playPause();
  };

  const handleSkip = (seconds: number) => {
    audioControls?.skip(seconds);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
      <button
        onClick={() => handleSkip(-5)}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Skip back 5s"
        aria-label="Skip back 5 seconds"
      >
        <SkipBack size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 active:bg-gray-800 dark:active:bg-gray-200 transition-colors shadow-sm
          focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <button
        onClick={() => handleSkip(5)}
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Skip forward 5s"
        aria-label="Skip forward 5 seconds"
      >
        <SkipForward size={20} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}
