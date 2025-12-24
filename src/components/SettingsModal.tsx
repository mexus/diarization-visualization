import { useEffect, useState, useMemo } from 'react';
import { X, Trash2, FileAudio, Database } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getCacheEntries, deleteEntry, clearAllStates } from '../utils/stateStorage';
import type { CacheEntryInfo } from '../utils/stateStorage';
import { formatRelativeTime } from '../utils/formatTime';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAudioHash: string | null;
  onToast: (type: 'success' | 'warning', message: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentAudioHash,
  onToast,
}: SettingsModalProps) {
  // Track a version to force refresh of entries
  const [entriesVersion, setEntriesVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CacheEntryInfo | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Refresh entries when modal opens or version changes
  const entries = useMemo(() => {
    if (!isOpen) return [];
    // entriesVersion is used to trigger re-computation
    void entriesVersion;
    return getCacheEntries();
  }, [isOpen, entriesVersion]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        // Close confirmation modals first, then settings modal
        if (deleteTarget) {
          setDeleteTarget(null);
        } else if (showClearAllConfirm) {
          setShowClearAllConfirm(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, deleteTarget, showClearAllConfirm]);

  const handleDeleteEntry = (entry: CacheEntryInfo) => {
    setDeleteTarget(entry);
  };

  const confirmDeleteEntry = () => {
    if (deleteTarget) {
      deleteEntry(deleteTarget.hash);
      setEntriesVersion((v) => v + 1);
      onToast('success', 'Cache entry deleted');
      setDeleteTarget(null);
    }
  };

  const handleClearAll = () => {
    setShowClearAllConfirm(true);
  };

  const confirmClearAll = () => {
    clearAllStates();
    setEntriesVersion((v) => v + 1);
    onToast('success', 'All cache cleared');
    setShowClearAllConfirm(false);
  };

  const formatEntryName = (entry: CacheEntryInfo): string => {
    if (entry.fileName) {
      return entry.fileName;
    }
    // Truncate hash for display
    return `${entry.hash.slice(0, 8)}...${entry.hash.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Cache Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Cached Audio Files ({entries.length} of 10)
              </h3>
            </div>

            {entries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-gray-400 dark:text-gray-500 text-sm">No cached entries</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {entries.map((entry) => (
                  <div
                    key={entry.hash}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      entry.hash === currentAudioHash
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <FileAudio
                      size={20}
                      className={
                        entry.hash === currentAudioHash
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate"
                          title={entry.fileName ?? entry.hash}
                        >
                          {formatEntryName(entry)}
                        </span>
                        {entry.hash === currentAudioHash && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {entry.segmentCount} segments · {entry.historyDepth} undo steps ·{' '}
                        {formatRelativeTime(entry.savedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry)}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Delete this entry"
                    >
                      <Trash2 size={16} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClearAll}
              disabled={entries.length === 0}
              className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md
                hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              Clear All Cache
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
              Cache stores your editing history for quick recovery when you reopen the same audio
              file.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Entry Confirmation */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title="Delete Cache Entry"
        message={`Are you sure you want to delete the cached data for "${deleteTarget ? formatEntryName(deleteTarget) : ''}"? This cannot be undone.`}
        onConfirm={confirmDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Clear All Confirmation */}
      <ConfirmDeleteModal
        isOpen={showClearAllConfirm}
        title="Clear All Cache"
        message="Are you sure you want to delete all cached audio data? This will remove editing history for all files and cannot be undone."
        confirmLabel="Clear All"
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearAllConfirm(false)}
      />
    </>
  );
}
