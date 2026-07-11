import z from 'zod';

import { EnumwaiiError } from './enumwaii-error';
import { EnumwaiiParseError } from './enumwaii-parse-error';
import { EnumwaiiUnknownMemberError } from './enumwaii-unknown-member-error';

export declare const ENUMWAII_BRAND: unique symbol;

export interface iEnumwaiiBrand<TIdentity extends string, TRaw extends string = string> {
  readonly [ENUMWAII_BRAND]: `${TIdentity}:${TRaw}`;
}

/**
 * A member of an enumwaii enum. At runtime this is the plain string, so it
 * serializes through JSON, URLs, and databases with zero ceremony. The brand
 * exists only at the type level: raw string literals and values from unrelated
 * enums are not assignable to it, which forces call sites to go through the
 * enum object, `parse`, or `schema`.
 *
 * The brand cannot block `value === 'RAW'` comparisons (TypeScript treats the
 * types as comparable no matter how the brand is shaped); use the bundled
 * `no-raw-enum-comparison` ESLint rule for that.
 */
export type EnumwaiiValue<TRaw extends string, TIdentity extends string = string> = TRaw extends string
  ? TRaw & iEnumwaiiBrand<TIdentity, TRaw>
  : never;

export type InferEnumwaii<TEnum> =
  TEnum extends Enumwaii<infer TRaw, infer TIdentity> ? EnumwaiiValue<TRaw, TIdentity> : never;

export interface iEnumwaiiSafeParseSuccess<TRaw extends string, TIdentity extends string> {
  isSuccess: true;
  value: EnumwaiiValue<TRaw, TIdentity>;
}

export interface iEnumwaiiSafeParseFailure {
  isSuccess: false;
  error: EnumwaiiParseError;
}

export type EnumwaiiSafeParseResult<TRaw extends string, TIdentity extends string> =
  iEnumwaiiSafeParseSuccess<TRaw, TIdentity> | iEnumwaiiSafeParseFailure;

/**
 * Keys of the mapping must be exactly the enum members: missing keys fail the
 * `Record<TRaw, unknown>` constraint, extra keys collapse to `never`. Keys must
 * be plain literals — computed branded keys do not reduce to their literal, so
 * `[MODES.PLAN]: ...` is not supported (and not needed: the whole mapping is
 * validated).
 */

/**
 * A derived lookup table. Branded strings cannot bracket-index mapped types
 * (TS collapses `T[Literal & Brand]` to an implicit-any error), so the table
 * itself is callable: `MODE_LABELS(mode)`. Lookups with keys outside the enum
 * throw when called from untyped code.
 */
/**
 * TypeScript represents computed branded keys as a string index signature, so
 * `derive` validates exactness at runtime. The bundled `no-raw-enum-member`
 * rule requires computed member keys at call sites.
 */
export interface iEnumwaiiDerived<TRaw extends string, TIdentity extends string, TValue> {
  (value: EnumwaiiValue<TRaw, TIdentity>): TValue;
  /** Same lookup as calling the table; useful when passing the lookup around. */
  readonly get: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue;
  /** Plain-keyed frozen record for iteration, spreading, and interop. */
  readonly record: Readonly<Record<TRaw, TValue>>;
}

const guardMemberAccess = <TTarget extends object>(
  enumName: string,
  target: TTarget,
  knownMembers: readonly string[],
): TTarget =>
  new Proxy(Object.freeze(target), {
    get(currentTarget, property, receiver) {
      // Symbols and prototype-chain lookups (toString, hasOwnProperty, ...) must
      // stay transparent so spreading, iteration, and inspection keep working;
      // 'toJSON' and 'then' are probed by JSON.stringify and await.
      if (typeof property !== 'string' || property in currentTarget || property === 'toJSON' || property === 'then') {
        return Reflect.get(currentTarget, property, receiver);
      }
      throw new EnumwaiiUnknownMemberError(enumName, property, knownMembers);
    },
  });

export class Enumwaii<TRaw extends string, TIdentity extends string> {
  readonly name: string;

  private readonly identityName: TIdentity;

  /**
   * Member accessor, mirrors `z.enum(...).enum`. Guarded by a Proxy: reading a
   * member that does not exist throws instead of returning `undefined`.
   */
  readonly enum: { readonly [K in TRaw]: EnumwaiiValue<K, TIdentity> };

