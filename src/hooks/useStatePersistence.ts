import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { hashAudioFile } from '../utils/audioHash';
import { loadState } from '../utils/stateStorage';

/**
 * Hook that handles audio file hashing and state restoration.
 * When an audio file is loaded, computes its hash and restores
 * any previously saved state (segments, speakers, history) for that file.
 * If no cached state exists, clears any existing segments.
 */
export function useStatePersistence() {
  const audioFile = useEditorStore((s) => s.audioFile);
  const setAudioHash = useEditorStore((s) => s.setAudioHash);
  const setLoading = useEditorStore((s) => s.setLoading);
  const restoreWithHistory = useEditorStore((s) => s.restoreWithHistory);

  // Track previous audio file to detect changes
  const prevAudioFileRef = useRef<File | null>(null);

  useEffect(() => {
    if (!audioFile) {
      setAudioHash(null);
      setLoading(null);
      return;
    }

    // Check if this is a new audio file (not the same instance)
    const isNewAudioFile = audioFile !== prevAudioFileRef.current;
    prevAudioFileRef.current = audioFile;

    if (!isNewAudioFile) {
      return;
    }

    let cancelled = false;

    setLoading('Loading audio file...');

    hashAudioFile(audioFile).then((hash) => {
      if (cancelled) return;

      setAudioHash(hash);

      const savedState = loadState(hash);
      if (savedState && (savedState.segments.length > 0 || savedState.manualSpeakers.length > 0)) {
        setLoading('Restoring saved diarization...');

        // Regenerate segment IDs to ensure uniqueness
        const restoredSegments = savedState.segments.map((seg) => ({
          ...seg,
          id: crypto.randomUUID(),
        }));

        // Also regenerate IDs in history entries
        const restoredHistory = savedState.history.map((entry) => ({
          ...entry,
          segments: entry.segments.map((seg) => ({
            ...seg,
            id: crypto.randomUUID(),
          })),
        }));

        const restoredFuture = savedState.future.map((entry) => ({
          ...entry,
          segments: entry.segments.map((seg) => ({
            ...seg,
            id: crypto.randomUUID(),
          })),
        }));

        restoreWithHistory(
          restoredSegments,
          savedState.manualSpeakers,
          restoredHistory,
          restoredFuture
        );
        console.log(
          `Restored ${restoredSegments.length} segments, ${savedState.history.length} history entries from browser storage`
        );
      } else {
        // No cached state for this audio file - clear existing segments
        restoreWithHistory([], [], [], []);
        console.log('No cached state found, cleared existing segments');
      }

      setLoading(null);
    });

    return () => {
      cancelled = true;
    };
  }, [audioFile, setAudioHash, setLoading, restoreWithHistory]);
}
