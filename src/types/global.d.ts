interface WaveSurferControls {
  playPause: () => void;
  skip: (seconds: number) => void;
  seekTo: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
}

declare global {
  interface Window {
    __wavesurferControls?: WaveSurferControls;
  }
}

export {};
