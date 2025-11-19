import { createContext, use, useEffect, useMemo, useState } from 'react';

import { FunctionOnce } from './function-once';

export type ResolvedTheme = 'dark' | 'light';
export type Theme = ResolvedTheme | 'system';

interface iThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface iThemeProviderState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const initialState: iThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<iThemeProviderState>(initialState);

const isBrowser = typeof window !== 'undefined';

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'startername.theme',
}: iThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (isBrowser ? (localStorage.getItem(storageKey) as Theme) : defaultTheme) || defaultTheme,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function updateTheme() {
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
        root.classList.add(systemTheme);
        return;
      }

      setResolvedTheme(theme);
      root.classList.add(theme);
    }

    mediaQuery.addEventListener('change', updateTheme);
    updateTheme();

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
      },
    }),
    [theme, resolvedTheme, storageKey],
  );

  return (
    <ThemeProviderContext value={value}>
      <FunctionOnce param={storageKey}>
        {(currentStorageKey) => {
          const currentTheme: string | null = localStorage.getItem(currentStorageKey);

          if (
            currentTheme === 'dark' ||
            ((currentTheme === null || currentTheme === 'system') &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)
          ) {
            document.documentElement.classList.add('dark');
          }
        }}
      </FunctionOnce>
      {children}
    </ThemeProviderContext>
  );
}

export function useTheme() {
  const context = use(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}
