import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useEditorStore } from '../store/editorStore';

export function WaveformCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const audioFile = useEditorStore((s) => s.audioFile);
  const pixelsPerSecond = useEditorStore((s) => s.pixelsPerSecond);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setDuration = useEditorStore((s) => s.setDuration);

  // Initialize WaveSurfer and load audio when audioFile is set
  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    setIsReady(false);

    // Destroy previous instance if any
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#3b82f6',
      progressColor: '#1d4ed8',
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
      <div className="bg-white border-b border-gray-200 min-h-[128px] flex-1">
        <div className="flex items-center justify-center h-32 bg-gray-100 text-gray-400">
          Import an audio file to see the waveform
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 min-h-[128px] flex-1">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
