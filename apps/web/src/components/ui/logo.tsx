import { useTheme } from 'next-themes';

import { cn } from '@~/lib/utils';

export function Logo({ className }: { className?: string }) {
  const { theme } = useTheme();
  return (
    <img
      src={`/favicon/favicon${theme === 'light' ? '.dark' : ''}.svg`}
      className={cn('size-32 ', className)}
      alt="Wyrmways Logo"
    />
  );
}
