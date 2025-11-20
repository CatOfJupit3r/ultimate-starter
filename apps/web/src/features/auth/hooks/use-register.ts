import { useMutation, useQueryClient } from '@tanstack/react-query';

import { USE_ME_QUERY_KEYS } from '@~/features/user/hooks/use-me';
import AuthService from '@~/services/auth-service';
import { toast } from '@~/utils/toast';

const useRegister = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: mutate,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
      username,
    }: {
      email: string;
      username: string;
      name: string;
      password: string;
    }) =>
      AuthService.getInstance().signUp.email({
        email,
        name,
        username,
        password,
        fetchOptions: { throw: true },
      }),
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: async (_) => {
      await queryClient.invalidateQueries({
        queryKey: USE_ME_QUERY_KEYS(),
      });
    },
  });

  return {
    mutate,
    isPending,
    isSuccess,
  };
};

export default useRegister;
