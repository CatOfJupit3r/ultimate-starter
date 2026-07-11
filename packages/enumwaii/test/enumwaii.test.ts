import { describe, expect, it } from 'vitest';
import z from 'zod';

import { Enumwaii, type EnumwaiiValue, type InferEnumwaii } from '../src/enumwaii';
import { EnumwaiiError } from '../src/enumwaii-error';
import { EnumwaiiParseError } from '../src/enumwaii-parse-error';
import { EnumwaiiUnknownMemberError } from '../src/enumwaii-unknown-member-error';

const userRolesEnumwaii = new Enumwaii('UserRole', ['ADMIN', 'USER', 'GUEST']);
type UserRole = InferEnumwaii<typeof userRolesEnumwaii>;

const acceptRole = (role: UserRole): string => role;

describe('Enumwaii', () => {
  it('returns an Enumwaii instance with detachable accessors', () => {
    expect(userRolesEnumwaii).toBeInstanceOf(Enumwaii);
    const { is } = userRolesEnumwaii;
    expect(['ADMIN', 'nope'].filter(is)).toEqual(['ADMIN']);
  });

  it('exposes members, values, and rawValues', () => {
    expect(userRolesEnumwaii.enum.ADMIN).toBe('ADMIN');
    expect(userRolesEnumwaii.values).toEqual(['ADMIN', 'USER', 'GUEST']);
    expect(userRolesEnumwaii.rawValues).toEqual(['ADMIN', 'USER', 'GUEST']);
  });

  it('rejects duplicate values at creation', () => {
    expect(() => new Enumwaii('Broken', ['A', 'A'])).toThrow(EnumwaiiError);
  });

  it('owns and freezes its values instead of retaining mutable caller state', () => {
    const source: ['A' | 'B', 'A' | 'B'] = ['A', 'B'];
    const stableEnumwaii = new Enumwaii('Stable', source);
    source[0] = 'B';

    expect(stableEnumwaii.rawValues).toEqual(['A', 'B']);
    expect(stableEnumwaii.values).toEqual(['A', 'B']);
    expect(stableEnumwaii.parse('A')).toBe(stableEnumwaii.enum.A);
    expect(Object.isFrozen(stableEnumwaii.rawValues)).toBe(true);
  });

  it('rejects empty names and empty member lists at runtime', () => {
    expect(() => new Enumwaii('', ['A'])).toThrow(EnumwaiiError);
    expect(() => Reflect.construct(Enumwaii, ['Empty', []])).toThrow(EnumwaiiError);
  });

  it('crashes on access to unknown members instead of returning undefined', () => {
    expect(() => Reflect.get(userRolesEnumwaii.enum, 'ADMNI')).toThrow(EnumwaiiUnknownMemberError);
  });

  it('keeps the enum object iterable and JSON-serializable despite the guard', () => {
    expect(Object.keys(userRolesEnumwaii.enum)).toEqual(['ADMIN', 'USER', 'GUEST']);
    expect(JSON.stringify(userRolesEnumwaii.enum)).toBe('{"ADMIN":"ADMIN","USER":"USER","GUEST":"GUEST"}');
    expect({ ...userRolesEnumwaii.enum }).toEqual({ ADMIN: 'ADMIN', USER: 'USER', GUEST: 'GUEST' });
  });

  it('flags raw strings at compile time while branded values pass', () => {
    // @ts-expect-error raw string literals are not assignable to the branded type
    acceptRole('ADMIN');
    expect(acceptRole(userRolesEnumwaii.enum.ADMIN)).toBe('ADMIN');
    expect(acceptRole(userRolesEnumwaii.parse('USER'))).toBe('USER');
  });
});

describe('parsing and serialization', () => {
  it('parse promotes valid strings and throws on anything else', () => {
    expect(userRolesEnumwaii.parse('GUEST')).toBe('GUEST');
    expect(() => userRolesEnumwaii.parse('guest')).toThrow(EnumwaiiParseError);
    expect(() => userRolesEnumwaii.parse(42)).toThrow(EnumwaiiParseError);
    expect(() => userRolesEnumwaii.parse(undefined)).toThrow(EnumwaiiParseError);
  });

  it('safeParse reports failures without throwing', () => {
    const parsed = userRolesEnumwaii.safeParse('ADMIN');
    expect(parsed).toEqual({ isSuccess: true, value: 'ADMIN' });
    const failed = userRolesEnumwaii.safeParse('nope');
    expect(failed.isSuccess).toBe(false);
    if (!failed.isSuccess) {
      expect(failed.error).toBeInstanceOf(EnumwaiiParseError);
    }
  });

  it('is narrows unknown input', () => {
    const input: unknown = 'USER';
    expect(userRolesEnumwaii.is(input)).toBe(true);
    if (userRolesEnumwaii.is(input)) {
      expect(acceptRole(input)).toBe('USER');
    }
  });

  it('round-trips through JSON because values are plain strings at runtime', () => {
    const payload = JSON.stringify({ role: userRolesEnumwaii.enum.ADMIN });
    expect(payload).toBe('{"role":"ADMIN"}');
    const revived = JSON.parse(payload) as { role: unknown };
    expect(userRolesEnumwaii.parse(revived.role)).toBe(userRolesEnumwaii.enum.ADMIN);
    expect(userRolesEnumwaii.serialize(userRolesEnumwaii.enum.ADMIN)).toBe('ADMIN');
  });
});

