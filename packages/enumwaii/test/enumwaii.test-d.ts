import { describe, expectTypeOf, it } from 'vitest';
import type z from 'zod';

import { Enumwaii, type EnumwaiiValue, type InferEnumwaii } from '../src/enumwaii';
import type { EnumwaiiParseError } from '../src/enumwaii-parse-error';

const userRolesEnumwaii = new Enumwaii('UserRole', ['ADMIN', 'USER', 'GUEST']);
type UserRole = InferEnumwaii<typeof userRolesEnumwaii>;

const acceptRole = (role: UserRole): string => role;

describe('brand inference', () => {
  it('preserves literal types through the constructor', () => {
    expectTypeOf(userRolesEnumwaii).toEqualTypeOf<Enumwaii<'ADMIN' | 'USER' | 'GUEST', 'UserRole'>>();
    expectTypeOf<UserRole>().toEqualTypeOf<EnumwaiiValue<'ADMIN' | 'USER' | 'GUEST', 'UserRole'>>();
  });

  it('rejects raw strings flowing into enum-typed positions', () => {
    expectTypeOf<'ADMIN'>().not.toExtend<UserRole>();
    expectTypeOf<string>().not.toExtend<UserRole>();
    // @ts-expect-error raw string literals are not enum values
    acceptRole('ADMIN');
  });

  it('keeps branded values assignable to the raw literal union and string', () => {
    expectTypeOf<UserRole>().toExtend<'ADMIN' | 'USER' | 'GUEST'>();
    expectTypeOf<UserRole>().toExtend<string>();
  });

  it('types each enum member with its own literal', () => {
    expectTypeOf(userRolesEnumwaii.enum.ADMIN).toEqualTypeOf<EnumwaiiValue<'ADMIN', 'UserRole'>>();
    expectTypeOf(userRolesEnumwaii.enum.ADMIN).toExtend<UserRole>();
    expectTypeOf(userRolesEnumwaii.enum.ADMIN).not.toExtend<EnumwaiiValue<'USER', 'UserRole'>>();
  });

  it('resolves InferEnumwaii to never for non-enums', () => {
    expectTypeOf<InferEnumwaii<string>>().toBeNever();
    expectTypeOf<InferEnumwaii<{ values: string[] }>>().toBeNever();
  });

  it('keeps the same literal from an unrelated enum unassignable', () => {
    const otherEnumwaii = new Enumwaii('Other', ['ADMIN']);
    expectTypeOf(otherEnumwaii.enum.ADMIN).not.toExtend<UserRole>();
  });
});

describe('parsing and serialization types', () => {
  it('parse takes unknown and returns the branded union', () => {
    expectTypeOf(userRolesEnumwaii.parse).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(userRolesEnumwaii.parse).returns.toEqualTypeOf<UserRole>();
  });

  it('safeParse narrows on isSuccess', () => {
    const result = userRolesEnumwaii.safeParse('ADMIN');
    if (result.isSuccess) {
      expectTypeOf(result.value).toEqualTypeOf<UserRole>();
      // @ts-expect-error error only exists on the failure branch
      expectTypeOf(result.error);
    } else {
      expectTypeOf(result.error).toEqualTypeOf<EnumwaiiParseError>();
    }
  });

  it('is narrows unknown input to the branded union', () => {
    const input: unknown = 'ADMIN';
    if (userRolesEnumwaii.is(input)) {
      expectTypeOf(input).toEqualTypeOf<UserRole>();
    }
  });

  it('serialize unbrands back to the raw literal union', () => {
    expectTypeOf(userRolesEnumwaii.serialize).returns.toEqualTypeOf<'ADMIN' | 'USER' | 'GUEST'>();
    expectTypeOf(userRolesEnumwaii.serialize).parameter(0).toEqualTypeOf<UserRole>();
  });

  it('exposes branded values and raw values separately', () => {
    expectTypeOf(userRolesEnumwaii.values[0]).toEqualTypeOf<UserRole>();
    expectTypeOf(userRolesEnumwaii.rawValues[0]).toEqualTypeOf<'ADMIN' | 'USER' | 'GUEST'>();
  });
});

