import { Modal } from './Modal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const keyboardShortcuts = [
  { key: 'Space', action: 'Play / Pause' },
  { key: '←', action: 'Skip back 5s' },
  { key: '→', action: 'Skip forward 5s' },
  { key: 'Ctrl+Z', action: 'Undo' },
  { key: 'Ctrl+Shift+Z', action: 'Redo' },
  { key: 'Delete', action: 'Delete selected segment' },
  { key: 'Escape', action: 'Deselect / Close dialog' },
];

const mouseActions = [
  { action: 'Click segment', result: 'Select' },
  { action: 'Drag edge handles', result: 'Resize segment' },
  { action: 'Drag segment body', result: 'Move to different speaker' },
  { action: 'Double-click lane', result: 'Create new segment' },
  { action: 'Click speaker label', result: 'Rename speaker' },
  { action: 'Drag speaker label', result: 'Merge speakers' },
  { action: 'Click timeline', result: 'Seek to position' },
  { action: 'Scroll wheel', result: 'Horizontal scroll' },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts & Controls"
      size="xl"
    >
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keyboard Shortcuts */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Keyboard
          </h3>
          <div className="space-y-2">
            {keyboardShortcuts.map(({ key, action }) => (
              <div key={key} className="flex items-center gap-3">
                <kbd className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-mono text-sm min-w-[4rem] text-center">
                  {key}
                </kbd>
                <span className="text-gray-600 dark:text-gray-300 text-sm">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mouse Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Mouse
          </h3>
          <div className="space-y-2">
            {mouseActions.map(({ action, result }) => (
              <div key={action} className="flex items-start gap-3">
                <span className="text-gray-700 dark:text-gray-200 text-sm font-medium min-w-[8rem]">
                  {action}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{result}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Press <kbd className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-xs">Esc</kbd> to close
        </p>
      </div>
    </Modal>
  );
}
