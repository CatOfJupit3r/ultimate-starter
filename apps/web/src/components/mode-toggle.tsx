import { LuMoon, LuSun } from 'react-icons/lu';

import { USER_THEME, useTheme } from '@~/components/theme-provider';
import { Button } from '@~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@~/components/ui/dropdown-menu';

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <LuSun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <LuMoon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme(USER_THEME.light)}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(USER_THEME.dark)}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(USER_THEME.system)}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
