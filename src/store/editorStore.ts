import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Segment, EditorState, DragState } from '../types';
import { extractSpeakers } from '../utils/rttmParser';
import { saveState } from '../utils/stateStorage';

const MIN_SEGMENT_DURATION = 0.1; // seconds

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
};

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
        manualSpeakers: newManualSpeakers,
        speakers: computeSpeakers(state.segments, newManualSpeakers),
      };
    }),

  // Merge all segments from source speaker into target speaker
  mergeSpeakers: (sourceId, targetId) => {
    const state = useEditorStore.getState();
    if (sourceId === targetId) return false;

    const sourceSegments = state.segments.filter((s) => s.speakerId === sourceId);
    if (sourceSegments.length === 0) return false;

    // Check if any source segment would overlap with target segments
    for (const seg of sourceSegments) {
      if (wouldOverlap(state.segments, targetId, seg.startTime, seg.duration, seg.id)) {
        return false; // Can't merge due to overlaps
      }
    }

    // Perform the merge
    set((state) => {
      const updatedSegments = state.segments.map((s) =>
        s.speakerId === sourceId ? { ...s, speakerId: targetId } : s
      );

      // Remove source from manualSpeakers if present
      const newManualSpeakers = state.manualSpeakers.filter((id) => id !== sourceId);

      return {
        segments: updatedSegments,
        manualSpeakers: newManualSpeakers,
        speakers: computeSpeakers(updatedSegments, newManualSpeakers),
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
        segments: updatedSegments,
        speakers: computeSpeakers(updatedSegments, state.manualSpeakers),
      };
    }),

  // Delete segment
  deleteSegment: (segmentId) =>
    set((state) => {
      const updatedSegments = state.segments.filter((s) => s.id !== segmentId);
      return {
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
})));

// Auto-save segments when they change (debounced via subscription)
useEditorStore.subscribe(
  (state) => ({ segments: state.segments, audioHash: state.audioHash }),
  ({ segments, audioHash }) => {
    if (audioHash && segments.length > 0) {
      saveState(audioHash, segments);
    }
  },
  { equalityFn: (a, b) => a.segments === b.segments && a.audioHash === b.audioHash }
);
