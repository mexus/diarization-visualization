import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useEditorStore } from './store/editorStore';

// Mock wavesurfer.js
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(),
      destroy: vi.fn(),
      load: vi.fn(),
      zoom: vi.fn(),
      getDuration: vi.fn(() => 60),
      getCurrentTime: vi.fn(() => 0),
      seekTo: vi.fn(),
      setPlaybackRate: vi.fn(),
      playPause: vi.fn(),
    })),
  },
}));

// Mock the hooks that cause issues
vi.mock('./hooks/useStatePersistence', () => ({
  useStatePersistence: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock MutationObserver
vi.stubGlobal('MutationObserver', vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
})));

// Mock getComputedStyle
vi.stubGlobal('getComputedStyle', vi.fn(() => ({
  getPropertyValue: vi.fn(() => ''),
})));

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

// Import the App component after mocks
import App from './App';

describe('App keyboard shortcuts', () => {
  const mockPlayPause = vi.fn();
  const mockSkip = vi.fn();

  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.setState({
      segments: [],
      speakers: [],
      manualSpeakers: [],
      selectedSegmentId: null,
      history: [],
      future: [],
      audioFile: null,
      audioHash: null,
      audioControls: {
        playPause: mockPlayPause,
        skip: mockSkip,
        seekTo: vi.fn(),
        setPlaybackRate: vi.fn(),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Space key - play/pause', () => {
    it('should call playPause when Space is pressed', () => {
      render(<App />);

      fireEvent.keyDown(document, { code: 'Space' });

      expect(mockPlayPause).toHaveBeenCalledTimes(1);
    });

    it('should not call playPause when Space is pressed in an input', () => {
      const { container } = render(<App />);
      const input = document.createElement('input');
      container.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { code: 'Space', target: input });

      expect(mockPlayPause).not.toHaveBeenCalled();
    });
  });

  describe('Arrow keys - skip', () => {
    it('should skip backward 5 seconds when ArrowLeft is pressed', () => {
      render(<App />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(mockSkip).toHaveBeenCalledWith(-5);
    });

    it('should skip forward 5 seconds when ArrowRight is pressed', () => {
      render(<App />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(mockSkip).toHaveBeenCalledWith(5);
    });

    it('should not skip when ArrowLeft is pressed in an input', () => {
      const { container } = render(<App />);
      const input = document.createElement('input');
      container.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowLeft', target: input });

      expect(mockSkip).not.toHaveBeenCalled();
    });
  });

  describe('Escape key - deselect', () => {
    it('should deselect segment when Escape is pressed', async () => {
      useEditorStore.setState({ selectedSegmentId: 'segment-1' });
      render(<App />);

      // Close the help modal first if it's open (first visit)
      // The first Escape closes the modal, the second deselects
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useEditorStore.getState().selectedSegmentId).toBeNull();
    });
  });

  describe('Delete/Backspace - delete segment', () => {
    it('should delete selected segment when Delete is pressed', () => {
      const testSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      useEditorStore.setState({
        segments: [testSegment],
        selectedSegmentId: 'segment-1',
      });
      render(<App />);

      fireEvent.keyDown(document, { key: 'Delete' });

      expect(useEditorStore.getState().segments).toHaveLength(0);
      expect(useEditorStore.getState().selectedSegmentId).toBeNull();
    });

    it('should delete selected segment when Backspace is pressed', () => {
      const testSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      useEditorStore.setState({
        segments: [testSegment],
        selectedSegmentId: 'segment-1',
      });
      render(<App />);

      fireEvent.keyDown(document, { key: 'Backspace' });

      expect(useEditorStore.getState().segments).toHaveLength(0);
    });

    it('should not delete when no segment is selected', () => {
      const testSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      useEditorStore.setState({
        segments: [testSegment],
        selectedSegmentId: null,
      });
      render(<App />);

      fireEvent.keyDown(document, { key: 'Delete' });

      expect(useEditorStore.getState().segments).toHaveLength(1);
    });
  });

  describe('Ctrl+Z - undo', () => {
    it('should undo when Ctrl+Z is pressed', () => {
      const originalSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      const modifiedSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 2,
      };
      useEditorStore.setState({
        segments: [modifiedSegment],
        history: [{ segments: [originalSegment], manualSpeakers: [] }],
        future: [],
      });
      render(<App />);

      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

      expect(useEditorStore.getState().segments[0].duration).toBe(1);
    });

    it('should not undo when Ctrl+Shift+Z is pressed (that is redo)', () => {
      const originalSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      useEditorStore.setState({
        segments: [originalSegment],
        history: [{ segments: [], manualSpeakers: [] }],
        future: [],
      });
      render(<App />);

      // Ctrl+Shift+Z should trigger redo, not undo
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true });

      // With no future, nothing should change
      expect(useEditorStore.getState().segments).toHaveLength(1);
    });
  });

  describe('Ctrl+Shift+Z / Ctrl+Y - redo', () => {
    it('should redo when Ctrl+Shift+Z is pressed', () => {
      const originalSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      const futureSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 2,
      };
      useEditorStore.setState({
        segments: [originalSegment],
        history: [],
        future: [{ segments: [futureSegment], manualSpeakers: [] }],
      });
      render(<App />);

      // Using 'z' with shiftKey produces 'Z' in the event
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true });

      expect(useEditorStore.getState().segments[0].duration).toBe(2);
    });

    it('should redo when Ctrl+Y is pressed', () => {
      const originalSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 1,
      };
      const futureSegment = {
        id: 'segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 2,
      };
      useEditorStore.setState({
        segments: [originalSegment],
        history: [],
        future: [{ segments: [futureSegment], manualSpeakers: [] }],
      });
      render(<App />);

      fireEvent.keyDown(document, { key: 'y', ctrlKey: true });

      expect(useEditorStore.getState().segments[0].duration).toBe(2);
    });
  });
});
