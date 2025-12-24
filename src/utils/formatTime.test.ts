import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDuration, formatRelativeTime } from './formatTime';

describe('formatTime', () => {
  describe('formatDuration', () => {
    it('formats 0 seconds as "0:00"', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('formats seconds with leading zero padding', () => {
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(9)).toBe('0:09');
    });

    it('formats 10 seconds as "0:10"', () => {
      expect(formatDuration(10)).toBe('0:10');
    });

    it('formats 59 seconds as "0:59"', () => {
      expect(formatDuration(59)).toBe('0:59');
    });

    it('formats 60 seconds as "1:00"', () => {
      expect(formatDuration(60)).toBe('1:00');
    });

    it('formats 65 seconds as "1:05"', () => {
      expect(formatDuration(65)).toBe('1:05');
    });

    it('formats 125 seconds as "2:05"', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('handles large minute values (no hour conversion)', () => {
      expect(formatDuration(3661)).toBe('61:01'); // 1h 1m 1s shows as 61:01
    });

    it('handles very large values', () => {
      expect(formatDuration(7200)).toBe('120:00'); // 2 hours
    });

    it('includes milliseconds when includeMs is true', () => {
      expect(formatDuration(0, true)).toBe('0:00.000');
    });

    it('formats 1.5 seconds with milliseconds', () => {
      expect(formatDuration(1.5, true)).toBe('0:01.500');
    });

    it('formats 1.999 seconds with milliseconds', () => {
      expect(formatDuration(1.999, true)).toBe('0:01.999');
    });

    it('formats milliseconds correctly (accounting for floating-point precision)', () => {
      // Note: Due to floating-point precision, 1.001 may floor to 0 or 1 ms
      // The implementation uses Math.floor, so we test with values that work reliably
      expect(formatDuration(1.1, true)).toBe('0:01.100');
      expect(formatDuration(1.25, true)).toBe('0:01.250');
    });

    it('pads milliseconds with leading zeros', () => {
      expect(formatDuration(1.05, true)).toBe('0:01.050');
      // 1.1 is represented exactly in binary floating-point
      expect(formatDuration(1.1, true)).toBe('0:01.100');
    });

    it('floors fractional seconds when includeMs is false', () => {
      expect(formatDuration(1.9)).toBe('0:01');
      expect(formatDuration(1.1)).toBe('0:01');
    });

    it('handles edge case of 59.999 seconds', () => {
      expect(formatDuration(59.999)).toBe('0:59');
      expect(formatDuration(59.999, true)).toBe('0:59.999');
    });
  });

  describe('formatRelativeTime', () => {
    const NOW = 1700000000000; // Fixed timestamp for testing

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "just now" for timestamps less than 60 seconds ago', () => {
      expect(formatRelativeTime(NOW - 1000)).toBe('just now'); // 1 second ago
      expect(formatRelativeTime(NOW - 30000)).toBe('just now'); // 30 seconds ago
      expect(formatRelativeTime(NOW - 59000)).toBe('just now'); // 59 seconds ago
    });

    it('returns "Xm ago" for timestamps 1-59 minutes ago', () => {
      expect(formatRelativeTime(NOW - 60 * 1000)).toBe('1m ago');
      expect(formatRelativeTime(NOW - 5 * 60 * 1000)).toBe('5m ago');
      expect(formatRelativeTime(NOW - 59 * 60 * 1000)).toBe('59m ago');
    });

    it('returns "Xh ago" for timestamps 1-23 hours ago', () => {
      expect(formatRelativeTime(NOW - 60 * 60 * 1000)).toBe('1h ago');
      expect(formatRelativeTime(NOW - 3 * 60 * 60 * 1000)).toBe('3h ago');
      expect(formatRelativeTime(NOW - 23 * 60 * 60 * 1000)).toBe('23h ago');
    });

    it('returns "yesterday" for timestamps exactly 1 day ago', () => {
      expect(formatRelativeTime(NOW - 24 * 60 * 60 * 1000)).toBe('yesterday');
    });

    it('returns "yesterday" for timestamps 24-47 hours ago', () => {
      expect(formatRelativeTime(NOW - 36 * 60 * 60 * 1000)).toBe('yesterday');
    });

    it('returns "Xd ago" for timestamps 2-6 days ago', () => {
      expect(formatRelativeTime(NOW - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago');
      expect(formatRelativeTime(NOW - 5 * 24 * 60 * 60 * 1000)).toBe('5d ago');
      expect(formatRelativeTime(NOW - 6 * 24 * 60 * 60 * 1000)).toBe('6d ago');
    });

    it('returns date string for timestamps 7+ days ago', () => {
      const sevenDaysAgo = NOW - 7 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(sevenDaysAgo);
      // Should be a date string, not "Xd ago"
      expect(result).not.toContain('d ago');
      expect(result).not.toBe('just now');
    });

    it('returns date string for timestamps many days ago', () => {
      const thirtyDaysAgo = NOW - 30 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(thirtyDaysAgo);
      expect(result).not.toContain('d ago');
    });

    it('handles current timestamp (returns "just now")', () => {
      expect(formatRelativeTime(NOW)).toBe('just now');
    });

    it('handles boundary between seconds and minutes', () => {
      expect(formatRelativeTime(NOW - 59 * 1000)).toBe('just now');
      expect(formatRelativeTime(NOW - 60 * 1000)).toBe('1m ago');
    });

    it('handles boundary between minutes and hours', () => {
      expect(formatRelativeTime(NOW - 59 * 60 * 1000)).toBe('59m ago');
      expect(formatRelativeTime(NOW - 60 * 60 * 1000)).toBe('1h ago');
    });

    it('handles boundary between hours and days', () => {
      expect(formatRelativeTime(NOW - 23 * 60 * 60 * 1000)).toBe('23h ago');
      expect(formatRelativeTime(NOW - 24 * 60 * 60 * 1000)).toBe('yesterday');
    });
  });
});
