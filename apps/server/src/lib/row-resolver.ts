/**
 * Factory for the repetitive "Drizzle row -> API response" mapping. Most repository
 * `toResponse` functions only need to (a) turn `null` DB columns into `undefined` optional
 * fields, (b) drop internal/unexposed columns, and (c) narrow a couple of field types.
 * `createRowResolver` covers all three so features don't hand-roll a field-by-field mapper.
 */
interface iResolverSpec<Row, Response> {
  /** Columns whose `null` value should become `undefined` in the response. */
  optional?: readonly (keyof Row)[];
  /** Columns present on the row that must not be exposed in the response. */
  omit?: readonly (keyof Row)[];
  /** Computed/narrowed fields that can't be expressed via `optional`/`omit` alone. */
  overrides?: (row: Row) => Partial<Response>;
}

export function createRowResolver<Row extends Record<string, unknown>, Response>(
  spec: iResolverSpec<Row, Response> = {},
): (row: Row) => Response {
  return (row: Row): Response => {
    const result: Record<string, unknown> = { ...row };

    for (const key of spec.optional ?? []) {
      if (result[key as string] === null) result[key as string] = undefined;
    }
    for (const key of spec.omit ?? []) {
      delete result[key as string];
    }
    if (spec.overrides) {
      Object.assign(result, spec.overrides(row));
    }

    return result as Response;
  };
}
