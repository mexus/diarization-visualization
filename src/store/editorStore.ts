import { create } from 'zustand';
import type { Segment, EditorState } from '../types';
import { extractSpeakers } from '../utils/rttmParser';

interface EditorActions {
  setSegments: (segments: Segment[]) => void;
  setZoom: (pixelsPerSecond: number) => void;
  setLabelWidth: (width: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioFile: (file: File | null) => void;
  renameSpeaker: (oldId: string, newId: string) => void;
  reset: () => void;
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
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
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
}));
