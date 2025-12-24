import { describe, it, expect } from 'vitest';
import { getRTTMCoverage, checkRTTMMismatch } from './rttmMismatch';
import type { Segment } from '../types';

function createSegment(startTime: number, duration: number, speakerId = 'SPEAKER_00'): Segment {
  return {
    id: crypto.randomUUID(),
    speakerId,
    startTime,
    duration,
  };
}

describe('getRTTMCoverage', () => {
  it('returns zeros for empty segments', () => {
    const coverage = getRTTMCoverage([]);
    expect(coverage).toEqual({
      minStartTime: 0,
      maxEndTime: 0,
      segmentCount: 0,
    });
  });

  it('returns correct coverage for single segment', () => {
    const segments = [createSegment(5, 10)];
    const coverage = getRTTMCoverage(segments);
    expect(coverage).toEqual({
      minStartTime: 5,
      maxEndTime: 15,
      segmentCount: 1,
    });
  });

  it('returns correct coverage for multiple segments', () => {
    const segments = [
      createSegment(5, 10),   // 5-15
      createSegment(2, 3),    // 2-5
      createSegment(20, 5),   // 20-25
    ];
    const coverage = getRTTMCoverage(segments);
    expect(coverage).toEqual({
      minStartTime: 2,
      maxEndTime: 25,
      segmentCount: 3,
    });
  });

  it('handles overlapping segments', () => {
    const segments = [
      createSegment(0, 10),   // 0-10
      createSegment(5, 10),   // 5-15
      createSegment(8, 10),   // 8-18
    ];
    const coverage = getRTTMCoverage(segments);
    expect(coverage).toEqual({
      minStartTime: 0,
      maxEndTime: 18,
      segmentCount: 3,
    });
  });

  it('handles segment starting at 0', () => {
    const segments = [createSegment(0, 5)];
    const coverage = getRTTMCoverage(segments);
    expect(coverage).toEqual({
      minStartTime: 0,
      maxEndTime: 5,
      segmentCount: 1,
    });
  });
});

describe('checkRTTMMismatch', () => {
  describe('returns null (no mismatch)', () => {
    it('when segments fit within audio duration', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);
      expect(result).toBeNull();
    });

    it('when audio is slightly longer (within threshold)', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100, segmentCount: 10 };
      // 4 seconds gap, which is less than 5 seconds threshold
      const result = checkRTTMMismatch(coverage, 104);
      expect(result).toBeNull();
    });

    it('when audio is slightly longer by percentage (within 10%)', () => {
      const coverage = { minStartTime: 0, maxEndTime: 50, segmentCount: 10 };
      // 4 seconds gap = 8% of 50 seconds, which is less than 10% threshold
      const result = checkRTTMMismatch(coverage, 54);
      expect(result).toBeNull();
    });

    it('when there are no segments', () => {
      const coverage = { minStartTime: 0, maxEndTime: 0, segmentCount: 0 };
      const result = checkRTTMMismatch(coverage, 100);
      expect(result).toBeNull();
    });

    it('when audio duration is 0', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 0);
      expect(result).toBeNull();
    });

    it('when audio duration is negative', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, -1);
      expect(result).toBeNull();
    });
  });

  describe('detects segments-beyond mismatch', () => {
    it('when segments extend beyond audio', () => {
      const coverage = { minStartTime: 0, maxEndTime: 120, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('segments-beyond');
      expect(result!.audioDuration).toBe(100);
      expect(result!.rttmMaxEndTime).toBe(120);
      expect(result!.message).toContain('20 seconds');
    });

    it('when segments extend by small amount', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100.5, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('segments-beyond');
      expect(result!.message).toContain('0.5 second');
    });
  });

  describe('detects audio-longer mismatch', () => {
    it('when audio is more than 5 seconds longer', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 110);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('audio-longer');
      expect(result!.audioDuration).toBe(110);
      expect(result!.rttmMaxEndTime).toBe(100);
      expect(result!.message).toContain('10 seconds longer');
    });

    it('when audio is more than 10% longer (short audio)', () => {
      const coverage = { minStartTime: 0, maxEndTime: 30, segmentCount: 10 };
      // 4 seconds gap = 13.3% of 30 seconds, which is more than 10% threshold
      // (but less than 5 seconds absolute threshold)
      const result = checkRTTMMismatch(coverage, 34);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('audio-longer');
      expect(result!.message).toContain('4 seconds longer');
    });

    it('when audio is significantly longer (minutes)', () => {
      const coverage = { minStartTime: 0, maxEndTime: 100, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 200);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('audio-longer');
      expect(result!.message).toContain('1 minute');
      expect(result!.message).toContain('40 seconds');
    });
  });

  describe('message formatting', () => {
    it('formats singular second correctly', () => {
      const coverage = { minStartTime: 0, maxEndTime: 101, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);

      expect(result!.message).toContain('1 second');
      expect(result!.message).not.toContain('1 seconds');
    });

    it('formats plural seconds correctly', () => {
      const coverage = { minStartTime: 0, maxEndTime: 102, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);

      expect(result!.message).toContain('2 seconds');
    });

    it('formats minutes correctly', () => {
      const coverage = { minStartTime: 0, maxEndTime: 160, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);

      expect(result!.message).toContain('1 minute');
    });

    it('formats plural minutes correctly', () => {
      const coverage = { minStartTime: 0, maxEndTime: 220, segmentCount: 10 };
      const result = checkRTTMMismatch(coverage, 100);

      expect(result!.message).toContain('2 minutes');
    });
  });
});
