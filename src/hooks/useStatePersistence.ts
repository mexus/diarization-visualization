import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { hashAudioFile } from '../utils/audioHash';
import { loadState } from '../utils/stateStorage';

/**
 * Hook that handles audio file hashing and state restoration.
 * When an audio file is loaded, computes its hash and restores
 * any previously saved segments for that file.
 */
export function useStatePersistence() {
  const audioFile = useEditorStore((s) => s.audioFile);
  const setAudioHash = useEditorStore((s) => s.setAudioHash);
  const setSegments = useEditorStore((s) => s.setSegments);
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
        const savedSegments = loadState(hash);
        if (savedSegments && savedSegments.length > 0) {
          // Regenerate IDs to ensure uniqueness
          const restoredSegments = savedSegments.map((seg) => ({
            ...seg,
            id: crypto.randomUUID(),
          }));
          setSegments(restoredSegments);
          console.log(`Restored ${restoredSegments.length} segments from browser storage`);
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // Only run when audioFile changes, not when segments change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile, setAudioHash, setSegments]);
}
