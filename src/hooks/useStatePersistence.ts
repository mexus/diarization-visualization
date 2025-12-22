import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { hashAudioFile } from '../utils/audioHash';
import { loadState } from '../utils/stateStorage';

/**
 * Hook that handles audio file hashing and state restoration.
 * When an audio file is loaded, computes its hash and restores
 * any previously saved state (segments, speakers, history) for that file.
 */
export function useStatePersistence() {
  const audioFile = useEditorStore((s) => s.audioFile);
  const setAudioHash = useEditorStore((s) => s.setAudioHash);
  const restoreWithHistory = useEditorStore((s) => s.restoreWithHistory);
  const segments = useEditorStore((s) => s.segments);

  useEffect(() => {
    if (!audioFile) {
      setAudioHash(null);
      return;
    }

    let cancelled = false;

    hashAudioFile(audioFile).then((hash) => {
      if (cancelled) return;

      setAudioHash(hash);

      // Only restore if no segments are currently loaded
      // (user might have imported RTTM already)
      if (segments.length === 0) {
        const savedState = loadState(hash);
        if (savedState && (savedState.segments.length > 0 || savedState.manualSpeakers.length > 0)) {
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
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // Only run when audioFile changes, not when segments change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile, setAudioHash, restoreWithHistory]);
}
