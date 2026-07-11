export type TryCatchResult<T, E> = { data: T; error: null } | { data: null; error: E };

/**
 * Safe try-catch wrapper for synchronous and asynchronous functions.
 *
 * Use it to avoid try-catch blocks in your code.
 *
 * Inspired by t3dotgg gist: https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b
 * @param fn - Function to execute
 * @returns An object containing either the data or the error
 */
export function tryCatch<T, E = Error>(fn: () => T) {
  type Result<TResult, EResult> = { data: TResult; error: null } | { data: null; error: EResult };
  type ReturnType = T extends Promise<infer P> ? Promise<Result<P, E>> : Result<T, E>;

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((data: Promise<unknown>) => ({ data, error: null }))
        .catch((e: unknown) => ({ data: null, error: e as E })) as ReturnType;
    }
    return { data: result, error: null } as ReturnType;
  } catch (e: unknown) {
    return { data: null, error: e as E } as ReturnType;
  }
}

/**
 * Runs work and delegates every failure to a callback that must throw or otherwise never return.
 */
export async function handleError<T>(operation: () => Promise<T> | T, onError: (error: unknown) => never): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return onError(error);
  }
}
