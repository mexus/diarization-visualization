import { describe, it, expect } from 'vitest';
import { parseRTTM, serializeRTTM, extractSpeakers } from './rttmParser';
import type { Segment } from '../types';

describe('parseRTTM', () => {
  it('should parse a valid RTTM line into a segment', () => {
    const rttm = 'SPEAKER audio 1 0.500 2.000 <NA> <NA> SPEAKER_00 <NA> <NA>';
    const result = parseRTTM(rttm);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      speakerId: 'SPEAKER_00',
      startTime: 0.5,
      duration: 2.0,
    });
    expect(result[0].id).toBe('test-uuid-1');
  });

  it('should parse multiple valid RTTM lines', () => {
    const rttm = `SPEAKER audio 1 0.000 1.500 <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 2.000 3.000 <NA> <NA> SPEAKER_01 <NA> <NA>
SPEAKER audio 1 5.500 2.500 <NA> <NA> SPEAKER_00 <NA> <NA>`;

    const result = parseRTTM(rttm);

    expect(result).toHaveLength(3);
    expect(result[0].speakerId).toBe('SPEAKER_00');
    expect(result[1].speakerId).toBe('SPEAKER_01');
    expect(result[2].speakerId).toBe('SPEAKER_00');
    expect(result[0].id).toBe('test-uuid-1');
    expect(result[1].id).toBe('test-uuid-2');
    expect(result[2].id).toBe('test-uuid-3');
  });

  it('should skip empty lines', () => {
    const rttm = `SPEAKER audio 1 0.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>

SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_01 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(2);
  });

  it('should skip lines starting with semicolon (;) as comments', () => {
    const rttm = `; This is a comment
SPEAKER audio 1 0.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>
; Another comment
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_01 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(2);
  });

  it('should skip lines starting with hash (#) as comments', () => {
    const rttm = `# This is a comment
SPEAKER audio 1 0.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>
# Another comment
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_01 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(2);
  });

  it('should skip lines with less than 8 columns', () => {
    const rttm = `SPEAKER audio 1 0.000 1.000 <NA>
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(1);
    expect(result[0].speakerId).toBe('SPEAKER_00');
  });

  it('should skip lines not starting with SPEAKER', () => {
    const rttm = `LEXEME audio 1 0.000 1.000 <NA> <NA> word <NA> <NA>
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>
NONSPEAKER audio 1 4.000 1.000 <NA> <NA> SPEAKER_01 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(1);
    expect(result[0].speakerId).toBe('SPEAKER_00');
  });

  it('should skip lines with NaN startTime', () => {
    const rttm = `SPEAKER audio 1 invalid 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_01 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(1);
    expect(result[0].speakerId).toBe('SPEAKER_01');
  });

  it('should skip lines with NaN duration', () => {
    const rttm = `SPEAKER audio 1 0.000 invalid <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_01 <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(1);
    expect(result[0].speakerId).toBe('SPEAKER_01');
  });

  it('should handle extra whitespace between columns', () => {
    const rttm = 'SPEAKER   audio   1   0.500   2.000   <NA>   <NA>   SPEAKER_00   <NA>   <NA>';
    const result = parseRTTM(rttm);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      speakerId: 'SPEAKER_00',
      startTime: 0.5,
      duration: 2.0,
    });
  });

  it('should handle lines with leading/trailing whitespace', () => {
    const rttm = '   SPEAKER audio 1 0.500 2.000 <NA> <NA> SPEAKER_00 <NA> <NA>   ';
    const result = parseRTTM(rttm);

    expect(result).toHaveLength(1);
    expect(result[0].speakerId).toBe('SPEAKER_00');
  });

  it('should return empty array for empty input', () => {
    expect(parseRTTM('')).toEqual([]);
    expect(parseRTTM('   ')).toEqual([]);
    expect(parseRTTM('\n\n')).toEqual([]);
  });

  it('should generate unique UUIDs for each segment', () => {
    const rttm = `SPEAKER audio 1 0.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 1.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 2.000 1.000 <NA> <NA> SPEAKER_00 <NA> <NA>`;

    const result = parseRTTM(rttm);
    const ids = result.map(s => s.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });

  it('should handle non-standard speaker names', () => {
    const rttm = `SPEAKER audio 1 0.000 1.000 <NA> <NA> John_Doe <NA> <NA>
SPEAKER audio 1 1.000 1.000 <NA> <NA> speaker-with-dashes <NA> <NA>`;

    const result = parseRTTM(rttm);
    expect(result).toHaveLength(2);
    expect(result[0].speakerId).toBe('John_Doe');
    expect(result[1].speakerId).toBe('speaker-with-dashes');
  });

  it('should parse decimal times correctly', () => {
    const rttm = 'SPEAKER audio 1 123.456 789.012 <NA> <NA> SPEAKER_00 <NA> <NA>';
    const result = parseRTTM(rttm);

    expect(result[0].startTime).toBe(123.456);
    expect(result[0].duration).toBe(789.012);
  });
});

describe('serializeRTTM', () => {
  it('should serialize a single segment', () => {
    const segments: Segment[] = [{
      id: 'test-id',
      speakerId: 'SPEAKER_00',
      startTime: 0.5,
      duration: 2.0,
    }];

    const result = serializeRTTM(segments);
    expect(result).toBe('SPEAKER audio 1 0.500 2.000 <NA> <NA> SPEAKER_00 <NA> <NA>');
  });

  it('should serialize multiple segments sorted by startTime', () => {
    const segments: Segment[] = [
      { id: '3', speakerId: 'SPEAKER_00', startTime: 5.0, duration: 1.0 },
      { id: '1', speakerId: 'SPEAKER_01', startTime: 0.0, duration: 2.0 },
      { id: '2', speakerId: 'SPEAKER_00', startTime: 2.5, duration: 1.5 },
    ];

    const result = serializeRTTM(segments);
    const lines = result.split('\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('0.000');
    expect(lines[1]).toContain('2.500');
    expect(lines[2]).toContain('5.000');
  });

  it('should format times with exactly 3 decimal places', () => {
    const segments: Segment[] = [
      { id: '1', speakerId: 'SPEAKER_00', startTime: 1, duration: 2 },
      { id: '2', speakerId: 'SPEAKER_00', startTime: 1.5, duration: 0.5 },
      { id: '3', speakerId: 'SPEAKER_00', startTime: 1.123456, duration: 2.789012 },
    ];

    const result = serializeRTTM(segments);
    const lines = result.split('\n');

    expect(lines[0]).toContain('1.000 2.000');
    expect(lines[1]).toContain('1.123 2.789'); // Rounded
    expect(lines[2]).toContain('1.500 0.500');
  });

  it('should use custom filename', () => {
    const segments: Segment[] = [{
      id: 'test-id',
      speakerId: 'SPEAKER_00',
      startTime: 0,
      duration: 1,
    }];

    const result = serializeRTTM(segments, 'my_recording');
    expect(result).toContain('SPEAKER my_recording 1');
  });

  it('should handle empty segments array', () => {
    expect(serializeRTTM([])).toBe('');
  });

  it('should not mutate the original segments array', () => {
    const segments: Segment[] = [
      { id: '2', speakerId: 'SPEAKER_00', startTime: 2.0, duration: 1.0 },
      { id: '1', speakerId: 'SPEAKER_00', startTime: 0.0, duration: 1.0 },
    ];

    const originalOrder = [...segments];
    serializeRTTM(segments);

    expect(segments).toEqual(originalOrder);
  });
});

describe('extractSpeakers', () => {
  it('should extract unique speakers sorted alphabetically', () => {
    const segments: Segment[] = [
      { id: '1', speakerId: 'SPEAKER_02', startTime: 0, duration: 1 },
      { id: '2', speakerId: 'SPEAKER_00', startTime: 1, duration: 1 },
      { id: '3', speakerId: 'SPEAKER_01', startTime: 2, duration: 1 },
    ];

    const result = extractSpeakers(segments);
    expect(result).toEqual(['SPEAKER_00', 'SPEAKER_01', 'SPEAKER_02']);
  });

  it('should handle duplicate speaker IDs', () => {
    const segments: Segment[] = [
      { id: '1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 },
      { id: '2', speakerId: 'SPEAKER_00', startTime: 1, duration: 1 },
      { id: '3', speakerId: 'SPEAKER_01', startTime: 2, duration: 1 },
      { id: '4', speakerId: 'SPEAKER_01', startTime: 3, duration: 1 },
    ];

    const result = extractSpeakers(segments);
    expect(result).toEqual(['SPEAKER_00', 'SPEAKER_01']);
  });

  it('should return empty array for empty segments', () => {
    expect(extractSpeakers([])).toEqual([]);
  });

  it('should handle single speaker', () => {
    const segments: Segment[] = [
      { id: '1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 },
    ];

    const result = extractSpeakers(segments);
    expect(result).toEqual(['SPEAKER_00']);
  });

  it('should handle non-standard speaker names', () => {
    const segments: Segment[] = [
      { id: '1', speakerId: 'Alice', startTime: 0, duration: 1 },
      { id: '2', speakerId: 'Bob', startTime: 1, duration: 1 },
      { id: '3', speakerId: 'Charlie', startTime: 2, duration: 1 },
    ];

    const result = extractSpeakers(segments);
    expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
  });
});

describe('parseRTTM and serializeRTTM roundtrip', () => {
  it('should preserve data through parse -> serialize -> parse', () => {
    const originalRTTM = `SPEAKER audio 1 0.000 1.500 <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 2.000 3.000 <NA> <NA> SPEAKER_01 <NA> <NA>
SPEAKER audio 1 5.500 2.500 <NA> <NA> SPEAKER_02 <NA> <NA>`;

    const parsed = parseRTTM(originalRTTM);
    const serialized = serializeRTTM(parsed);
    const reparsed = parseRTTM(serialized);

    expect(reparsed).toHaveLength(parsed.length);
    for (let i = 0; i < parsed.length; i++) {
      expect(reparsed[i].speakerId).toBe(parsed[i].speakerId);
      expect(reparsed[i].startTime).toBe(parsed[i].startTime);
      expect(reparsed[i].duration).toBe(parsed[i].duration);
    }
  });
});
