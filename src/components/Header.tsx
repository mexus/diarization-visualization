import { useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Undo2,
  Redo2,
} from 'lucide-react';
import { ShortcutsModal } from './ShortcutsModal';
import { ThemeToggle } from './ThemeToggle';
import { useEditorStore } from '../store/editorStore';
import { parseRTTM, serializeRTTM } from '../utils/rttmParser';
import type { ThemeMode } from '../utils/themeStorage';

function formatTime(seconds: number, includeMs = false): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const base = `${mins}:${secs.toString().padStart(2, '0')}`;
  if (includeMs) {
    const ms = Math.floor((seconds % 1) * 1000);
    return `${base}.${ms.toString().padStart(3, '0')}`;
  }
  return base;
}

function Separator() {
  return <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

interface HeaderProps {
  helpDefaultOpen?: boolean;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export function Header({ helpDefaultOpen = false, themeMode, onThemeModeChange }: HeaderProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const rttmInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(helpDefaultOpen);

  const {
    segments,
    isPlaying,
    currentTime,
    duration,
    pixelsPerSecond,
    history,
    future,
    setAudioFile,
    setSegments,
    setZoom,
    undo,
    redo,
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

  const handleRTTMExport = () => {
    if (segments.length === 0) return;

    const rttmText = serializeRTTM(segments);
    const blob = new Blob([rttmText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'diarization.rttm';
    // Mobile browsers require the anchor to be in the DOM for the click to work
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
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

  const [playbackRate, setPlaybackRate] = useState(1);

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    const controls = (window as unknown as Record<string, { setPlaybackRate?: (r: number) => void }>)
      .__wavesurferControls;
    controls?.setPlaybackRate?.(rate);
  };

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Calculate zoom progress for slider fill
  const zoomProgress = ((pixelsPerSecond - 10) / 190) * 100;

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 sm:py-3 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
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
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md
              hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1"
            title="Import Audio"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Audio</span>
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
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md
              hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition-colors
              focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
            title="Import RTTM"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">RTTM</span>
          </button>

          <button
            onClick={handleRTTMExport}
            disabled={segments.length === 0}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm bg-green-500 text-white rounded-md
              hover:bg-green-600 active:bg-green-700 transition-colors shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-1"
            title="Export RTTM"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        <Separator />

        {/* Undo/Redo - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <Separator />

        {/* Transport Controls */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Skip back 5s"
          >
            <SkipBack size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 active:bg-gray-800 dark:active:bg-gray-200 transition-colors shadow-sm
              focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Skip forward 5s"
          >
            <SkipForward size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <Separator />

        {/* Time Display - compact on mobile */}
        <div className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-300 tabular-nums">
          <span className="hidden sm:inline">{formatTime(currentTime, true)} / {formatTime(duration)}</span>
          <span className="sm:hidden">{formatTime(currentTime)}</span>
        </div>

        <Separator />

        {/* Playback Speed - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Speed</span>
          <select
            value={playbackRate}
            onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom Slider - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Zoom</span>
          <button
            onClick={() => setZoom(Math.max(10, pixelsPerSecond - 20))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <input
            type="range"
            min="10"
            max="200"
            value={pixelsPerSecond}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-28 custom-slider"
            style={{
              background: `linear-gradient(to right, var(--slider-track-active) 0%, var(--slider-track-active) ${zoomProgress}%, var(--slider-track-bg) ${zoomProgress}%, var(--slider-track-bg) 100%)`,
              borderRadius: '2px',
            }}
          />
          <button
            onClick={() => setZoom(Math.min(200, pixelsPerSecond + 20))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 w-14 text-right tabular-nums">
            {pixelsPerSecond}px/s
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle mode={themeMode} onModeChange={onThemeModeChange} />

        {/* Help Button */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2"
          title="Keyboard shortcuts"
        >
          <HelpCircle size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}
