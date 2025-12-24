import type { Segment, HistoryEntry } from '../types';

const STORAGE_KEY = 'diarization-editor-states';
const MAX_ENTRIES = 10;
const CURRENT_VERSION = 1;

interface StoredState {
  segments: Segment[];
  manualSpeakers: string[];
  history: HistoryEntry[];
  future: HistoryEntry[];
  savedAt: number;
  fileName?: string;
}

interface StorageData {
  version: number;
  entries: Record<string, StoredState>;
  order: string[]; // Most recent first (LRU order)
}

// Legacy format (no version field)
interface LegacyStorageData {
  entries: Record<string, StoredState>;
  order: string[];
}

/**
 * Validate that a segment has the required structure.
 */
function isValidSegment(seg: unknown): seg is Segment {
  if (!seg || typeof seg !== 'object') return false;
  const s = seg as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.speakerId === 'string' &&
    typeof s.startTime === 'number' &&
    typeof s.duration === 'number'
  );
}

/**
 * Validate that an entry has the required structure.
 */
function isValidEntry(entry: unknown): entry is StoredState {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;

  // Required fields
  if (!Array.isArray(e.segments)) return false;
  if (typeof e.savedAt !== 'number') return false;

  // Validate all segments
  for (const seg of e.segments) {
    if (!isValidSegment(seg)) return false;
  }

  // Validate history entries if present
  if (e.history !== undefined) {
    if (!Array.isArray(e.history)) return false;
    for (const histEntry of e.history) {
      if (!histEntry || typeof histEntry !== 'object') return false;
      const h = histEntry as Record<string, unknown>;
      if (!Array.isArray(h.segments)) return false;
      for (const seg of h.segments) {
        if (!isValidSegment(seg)) return false;
      }
    }
  }

  return true;
}

/**
 * Migrate legacy storage (no version) to current version.
 */
function migrateStorage(raw: unknown): { data: StorageData; migrated: boolean } {
  if (!raw || typeof raw !== 'object') {
    return {
      data: { version: CURRENT_VERSION, entries: {}, order: [] },
      migrated: false,
    };
  }

  const data = raw as Record<string, unknown>;

  // Check for version field
  if (!('version' in data)) {
    // Migrate from legacy (no version)
    console.log('[stateStorage] Migrating storage from legacy to v1');
    const legacy = data as unknown as LegacyStorageData;
    return {
      data: {
        version: CURRENT_VERSION,
        entries: legacy.entries ?? {},
        order: legacy.order ?? [],
      },
      migrated: true,
    };
  }

  // Already versioned
  if (data.version === CURRENT_VERSION) {
    return { data: data as unknown as StorageData, migrated: false };
  }

  // Future version - shouldn't happen, but handle gracefully
  console.warn('[stateStorage] Unknown storage version:', data.version);
  return {
    data: { version: CURRENT_VERSION, entries: {}, order: [] },
    migrated: true,
  };
}

/**
 * Validate entries and remove invalid ones.
 */
function validateEntries(data: StorageData): { data: StorageData; removed: string[] } {
  const removed: string[] = [];
  const validEntries: Record<string, StoredState> = {};
  const validOrder: string[] = [];

  for (const hash of data.order) {
    const entry = data.entries[hash];
    if (isValidEntry(entry)) {
      validEntries[hash] = entry;
      validOrder.push(hash);
    } else {
      removed.push(hash);
      console.warn(`[stateStorage] Removed invalid cache entry: ${hash.slice(0, 8)}...`);
    }
  }

  return {
    data: { version: data.version, entries: validEntries, order: validOrder },
    removed,
  };
}

// Track removed entries for toast notification
let lastRemovedEntries: string[] = [];

function getStorageData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { data: migrated, migrated: wasMigrated } = migrateStorage(parsed);
      const { data: validated, removed } = validateEntries(migrated);

      // Track removed entries for external consumption
      lastRemovedEntries = removed;

      // If we removed entries or migrated, save the cleaned version
      if (removed.length > 0 || wasMigrated) {
        setStorageData(validated);
      }

      return validated;
    }
  } catch {
    // Ignore parse errors
  }
  lastRemovedEntries = [];
  return { version: CURRENT_VERSION, entries: {}, order: [] };
}

function setStorageData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Get the list of entries that were removed during the last load.
 * Call this after loadState to check if any entries were invalidated.
 */
export function getLastRemovedEntries(): string[] {
  return lastRemovedEntries;
}

/**
 * Save state for an audio file hash.
 * Implements LRU eviction to keep only the last MAX_ENTRIES.
 */
export function saveState(
  audioHash: string,
  segments: Segment[],
  manualSpeakers: string[] = [],
  history: HistoryEntry[] = [],
  future: HistoryEntry[] = [],
  fileName?: string
): void {
  const data = getStorageData();

  // Preserve existing fileName if not provided
  const existingFileName = data.entries[audioHash]?.fileName;

  // Remove from current position in order (if exists)
  data.order = data.order.filter((h) => h !== audioHash);

  // Add to front (most recent)
  data.order.unshift(audioHash);

  // Store the state
  data.entries[audioHash] = {
    segments,
    manualSpeakers,
    history,
    future,
    savedAt: Date.now(),
    fileName: fileName ?? existingFileName,
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

interface LoadedState {
  segments: Segment[];
  manualSpeakers: string[];
  history: HistoryEntry[];
  future: HistoryEntry[];
}

/**
 * Load state for an audio file hash.
 * Returns null if no saved state exists.
 */
export function loadState(audioHash: string): LoadedState | null {
  const data = getStorageData();
  const state = data.entries[audioHash];

  if (!state) {
    return null;
  }

  // Move to front of order (mark as recently used)
  data.order = data.order.filter((h) => h !== audioHash);
  data.order.unshift(audioHash);
  setStorageData(data);

  return {
    segments: state.segments,
    manualSpeakers: state.manualSpeakers ?? [],
    history: state.history ?? [],
    future: state.future ?? [],
  };
}

/**
 * Clear all saved states.
 */
export function clearAllStates(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Cache entry info for display in settings modal.
 */
export interface CacheEntryInfo {
  hash: string;
  fileName?: string;
  savedAt: number;
  segmentCount: number;
  historyDepth: number;
}

/**
 * Get all cache entries for display in settings modal.
 */
export function getCacheEntries(): CacheEntryInfo[] {
  const data = getStorageData();
  return data.order.map((hash) => {
    const entry = data.entries[hash];
    return {
      hash,
      fileName: entry.fileName,
      savedAt: entry.savedAt,
      segmentCount: entry.segments.length,
      historyDepth: entry.history?.length ?? 0,
    };
  });
}

/**
 * Delete a single cache entry by hash.
 */
export function deleteEntry(audioHash: string): void {
  const data = getStorageData();
  delete data.entries[audioHash];
  data.order = data.order.filter((h) => h !== audioHash);
  setStorageData(data);
}
