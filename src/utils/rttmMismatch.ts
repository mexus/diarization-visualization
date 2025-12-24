import type { Segment } from '../types';

export interface RTTMCoverage {
  minStartTime: number;
  maxEndTime: number;
  segmentCount: number;
}

export interface MismatchInfo {
  type: 'segments-beyond' | 'audio-longer' | 'both';
  audioDuration: number;
  rttmMaxEndTime: number;
  message: string;
}

/**
 * Calculate the coverage of RTTM segments.
 * Returns the min start time, max end time, and segment count.
 */
export function getRTTMCoverage(segments: Segment[]): RTTMCoverage {
  if (segments.length === 0) {
    return { minStartTime: 0, maxEndTime: 0, segmentCount: 0 };
  }

  let minStartTime = Infinity;
  let maxEndTime = 0;

  for (const segment of segments) {
    const endTime = segment.startTime + segment.duration;
    if (segment.startTime < minStartTime) {
      minStartTime = segment.startTime;
    }
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  }

  return {
    minStartTime,
    maxEndTime,
    segmentCount: segments.length,
  };
}

// Threshold constants
const GAP_THRESHOLD_SECONDS = 5;
const GAP_THRESHOLD_PERCENT = 0.1;

/**
 * Check if RTTM coverage mismatches the audio duration.
 * Returns mismatch info if there's a problem, null if everything is fine.
 *
 * Mismatches are detected when:
 * 1. Segments extend beyond audio duration
 * 2. Audio is significantly longer than RTTM coverage (>10% or >5 seconds)
 */
export function checkRTTMMismatch(
  coverage: RTTMCoverage,
  audioDuration: number
): MismatchInfo | null {
  // Skip check if no segments or no audio duration
  if (coverage.segmentCount === 0 || audioDuration <= 0) {
    return null;
  }

  const segmentsBeyond = coverage.maxEndTime > audioDuration;

  // Check if audio is significantly longer than RTTM coverage
  const gap = audioDuration - coverage.maxEndTime;
  const audioLonger = gap > GAP_THRESHOLD_SECONDS ||
    (audioDuration > 0 && gap / audioDuration > GAP_THRESHOLD_PERCENT);

  if (!segmentsBeyond && !audioLonger) {
    return null;
  }

  let type: MismatchInfo['type'];
  let message: string;

  if (segmentsBeyond && audioLonger) {
    // This shouldn't happen logically, but handle it anyway
    type = 'both';
    message = 'The RTTM file has segments that extend beyond the audio, and the audio is also longer than the RTTM coverage.';
  } else if (segmentsBeyond) {
    type = 'segments-beyond';
    const overrun = coverage.maxEndTime - audioDuration;
    message = `The RTTM file contains segments that extend ${formatSeconds(overrun)} beyond the audio duration.`;
  } else {
    type = 'audio-longer';
    message = `The audio is ${formatSeconds(gap)} longer than the RTTM coverage. The RTTM file may not match this audio.`;
  }

  return {
    type,
    audioDuration,
    rttmMaxEndTime: coverage.maxEndTime,
    message,
  };
}

/**
 * Format seconds as a human-readable string (e.g., "2.5 seconds" or "1 minute 30 seconds")
 */
function formatSeconds(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;

  if (rounded < 60) {
    return `${rounded} second${rounded !== 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = Math.round((rounded % 60) * 10) / 10;

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
}
