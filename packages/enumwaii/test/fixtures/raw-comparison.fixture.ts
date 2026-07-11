import { Enumwaii } from '../../src/enumwaii';

const fixtureRolesEnumwaii = new Enumwaii('FixtureRole', ['ADMIN', 'USER']);
const FIXTURE_ROLES = fixtureRolesEnumwaii.enum;

export const role = fixtureRolesEnumwaii.parse('ADMIN');

// violation: raw literal on the right
export const isRawEqual = role === 'ADMIN';

// violation: raw literal on the left
export const isRawNotEqual = 'USER' !== role;

// ok: compares against the enum member
export const isMemberEqual = role === FIXTURE_ROLES.ADMIN;

// ok: both sides are plain strings, no enumwaii value involved
export const isPlainComparison = String(role).toLowerCase() === 'admin';

export const describeRoleBad = (): string => {
  switch (role) {
    // violation: raw case against an enumwaii discriminant
    case 'ADMIN':
      return 'admin';
    default:
      return 'other';
  }
};

export const describeRoleGood = (): string => {
  switch (role) {
    case FIXTURE_ROLES.ADMIN:
      return 'admin';
    default:
      return 'other';
  }
};
