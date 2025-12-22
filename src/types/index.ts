export interface Segment {
  id: string;
  speakerId: string;
  startTime: number; // seconds
  duration: number; // seconds
}

export interface DragState {
  type: 'resize-left' | 'resize-right' | 'relabel';
  segmentId: string;
  currentTime?: number; // resize position in seconds
  currentSpeakerId?: string; // relabel target lane
  originalSegment: Segment; // snapshot before drag
}

export interface EditorState {
  segments: Segment[];
  speakers: string[]; // Computed: unique speakers from segments + manualSpeakers
  manualSpeakers: string[]; // Speakers added manually (not derived from segments)
  pixelsPerSecond: number;
  labelWidth: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioFile: File | null;
  audioHash: string | null;
  selectedSegmentId: string | null;
  dragState: DragState | null;
}
