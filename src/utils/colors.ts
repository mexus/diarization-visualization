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

/**
 * Adjust brightness of a hex color.
 * Positive amount = lighter, negative = darker.
 */
function adjustBrightness(color: string, amount: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
  // Handle HSL colors (from hash fallback)
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = Math.min(100, Math.max(0, parseInt(match[3]) + Math.round(amount / 2.55)));
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }
  return color;
}

/**
 * Generate a gradient from a speaker color (for segment depth effect).
 * Returns a CSS linear-gradient string.
 */
export function getSpeakerGradient(speakerId: string): string {
  const baseColor = getSpeakerColor(speakerId);
  const lighter = adjustBrightness(baseColor, 15);
  const darker = adjustBrightness(baseColor, -15);
  return `linear-gradient(180deg, ${lighter} 0%, ${baseColor} 50%, ${darker} 100%)`;
}

/**
 * Get a shadow style derived from speaker color for inner glow effect.
 */
export function getSpeakerShadow(speakerId: string): string {
  const baseColor = getSpeakerColor(speakerId);
  const highlight = adjustBrightness(baseColor, 30);
  const shadow = adjustBrightness(baseColor, -25);
  return `inset 0 1px 0 ${highlight}, inset 0 -1px 2px ${shadow}`;
}
