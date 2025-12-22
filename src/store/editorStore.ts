import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Segment, EditorState, DragState, HistoryEntry } from '../types';
import { extractSpeakers } from '../utils/rttmParser';
import { saveState } from '../utils/stateStorage';

const MIN_SEGMENT_DURATION = 0.1; // seconds
const MAX_HISTORY = 50; // Maximum undo/redo steps

interface EditorActions {
  setSegments: (segments: Segment[]) => void;
  setZoom: (pixelsPerSecond: number) => void;
  setLabelWidth: (width: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioFile: (file: File | null) => void;
  setAudioHash: (hash: string | null) => void;
  renameSpeaker: (oldId: string, newId: string) => void;
  reset: () => void;
  // Speaker management
  addSpeaker: () => void;
  removeSpeaker: (speakerId: string) => void;
  mergeSpeakers: (sourceId: string, targetId: string) => boolean;
  // Selection
  selectSegment: (segmentId: string | null) => void;
  // Segment editing
  updateSegment: (
    segmentId: string,
    updates: Partial<Pick<Segment, 'startTime' | 'duration' | 'speakerId'>>
  ) => void;
  deleteSegment: (segmentId: string) => void;
  createSegment: (speakerId: string, startTime: number, duration: number) => void;
  // Drag state
  startDrag: (dragState: DragState) => void;
  updateDrag: (updates: Partial<Omit<DragState, 'type' | 'segmentId' | 'originalSegment'>>) => void;
  endDrag: () => void;
  // Undo/redo
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  restoreWithHistory: (segments: Segment[], manualSpeakers: string[], history: HistoryEntry[], future: HistoryEntry[]) => void;
}

const DEFAULT_PIXELS_PER_SECOND = 50;
const DEFAULT_LABEL_WIDTH = 112;

const initialState: EditorState = {
  segments: [],
  speakers: [],
  manualSpeakers: [],
  pixelsPerSecond: DEFAULT_PIXELS_PER_SECOND,
  labelWidth: DEFAULT_LABEL_WIDTH,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  audioFile: null,
  audioHash: null,
  selectedSegmentId: null,
  dragState: null,
  history: [],
  future: [],
};

// Helper to create a history entry from current state
function createHistoryEntry(state: EditorState): HistoryEntry {
  return {
    segments: state.segments,
    manualSpeakers: state.manualSpeakers,
  };
}

// Helper to push current state to history (call before making changes)
function pushHistory(state: EditorState): Partial<EditorState> {
  const entry = createHistoryEntry(state);
  const newHistory = [entry, ...state.history].slice(0, MAX_HISTORY);
  return {
    history: newHistory,
    future: [], // Clear redo stack on new action
  };
}

// Merge speakers from segments with manually added speakers
function computeSpeakers(segments: Segment[], manualSpeakers: string[]): string[] {
  const fromSegments = extractSpeakers(segments);
  const combined = new Set([...fromSegments, ...manualSpeakers]);
  return Array.from(combined).sort();
}

// Generate the next available speaker ID (SPEAKER_00, SPEAKER_01, etc.)
function getNextSpeakerId(existingSpeakers: string[]): string {
  let index = 0;
  while (existingSpeakers.includes(`SPEAKER_${index.toString().padStart(2, '0')}`)) {
    index++;
  }
  return `SPEAKER_${index.toString().padStart(2, '0')}`;
}

// Check if a segment would overlap with existing segments in the same lane
function wouldOverlap(
  segments: Segment[],
  targetSpeakerId: string,
  startTime: number,
  duration: number,
  excludeSegmentId?: string
): boolean {
  const endTime = startTime + duration;
  return segments
    .filter((s) => s.speakerId === targetSpeakerId && s.id !== excludeSegmentId)
    .some((other) => {
      const otherEnd = other.startTime + other.duration;
      // Overlap if ranges intersect (but zero-gap adjacency is OK)
      return startTime < otherEnd && endTime > other.startTime;
    });
}

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector((set) => ({
  ...initialState,

  setSegments: (segments) =>
    set((state) => ({
      segments,
      speakers: computeSpeakers(segments, state.manualSpeakers),
      history: [], // Clear history when loading new segments
      future: [],
    })),

  setZoom: (pixelsPerSecond) => set({ pixelsPerSecond }),

  setLabelWidth: (labelWidth) => set({ labelWidth: Math.max(80, Math.min(300, labelWidth)) }),

  setPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setAudioFile: (audioFile) => set({ audioFile }),

  setAudioHash: (audioHash) => set({ audioHash }),

  renameSpeaker: (oldId, newId) =>
    set((state) => {
      const trimmedNewId = newId.trim();
      if (!trimmedNewId || trimmedNewId === oldId) return state;

      // Check if newId already exists
      if (state.speakers.includes(trimmedNewId)) return state;

      const updatedSegments = state.segments.map((seg) =>
        seg.speakerId === oldId ? { ...seg, speakerId: trimmedNewId } : seg
      );

      // Also rename in manual speakers if present
      const updatedManualSpeakers = state.manualSpeakers.map((id) =>
        id === oldId ? trimmedNewId : id
      );

      return {
        ...pushHistory(state),
        segments: updatedSegments,
        manualSpeakers: updatedManualSpeakers,
        speakers: computeSpeakers(updatedSegments, updatedManualSpeakers),
      };
    }),

  reset: () => set(initialState),

  // Speaker management
  addSpeaker: () =>
    set((state) => {
      const newSpeakerId = getNextSpeakerId(state.speakers);
      const newManualSpeakers = [...state.manualSpeakers, newSpeakerId];
      return {
        ...pushHistory(state),
        manualSpeakers: newManualSpeakers,
        speakers: computeSpeakers(state.segments, newManualSpeakers),
      };
    }),

  removeSpeaker: (speakerId) =>
    set((state) => {
      // Only allow removing speakers that have no segments
      const hasSegments = state.segments.some((s) => s.speakerId === speakerId);
      if (hasSegments) return state;

      // Remove from manual speakers list
      const newManualSpeakers = state.manualSpeakers.filter((id) => id !== speakerId);
      return {
        ...pushHistory(state),
        manualSpeakers: newManualSpeakers,
        speakers: computeSpeakers(state.segments, newManualSpeakers),
      };
    }),

  // Merge all segments from source speaker into target speaker
  // Overlapping segments are combined into single segments spanning their union
  mergeSpeakers: (sourceId, targetId) => {
    const state = useEditorStore.getState();
    if (sourceId === targetId) return false;

    const sourceSegments = state.segments.filter((s) => s.speakerId === sourceId);
    const targetSegments = state.segments.filter((s) => s.speakerId === targetId);
    const otherSegments = state.segments.filter(
      (s) => s.speakerId !== sourceId && s.speakerId !== targetId
    );

    // If source has no segments, just remove it from manualSpeakers
    if (sourceSegments.length === 0) {
      set((state) => {
        const newManualSpeakers = state.manualSpeakers.filter((id) => id !== sourceId);
        return {
          ...pushHistory(state),
          manualSpeakers: newManualSpeakers,
          speakers: computeSpeakers(state.segments, newManualSpeakers),
        };
      });
      return true;
    }

    // Combine source and target segments, then merge overlapping intervals
    const allSegments = [...sourceSegments, ...targetSegments];

    // Sort by start time
    allSegments.sort((a, b) => a.startTime - b.startTime);

    // Merge overlapping intervals
    const mergedSegments: Segment[] = [];
    for (const seg of allSegments) {
      const last = mergedSegments[mergedSegments.length - 1];
      const segEnd = seg.startTime + seg.duration;

      if (last && seg.startTime <= last.startTime + last.duration) {
        // Overlapping or adjacent - extend the last segment
        const lastEnd = last.startTime + last.duration;
        const newEnd = Math.max(lastEnd, segEnd);
        last.duration = newEnd - last.startTime;
      } else {
        // No overlap - add new segment with target speaker ID
        mergedSegments.push({
          id: crypto.randomUUID(),
          speakerId: targetId,
          startTime: seg.startTime,
          duration: seg.duration,
        });
      }
    }

    // Perform the merge
    set((state) => {
      const updatedSegments = [...otherSegments, ...mergedSegments];

      // Remove source from manualSpeakers if present
      const newManualSpeakers = state.manualSpeakers.filter((id) => id !== sourceId);

      return {
        ...pushHistory(state),
        segments: updatedSegments,
        manualSpeakers: newManualSpeakers,
        speakers: computeSpeakers(updatedSegments, newManualSpeakers),
        selectedSegmentId: null, // Clear selection since segment IDs changed
      };
    });

    return true;
  },

  // Selection
  selectSegment: (segmentId) => set({ selectedSegmentId: segmentId }),

  // Update segment with validation and clamping to adjacent segments
  updateSegment: (segmentId, updates) =>
    set((state) => {
      const segment = state.segments.find((s) => s.id === segmentId);
      if (!segment) return state;

      const newSpeakerId = updates.speakerId ?? segment.speakerId;
      const originalEndTime = segment.startTime + segment.duration;

      // Get other segments in the same lane (for clamping during resize)
      const laneSegments = state.segments.filter(
        (s) => s.speakerId === newSpeakerId && s.id !== segmentId
      );

      let newStartTime = updates.startTime ?? segment.startTime;
      let newDuration = updates.duration ?? segment.duration;

      // Clamp to adjacent segments during resize (not for relabel)
      const isResize = updates.startTime !== undefined || updates.duration !== undefined;
      const isRelabel = updates.speakerId !== undefined && updates.speakerId !== segment.speakerId;

      if (isResize && !isRelabel) {
        // Find the closest segment ending before or at our original start
        const segmentsBefore = laneSegments.filter(
          (s) => s.startTime + s.duration <= segment.startTime
        );
        const maxEndBefore = segmentsBefore.length > 0
          ? Math.max(...segmentsBefore.map((s) => s.startTime + s.duration))
          : 0;

        // Find the closest segment starting at or after our original end
        const segmentsAfter = laneSegments.filter(
          (s) => s.startTime >= originalEndTime
        );
        const minStartAfter = segmentsAfter.length > 0
          ? Math.min(...segmentsAfter.map((s) => s.startTime))
          : Infinity;

        // Resize-left: clamp start time and recalculate duration to keep end fixed
        if (updates.startTime !== undefined) {
          newStartTime = Math.max(newStartTime, maxEndBefore);
          newDuration = originalEndTime - newStartTime;
        }

        // Resize-right: clamp end time (via duration)
        if (updates.duration !== undefined && updates.startTime === undefined) {
          const newEndTime = newStartTime + newDuration;
          if (newEndTime > minStartAfter) {
            newDuration = minStartAfter - newStartTime;
          }
        }
      }

      // Enforce minimum duration
      newDuration = Math.max(MIN_SEGMENT_DURATION, newDuration);

      // Enforce non-negative start time
      newStartTime = Math.max(0, newStartTime);

      // For relabel, reject if would overlap (can't clamp for lane changes)
      if (isRelabel) {
        if (wouldOverlap(state.segments, newSpeakerId, newStartTime, newDuration, segmentId)) {
          return state;
        }
      }

      const updatedSegments = state.segments.map((s) =>
        s.id === segmentId
          ? { ...s, startTime: newStartTime, duration: newDuration, speakerId: newSpeakerId }
          : s
      );

      return {
        ...pushHistory(state),
        segments: updatedSegments,
        speakers: computeSpeakers(updatedSegments, state.manualSpeakers),
      };
    }),

  // Delete segment
  deleteSegment: (segmentId) =>
    set((state) => {
      const updatedSegments = state.segments.filter((s) => s.id !== segmentId);
      return {
        ...pushHistory(state),
        segments: updatedSegments,
        speakers: computeSpeakers(updatedSegments, state.manualSpeakers),
        selectedSegmentId: state.selectedSegmentId === segmentId ? null : state.selectedSegmentId,
      };
    }),

  // Create new segment
  createSegment: (speakerId, startTime, duration) =>
    set((state) => {
      const finalStartTime = Math.max(0, startTime);
      const finalDuration = Math.max(MIN_SEGMENT_DURATION, duration);

      // Check for overlaps
      if (wouldOverlap(state.segments, speakerId, finalStartTime, finalDuration)) {
        return state;
      }

      const newSegment: Segment = {
        id: crypto.randomUUID(),
        speakerId,
        startTime: finalStartTime,
        duration: finalDuration,
      };

      const updatedSegments = [...state.segments, newSegment];

      // Remove speaker from manualSpeakers if it now has segments
      const updatedManualSpeakers = state.manualSpeakers.filter((id) => id !== speakerId);

      return {
        ...pushHistory(state),
        segments: updatedSegments,
        manualSpeakers: updatedManualSpeakers,
        speakers: computeSpeakers(updatedSegments, updatedManualSpeakers),
        selectedSegmentId: newSegment.id,
      };
    }),

  // Drag state management
  startDrag: (dragState) => set({ dragState }),

  updateDrag: (updates) =>
    set((state) => ({
      dragState: state.dragState ? { ...state.dragState, ...updates } : null,
    })),

  endDrag: () => set({ dragState: null }),

  // Undo/redo
  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state;

      const [previous, ...rest] = state.history;
      const currentEntry = createHistoryEntry(state);

      return {
        segments: previous.segments,
        manualSpeakers: previous.manualSpeakers,
        speakers: computeSpeakers(previous.segments, previous.manualSpeakers),
        history: rest,
        future: [currentEntry, ...state.future].slice(0, MAX_HISTORY),
        // Clear selection if the segment no longer exists
        selectedSegmentId: previous.segments.some((s) => s.id === state.selectedSegmentId)
          ? state.selectedSegmentId
          : null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;

      const [next, ...rest] = state.future;
      const currentEntry = createHistoryEntry(state);

      return {
        segments: next.segments,
        manualSpeakers: next.manualSpeakers,
        speakers: computeSpeakers(next.segments, next.manualSpeakers),
        history: [currentEntry, ...state.history].slice(0, MAX_HISTORY),
        future: rest,
        // Clear selection if the segment no longer exists
        selectedSegmentId: next.segments.some((s) => s.id === state.selectedSegmentId)
          ? state.selectedSegmentId
          : null,
      };
    }),

  clearHistory: () => set({ history: [], future: [] }),

  restoreWithHistory: (segments, manualSpeakers, history, future) =>
    set(() => ({
      segments,
      manualSpeakers,
      speakers: computeSpeakers(segments, manualSpeakers),
      history,
      future,
    })),
})));

// Auto-save state when it changes (debounced via subscription)
useEditorStore.subscribe(
  (state) => ({
    segments: state.segments,
    manualSpeakers: state.manualSpeakers,
    history: state.history,
    future: state.future,
    audioHash: state.audioHash,
  }),
  ({ segments, manualSpeakers, history, future, audioHash }) => {
    if (audioHash && (segments.length > 0 || manualSpeakers.length > 0)) {
      saveState(audioHash, segments, manualSpeakers, history, future);
    }
  },
  {
    equalityFn: (a, b) =>
      a.segments === b.segments &&
      a.manualSpeakers === b.manualSpeakers &&
      a.history === b.history &&
      a.future === b.future &&
      a.audioHash === b.audioHash,
  }
);
