import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editorStore';
import type { Segment } from '../types';


describe('editorStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useEditorStore.getState().reset();
  });

  describe('wouldOverlap (via createSegment rejection)', () => {
    it('should allow segment when no other segments in lane', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1);
    });

    it('should allow segments that do not overlap (gap between)', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1); // 0-1
      store.createSegment('SPEAKER_00', 2, 1); // 2-3 (gap from 1-2)

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(2);
    });

    it('should reject segments that overlap (partial)', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 2); // 0-2
      store.createSegment('SPEAKER_00', 1, 2); // 1-3 (overlaps at 1-2)

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1); // Second was rejected
    });

    it('should reject when one segment contains another', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 5); // 0-5
      store.createSegment('SPEAKER_00', 1, 2); // 1-3 (contained within 0-5)

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1);
    });

    it('should allow adjacent segments (zero-gap)', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1); // 0-1
      store.createSegment('SPEAKER_00', 1, 1); // 1-2 (adjacent, no gap)

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(2);
    });

    it('should only check segments in same speaker lane', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 2); // SPEAKER_00: 0-2
      store.createSegment('SPEAKER_01', 0, 2); // SPEAKER_01: 0-2 (OK - different lane)

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(2);
    });
  });

  describe('getNextSpeakerId (via addSpeaker)', () => {
    it('should return SPEAKER_00 for empty speakers list', () => {
      const store = useEditorStore.getState();
      store.addSpeaker();

      const speakers = useEditorStore.getState().speakers;
      expect(speakers).toContain('SPEAKER_00');
    });

    it('should return SPEAKER_01 when SPEAKER_00 exists', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.addSpeaker();

      const speakers = useEditorStore.getState().speakers;
      expect(speakers).toContain('SPEAKER_00');
      expect(speakers).toContain('SPEAKER_01');
    });

    it('should find first gap in sequence', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_02', 1, 1); // Skip SPEAKER_01
      store.addSpeaker();

      const speakers = useEditorStore.getState().speakers;
      expect(speakers).toContain('SPEAKER_01'); // Should fill the gap
    });

    it('should handle non-standard speaker names when finding next ID', () => {
      const store = useEditorStore.getState();
      store.createSegment('John', 0, 1);
      store.createSegment('Alice', 1, 1);
      store.addSpeaker();

      const manualSpeakers = useEditorStore.getState().manualSpeakers;
      expect(manualSpeakers).toContain('SPEAKER_00');
    });
  });

  describe('updateSegment', () => {
    it('should update segment startTime', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      const segmentId = useEditorStore.getState().segments[0].id;

      store.updateSegment(segmentId, { startTime: 2 });

      const updated = useEditorStore.getState().segments[0];
      expect(updated.startTime).toBe(2);
    });

    it('should update segment duration', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      const segmentId = useEditorStore.getState().segments[0].id;

      store.updateSegment(segmentId, { duration: 5 });

      const updated = useEditorStore.getState().segments[0];
      expect(updated.duration).toBe(5);
    });

    it('should update segment speakerId (relabel)', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      const segmentId = useEditorStore.getState().segments[0].id;

      store.updateSegment(segmentId, { speakerId: 'SPEAKER_01' });

      const updated = useEditorStore.getState().segments[0];
      expect(updated.speakerId).toBe('SPEAKER_01');
    });

    it('should enforce minimum duration (0.1s)', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      const segmentId = useEditorStore.getState().segments[0].id;

      store.updateSegment(segmentId, { duration: 0.01 });

      const updated = useEditorStore.getState().segments[0];
      expect(updated.duration).toBe(0.1);
    });

    it('should enforce non-negative startTime', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 1, 1);
      const segmentId = useEditorStore.getState().segments[0].id;

      store.updateSegment(segmentId, { startTime: -5 });

      const updated = useEditorStore.getState().segments[0];
      expect(updated.startTime).toBe(0);
    });

    it('should clamp resize-left to adjacent segment boundary', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 2); // 0-2
      store.createSegment('SPEAKER_00', 3, 2); // 3-5

      const segments = useEditorStore.getState().segments;
      const secondId = segments.find(s => s.startTime === 3)!.id;

      // Try to resize second segment's start to 1 (should clamp to 2)
      store.updateSegment(secondId, { startTime: 1 });

      const updated = useEditorStore.getState().segments.find(s => s.id === secondId);
      expect(updated!.startTime).toBe(2); // Clamped to end of first segment
    });

    it('should clamp resize-right to adjacent segment boundary', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 2); // 0-2
      store.createSegment('SPEAKER_00', 3, 2); // 3-5

      const segments = useEditorStore.getState().segments;
      const firstId = segments.find(s => s.startTime === 0)!.id;

      // Try to extend first segment to duration 5 (end at 5, should clamp to 3)
      store.updateSegment(firstId, { duration: 5 });

      const updated = useEditorStore.getState().segments.find(s => s.id === firstId);
      expect(updated!.duration).toBe(3); // Clamped to start of second segment
    });

    it('should reject relabel if would overlap', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 2); // 0-2
      store.createSegment('SPEAKER_01', 1, 2); // 1-3 (different speaker)

      const segments = useEditorStore.getState().segments;
      const secondId = segments.find(s => s.speakerId === 'SPEAKER_01')!.id;

      // Try to relabel second segment to SPEAKER_00 (would overlap)
      store.updateSegment(secondId, { speakerId: 'SPEAKER_00' });

      // Should not change
      const updated = useEditorStore.getState().segments.find(s => s.id === secondId);
      expect(updated!.speakerId).toBe('SPEAKER_01');
    });

    it('should push to history before update', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      const segmentId = useEditorStore.getState().segments[0].id;

      const historyBefore = useEditorStore.getState().history.length;
      store.updateSegment(segmentId, { duration: 2 });
      const historyAfter = useEditorStore.getState().history.length;

      expect(historyAfter).toBe(historyBefore + 1);
    });

    it('should return unchanged state if segment not found', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      const stateBefore = useEditorStore.getState().segments;
      store.updateSegment('non-existent-id', { duration: 5 });
      const stateAfter = useEditorStore.getState().segments;

      expect(stateAfter).toBe(stateBefore);
    });
  });

  describe('mergeSpeakers', () => {
    it('should merge speakers with non-overlapping segments', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1); // 0-1
      store.createSegment('SPEAKER_01', 2, 1); // 2-3

      store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(2);
      expect(segments.every(s => s.speakerId === 'SPEAKER_00')).toBe(true);
    });

    it('should merge overlapping segments into single segment', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 3); // 0-3
      store.createSegment('SPEAKER_01', 2, 3); // 2-5 (overlaps 2-3)

      store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1);
      expect(segments[0].startTime).toBe(0);
      expect(segments[0].duration).toBe(5); // Merged: 0-5
      expect(segments[0].speakerId).toBe('SPEAKER_00');
    });

    it('should remove source speaker after merge', () => {
      const store = useEditorStore.getState();
      store.addSpeaker(); // SPEAKER_00
      store.addSpeaker(); // SPEAKER_01

      store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      const speakers = useEditorStore.getState().speakers;
      expect(speakers).toContain('SPEAKER_00');
      expect(speakers).not.toContain('SPEAKER_01');
    });

    it('should return false when sourceId === targetId', () => {
      const store = useEditorStore.getState();
      store.addSpeaker();

      const result = store.mergeSpeakers('SPEAKER_00', 'SPEAKER_00');
      expect(result).toBe(false);
    });

    it('should handle empty source speaker (just remove)', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.addSpeaker(); // SPEAKER_01 with no segments

      const result = store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      expect(result).toBe(true);
      const speakers = useEditorStore.getState().speakers;
      expect(speakers).not.toContain('SPEAKER_01');
    });

    it('should clear selection after merge', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_01', 2, 1);

      const segmentId = useEditorStore.getState().segments[1].id;
      store.selectSegment(segmentId);

      store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      expect(useEditorStore.getState().selectedSegmentId).toBeNull();
    });

    it('should push to history before merge', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_01', 2, 1);
      store.clearHistory();

      store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      expect(useEditorStore.getState().history.length).toBeGreaterThan(0);
    });

    it('should merge adjacent segments', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1); // 0-1
      store.createSegment('SPEAKER_01', 1, 1); // 1-2 (adjacent)

      store.mergeSpeakers('SPEAKER_01', 'SPEAKER_00');

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1);
      expect(segments[0].startTime).toBe(0);
      expect(segments[0].duration).toBe(2); // Merged: 0-2
    });
  });

  describe('undo/redo', () => {
    it('should undo and restore previous segments', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      expect(useEditorStore.getState().segments).toHaveLength(2);

      store.undo();

      expect(useEditorStore.getState().segments).toHaveLength(1);
    });

    it('should move current state to future on undo', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      store.undo();

      expect(useEditorStore.getState().future).toHaveLength(1);
    });

    it('should redo and restore next state', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      store.undo();
      expect(useEditorStore.getState().segments).toHaveLength(1);

      store.redo();
      expect(useEditorStore.getState().segments).toHaveLength(2);
    });

    it('should move current state to history on redo', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      store.undo();
      const historyBefore = useEditorStore.getState().history.length;

      store.redo();

      expect(useEditorStore.getState().history.length).toBe(historyBefore + 1);
    });

    it('should do nothing if history is empty on undo', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.clearHistory();

      const segmentsBefore = useEditorStore.getState().segments;
      store.undo();

      expect(useEditorStore.getState().segments).toBe(segmentsBefore);
    });

    it('should do nothing if future is empty on redo', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      const segmentsBefore = useEditorStore.getState().segments;
      store.redo();

      expect(useEditorStore.getState().segments).toBe(segmentsBefore);
    });

    it('should clear selection if segment no longer exists after undo', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      const segmentId = useEditorStore.getState().segments[0].id;
      store.selectSegment(segmentId);

      store.undo(); // Undo the createSegment

      expect(useEditorStore.getState().selectedSegmentId).toBeNull();
    });

    it('should respect MAX_HISTORY limit (50)', () => {
      const store = useEditorStore.getState();

      // Create 60 segments to exceed MAX_HISTORY
      for (let i = 0; i < 60; i++) {
        store.createSegment('SPEAKER_00', i * 2, 1);
      }

      const historyLength = useEditorStore.getState().history.length;
      expect(historyLength).toBeLessThanOrEqual(50);
    });

    it('should clear redo stack on new action', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      store.undo(); // Go back
      expect(useEditorStore.getState().future.length).toBeGreaterThan(0);

      store.createSegment('SPEAKER_00', 4, 1); // New action

      expect(useEditorStore.getState().future).toHaveLength(0);
    });
  });

  describe('createSegment', () => {
    it('should create segment with valid params', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 5, 2);

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1);
      expect(segments[0]).toMatchObject({
        speakerId: 'SPEAKER_00',
        startTime: 5,
        duration: 2,
      });
    });

    it('should enforce minimum duration', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 0.01);

      const segments = useEditorStore.getState().segments;
      expect(segments[0].duration).toBe(0.1);
    });

    it('should enforce non-negative startTime', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', -5, 1);

      const segments = useEditorStore.getState().segments;
      expect(segments[0].startTime).toBe(0);
    });

    it('should reject if would overlap', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 2);
      store.createSegment('SPEAKER_00', 1, 1); // Would overlap

      const segments = useEditorStore.getState().segments;
      expect(segments).toHaveLength(1);
    });

    it('should select newly created segment', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      const segmentId = useEditorStore.getState().segments[0].id;
      expect(useEditorStore.getState().selectedSegmentId).toBe(segmentId);
    });

    it('should remove speaker from manualSpeakers when it gets segments', () => {
      const store = useEditorStore.getState();
      store.addSpeaker(); // Creates SPEAKER_00 in manualSpeakers

      expect(useEditorStore.getState().manualSpeakers).toContain('SPEAKER_00');

      store.createSegment('SPEAKER_00', 0, 1);

      expect(useEditorStore.getState().manualSpeakers).not.toContain('SPEAKER_00');
      expect(useEditorStore.getState().speakers).toContain('SPEAKER_00'); // Still in speakers
    });

    it('should push to history', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      expect(useEditorStore.getState().history.length).toBeGreaterThan(0);
    });
  });

  describe('deleteSegment', () => {
    it('should delete segment by ID', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      const segmentId = useEditorStore.getState().segments[0].id;
      store.deleteSegment(segmentId);

      expect(useEditorStore.getState().segments).toHaveLength(1);
    });

    it('should clear selection if deleted segment was selected', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      const segmentId = useEditorStore.getState().segments[0].id;
      store.selectSegment(segmentId);
      store.deleteSegment(segmentId);

      expect(useEditorStore.getState().selectedSegmentId).toBeNull();
    });

    it('should push to history', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.clearHistory();

      const segmentId = useEditorStore.getState().segments[0].id;
      store.deleteSegment(segmentId);

      expect(useEditorStore.getState().history.length).toBeGreaterThan(0);
    });
  });

  describe('addSpeaker and removeSpeaker', () => {
    it('should add new speaker to manualSpeakers', () => {
      const store = useEditorStore.getState();
      store.addSpeaker();

      expect(useEditorStore.getState().manualSpeakers).toContain('SPEAKER_00');
    });

    it('should remove speaker from manualSpeakers', () => {
      const store = useEditorStore.getState();
      store.addSpeaker();
      store.removeSpeaker('SPEAKER_00');

      expect(useEditorStore.getState().manualSpeakers).not.toContain('SPEAKER_00');
    });

    it('should not remove speaker that has segments', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      store.removeSpeaker('SPEAKER_00');

      expect(useEditorStore.getState().speakers).toContain('SPEAKER_00');
    });
  });

  describe('renameSpeaker', () => {
    it('should rename speaker in all segments', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_00', 2, 1);

      store.renameSpeaker('SPEAKER_00', 'NewName');

      const segments = useEditorStore.getState().segments;
      expect(segments.every(s => s.speakerId === 'NewName')).toBe(true);
    });

    it('should not rename if newId already exists', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);
      store.createSegment('SPEAKER_01', 2, 1);

      store.renameSpeaker('SPEAKER_00', 'SPEAKER_01');

      // Should not change
      expect(useEditorStore.getState().segments[0].speakerId).toBe('SPEAKER_00');
    });

    it('should trim whitespace from new name', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      store.renameSpeaker('SPEAKER_00', '  NewName  ');

      expect(useEditorStore.getState().segments[0].speakerId).toBe('NewName');
    });

    it('should not rename if new name is empty', () => {
      const store = useEditorStore.getState();
      store.createSegment('SPEAKER_00', 0, 1);

      store.renameSpeaker('SPEAKER_00', '   ');

      expect(useEditorStore.getState().segments[0].speakerId).toBe('SPEAKER_00');
    });
  });

  describe('setLabelWidth', () => {
    it('should clamp width to minimum 80', () => {
      const store = useEditorStore.getState();
      store.setLabelWidth(50);

      expect(useEditorStore.getState().labelWidth).toBe(80);
    });

    it('should clamp width to maximum 300', () => {
      const store = useEditorStore.getState();
      store.setLabelWidth(500);

      expect(useEditorStore.getState().labelWidth).toBe(300);
    });

    it('should accept valid width', () => {
      const store = useEditorStore.getState();
      store.setLabelWidth(150);

      expect(useEditorStore.getState().labelWidth).toBe(150);
    });
  });

  describe('dragState management', () => {
    it('should start drag', () => {
      const store = useEditorStore.getState();
      const segment: Segment = { id: 'test', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 };

      store.startDrag({
        type: 'resize-left',
        segmentId: 'test',
        originalSegment: segment,
      });

      const dragState = useEditorStore.getState().dragState;
      expect(dragState).not.toBeNull();
      expect(dragState!.type).toBe('resize-left');
    });

    it('should update drag', () => {
      const store = useEditorStore.getState();
      const segment: Segment = { id: 'test', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 };

      store.startDrag({
        type: 'resize-left',
        segmentId: 'test',
        originalSegment: segment,
      });

      store.updateDrag({ currentTime: 0.5 });

      expect(useEditorStore.getState().dragState!.currentTime).toBe(0.5);
    });

    it('should end drag', () => {
      const store = useEditorStore.getState();
      const segment: Segment = { id: 'test', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 };

      store.startDrag({
        type: 'resize-left',
        segmentId: 'test',
        originalSegment: segment,
      });

      store.endDrag();

      expect(useEditorStore.getState().dragState).toBeNull();
    });
  });

  describe('restoreWithHistory', () => {
    it('should restore segments and history', () => {
      const store = useEditorStore.getState();
      const segments: Segment[] = [
        { id: 'test-1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 },
      ];
      const history: HistoryEntry[] = [
        { segments: [], manualSpeakers: [] },
      ];

      store.restoreWithHistory(segments, ['SPEAKER_01'], history, []);

      const state = useEditorStore.getState();
      expect(state.segments).toEqual(segments);
      expect(state.manualSpeakers).toContain('SPEAKER_01');
      expect(state.history).toHaveLength(1);
    });
  });
});

// Import HistoryEntry type
import type { HistoryEntry } from '../types';
