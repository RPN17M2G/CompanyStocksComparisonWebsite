import { useState, useMemo } from 'react';
import { createTheme } from '@mui/material';
import { lightTheme, darkTheme, typography } from './theme';

export type ThemeMode = 'light' | 'dark';

export const useThemeManager = () => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === 'light' ? lightTheme : darkTheme,
        typography: typography,
      }),
    [mode]
  );

  return { theme, mode, toggleTheme };
};
