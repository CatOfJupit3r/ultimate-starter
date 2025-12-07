---
applyTo: "apps/web/**/*.ts,packages/shared/**/*.ts"
---

## Overview
- The web client lives in `apps/web` and is powered by React 19, Vite, TanStack Router/Query/Form, Tailwind CSS, and Sonner for toasts.
- Shared backend contracts are consumed through the generated oRPC client (`@startername/shared`) so API calls stay fully typed.
- Authentication relies on Better Auth's React client (`apps/web/src/services/auth-service.ts`) and uses secure cookies issued by the backend.

## Environment & Bootstrapping
- Run `bun run dev` at the repo root to start both the web app (`http://localhost:3001`) and the API; ensure Docker Desktop is running so Mongo boots successfully.
- Copy `.env.example` to `.env` in `apps/web` and configure environment variables (e.g., Vite public URLs) before launching.
- Vite aliases: `@~/` resolves to `apps/web/src`, enabling concise imports across components, hooks, and utilities.

## Router, Query Client, and oRPC Integration
- The root router is created in `src/main.tsx`, injecting `tanstackRPC` and a shared `QueryClient` into the router context (`createRouter({ context: { tanstackRPC, queryClient } })`).
- Access the context in route files via `Route.useRouteContext()` to share the single query client and RPC helpers.
- RPC client setup:
  - `src/utils/orpc.ts` wires `createORPCClient` to `/api/rpc` using `clientAbsoluteLink` and an `onError` interceptor for logging.
  - `src/utils/tanstack-orpc.ts` applies `createTanstackQueryUtils` so every contract procedure exposes `.queryOptions`, `.mutationOptions`, `.queryKey`, etc.

### Reading Data
- Prefer `useQuery(tanstackRPC.<namespace>.<procedure>.queryOptions({ input }))` inside hooks/components to get typed responses with minimal boilerplate.
- For server-side loaders or imperative calls, use `await tanstackRPC.<namespace>.<procedure>.call({ input })`.
- Prefetch or refetch using generated keys:
  ```typescript
  const queryClient = useQueryClient();
  await queryClient.prefetchQuery(tanstackRPC.user.getUserProfile.queryOptions());
  await queryClient.invalidateQueries({ queryKey: tanstackRPC.user.getUserProfile.queryKey() });
  ```

### Mutations
- Bootstrap mutations with standalone options exported from each hook file. Call `tanstackRPC.<namespace>.<procedure>.mutationOptions({ ...callbacks })` to ensure typed context and query keys.
- Always use the `ctx.client` `QueryClient` reference passed into option callbacks (`onMutate`, `onError`, `onSuccess`, `onSettled`) instead of importing your own client instance.
- Queries should export their return type using the shared contract outputs for reuse in mutations:
  ```typescript
  import { type ORPCOutputs } from '@~/utils/orpc';

  export type ThisLobbyQueryReturnType = ORPCOutputs['lobby']['getLobbyInfo'];
  ```
- Drive optimistic updates with `setQueryData` generics that reference the exported type and keys generated from `tanstackRPC` helpers or route-specific helpers.
- Template mutation pattern:
  ```typescript
  import { useMutation } from '@tanstack/react-query';

  import { tanstackRPC } from '@~/utils/tanstack-orpc';
  import { THIS_LOBBY_QUERY_KEYS, type ThisLobbyQueryReturnType } from '@~/hooks/queries/lobbies/use-this-lobby';

  export const removeLobbyMemberMutationOptions = tanstackRPC.lobby.removeLobbyPlayer.mutationOptions({
    onMutate: ({ params: { lobbyId, userId } }, ctx) => {
      ctx.client.setQueryData<ThisLobbyQueryReturnType>(tanstackRPC.lobby.getLobbyInfo.queryKey({ input: { lobbyId } }), (oldData) => {
        if (!oldData) return oldData;

        const players = oldData.players.filter((player) => player.userId !== userId);
        const waitingApproval = oldData.waitingApproval.filter((player) => player.name !== userId);

        return {
          ...oldData,
          players,
          waitingApproval,
        };
      });
    },
    onError: (_error, { params: { lobbyId } }, _context, ctx) => {
      ctx.client.invalidateQueries({ queryKey: tanstackRPC.lobby.getLobbyInfo.queryKey({ input: { lobbyId } }) });
    },
    onSuccess: ({ players, waitingApproval }, { params: { lobbyId } }, _context, ctx) => {
      ctx.client.setQueryData<ThisLobbyQueryReturnType>(tanstackRPC.lobby.getLobbyInfo.queryKey({ input: { lobbyId } }), (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          players,
          waitingApproval,
        };
      });
    },
  });

  export default function useRemoveLobbyMember() {
    const { mutate: removeLobbyMember, isPending } = useMutation(removeLobbyMemberMutationOptions);

    return {
      removeLobbyMember,
      isPending,
    };
  }
  ```
- On errors, invalidate the affected queries to resync state (`ctx.client.invalidateQueries`).
- Always prefer query keys derived from `tanstackRPC.<namespace>.<procedure>.queryKey({ input })`;

## Optimistic UI Updates

