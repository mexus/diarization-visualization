import { useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
  FileText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { parseRTTM } from '../utils/rttmParser';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function Header() {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const rttmInputRef = useRef<HTMLInputElement>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    pixelsPerSecond,
    setAudioFile,
    setSegments,
    setZoom,
  } = useEditorStore();

  const handleAudioImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleRTTMImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const segments = parseRTTM(text);
      setSegments(segments);
    }
  };

  const handlePlayPause = () => {
    const controls = (window as unknown as Record<string, { playPause?: () => void }>)
      .__wavesurferControls;
    controls?.playPause?.();
  };

  const handleSkip = (seconds: number) => {
    const controls = (window as unknown as Record<string, { skip?: (s: number) => void }>)
      .__wavesurferControls;
    controls?.skip?.(seconds);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-6">
        {/* File Controls */}
        <div className="flex items-center gap-2">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioImport}
          />
          <button
            onClick={() => audioInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Upload size={16} />
            Audio
          </button>

          <input
            ref={rttmInputRef}
            type="file"
            accept=".rttm"
            className="hidden"
            onChange={handleRTTMImport}
          />
          <button
            onClick={() => rttmInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FileText size={16} />
            RTTM
          </button>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Skip back 5s"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Skip forward 5s"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500">Zoom</span>
          <button
            onClick={() => setZoom(Math.max(10, pixelsPerSecond - 20))}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} className="text-gray-600" />
          </button>
          <input
            type="range"
            min="10"
            max="200"
            value={pixelsPerSecond}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32"
          />
          <button
            onClick={() => setZoom(Math.min(200, pixelsPerSecond + 20))}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} className="text-gray-600" />
          </button>
          <span className="text-sm text-gray-500 w-12">
            {pixelsPerSecond}px/s
          </span>
        </div>
      </div>
    </header>
  );
}
