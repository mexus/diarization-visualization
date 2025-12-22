/**
 * Compute a SHA-256 hash of an audio file for identification.
 * Uses the Web Crypto API for efficient hashing.
 */
export async function hashAudioFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
