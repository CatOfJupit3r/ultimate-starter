import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { createContext, use, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import z from 'zod';

import { isOnClient } from '@~/utils/ssr-helpers';

const userThemeZod = z.enum(['light', 'dark', 'system']);
export const USER_THEME = userThemeZod.enum;
const userThemeValidator = userThemeZod.clone().catch(USER_THEME.dark);

export type UserTheme = z.infer<typeof userThemeZod>;
export type AppTheme = Exclude<UserTheme, 'system'>;

const THEME_COOKIE = 'startername.theme';

export const getStoredTheme = createServerFn().handler(async () => userThemeValidator.parse(getCookie(THEME_COOKIE)));

export function getInitialThemeClass(theme: UserTheme): Exclude<UserTheme, typeof USER_THEME.system> {
  if (theme === USER_THEME.system) {
    // During SSR, default to light; client will adjust if needed
    return USER_THEME.dark;
  }
  return theme;
}

export const setStoredTheme = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => userThemeValidator.parse(data))
  .handler(({ data }) => {
    setCookie(THEME_COOKIE, data);
  });

function getSystemTheme(): AppTheme {
  if (isOnClient) return USER_THEME.dark;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? USER_THEME.dark : USER_THEME.light;
}

function handleThemeChange(theme: UserTheme) {
  const root = document.documentElement;
  root.classList.remove(USER_THEME.light, USER_THEME.dark);
  const newTheme = theme === USER_THEME.system ? getSystemTheme() : theme;
  root.classList.add(newTheme);
}

function setupPreferredListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => handleThemeChange(USER_THEME.system);
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

interface iThemeContextProps {
  userTheme: UserTheme;
  appTheme: AppTheme;
  setTheme: (theme: UserTheme) => void;
}

const ThemeContext = createContext<iThemeContextProps | undefined>(undefined);

interface iThemeProviderProps {
  children: ReactNode;
  initialTheme: UserTheme;
}

export function ThemeProvider({ children, initialTheme }: iThemeProviderProps) {
  const [userTheme, setUserTheme] = useState<UserTheme>(initialTheme);

  useEffect(() => {
    handleThemeChange(userTheme);

    if (userTheme === 'system') {
      return setupPreferredListener();
    }
    return undefined;
  }, [userTheme]);

  const appTheme = userTheme === 'system' ? getSystemTheme() : userTheme;

  const setTheme = (newUserTheme: UserTheme) => {
    setUserTheme(newUserTheme);
    void setStoredTheme({ data: newUserTheme });
  };

  const value = useMemo(() => ({ userTheme, appTheme, setTheme }), [userTheme, appTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
