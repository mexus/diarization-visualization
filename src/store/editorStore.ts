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
    set({
      segments,
      speakers: extractSpeakers(segments),
    }),

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

      return {
        segments: updatedSegments,
        speakers: extractSpeakers(updatedSegments),
      };
    }),

  reset: () => set(initialState),

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
        speakers: extractSpeakers(updatedSegments),
      };
    }),

  // Delete segment
  deleteSegment: (segmentId) =>
    set((state) => {
      const updatedSegments = state.segments.filter((s) => s.id !== segmentId);
      return {
        segments: updatedSegments,
        speakers: extractSpeakers(updatedSegments),
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

      return {
        segments: updatedSegments,
        speakers: extractSpeakers(updatedSegments),
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