  readonly values: readonly [EnumwaiiValue<TRaw, TIdentity>, ...EnumwaiiValue<TRaw, TIdentity>[]];

  /** Unbranded values, for interop with APIs that want plain strings. */
  readonly rawValues: readonly [TRaw, ...TRaw[]];

  private readonly memberSet: Set<string>;

  // Boxed so the cached schema stays mutable behind the readonly field.
  /** Zod schema whose output carries this enum's identity brand. */
  readonly schema: z.ZodType<EnumwaiiValue<TRaw, TIdentity>, TRaw>;

  constructor(enumName: TIdentity, rawValues: readonly [TRaw, ...TRaw[]], displayName: string = enumName) {
    if (displayName.length === 0) {
      throw new EnumwaiiError('[enumwaii] enum name cannot be empty');
    }
    if (rawValues.length === 0) {
      throw new EnumwaiiError(`[enumwaii] "${displayName}" must have at least one member`);
    }
    const ownedRawValues = Object.freeze([...rawValues]) as unknown as readonly [TRaw, ...TRaw[]];
    const memberSet = new Set<string>(ownedRawValues);
    if (memberSet.size !== ownedRawValues.length) {
      throw new EnumwaiiError(`[enumwaii] "${displayName}" has duplicate values: ${rawValues.join(', ')}`);
    }
    this.name = displayName;
    this.identityName = enumName;
    this.rawValues = ownedRawValues;
    this.memberSet = memberSet;
    // The brand is type-level only, so branding the runtime strings is a pure cast.
    this.values = ownedRawValues as unknown as readonly [
      EnumwaiiValue<TRaw, TIdentity>,
      ...EnumwaiiValue<TRaw, TIdentity>[],
    ];
    const enumTarget = Object.fromEntries(ownedRawValues.map((value) => [value, value])) as {
      [K in TRaw]: EnumwaiiValue<K, TIdentity>;
    };
    this.enum = guardMemberAccess(displayName, enumTarget, ownedRawValues);
    this.schema = z.enum(this.rawValues) as unknown as z.ZodType<EnumwaiiValue<TRaw, TIdentity>, TRaw>;
  }

  // Arrow-function fields keep every accessor safe to pass around detached
  // (e.g. `values.filter(roles.is)`) without losing `this`.
  readonly is = (input: unknown): input is EnumwaiiValue<TRaw, TIdentity> =>
    typeof input === 'string' && this.memberSet.has(input);

  /** Deserialization boundary: promotes an untrusted string to a branded value or throws. */
  readonly parse = (input: unknown): EnumwaiiValue<TRaw, TIdentity> => {
    if (this.is(input)) {
      return input;
    }
    throw new EnumwaiiParseError(this.name, input, this.rawValues);
  };

  readonly safeParse = (input: unknown): EnumwaiiSafeParseResult<TRaw, TIdentity> => {
    if (this.is(input)) {
      return { isSuccess: true, value: input };
    }
    return { isSuccess: false, error: new EnumwaiiParseError(this.name, input, this.rawValues) };
  };

  /** Identity at runtime; use it to mark serialization boundaries explicitly. */
  readonly serialize = (value: EnumwaiiValue<TRaw, TIdentity>): TRaw => value;

  /** Zod schema whose output is the branded value, for contracts and forms. */
  readonly asSchema = (): z.ZodType<EnumwaiiValue<TRaw, TIdentity>, TRaw> => this.schema;

  /** Superset enum: existing branded values remain assignable to the extended type. */
  readonly extend = <TExtra extends string>(
    extendedName: string,
    extraValues: readonly [TExtra, ...TExtra[]],
  ): Enumwaii<TRaw | TExtra, TIdentity> => {
    for (const extraValue of extraValues) {
      if (this.memberSet.has(extraValue)) {
        throw new EnumwaiiError(
          `[enumwaii] "${extendedName}" re-adds existing member "${extraValue}" of "${this.name}"`,
        );
      }
    }
    return new Enumwaii(this.identityName, [...this.rawValues, ...extraValues], extendedName);
  };

