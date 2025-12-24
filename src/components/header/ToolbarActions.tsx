import { useState } from 'react';
import { HelpCircle, Settings } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { SettingsModal } from '../modals/SettingsModal';
import { useEditorStore } from '../../store/editorStore';
import type { ThemeMode } from '../../utils/themeStorage';

interface ToolbarActionsProps {
  helpDefaultOpen?: boolean;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onToast: (type: 'success' | 'warning' | 'error', message: string) => void;
}

export function ToolbarActions({
  helpDefaultOpen = false,
  themeMode,
  onThemeModeChange,
  onToast,
}: ToolbarActionsProps) {
  const [showHelp, setShowHelp] = useState(helpDefaultOpen);
  const [showSettings, setShowSettings] = useState(false);
  const audioHash = useEditorStore((s) => s.audioHash);

  return (
    <>
      {/* Theme Toggle */}
      <ThemeToggle mode={themeMode} onModeChange={onThemeModeChange} />

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2"
        title="Settings"
      >
        <Settings size={20} className="text-gray-500 dark:text-gray-400" />
      </button>

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Keyboard shortcuts"
      >
        <HelpCircle size={20} className="text-gray-500 dark:text-gray-400" />
      </button>

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentAudioHash={audioHash}
        onToast={onToast}
      />
    </>
  );
}