- Always derive cache identifiers from the generated helpers: `const key = tanstackRPC.<namespace>.<procedure>.queryKey({ input })`.
- Cancel in-flight queries before writing: `await queryClient.cancelQueries({ queryKey: key });`.
- Snapshot existing data so failures can roll back: `const previous = queryClient.getQueryData(key); return { previous };`.
- Apply the optimistic state immediately with `queryClient.setQueryData(key, updater)`; handle undefined caches gracefully.
- In `onError`, restore `context.previous` if it exists, then surface the error with Sonner or inline UI.
- On settle, queue a revalidation to synchronize with the server: `void queryClient.invalidateQueries({ queryKey: key });`.
- Template:
  ```typescript
  const mutationOptions = tanstackRPC.user.updateUserProfile.mutationOptions({
      async onMutate(patch, ctx) {
        const key = tanstackRPC.user.getUserProfile.queryKey();
      
        await ctx.client.cancelQueries({ queryKey: key });
        ctx.client.setQueryData<UpdateUserProfileReturnType>(key, (current) => current ? { ...current, bio: patch.bio } : current);
      },
      onError: (_error, _variables, __, ctx) => {
        const key = tanstackRPC.user.getUserProfile.queryKey();
        void ctx.client.invalidateQueries({ queryKey: key });
      },
      // IF endpoint returns updated data, add THIS instead of onSettled
      onSuccess: (_, _variables, __, ctx) => {
        const key = tanstackRPC.user.getUserProfile.queryKey();

        ctx.client.setQueryData<UpdateUserProfileReturnType>(key, (current) => current ? { ...current, bio: patch.bio } : current);
      },
      // IF endpoint does NOT return updated data, add THIS instead of onSuccess
      onSettled: (_data, _error, _variables, ctx) => {
        const key = tanstackRPC.user.getUserProfile.queryKey();

        void ctx.client.invalidateQueries({ queryKey: key });
      },
    });
  ```
- Surface optimistic state in the UI through mutation flags (`isPending`, `isSuccess`, `isError`) and toast feedback.

## Optimistic Updates

```typescript
const mutationOptions = tanstackRPC.namespace.procedure.mutationOptions({
  async onMutate(variables, ctx) {
    const key = tanstackRPC.namespace.queryProcedure.queryKey();
    await ctx.client.cancelQueries({ queryKey: key });
    const previous = ctx.client.getQueryData(key);
    ctx.client.setQueryData<NamespaceProcedureReturn>(key, (old) => ({ ...old, ...updatedFields }));
    return { previous };
  },
  onError: (_error, _variables, context, ctx) => {
    const key = tanstackRPC.namespace.queryProcedure.queryKey();
    if (context?.previous) ctx.client.setQueryData<NamespaceProcedureReturn>(key, context.previous);
    else void ctx.client.invalidateQueries({ queryKey: key });
  },
  onSettled: (_data, _error, _variables, ctx) => {
    const key = tanstackRPC.namespace.queryProcedure.queryKey();
    void ctx.client.invalidateQueries({ queryKey: key });
  },
});
```

## Component Loading States

```typescript
const { data: item, isPending, error } = useQuery(...);

if (isPending) return <Skeleton />;
if (error) return <ErrorBoundary error={error} />;
if (!item) return <NotFound />;

return <ItemDisplay item={item} />;
```

## URL State with nuqs

```typescript
import z from 'zod';
import { useQueryStates, parseAsString, parseAsStringEnum } from 'nuqs';

const sortValuesSchema = z.enum(['RECENT', 'PARTICIPANTS', 'COMPLETED']);
const SORT_VALUES = sortValuesSchema.enum;
const SORT_VALUES_ARRAY = Object.values(SORT_VALUES);
type SortValue = z.infer<typeof sortValuesSchema>;

export function ChallengeFilters() {
  const [{ search, sort }, setQueryStates] = useQueryStates({
    search: parseAsString.withDefault(''),
    sort: parseAsStringEnum(SORT_VALUES_ARRAY).withDefault(SORT_VALUES.RECENT),
  });

  return (
    <form className="flex gap-3">
      <Input
        value={search}
        onChange={(event) => void setQueryStates({ search: event.target.value || null })}
        placeholder="Search challenges..."
      />
      <SingleSelect
        options={SORT_VALUES_ARRAY.map((value) => ({ label: value, value }))}
        value={sort}
        onValueChange={(value) => void setQueryStates({ sort: value ?? SORT_VALUES.RECENT })}
        className="w-40"
      />
    </form>
  );
}
```

## Frontend Architecture

- **Feature code**: `apps/web/src/features/<domain>` holds domain modules with colocated `components`, `hooks`, and tests.
- **Query Hooks**: `apps/web/src/features/*/hooks/queries/**/*.ts`
- **Mutation Hooks**: `apps/web/src/features/*/hooks/mutations/**/*.ts`
- **Components**: `apps/web/src/features/*/components/**/*.tsx`
- **Helpers**: `apps/web/src/features/*/helpers/**/*.tsx`
- **Routes**: `apps/web/src/routes/**/*.tsx`
- **oRPC Setup**: `apps/web/src/utils/tanstack-orpc.ts`
- **Auth Service**: `apps/web/src/services/auth-service.ts`

## Forms, Feedback, and Styling
- TanStack Form powers auth flows (`components/sign-in-form.tsx`, `sign-up-form.tsx`); keep validators in sync with shared `zod` schemas and show validation errors inline.
- Toasts are centralized via Sonner (`<Toaster richColors />` in `__root.tsx`); prefer toasts for cross-route notifications and inline UI for form-level feedback.
- Tailwind provides design tokens; keep new utility classes consistent with existing components and prefer composing primitives located in `components/ui`.