  /**
   * Runtime subset. Members must be referenced through this enum's accessor.
   * TypeScript cannot infer a literal subset from branded computed values, so
   * the result retains the base enum type while `parse` enforces the subset.
   */
  readonly pick = (
    pickedName: string,
    pickedValues: readonly [EnumwaiiValue<TRaw, TIdentity>, ...EnumwaiiValue<TRaw, TIdentity>[]],
  ): Enumwaii<TRaw, TIdentity> => {
    for (const pickedValue of pickedValues) {
      if (!this.memberSet.has(pickedValue)) {
        throw new EnumwaiiError(`[enumwaii] "${pickedName}" picks unknown member "${pickedValue}" of "${this.name}"`);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return new Enumwaii(this.identityName, pickedValues as unknown as readonly [TRaw, ...TRaw[]], pickedName);
  };

  /** Runtime subset that excludes the supplied members. See `pick` for the type-level tradeoff. */
  readonly omit = (
    omittedName: string,
    omittedValues: readonly [EnumwaiiValue<TRaw, TIdentity>, ...EnumwaiiValue<TRaw, TIdentity>[]],
  ): Enumwaii<TRaw, TIdentity> => {
    const omittedSet = new Set<string>(omittedValues);
    for (const omittedValue of omittedValues) {
      if (!this.memberSet.has(omittedValue)) {
        throw new EnumwaiiError(`[enumwaii] "${omittedName}" omits unknown member "${omittedValue}" of "${this.name}"`);
      }
    }
    const remainingValues = this.rawValues.filter((value) => !omittedSet.has(value));
    if (remainingValues.length === 0) {
      throw new EnumwaiiError(`[enumwaii] "${omittedName}" omits every member of "${this.name}"`);
    }
    return new Enumwaii(
      this.identityName,
      // filter cannot narrow the tuple type; non-emptiness is checked above.
      remainingValues as unknown as readonly [TRaw, ...TRaw[]],
      omittedName,
    );
  };

  /**
   * Exhaustive lookup table keyed by enum members. Runtime validation rejects
   * omissions and unknown keys. Use computed keys (`[STATUSES.READY]`) and
   * enable `no-raw-enum-member` so raw keys cannot bypass the accessor.
   */
  readonly derive = <const TValue>(mapping: Record<string, TValue>): iEnumwaiiDerived<TRaw, TIdentity, TValue> => {
    const mappingKeys = new Set(Object.keys(mapping));
    for (const value of this.rawValues) {
      if (!mappingKeys.has(value)) {
        throw new EnumwaiiError(`[enumwaii] derived mapping for "${this.name}" is missing member "${value}"`);
      }
    }
    for (const key of mappingKeys) {
      if (!this.memberSet.has(key)) {
        throw new EnumwaiiError(`[enumwaii] derived mapping for "${this.name}" has unknown key "${key}"`);
      }
    }
    return this.buildDerivedMap(mapping);
  };

  readonly deriveWith = <TValue>(
    build: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue,
  ): iEnumwaiiDerived<TRaw, TIdentity, TValue> => {
    const mapping = Object.fromEntries(
      this.rawValues.map((value) => [value, build(value as EnumwaiiValue<TRaw, TIdentity>)]),
    ) as Record<TRaw, TValue>;
    return this.buildDerivedMap(mapping);
  };

  private readonly buildDerivedMap = <TValue>(
    mapping: Record<string, TValue>,
  ): iEnumwaiiDerived<TRaw, TIdentity, TValue> => {
    const derivedName = `${this.name} (derived)`;
    const lookup = <K extends TRaw>(value: EnumwaiiValue<K, TIdentity>): TValue => {
      if (!this.memberSet.has(value)) {
        throw new EnumwaiiUnknownMemberError(derivedName, value, this.rawValues);
      }
      // Branded strings cannot bracket-index mapped types, so widen the key;
      // the narrowing back to TMap[K] is safe because value is EnumwaiiValue<K>.
      return mapping[value as TRaw] as TValue;
    };
    return Object.freeze(
      Object.assign(lookup, {
        get: lookup,
        record: guardMemberAccess(derivedName, mapping, this.rawValues) as Readonly<Record<TRaw, TValue>>,
      }),
    );
  };
}
