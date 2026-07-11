import type z from 'zod';

export function isNil<T>(value: T | Nil): value is Nil {
  return value === null || value === undefined;
}

export type ZGenerator<T> = T extends (...args: unknown[]) => infer U
  ? U extends z.ZodType
    ? z.infer<U>
    : never
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeNilFromObject<T extends Record<string, any>>(obj: T): Record<keyof T, NonNil<T[keyof T]>> {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => !isNil(value))) as Record<
    keyof T,
    NonNil<T[keyof T]>
  >;
}
