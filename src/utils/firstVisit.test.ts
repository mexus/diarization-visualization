import { describe, it, expect, beforeEach } from 'vitest';
import { isFirstVisit, markVisited } from './firstVisit';

describe('firstVisit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isFirstVisit', () => {
    it('returns true on first visit (no localStorage value)', () => {
      expect(isFirstVisit()).toBe(true);
    });

    it('returns false after markVisited is called', () => {
      markVisited();
      expect(isFirstVisit()).toBe(false);
    });

    it('returns true when localStorage value is not "true"', () => {
      localStorage.setItem('diarization-editor-visited', 'false');
      expect(isFirstVisit()).toBe(true);
    });

    it('returns true when localStorage value is empty string', () => {
      localStorage.setItem('diarization-editor-visited', '');
      expect(isFirstVisit()).toBe(true);
    });

    it('returns false when localStorage value is exactly "true"', () => {
      localStorage.setItem('diarization-editor-visited', 'true');
      expect(isFirstVisit()).toBe(false);
    });
  });

  describe('markVisited', () => {
    it('sets localStorage key to "true"', () => {
      markVisited();
      expect(localStorage.getItem('diarization-editor-visited')).toBe('true');
    });

    it('is idempotent - calling multiple times has same result', () => {
      markVisited();
      markVisited();
      markVisited();
      expect(localStorage.getItem('diarization-editor-visited')).toBe('true');
    });
  });
});
