import { useState, useEffect, useCallback } from 'react';
import { getStoredTheme, setStoredTheme, type ThemeMode } from '../utils/themeStorage';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    // Initialize with correct resolved theme to avoid flash
    if (typeof window === 'undefined') return 'light';
    const stored = getStoredTheme();
    if (stored === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return stored;
  });

  // Resolve actual theme (handles 'system' mode)
  useEffect(() => {
    const updateResolved = () => {
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(mode);
      }
    };

    updateResolved();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolved);
    return () => mediaQuery.removeEventListener('change', updateResolved);
  }, [mode]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    setStoredTheme(newMode);
  }, []);

  return { mode, resolvedTheme, setTheme };
}
