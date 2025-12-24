import { vi } from 'vitest';

// Mock wavesurfer.js
export const mockWaveSurferInstance = {
  on: vi.fn(),
  un: vi.fn(),
  destroy: vi.fn(),
  load: vi.fn(),
  loadBlob: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  playPause: vi.fn(),
  stop: vi.fn(),
  zoom: vi.fn(),
  getDuration: vi.fn(() => 60),
  getCurrentTime: vi.fn(() => 0),
  seekTo: vi.fn(),
  setPlaybackRate: vi.fn(),
  getPlaybackRate: vi.fn(() => 1),
  setVolume: vi.fn(),
  getVolume: vi.fn(() => 1),
  isPlaying: vi.fn(() => false),
};

vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => mockWaveSurferInstance),
  },
}));

// Mock window.__wavesurferControls (for tests that haven't migrated to Zustand yet)
export const mockWavesurferControls = {
  playPause: vi.fn(),
  skip: vi.fn(),
  seekTo: vi.fn(),
  setPlaybackRate: vi.fn(),
};

Object.defineProperty(window, '__wavesurferControls', {
  value: mockWavesurferControls,
  writable: true,
  configurable: true,
});

// Mock URL.createObjectURL / revokeObjectURL
vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});

// Mock MutationObserver (used by WaveformCanvas for theme changes)
const mockMutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

vi.stubGlobal('MutationObserver', mockMutationObserver);

// Mock getComputedStyle (used by WaveformCanvas for CSS variable reading)
const mockGetComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn((prop: string) => {
    const cssVars: Record<string, string> = {
      '--waveform-color': '#3b82f6',
      '--waveform-progress-color': '#1d4ed8',
      '--waveform-cursor-color': '#ef4444',
    };
    return cssVars[prop] ?? '';
  }),
}));

vi.stubGlobal('getComputedStyle', mockGetComputedStyle);

// Mock ResizeObserver (used by some components)
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', mockResizeObserver);

// Mock matchMedia (used by useTheme hook)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Helper to reset all mocks between tests
export function resetComponentMocks() {
  mockWaveSurferInstance.on.mockClear();
  mockWaveSurferInstance.un.mockClear();
  mockWaveSurferInstance.destroy.mockClear();
  mockWaveSurferInstance.load.mockClear();
  mockWaveSurferInstance.loadBlob.mockClear();
  mockWaveSurferInstance.play.mockClear();
  mockWaveSurferInstance.pause.mockClear();
  mockWaveSurferInstance.playPause.mockClear();
  mockWaveSurferInstance.zoom.mockClear();
  mockWaveSurferInstance.seekTo.mockClear();
  mockWaveSurferInstance.setPlaybackRate.mockClear();

  mockWavesurferControls.playPause.mockClear();
  mockWavesurferControls.skip.mockClear();
  mockWavesurferControls.seekTo.mockClear();
  mockWavesurferControls.setPlaybackRate.mockClear();
}
