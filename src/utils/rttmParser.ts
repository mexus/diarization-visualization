import type { Segment } from '../types';

/**
 * Parse RTTM format text into Segment array.
 * RTTM format: SPEAKER <file> <channel> <start> <duration> <NA> <NA> <speaker_id> <NA> <NA>
 */
export function parseRTTM(text: string): Segment[] {
  const lines = text.split('\n');
  const segments: Segment[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }

    const parts = trimmed.split(/\s+/);

    // RTTM lines should have at least 8 columns
    if (parts.length < 8 || parts[0] !== 'SPEAKER') {
      continue;
    }

    const startTime = parseFloat(parts[3]);
    const duration = parseFloat(parts[4]);
    const speakerId = parts[7];

    if (isNaN(startTime) || isNaN(duration)) {
      continue;
    }

    segments.push({
      id: crypto.randomUUID(),
      speakerId,
      startTime,
      duration,
    });
  }

  return segments;
}

/**
 * Serialize Segment array back to RTTM format.
 */
export function serializeRTTM(segments: Segment[], filename = 'audio'): string {
  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);

  return sorted
    .map(
      (seg) =>
        `SPEAKER ${filename} 1 ${seg.startTime.toFixed(3)} ${seg.duration.toFixed(3)} <NA> <NA> ${seg.speakerId} <NA> <NA>`
    )
    .join('\n');
}

/**
 * Extract unique speaker IDs from segments.
 */
export function extractSpeakers(segments: Segment[]): string[] {
  const speakerSet = new Set(segments.map((s) => s.speakerId));
  return Array.from(speakerSet).sort();
}
