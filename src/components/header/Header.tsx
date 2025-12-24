import { FileControls } from './FileControls';
import { UndoRedoControls } from './UndoRedoControls';
import { TransportControls } from './TransportControls';
import { TimeDisplay } from './TimeDisplay';
import { PlaybackSpeedControl } from './PlaybackSpeedControl';
import { ZoomControls } from './ZoomControls';
import { ToolbarActions } from './ToolbarActions';
import type { ThemeMode } from '../../utils/themeStorage';

function Separator() {
  return <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

interface HeaderProps {
  helpDefaultOpen?: boolean;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onToast: (type: 'success' | 'warning' | 'error', message: string) => void;
}

export function Header({ helpDefaultOpen = false, themeMode, onThemeModeChange, onToast }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 sm:py-3 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        {/* File Controls */}
        <FileControls onToast={onToast} />

        <Separator />

        {/* Undo/Redo - hidden on mobile */}
        <UndoRedoControls />

        <Separator />

        {/* Transport Controls */}
        <TransportControls />

        <Separator />

        {/* Time Display - compact on mobile */}
        <TimeDisplay />

        <Separator />

        {/* Playback Speed - hidden on mobile */}
        <PlaybackSpeedControl />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom Slider - hidden on mobile */}
        <ZoomControls />

        {/* Theme Toggle, Settings, Help */}
        <ToolbarActions
          helpDefaultOpen={helpDefaultOpen}
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          onToast={onToast}
        />
      </div>
    </header>
  );
}
