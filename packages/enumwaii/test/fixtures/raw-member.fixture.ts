import { Enumwaii } from '../../src/enumwaii';

const fixtureRolesEnumwaii = new Enumwaii('FixtureRole', ['ADMIN', 'USER']);
const FIXTURE_ROLES = fixtureRolesEnumwaii.enum;

// violations: derived maps must use computed enum member keys
fixtureRolesEnumwaii.derive({
  ADMIN: 'Administrator',
  USER: 'Member',
});

// violations: subset operations must use the owning enum members
// @ts-expect-error fixture intentionally passes a raw member to test the lint rule
fixtureRolesEnumwaii.pick('StaffRole', ['ADMIN']);
// @ts-expect-error fixture intentionally passes a raw member to test the lint rule
fixtureRolesEnumwaii.omit('NonAdminRole', ['ADMIN']);

// ok
fixtureRolesEnumwaii.derive({
  [FIXTURE_ROLES.ADMIN]: 'Administrator',
  [FIXTURE_ROLES.USER]: 'Member',
});
fixtureRolesEnumwaii.pick('StaffRole', [FIXTURE_ROLES.ADMIN]);
fixtureRolesEnumwaii.omit('NonAdminRole', [FIXTURE_ROLES.ADMIN]);
