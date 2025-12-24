import { describe, it, expect } from 'vitest';
import {
  getSpeakerColor,
  getSpeakerColorLight,
  getSpeakerGradient,
  getSpeakerShadow,
} from './colors';

describe('colors', () => {
  describe('getSpeakerColor', () => {
    it('returns preset blue for SPEAKER_00', () => {
      expect(getSpeakerColor('SPEAKER_00')).toBe('#3b82f6');
    });

    it('returns preset orange for SPEAKER_01', () => {
      expect(getSpeakerColor('SPEAKER_01')).toBe('#f97316');
    });

    it('returns preset green for SPEAKER_02', () => {
      expect(getSpeakerColor('SPEAKER_02')).toBe('#22c55e');
    });

    it('returns preset colors for SPEAKER_00 through SPEAKER_07', () => {
      const expectedColors = [
        '#3b82f6', '#f97316', '#22c55e', '#a855f7',
        '#ef4444', '#06b6d4', '#eab308', '#ec4899',
      ];
      expectedColors.forEach((color, index) => {
        expect(getSpeakerColor(`SPEAKER_0${index}`)).toBe(color);
      });
    });

    it('returns HSL color for SPEAKER_08 and higher (beyond presets)', () => {
      const color = getSpeakerColor('SPEAKER_08');
      expect(color).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
    });

    it('returns HSL color for SPEAKER_99', () => {
      const color = getSpeakerColor('SPEAKER_99');
      expect(color).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
    });

    it('handles case-insensitive speaker IDs (speaker_00)', () => {
      expect(getSpeakerColor('speaker_00')).toBe('#3b82f6');
    });

    it('handles case-insensitive speaker IDs (Speaker_01)', () => {
      expect(getSpeakerColor('Speaker_01')).toBe('#f97316');
    });

    it('handles case-insensitive speaker IDs (SPEAKER_02)', () => {
      expect(getSpeakerColor('SPEAKER_02')).toBe('#22c55e');
    });

    it('returns consistent colors for same speaker ID', () => {
      const color1 = getSpeakerColor('CustomSpeaker');
      const color2 = getSpeakerColor('CustomSpeaker');
      expect(color1).toBe(color2);
    });

    it('returns different colors for different speaker IDs', () => {
      const color1 = getSpeakerColor('SpeakerA');
      const color2 = getSpeakerColor('SpeakerB');
      expect(color1).not.toBe(color2);
    });

    it('handles non-standard speaker names', () => {
      const color = getSpeakerColor('John_Doe');
      expect(color).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
    });

    it('handles empty string', () => {
      const color = getSpeakerColor('');
      expect(color).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
    });

    it('handles very long speaker IDs', () => {
      const longId = 'SPEAKER_' + 'A'.repeat(1000);
      const color = getSpeakerColor(longId);
      expect(color).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
    });

    it('handles speaker ID with only numbers', () => {
      const color = getSpeakerColor('12345');
      expect(color).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
    });
  });

  describe('getSpeakerColorLight', () => {
    it('returns hex with 33 suffix for SPEAKER_00', () => {
      expect(getSpeakerColorLight('SPEAKER_00')).toBe('#3b82f633');
    });

    it('returns hex with 33 suffix for SPEAKER_01', () => {
      expect(getSpeakerColorLight('SPEAKER_01')).toBe('#f9731633');
    });

    it('returns hex with 33 suffix for preset speakers', () => {
      const result = getSpeakerColorLight('SPEAKER_07');
      expect(result).toBe('#ec489933');
    });

    it('returns HSL with 90% lightness for non-preset speakers', () => {
      const color = getSpeakerColorLight('SPEAKER_08');
      expect(color).toMatch(/^hsl\(\d+, 70%, 90%\)$/);
    });

    it('returns HSL with 90% lightness for custom speaker names', () => {
      const color = getSpeakerColorLight('John');
      expect(color).toMatch(/^hsl\(\d+, 70%, 90%\)$/);
    });

    it('handles case-insensitive speaker IDs', () => {
      expect(getSpeakerColorLight('speaker_00')).toBe('#3b82f633');
    });
  });

  describe('getSpeakerGradient', () => {
    it('returns linear-gradient string', () => {
      const gradient = getSpeakerGradient('SPEAKER_00');
      expect(gradient).toMatch(/^linear-gradient\(180deg,/);
    });

    it('contains three color stops', () => {
      const gradient = getSpeakerGradient('SPEAKER_00');
      expect(gradient).toContain('0%');
      expect(gradient).toContain('50%');
      expect(gradient).toContain('100%');
    });

    it('works with preset hex colors', () => {
      const gradient = getSpeakerGradient('SPEAKER_01');
      expect(gradient).toMatch(/linear-gradient\(180deg, rgb\(\d+, \d+, \d+\) 0%, #f97316 50%, rgb\(\d+, \d+, \d+\) 100%\)/);
    });

    it('works with HSL fallback colors', () => {
      const gradient = getSpeakerGradient('CustomSpeaker');
      expect(gradient).toMatch(/linear-gradient\(180deg, hsl\(\d+, \d+%, \d+%\) 0%, hsl\(\d+, 70%, 55%\) 50%, hsl\(\d+, \d+%, \d+%\) 100%\)/);
    });

    it('returns consistent gradient for same speaker ID', () => {
      const gradient1 = getSpeakerGradient('TestSpeaker');
      const gradient2 = getSpeakerGradient('TestSpeaker');
      expect(gradient1).toBe(gradient2);
    });
  });

  describe('getSpeakerShadow', () => {
    it('returns inset box-shadow string', () => {
      const shadow = getSpeakerShadow('SPEAKER_00');
      expect(shadow).toContain('inset');
    });

    it('contains highlight and shadow colors', () => {
      const shadow = getSpeakerShadow('SPEAKER_00');
      expect(shadow).toMatch(/inset 0 1px 0.*inset 0 -1px 2px/);
    });

    it('works with preset hex colors', () => {
      const shadow = getSpeakerShadow('SPEAKER_01');
      expect(shadow).toMatch(/inset 0 1px 0 rgb\(\d+, \d+, \d+\), inset 0 -1px 2px rgb\(\d+, \d+, \d+\)/);
    });

    it('works with HSL fallback colors', () => {
      const shadow = getSpeakerShadow('CustomSpeaker');
      expect(shadow).toMatch(/inset 0 1px 0 hsl\(\d+, \d+%, \d+%\), inset 0 -1px 2px hsl\(\d+, \d+%, \d+%\)/);
    });

    it('returns consistent shadow for same speaker ID', () => {
      const shadow1 = getSpeakerShadow('TestSpeaker');
      const shadow2 = getSpeakerShadow('TestSpeaker');
      expect(shadow1).toBe(shadow2);
    });
  });
});
