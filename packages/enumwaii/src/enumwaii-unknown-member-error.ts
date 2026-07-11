import { EnumwaiiError } from './enumwaii-error';

export class EnumwaiiUnknownMemberError extends EnumwaiiError {
  constructor(
    readonly enumName: string,
    readonly member: string,
    readonly knownMembers: readonly string[],
  ) {
    super(`[enumwaii] "${enumName}" has no member "${member}". Known members: ${knownMembers.join(', ')}`);
    this.name = 'EnumwaiiUnknownMemberError';
  }
}
