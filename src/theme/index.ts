import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, type ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';

// Theme mode: light, dark, or follow system
export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vietask_theme_mode';

interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Resolve actual dark/light based on mode
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    radius,
    shadows,
    isDark,
  }), [isDark]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  // Toggle cycles: system → dark → light → system
  const toggleTheme = useCallback(() => {
    setMode(mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system');
  }, [mode, setMode]);

  // Don't render until preference is loaded to avoid flash
  if (!loaded) return React.createElement(React.Fragment);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, mode, setMode, toggleTheme } },
    children
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { colors, typography, spacing, radius, shadows };
