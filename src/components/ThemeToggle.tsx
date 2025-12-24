import { Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '../utils/themeStorage';

interface ThemeToggleProps {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}

export function ThemeToggle({ mode, onModeChange }: ThemeToggleProps) {
  const modes: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          className={`p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
            mode === value
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          title={label}
          aria-label={`${label} theme`}
          aria-pressed={mode === value}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