describe('asSchema types', () => {
  it('outputs branded values from raw string input', () => {
    const roleSchema = userRolesEnumwaii.asSchema();
    expectTypeOf<z.output<typeof roleSchema>>().toEqualTypeOf<UserRole>();
    expectTypeOf<z.input<typeof roleSchema>>().toEqualTypeOf<'ADMIN' | 'USER' | 'GUEST'>();
  });
});

describe('composition types', () => {
  const extendedRolesEnumwaii = userRolesEnumwaii.extend('ExtendedUserRole', ['BOT']);
  type ExtendedUserRole = InferEnumwaii<typeof extendedRolesEnumwaii>;

  const staffRolesEnumwaii = userRolesEnumwaii.pick('StaffRole', [
    userRolesEnumwaii.enum.ADMIN,
    userRolesEnumwaii.enum.USER,
  ]);
  type StaffRole = InferEnumwaii<typeof staffRolesEnumwaii>;

  it('extend produces a superset the base values remain assignable to', () => {
    expectTypeOf<ExtendedUserRole>().toEqualTypeOf<EnumwaiiValue<'ADMIN' | 'USER' | 'GUEST' | 'BOT', 'UserRole'>>();
    expectTypeOf<UserRole>().toExtend<ExtendedUserRole>();
    expectTypeOf<ExtendedUserRole>().not.toExtend<UserRole>();
  });

  it('pick produces a subset assignable to the base', () => {
    expectTypeOf<StaffRole>().toEqualTypeOf<UserRole>();
    expectTypeOf<StaffRole>().toExtend<UserRole>();
    expectTypeOf<UserRole>().toExtend<StaffRole>();
    // @ts-expect-error pick only accepts existing members
    userRolesEnumwaii.pick('Broken', ['SUPERADMIN']);
  });

  it('omit excludes members at the type level', () => {
    const nonGuestRolesEnumwaii = userRolesEnumwaii.omit('NonGuestRole', [userRolesEnumwaii.enum.GUEST]);
    expectTypeOf<InferEnumwaii<typeof nonGuestRolesEnumwaii>>().toEqualTypeOf<UserRole>();
    // @ts-expect-error omit only accepts existing members
    userRolesEnumwaii.omit('Broken', ['SUPERADMIN']);
  });
});

describe('derived table types', () => {
  const ROLE_RANKS = userRolesEnumwaii.derive({
    [userRolesEnumwaii.enum.ADMIN]: 3,
    [userRolesEnumwaii.enum.USER]: 2,
    [userRolesEnumwaii.enum.GUEST]: 1,
  });

  it('preserves per-key literal value types through calls and record access', () => {
    expectTypeOf(ROLE_RANKS(userRolesEnumwaii.enum.ADMIN)).toEqualTypeOf<3 | 2 | 1>();
    expectTypeOf(ROLE_RANKS.get(userRolesEnumwaii.enum.GUEST)).toEqualTypeOf<3 | 2 | 1>();
    expectTypeOf(ROLE_RANKS.record.USER).toEqualTypeOf<3 | 2 | 1>();
  });

  it('widens to the value union when looked up with the full enum type', () => {
    const someRole = userRolesEnumwaii.parse('ADMIN');
    expectTypeOf(ROLE_RANKS(someRole)).toEqualTypeOf<3 | 2 | 1>();
  });

  it('rejects raw strings, missing members, and extra keys', () => {
    // @ts-expect-error raw strings cannot be looked up
    ROLE_RANKS('ADMIN');
    userRolesEnumwaii.derive({ [userRolesEnumwaii.enum.ADMIN]: 1 });
  });

  it('deriveWith types the mapping uniformly from the builder result', () => {
    const roleSlugs = userRolesEnumwaii.deriveWith((role) => role.toLowerCase());
    expectTypeOf(roleSlugs).parameter(0).toExtend<UserRole>();
    expectTypeOf(roleSlugs(userRolesEnumwaii.enum.ADMIN)).toEqualTypeOf<string>();
    expectTypeOf(roleSlugs.record).toEqualTypeOf<{
      readonly ADMIN: string;
      readonly USER: string;
      readonly GUEST: string;
    }>();
    expectTypeOf(userRolesEnumwaii.deriveWith).parameter(0).parameter(0).toEqualTypeOf<UserRole>();
  });
});