describe('asSchema', () => {
  it('exposes a stable schema property for declaration-site ergonomics', () => {
    expect(userRolesEnumwaii.schema).toBe(userRolesEnumwaii.asSchema());
    expect(acceptRole(userRolesEnumwaii.schema.parse('USER'))).toBe('USER');
  });

  it('produces a zod schema with branded output', () => {
    const roleSchema = userRolesEnumwaii.asSchema();
    expect(acceptRole(roleSchema.parse('ADMIN'))).toBe('ADMIN');
    expect(() => roleSchema.parse('nope')).toThrow();
  });

  it('composes into larger zod objects', () => {
    const memberSchema = z.object({ name: z.string(), role: userRolesEnumwaii.asSchema() });
    const member = memberSchema.parse({ name: 'Neko', role: 'GUEST' });
    expect(acceptRole(member.role)).toBe('GUEST');
  });
});

describe('composition', () => {
  it('extend produces a superset that accepts values of the base enum', () => {
    const extendedRolesEnumwaii = userRolesEnumwaii.extend('ExtendedUserRole', ['BOT']);
    type ExtendedUserRole = InferEnumwaii<typeof extendedRolesEnumwaii>;
    const acceptExtended = (role: ExtendedUserRole): string => role;
    expect(acceptExtended(userRolesEnumwaii.enum.ADMIN)).toBe('ADMIN');
    expect(acceptExtended(extendedRolesEnumwaii.enum.BOT)).toBe('BOT');
    expect(extendedRolesEnumwaii.rawValues).toEqual(['ADMIN', 'USER', 'GUEST', 'BOT']);
    expect(() => userRolesEnumwaii.extend('Broken', ['ADMIN'])).toThrow(EnumwaiiError);
  });

  it('pick produces a subset whose values remain assignable to the base type', () => {
    const staffRolesEnumwaii = userRolesEnumwaii.pick('StaffRole', [
      userRolesEnumwaii.enum.ADMIN,
      userRolesEnumwaii.enum.USER,
    ]);
    expect(acceptRole(staffRolesEnumwaii.enum.ADMIN)).toBe('ADMIN');
    expect(staffRolesEnumwaii.rawValues).toEqual(['ADMIN', 'USER']);
    expect(() => staffRolesEnumwaii.parse('GUEST')).toThrow(EnumwaiiParseError);
  });

  it('omit drops members and rejects omitting everything', () => {
    const nonGuestRolesEnumwaii = userRolesEnumwaii.omit('NonGuestRole', [userRolesEnumwaii.enum.GUEST]);
    expect(nonGuestRolesEnumwaii.rawValues).toEqual(['ADMIN', 'USER']);
    expect(() =>
      userRolesEnumwaii.omit('Empty', [
        userRolesEnumwaii.enum.ADMIN,
        userRolesEnumwaii.enum.USER,
        userRolesEnumwaii.enum.GUEST,
      ]),
    ).toThrow(EnumwaiiError);
  });
});

describe('derive', () => {
  const ROLE_LABELS = userRolesEnumwaii.derive({
    [userRolesEnumwaii.enum.ADMIN]: 'Administrator',
    [userRolesEnumwaii.enum.USER]: 'Member',
    [userRolesEnumwaii.enum.GUEST]: 'Visitor',
  });

  it('builds an exhaustive callable lookup keyed by enum members', () => {
    expect(ROLE_LABELS(userRolesEnumwaii.enum.ADMIN)).toBe('Administrator');
    expect(ROLE_LABELS.get(userRolesEnumwaii.enum.USER)).toBe('Member');
    expect(ROLE_LABELS.record.GUEST).toBe('Visitor');
    // @ts-expect-error raw strings cannot be looked up
    expect(() => ROLE_LABELS('ADMIN')).not.toThrow();
  });

  it('preserves per-key value types', () => {
    const roleRanks = userRolesEnumwaii.derive({
      [userRolesEnumwaii.enum.ADMIN]: 3,
      [userRolesEnumwaii.enum.USER]: 2,
      [userRolesEnumwaii.enum.GUEST]: 1,
    });
    const adminRank: number = roleRanks(userRolesEnumwaii.enum.ADMIN);
    expect(adminRank).toBe(3);
  });

  it('crashes on lookups with keys outside the enum', () => {
    expect(() => Reflect.get(ROLE_LABELS.record, 'SUPERADMIN')).toThrow(EnumwaiiUnknownMemberError);
    expect(() => ROLE_LABELS('SUPERADMIN' as unknown as UserRole)).toThrow(EnumwaiiUnknownMemberError);
  });

  it('keeps the plain record iterable for interop', () => {
    expect(Object.entries(ROLE_LABELS.record)).toEqual([
      ['ADMIN', 'Administrator'],
      ['USER', 'Member'],
      ['GUEST', 'Visitor'],
    ]);
  });

  it('flags wrong mapping keys at compile time and at runtime', () => {
    expect(() =>
      userRolesEnumwaii.derive({
        ADMIN: 'a',
        USER: 'b',
        GUEST: 'c',
        SUPERADMIN: 'd',
      }),
    ).toThrow(EnumwaiiError);
    expect(() => userRolesEnumwaii.derive({ ADMIN: 'a' })).toThrow(EnumwaiiError);
  });

  it('deriveWith builds the mapping from the members themselves', () => {
    const roleSlugs = userRolesEnumwaii.deriveWith((role) => role.toLowerCase());
    expect(roleSlugs.record.ADMIN).toBe('admin');
    expect(roleSlugs(userRolesEnumwaii.enum.GUEST)).toBe('guest');
  });
});

describe('branded values interop', () => {
  it('branded values behave as plain strings for template literals and comparison', () => {
    const role: EnumwaiiValue<'ADMIN' | 'USER' | 'GUEST'> = userRolesEnumwaii.enum.USER;
    expect(`role:${role}`).toBe('role:USER');
    expect(role === userRolesEnumwaii.enum.USER).toBe(true);
  });
});
