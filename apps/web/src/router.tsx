import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';

import { NotFound } from './components/not-found';
import PseudoPage from './components/pseudo-page';
import { routeTree } from './routeTree.gen';
import { queryClient } from './utils/query-client';
import { tanstackRPC } from './utils/tanstack-orpc';

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: { tanstackRPC, queryClient },
    defaultPendingComponent: PseudoPage,
    defaultNotFoundComponent: NotFound,
    Wrap: function WrapComponent({ children }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  });
  return router;
};

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
