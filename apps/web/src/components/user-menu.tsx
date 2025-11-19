import { Link } from '@tanstack/react-router';
import { LuUser, LuSettings, LuLogOut } from 'react-icons/lu';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@~/components/ui/dropdown-menu';
import { useMe } from '@~/features/user';
import AuthService from '@~/services/auth-service';

import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

export default function UserMenu() {
  const { user, isLoggedIn, isPending, refetch } = useMe();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!isLoggedIn) {
    return (
      <Button variant="outline" asChild>
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{user.name}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card w-56" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="w-full cursor-pointer flex items-center gap-2">
            <LuUser className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="w-full cursor-pointer flex items-center gap-2">
            <LuSettings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start px-2 gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            onClick={() => {
              void AuthService.getInstance()
                .signOut({ fetchOptions: { throw: true } })
                .finally(async () => {
                  void refetch();
                });
            }}
          >
            <LuLogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
