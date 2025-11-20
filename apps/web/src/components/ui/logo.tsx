import { cn } from '@~/lib/utils';

import { useTheme } from '../theme-provider';

export function Logo({ className }: { className?: string }) {
  const { theme } = useTheme();
  return (
    <img
      src={`/favicon/favicon${theme === 'light' ? '.dark' : ''}.svg`}
      className={cn('size-32 ', className)}
      alt="Startername Logo"
    />
  );
}
