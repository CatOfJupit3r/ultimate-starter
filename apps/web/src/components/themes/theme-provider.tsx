import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { USER_THEME } from './constants';
import type { UserTheme } from './constants';
import { ThemeContext } from './context';
import {
  getInitialThemeClass,
  getSystemTheme,
  handleThemeChange,
  setStoredTheme,
  setupPreferredListener,
} from './helpers';

interface iThemeProviderProps {
  children: ReactNode;
  initialTheme: UserTheme;
}

export function ThemeProvider({ children, initialTheme }: iThemeProviderProps) {
  const [userTheme, setUserTheme] = useState<UserTheme>(initialTheme);

  useEffect(() => {
    handleThemeChange(userTheme);

    if (userTheme === USER_THEME.system) {
      return setupPreferredListener();
    }
    return undefined;
  }, [userTheme]);

  const appTheme = userTheme === USER_THEME.system ? getSystemTheme() : getInitialThemeClass(userTheme);

  const setTheme = (newUserTheme: UserTheme) => {
    setUserTheme(newUserTheme);
    void setStoredTheme({ data: newUserTheme });
  };

  const value = useMemo(() => ({ userTheme, appTheme, setTheme }), [userTheme, appTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
