import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';

interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
}

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    radius,
    shadows,
    isDark,
  }), [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme } },
    children
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { colors, typography, spacing, radius, shadows };
