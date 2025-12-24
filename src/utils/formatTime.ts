/**
 * Format a duration in seconds as MM:SS or MM:SS.mmm format.
 */
export function formatDuration(seconds: number, includeMs = false): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const base = `${mins}:${secs.toString().padStart(2, '0')}`;
  if (includeMs) {
    const ms = Math.floor((seconds % 1) * 1000);
    return `${base}.${ms.toString().padStart(3, '0')}`;
  }
  return base;
}

/**
 * Format a timestamp as a relative time string.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  // Fall back to date string
  return new Date(timestamp).toLocaleDateString();
}
