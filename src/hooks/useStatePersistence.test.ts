import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStatePersistence } from './useStatePersistence';
import { useEditorStore } from '../store/editorStore';
import * as audioHash from '../utils/audioHash';
import * as stateStorage from '../utils/stateStorage';

// Mock the modules
vi.mock('../utils/audioHash');
vi.mock('../utils/stateStorage');

describe('useStatePersistence', () => {
  const mockHashAudioFile = vi.mocked(audioHash.hashAudioFile);
  const mockLoadState = vi.mocked(stateStorage.loadState);

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
      loadingMessage: null,
    });

    // Reset mocks
    mockHashAudioFile.mockReset();
    mockLoadState.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should set audioHash to null when no audio file is loaded', () => {
    renderHook(() => useStatePersistence());

    expect(useEditorStore.getState().audioHash).toBeNull();
  });

  it('should compute hash and set it when audio file is loaded', async () => {
    mockHashAudioFile.mockResolvedValue('test-hash-123');
    mockLoadState.mockReturnValue(null);

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    // Set audio file in store
    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    await waitFor(() => {
      expect(mockHashAudioFile).toHaveBeenCalledWith(testFile);
    });

    await waitFor(() => {
      expect(useEditorStore.getState().audioHash).toBe('test-hash-123');
    });
  });

  it('should restore segments from storage when cached state exists', async () => {
    const cachedSegments = [
      { id: 'old-id-1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 },
      { id: 'old-id-2', speakerId: 'SPEAKER_01', startTime: 2, duration: 1.5 },
    ];

    mockHashAudioFile.mockResolvedValue('test-hash-456');
    mockLoadState.mockReturnValue({
      segments: cachedSegments,
      manualSpeakers: ['SPEAKER_02'],
      history: [],
      future: [],
    });

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.segments).toHaveLength(2);
      // IDs should be regenerated
      expect(state.segments[0].id).not.toBe('old-id-1');
      expect(state.segments[1].id).not.toBe('old-id-2');
      // But content should match
      expect(state.segments[0].speakerId).toBe('SPEAKER_00');
      expect(state.segments[0].startTime).toBe(0);
      expect(state.segments[0].duration).toBe(1);
      expect(state.segments[1].speakerId).toBe('SPEAKER_01');
    });
  });

  it('should restore manual speakers from storage', async () => {
    mockHashAudioFile.mockResolvedValue('test-hash-789');
    mockLoadState.mockReturnValue({
      segments: [],
      manualSpeakers: ['SPEAKER_CUSTOM'],
      history: [],
      future: [],
    });

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.manualSpeakers).toContain('SPEAKER_CUSTOM');
    });
  });

  it('should restore history from storage with regenerated IDs', async () => {
    const cachedHistory = [
      {
        segments: [{ id: 'history-old-id', speakerId: 'SPEAKER_00', startTime: 0, duration: 0.5 }],
        manualSpeakers: [],
      },
    ];

    mockHashAudioFile.mockResolvedValue('test-hash-history');
    mockLoadState.mockReturnValue({
      segments: [{ id: 'current-old-id', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 }],
      manualSpeakers: [],
      history: cachedHistory,
      future: [],
    });

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.history).toHaveLength(1);
      // History segment ID should be regenerated
      expect(state.history[0].segments[0].id).not.toBe('history-old-id');
      expect(state.history[0].segments[0].duration).toBe(0.5);
    });
  });

  it('should clear segments when no cached state exists', async () => {
    // Set up initial segments
    useEditorStore.setState({
      segments: [{ id: 'existing-segment', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 }],
    });

    mockHashAudioFile.mockResolvedValue('new-hash');
    mockLoadState.mockReturnValue(null);

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    await waitFor(() => {
      expect(useEditorStore.getState().segments).toHaveLength(0);
    });
  });

  it('should show loading state while processing', async () => {
    let resolveHash: (value: string) => void;
    const hashPromise = new Promise<string>((resolve) => {
      resolveHash = resolve;
    });
    mockHashAudioFile.mockReturnValue(hashPromise);
    mockLoadState.mockReturnValue(null);

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    // Should be in loading state
    expect(useEditorStore.getState().loadingMessage).toBe('Loading audio file...');

    // Resolve the hash
    await act(async () => {
      resolveHash!('test-hash');
      await hashPromise;
    });

    await waitFor(() => {
      expect(useEditorStore.getState().loadingMessage).toBeNull();
    });
  });

  it('should not re-process when the same audio file instance is set', async () => {
    mockHashAudioFile.mockResolvedValue('test-hash');
    mockLoadState.mockReturnValue(null);

    const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

    const { rerender } = renderHook(() => useStatePersistence());

    act(() => {
      useEditorStore.setState({ audioFile: testFile });
    });

    await waitFor(() => {
      expect(mockHashAudioFile).toHaveBeenCalledTimes(1);
    });

    // Re-render with the same file instance
    rerender();

    // Should not call hash again
    expect(mockHashAudioFile).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous processing when audio file changes quickly', async () => {
    let resolveFirst: (value: string) => void;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    mockHashAudioFile.mockReturnValueOnce(firstPromise);
    mockHashAudioFile.mockResolvedValueOnce('second-hash');
    mockLoadState.mockReturnValue(null);

    const testFile1 = new File(['audio 1'], 'test1.wav', { type: 'audio/wav' });
    const testFile2 = new File(['audio 2'], 'test2.wav', { type: 'audio/wav' });

    renderHook(() => useStatePersistence());

    // Load first file
    act(() => {
      useEditorStore.setState({ audioFile: testFile1 });
    });

    // Quickly load second file before first finishes
    act(() => {
      useEditorStore.setState({ audioFile: testFile2 });
    });

    // Resolve first hash after second is already processing
    await act(async () => {
      resolveFirst!('first-hash');
    });

    // Wait for second file to process
    await waitFor(() => {
      expect(useEditorStore.getState().audioHash).toBe('second-hash');
    });

    // The first hash should have been cancelled and not set
    expect(useEditorStore.getState().audioHash).not.toBe('first-hash');
  });
});
