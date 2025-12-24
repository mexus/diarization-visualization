const STORAGE_KEY = 'diarization-editor-visited';

export function isFirstVisit(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    // localStorage unavailable (private browsing, etc.)
    // Default to false to avoid showing help modal repeatedly
    return false;
  }
}

export function markVisited(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Silently fail if storage unavailable
  }
}
