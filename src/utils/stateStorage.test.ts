import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveState,
  loadState,
  clearAllStates,
  getCacheEntries,
  deleteEntry,
  getLastRemovedEntries,
} from './stateStorage';
import type { Segment, HistoryEntry } from '../types';

// Helper to create valid segments
function createSegment(overrides: Partial<Segment> = {}): Segment {
  return {
    id: crypto.randomUUID(),
    speakerId: 'SPEAKER_00',
    startTime: 0,
    duration: 1,
    ...overrides,
  };
}

describe('stateStorage', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
  });

  describe('isValidSegment (via validation)', () => {
    it('should accept valid segment', () => {
      const segment = createSegment();
      saveState('hash-1', [segment]);
      const loaded = loadState('hash-1');
      expect(loaded?.segments).toHaveLength(1);
    });

    it('should reject segment with missing id', () => {
      // Directly set invalid data
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            segments: [{ speakerId: 'SPEAKER_00', startTime: 0, duration: 1 }], // missing id
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull(); // Entry should be removed as invalid
    });

    it('should reject segment with missing speakerId', () => {
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            segments: [{ id: 'test', startTime: 0, duration: 1 }], // missing speakerId
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();
    });

    it('should reject segment with non-number startTime', () => {
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            segments: [{ id: 'test', speakerId: 'SPEAKER_00', startTime: '0', duration: 1 }],
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();
    });

    it('should reject segment with non-number duration', () => {
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            segments: [{ id: 'test', speakerId: 'SPEAKER_00', startTime: 0, duration: '1' }],
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();
    });
  });

  describe('isValidEntry (via validation)', () => {
    it('should accept valid entry', () => {
      saveState('hash-1', [createSegment()]);
      const loaded = loadState('hash-1');
      expect(loaded).not.toBeNull();
    });

    it('should reject entry with missing segments array', () => {
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();
    });

    it('should reject entry with missing savedAt', () => {
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            segments: [],
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();
    });

    it('should reject entry with invalid segment in history', () => {
      const invalidData = {
        version: 1,
        entries: {
          'hash-1': {
            segments: [],
            savedAt: Date.now(),
            history: [
              { segments: [{ id: 'test' }] }, // Invalid segment (missing fields)
            ],
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();
    });
  });

  describe('migrateStorage', () => {
    it('should return empty data for null input', () => {
      localStorage.setItem('diarization-editor-states', 'null');

      const loaded = loadState('any-hash');
      expect(loaded).toBeNull();
    });

    it('should add version field to legacy data', () => {
      // Legacy format (no version)
      const legacyData = {
        entries: {
          'hash-1': {
            segments: [createSegment()],
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(legacyData));

      const loaded = loadState('hash-1');
      expect(loaded).not.toBeNull();

      // Check that version was added
      const stored = JSON.parse(localStorage.getItem('diarization-editor-states')!);
      expect(stored.version).toBe(1);
    });

    it('should pass through already versioned data', () => {
      const segment = createSegment();
      saveState('hash-1', [segment]);

      const stored = JSON.parse(localStorage.getItem('diarization-editor-states')!);
      expect(stored.version).toBe(1);
    });

    it('should reset to empty for unknown future version', () => {
      const futureData = {
        version: 999,
        entries: {
          'hash-1': {
            segments: [],
            savedAt: Date.now(),
          },
        },
        order: ['hash-1'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(futureData));

      // Should clear and reset
      const loaded = loadState('hash-1');
      expect(loaded).toBeNull();

      // Check storage was reset
      const stored = JSON.parse(localStorage.getItem('diarization-editor-states')!);
      expect(stored.version).toBe(1);
      expect(stored.order).toHaveLength(0);
    });
  });

  describe('saveState and loadState', () => {
    it('should save and load roundtrip', () => {
      const segments: Segment[] = [
        createSegment({ startTime: 0, duration: 1 }),
        createSegment({ startTime: 2, duration: 2 }),
      ];
      const manualSpeakers = ['SPEAKER_01'];
      const history: HistoryEntry[] = [{ segments: [], manualSpeakers: [] }];
      const future: HistoryEntry[] = [{ segments: [createSegment()], manualSpeakers: [] }];

      saveState('hash-1', segments, manualSpeakers, history, future, 'test.wav');

      const loaded = loadState('hash-1');
      expect(loaded).not.toBeNull();
      expect(loaded!.segments).toHaveLength(2);
      expect(loaded!.manualSpeakers).toContain('SPEAKER_01');
      expect(loaded!.history).toHaveLength(1);
      expect(loaded!.future).toHaveLength(1);
    });

    it('should update existing entry (move to front)', () => {
      saveState('hash-1', [createSegment()]);
      saveState('hash-2', [createSegment()]);
      saveState('hash-1', [createSegment(), createSegment()]); // Update hash-1

      const entries = getCacheEntries();
      expect(entries[0].hash).toBe('hash-1'); // Should be first (most recent)
      expect(entries[0].segmentCount).toBe(2);
    });

    it('should preserve fileName if not provided', () => {
      saveState('hash-1', [createSegment()], [], [], [], 'original.wav');
      saveState('hash-1', [createSegment(), createSegment()]); // Update without fileName

      const entries = getCacheEntries();
      expect(entries[0].fileName).toBe('original.wav');
    });

    it('should evict oldest entry when over MAX_ENTRIES (10)', () => {
      // Create 11 entries
      for (let i = 0; i < 11; i++) {
        saveState(`hash-${i}`, [createSegment()]);
      }

      const entries = getCacheEntries();
      expect(entries).toHaveLength(10);
      expect(entries.find(e => e.hash === 'hash-0')).toBeUndefined(); // First one evicted
    });

    it('should return null for non-existent hash', () => {
      const loaded = loadState('non-existent');
      expect(loaded).toBeNull();
    });

    it('should include history and future in saved state', () => {
      const history: HistoryEntry[] = [
        { segments: [createSegment()], manualSpeakers: ['SPEAKER_01'] },
      ];
      const future: HistoryEntry[] = [
        { segments: [createSegment(), createSegment()], manualSpeakers: [] },
      ];

      saveState('hash-1', [], [], history, future);

      const loaded = loadState('hash-1');
      expect(loaded!.history).toHaveLength(1);
      expect(loaded!.future).toHaveLength(1);
    });

    it('should move entry to front on load (LRU)', () => {
      saveState('hash-1', [createSegment()]);
      saveState('hash-2', [createSegment()]);
      saveState('hash-3', [createSegment()]);

      // Access hash-1 (should move to front)
      loadState('hash-1');

      const entries = getCacheEntries();
      expect(entries[0].hash).toBe('hash-1');
    });
  });

  describe('getCacheEntries', () => {
    it('should return empty array for empty storage', () => {
      const entries = getCacheEntries();
      expect(entries).toEqual([]);
    });

    it('should return entries in LRU order', () => {
      saveState('hash-1', [createSegment()], [], [], [], 'first.wav');
      saveState('hash-2', [createSegment(), createSegment()], [], [], [], 'second.wav');

      const entries = getCacheEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].hash).toBe('hash-2'); // Most recent first
      expect(entries[1].hash).toBe('hash-1');
    });

    it('should include all entry info', () => {
      const history: HistoryEntry[] = [{ segments: [], manualSpeakers: [] }];
      saveState('hash-1', [createSegment(), createSegment()], [], history, [], 'test.wav');

      const entries = getCacheEntries();
      expect(entries[0]).toMatchObject({
        hash: 'hash-1',
        fileName: 'test.wav',
        segmentCount: 2,
        historyDepth: 1,
      });
      expect(entries[0].savedAt).toBeGreaterThan(0);
    });
  });

  describe('deleteEntry', () => {
    it('should delete single entry by hash', () => {
      saveState('hash-1', [createSegment()]);
      saveState('hash-2', [createSegment()]);

      deleteEntry('hash-1');

      const entries = getCacheEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].hash).toBe('hash-2');
    });

    it('should handle deleting non-existent entry', () => {
      saveState('hash-1', [createSegment()]);

      // Should not throw
      deleteEntry('non-existent');

      const entries = getCacheEntries();
      expect(entries).toHaveLength(1);
    });
  });

  describe('clearAllStates', () => {
    it('should clear all entries', () => {
      saveState('hash-1', [createSegment()]);
      saveState('hash-2', [createSegment()]);

      clearAllStates();

      const entries = getCacheEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('getLastRemovedEntries', () => {
    it('should return empty array when no entries removed', () => {
      saveState('hash-1', [createSegment()]);
      loadState('hash-1');

      expect(getLastRemovedEntries()).toEqual([]);
    });

    it('should return removed entries after validation', () => {
      // Set up invalid data
      const invalidData = {
        version: 1,
        entries: {
          'valid-hash': {
            segments: [createSegment()],
            savedAt: Date.now(),
          },
          'invalid-hash': {
            segments: [{ invalid: true }], // Invalid segment
            savedAt: Date.now(),
          },
        },
        order: ['valid-hash', 'invalid-hash'],
      };
      localStorage.setItem('diarization-editor-states', JSON.stringify(invalidData));

      // Trigger validation by loading
      loadState('valid-hash');

      const removed = getLastRemovedEntries();
      expect(removed).toContain('invalid-hash');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON gracefully', () => {
      localStorage.setItem('diarization-editor-states', 'not valid json');

      const loaded = loadState('any-hash');
      expect(loaded).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceeded');
      });

      // Should not throw
      expect(() => saveState('hash-1', [createSegment()])).not.toThrow();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
});
