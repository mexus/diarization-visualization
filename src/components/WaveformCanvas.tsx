import { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useEditorStore } from '../store/editorStore';

// Get waveform colors from CSS variables
function getWaveformColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    waveColor: style.getPropertyValue('--waveform-color').trim() || '#6b7280',
    progressColor: style.getPropertyValue('--waveform-progress').trim() || '#3b82f6',
  };
}

export function WaveformCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const audioFile = useEditorStore((s) => s.audioFile);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setDuration = useEditorStore((s) => s.setDuration);

  // Update waveform colors when theme changes
  const updateColors = useCallback(() => {
    if (!wavesurferRef.current) return;
    const { waveColor, progressColor } = getWaveformColors();
    wavesurferRef.current.setOptions({
      waveColor,
      progressColor,
    });
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateColors();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [updateColors]);

  // Initialize WaveSurfer and load audio when audioFile is set
  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    setIsReady(false);

    // Destroy previous instance if any
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const { waveColor, progressColor } = getWaveformColors();

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor: 'transparent', // Hide WaveSurfer cursor, we use our own Playhead
      cursorWidth: 0,
      height: 128,
      minPxPerSec: pixelsPerSecond,
      fillParent: false,
      autoScroll: false,
      hideScrollbar: true,
    });

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setIsReady(true);
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    ws.on('play', () => setPlaying(true));
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => setPlaying(false));

    wavesurferRef.current = ws;

    // Expose controls globally for Header and other components
    (window as unknown as Record<string, unknown>).__wavesurferControls = {
      playPause: () => ws.playPause(),
      skip: (seconds: number) => {
        const current = ws.getCurrentTime();
        const dur = ws.getDuration();
        if (dur > 0) {
          const newTime = Math.max(0, Math.min(dur, current + seconds));
          ws.seekTo(newTime / dur);
        }
      },
      seekTo: (time: number) => {
        const dur = ws.getDuration();
        if (dur > 0) {
          ws.seekTo(Math.max(0, Math.min(1, time / dur)));
        }
      },
      setPlaybackRate: (rate: number) => {
        ws.setPlaybackRate(rate);
      },
    };

    // Load the audio file
    const url = URL.createObjectURL(audioFile);
    ws.load(url);

    return () => {
      URL.revokeObjectURL(url);
      ws.destroy();
      wavesurferRef.current = null;
      delete (window as unknown as Record<string, unknown>).__wavesurferControls;
    };
    // Note: pixelsPerSecond intentionally excluded - zoom handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile, setPlaying, setCurrentTime, setDuration]);

  // Update zoom level only after audio is ready
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.zoom(pixelsPerSecond);
    }
  }, [pixelsPerSecond, isReady]);

  if (!audioFile) {
    return (
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 min-h-[128px] flex-1">
        <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 text-gray-400">
          Import an audio file to see the waveform
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 min-h-[128px] flex-1">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
