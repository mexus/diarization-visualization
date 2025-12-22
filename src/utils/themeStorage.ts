export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'diarization-editor-theme';

export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'system'; // default
}

export function setStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore localStorage errors
  }
}
