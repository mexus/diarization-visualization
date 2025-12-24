import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function PlaybackSpeedControl() {
  const audioControls = useEditorStore((s) => s.audioControls);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioControls?.setPlaybackRate(rate);
  };

  return (
    <div className="hidden md:flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Speed</span>
      <select
        value={playbackRate}
        onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
        aria-label="Playback speed"
        className="custom-dropdown text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md
          px-3 py-1.5 cursor-pointer shadow-sm
          hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
          transition-all duration-150"
      >
        {playbackRates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </select>
    </div>
  );
}
