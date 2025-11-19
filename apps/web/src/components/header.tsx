import { Link } from '@tanstack/react-router';
import { LuHouse, LuZap } from 'react-icons/lu';

import { useMe } from '@~/features/user';

import { ModeToggle } from './mode-toggle';
import { Button } from './ui/button';
import { Logo } from './ui/logo';
import UserMenu from './user-menu';

const HEADER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', authRequired: true, icon: LuHouse },
  { to: '/challenges', label: 'Challenges', authRequired: false, icon: LuZap },
] as const;

export default function Header() {
  const { isLoggedIn } = useMe();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section - Left */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
            <Logo className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block">Wyrmways</span>
          </Link>
        </div>

        {/* Navigation Links - Center */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex gap-6">
          {HEADER_LINKS.map(({ to, label, authRequired, icon: Icon }) => {
            if (authRequired && !isLoggedIn) return null;
            return (
              <Link
                key={to}
                to={to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[status=active]:bg-foreground data-[status=active]:text-background rounded-md px-2 py-1 data-[status=active]:font-semibold w-32 text-center"
              >
                <Icon className="inline-block mr-1 mb-0.5 h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu - Right */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button variant="default" size="sm" asChild className="hidden sm:flex">
              <Link to="/challenges/create">Create Challenge</Link>
            </Button>
          ) : null}
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
