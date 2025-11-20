import { useMutation } from '@tanstack/react-query';

import { tanstackRPC } from '@~/utils/tanstack-orpc';
import { toast } from '@~/utils/toast';

export const regeneratePublicCodeMutationOptions = tanstackRPC.user.regeneratePublicCode.mutationOptions({
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({ queryKey: tanstackRPC.user.getUserProfile.queryKey() });
    toast.success('Invite code regenerated successfully');
  },
  onError: () => {
    toast.error('Failed to regenerate invite code');
  },
});

export function useRegeneratePublicCode() {
  const { mutate: regeneratePublicCode, isPending } = useMutation(regeneratePublicCodeMutationOptions);

  return {
    regeneratePublicCode,
    isPending,
  };
}
