import type { Segment } from '../types';

const STORAGE_KEY = 'diarization-editor-states';
const MAX_ENTRIES = 10;

interface StoredState {
  segments: Segment[];
  savedAt: number;
}

interface StorageData {
  entries: Record<string, StoredState>;
  order: string[]; // Most recent first (LRU order)
}

function getStorageData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse errors
  }
  return { entries: {}, order: [] };
}

function setStorageData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Save segments for an audio file hash.
 * Implements LRU eviction to keep only the last MAX_ENTRIES.
 */
export function saveState(audioHash: string, segments: Segment[]): void {
  const data = getStorageData();

  // Remove from current position in order (if exists)
  data.order = data.order.filter((h) => h !== audioHash);

  // Add to front (most recent)
  data.order.unshift(audioHash);

  // Store the state
  data.entries[audioHash] = {
    segments,
    savedAt: Date.now(),
  };

  // Evict old entries if over limit
  while (data.order.length > MAX_ENTRIES) {
    const oldHash = data.order.pop();
    if (oldHash) {
      delete data.entries[oldHash];
    }
  }

  setStorageData(data);
}

/**
 * Load segments for an audio file hash.
 * Returns null if no saved state exists.
 */
export function loadState(audioHash: string): Segment[] | null {
  const data = getStorageData();
  const state = data.entries[audioHash];

  if (!state) {
    return null;
  }

  // Move to front of order (mark as recently used)
  data.order = data.order.filter((h) => h !== audioHash);
  data.order.unshift(audioHash);
  setStorageData(data);

  return state.segments;
}

/**
 * Clear all saved states.
 */
export function clearAllStates(): void {
  localStorage.removeItem(STORAGE_KEY);
}
