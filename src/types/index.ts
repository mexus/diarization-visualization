export interface Segment {
  id: string;
  speakerId: string;
  startTime: number; // seconds
  duration: number; // seconds
}

export interface EditorState {
  segments: Segment[];
  speakers: string[];
  pixelsPerSecond: number;
  labelWidth: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioFile: File | null;
}
