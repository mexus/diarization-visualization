const STORAGE_KEY = 'diarization-editor-visited';

export function isFirstVisit(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}

export function markVisited(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}
