import { createFileRoute } from '@tanstack/react-router';

import { ProfileView } from '@~/features/user';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const Route = createFileRoute('/_auth_only/profile')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(tanstackRPC.user.getUserProfile.queryOptions({ input: {} }));
  },
});

function RouteComponent() {
  return <ProfileView />;
}
