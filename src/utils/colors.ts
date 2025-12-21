// Predefined colors for common speaker indices (matching design mockup style)
const PRESET_COLORS = [
  '#3b82f6', // blue (Speaker 1)
  '#f97316', // orange (Speaker 2)
  '#22c55e', // green (Speaker 3)
  '#a855f7', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ec4899', // pink
];

/**
 * Hash a string to a number (simple djb2 hash).
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Get a consistent color for a speaker ID.
 * Uses preset colors for SPEAKER_00, SPEAKER_01, etc.
 * Falls back to hash-based color for other IDs.
 */
export function getSpeakerColor(speakerId: string): string {
  // Check for common SPEAKER_XX format
  const match = speakerId.match(/SPEAKER_(\d+)/i);
  if (match) {
    const index = parseInt(match[1], 10);
    if (index < PRESET_COLORS.length) {
      return PRESET_COLORS[index];
    }
  }

  // Fallback: hash to HSL color
  const hash = hashString(speakerId);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Get a lighter version of a color for backgrounds.
 */
export function getSpeakerColorLight(speakerId: string): string {
  const match = speakerId.match(/SPEAKER_(\d+)/i);
  if (match) {
    const index = parseInt(match[1], 10);
    if (index < PRESET_COLORS.length) {
      // Return a lighter opacity version
      return PRESET_COLORS[index] + '33'; // 20% opacity
    }
  }

  const hash = hashString(speakerId);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 90%)`;
}
